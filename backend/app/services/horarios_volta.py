from __future__ import annotations

# Serviço de lógica pura (sem acesso a BD) para o ciclo de horários de uma
# volta: ajusta o horário previsto das visitas quando há um atraso real
# registado (na saída da volta ou numa visita em concreto), propagando esse
# atraso para as paragens seguintes, e calcula o resumo/alertas de
# coerência de uma volta (durações, distâncias, hora-limite de regresso a
# Beja). Por ser puro — recebe os dados já carregados e devolve estruturas
# novas, sem tocar na BD — é a parte mais fácil de testar isoladamente
# (ver suite de testes), e é por isso que os routers (voltas.py) carregam
# os dados e delegam o cálculo aqui.

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Iterable, Optional
from zoneinfo import ZoneInfo

LISBON_TZ = ZoneInfo("Europe/Lisbon")
HORA_LIMITE_BEJA_PADRAO = time(16, 0)
ESTADOS_VISITA_TERMINAIS = {"CONCLUIDA", "CANCELADA"}


def _para_float(valor: Any) -> Optional[float]:
    # Colunas numeric/decimal da BD chegam via psycopg como Decimal; o resto
    # do módulo (e o JSON de resposta) trabalha com float, por isso esta
    # função normaliza ambos os casos (e None) para o mesmo tipo.
    if valor is None:
        return None
    if isinstance(valor, Decimal):
        return float(valor)
    return float(valor)


def _garantir_tz(dt: Optional[datetime]) -> Optional[datetime]:
    # As colunas timestamptz da BD já chegam com tzinfo definido, mas os
    # dataclasses deste módulo também podem ser construídos "à mão" (ex. nos
    # testes, ou com datetimes calculados aqui mesmo) com datetimes naive.
    # Assume-se que qualquer datetime naive que apareça já representa hora
    # local de Lisboa, para todas as comparações e aritmética de datas deste
    # módulo serem feitas de forma consistente (nunca a misturar naive com
    # aware, o que lançaria TypeError).
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=LISBON_TZ)
    return dt


def _minutos_entre(inicio: datetime, fim: datetime) -> int:
    # Arredonda ao minuto mais próximo — a precisão de segundos não é
    # relevante para os relatórios/alertas apresentados ao utilizador.
    return int(round((fim - inicio).total_seconds() / 60))


def formatar_minutos_como_duracao(minutos: int) -> str:
    # Mesma regra do formatarDuracao() do frontend (VoltaDetalhePage.tsx):
    # "125 min" lê-se pior do que "2h 5m" numa frase para o coordenador.
    horas, mins = divmod(minutos, 60)
    if horas <= 0:
        return f"{mins} min"
    return f"{horas}h {mins}m" if mins > 0 else f"{horas}h"


@dataclass
class VisitaAgendaItem:
    # Representação mínima de uma visita usada pelos algoritmos de
    # ajuste/propagação de atrasos deste módulo — desacoplada do formato da
    # linha devolvida pela query SQL (ver _carregar_visitas_para_ajuste em
    # voltas.py, que faz a conversão linha -> VisitaAgendaItem).
    visita_id: int
    paragem_ordem: int
    estado: str
    inicio_previsto: Optional[datetime]
    fim_previsto: Optional[datetime]
    inicio_real: Optional[datetime] = None
    fim_real: Optional[datetime] = None


@dataclass
class ResultadoAjusteHorarios:
    # Resultado devolvido pelas funções ajustar_por_atraso_*: quanto atraso
    # (em minutos) foi efetivamente aplicado, qual o novo regresso previsto
    # da volta, a lista de visitas cujo horário previsto mudou (só as que
    # mudaram, não todas as da volta — o router usa isto para saber quais
    # UPDATE fazer), e se/quanto esse novo regresso compromete a
    # hora-limite de regresso a Beja.
    atraso_aplicado_min: int
    novo_regresso_previsto: Optional[datetime]
    visitas_ajustadas: list[VisitaAgendaItem]
    compromete_regresso_beja: bool
    excesso_regresso_beja_min: int
    aviso_regresso_beja: Optional[str]


def construir_limite_beja(
    data_volta: date,
    hora_limite: time = HORA_LIMITE_BEJA_PADRAO,
) -> datetime:
    # Combina a data da volta com a hora-limite configurada (RF19/RF39) num
    # datetime aware em hora de Lisboa, para poder ser comparado diretamente
    # com os datetimes (também em timestamptz) de partida/regresso da volta.
    return datetime.combine(data_volta, hora_limite, tzinfo=LISBON_TZ)


def avaliar_regresso_beja(
    data_volta: date,
    regresso_previsto: Optional[datetime],
    regresso_real: Optional[datetime] = None,
    hora_limite: time = HORA_LIMITE_BEJA_PADRAO,
) -> tuple[bool, int, Optional[str]]:
    """
    Avalia se o regresso previsto (ou real) compromete a hora limite em Beja.
    Devolve sempre aviso informativo — nunca bloqueia o registo.
    """
    # Prefere o regresso real quando já existe (facto consumado, mais fiável
    # do que a previsão); só usa o previsto enquanto a volta ainda não
    # regressou de facto.
    referencia = _garantir_tz(regresso_real or regresso_previsto)
    if referencia is None:
        return False, 0, None

    limite_beja = construir_limite_beja(data_volta, hora_limite)
    referencia_lisboa = referencia.astimezone(LISBON_TZ)

    if referencia_lisboa > limite_beja:
        excesso = _minutos_entre(limite_beja, referencia_lisboa)
        aviso = (
            f"Atenção: o atraso empurra o regresso para as {referencia_lisboa.strftime('%H:%M')}, "
            f"ultrapassando em {formatar_minutos_como_duracao(excesso)} a hora limite de regresso a Beja "
            f"({hora_limite.strftime('%H:%M')})."
        )
        return True, excesso, aviso

    return False, 0, None


def _ordenar_visitas(visitas: Iterable[VisitaAgendaItem]) -> list[VisitaAgendaItem]:
    # Ordena pela sequência real do itinerário: primeiro pela ordem da
    # paragem, depois pelo início previsto dentro da mesma paragem (visitas
    # sem início previsto vão para o fim, via datetime.max) e por fim pelo
    # id como critério de desempate estável. Os algoritmos de propagação de
    # atraso abaixo dependem desta ordem para saberem quais visitas vêm
    # "depois" da que sofreu o atraso.
    return sorted(
        visitas,
        key=lambda v: (
            v.paragem_ordem,
            _garantir_tz(v.inicio_previsto) or datetime.max.replace(tzinfo=LISBON_TZ),
            v.visita_id,
        ),
    )


def ajustar_por_atraso_saida(
    *,
    data_volta: date,
    partida_prevista: Optional[datetime],
    regresso_previsto: Optional[datetime],
    partida_real_anterior: Optional[datetime],
    nova_partida_real: datetime,
    visitas: Iterable[VisitaAgendaItem],
    hora_limite_beja: time = HORA_LIMITE_BEJA_PADRAO,
) -> ResultadoAjusteHorarios:
    """
    Se a saída real for posterior à prevista (e à última saída real registada),
    desloca para a frente todas as visitas seguintes ainda não concluídas/canceladas
    e o regresso previsto da volta pelo mesmo delta.
    """
    partida_prev = _garantir_tz(partida_prevista)
    regresso_prev = _garantir_tz(regresso_previsto)
    partida_ant = _garantir_tz(partida_real_anterior)
    nova_partida = _garantir_tz(nova_partida_real)

    if partida_prev is None or nova_partida is None:
        raise ValueError("A volta não tem hora de partida prevista definida.")

    # A referência para calcular o atraso é a mais tardia entre a partida
    # prevista original e uma partida real já registada anteriormente — isto
    # evita que uma segunda correção da hora de saída (ex.: o utilizador
    # engana-se e corrige o valor) conte o atraso a partir do zero outra vez
    # e desloque as visitas duas vezes.
    referencia_base = partida_prev
    if partida_ant is not None and partida_ant > referencia_base:
        referencia_base = partida_ant

    # Só há atraso a propagar se a nova partida real for posterior à
    # referência; se for igual ou anterior (ex.: afinal saiu a tempo), não
    # se desloca nada — delta fica a zero.
    delta = nova_partida - referencia_base if nova_partida > referencia_base else timedelta(0)
    visitas_ordenadas = _ordenar_visitas(visitas)
    ajustadas: list[VisitaAgendaItem] = []

    if delta > timedelta(0):
        for v in visitas_ordenadas:
            # Visitas já terminadas (estado terminal) ou com um fim real já
            # registado são factos consumados — o atraso na saída da volta
            # não lhes é aplicado retroativamente, só afeta o que ainda
            # está planeado.
            if v.estado in ESTADOS_VISITA_TERMINAIS or v.fim_real is not None:
                continue
            ini_prev = _garantir_tz(v.inicio_previsto)
            fim_prev = _garantir_tz(v.fim_previsto)
            if ini_prev is None or fim_prev is None:
                continue
            ajustadas.append(
                VisitaAgendaItem(
                    visita_id=v.visita_id,
                    paragem_ordem=v.paragem_ordem,
                    estado=v.estado,
                    inicio_previsto=ini_prev + delta,
                    fim_previsto=fim_prev + delta,
                    inicio_real=_garantir_tz(v.inicio_real),
                    fim_real=_garantir_tz(v.fim_real),
                )
            )
        novo_regresso = regresso_prev + delta if regresso_prev is not None else None
    else:
        novo_regresso = regresso_prev

    compromete, excesso, aviso = avaliar_regresso_beja(
        data_volta=data_volta,
        regresso_previsto=novo_regresso,
        hora_limite=hora_limite_beja,
    )

    return ResultadoAjusteHorarios(
        atraso_aplicado_min=int(round(delta.total_seconds() / 60)),
        novo_regresso_previsto=novo_regresso,
        visitas_ajustadas=ajustadas,
        compromete_regresso_beja=compromete,
        excesso_regresso_beja_min=excesso,
        aviso_regresso_beja=aviso,
    )


def ajustar_por_atraso_visita(
    *,
    data_volta: date,
    regresso_previsto: Optional[datetime],
    visita_id: int,
    novo_inicio_real: Optional[datetime],
    novo_fim_real: Optional[datetime],
    visitas: Iterable[VisitaAgendaItem],
    hora_limite_beja: time = HORA_LIMITE_BEJA_PADRAO,
) -> ResultadoAjusteHorarios:
    """
    Propaga o atraso registado numa visita (início real tardio ou fim real posterior
    ao fim previsto) para todas as visitas posteriores e para o regresso previsto.
    """
    visitas_ordenadas = _ordenar_visitas(visitas)
    indice_alvo = next(
        (i for i, v in enumerate(visitas_ordenadas) if v.visita_id == visita_id),
        None,
    )
    if indice_alvo is None:
        raise ValueError("Visita não encontrada na volta.")

    alvo = visitas_ordenadas[indice_alvo]
    # Os novos valores (quando vêm None no pedido) mantêm o que já estava
    # gravado para a visita — permite registar só o início agora e o fim
    # mais tarde, sem perder o início já registado.
    ini_real = _garantir_tz(novo_inicio_real) if novo_inicio_real is not None else _garantir_tz(alvo.inicio_real)
    fim_real = _garantir_tz(novo_fim_real) if novo_fim_real is not None else _garantir_tz(alvo.fim_real)

    if fim_real is not None and ini_real is None:
        raise ValueError("Para registar o fim real da visita, indique também o início real.")

    if ini_real is not None and fim_real is not None and fim_real <= ini_real:
        raise ValueError("A hora de fim real da visita deve ser estritamente posterior à hora de início real.")

    regresso_prev = _garantir_tz(regresso_previsto)
    ini_prev_alvo = _garantir_tz(alvo.inicio_previsto)
    fim_prev_alvo = _garantir_tz(alvo.fim_previsto)
    fim_real_anterior = _garantir_tz(alvo.fim_real)
    ini_real_anterior = _garantir_tz(alvo.inicio_real)

    delta = timedelta(0)
    ajustadas: list[VisitaAgendaItem] = []

    # Dois cenários distintos de atraso, mutuamente exclusivos:
    #
    # 1) Já se conhece o fim real da visita (passo final, a visita terminou)
    #    — o atraso relevante é "quanto o fim real ultrapassou o fim
    #    previsto" (ou o fim real já registado antes, se for mais tardio —
    #    mesma lógica de "referência mais tardia" do atraso de saída, para
    #    uma correção não contar o atraso duas vezes). Este delta propaga-se
    #    só às visitas seguintes; a própria visita-alvo não entra em
    #    `ajustadas` porque o seu horário previsto não muda — o que muda é
    #    só o horário real, que é gravado pelo router fora desta função.
    #
    # 2) Ainda só se sabe o início real (visita em curso, fim ainda por
    #    registar) — o atraso é "quanto o início real ultrapassou o início
    #    previsto". Neste caso a própria visita-alvo TEM de ser ajustada
    #    (daí o append explícito a `ajustadas` dentro deste ramo): o seu
    #    fim previsto desloca-se pelo delta para refletir que, tendo
    #    começado mais tarde, também deve acabar mais tarde — mas o início
    #    previsto mantém-se (já passou, não há sentido em "adiar o
    #    passado") e o fim_real fica None porque ainda não é conhecido.
    if fim_real is not None and fim_prev_alvo is not None:
        ref_fim = fim_prev_alvo
        if fim_real_anterior is not None and fim_real_anterior > ref_fim:
            ref_fim = fim_real_anterior
        if fim_real > ref_fim:
            delta = fim_real - ref_fim
    elif ini_real is not None and ini_prev_alvo is not None and fim_prev_alvo is not None:
        ref_ini = ini_prev_alvo
        if ini_real_anterior is not None and ini_real_anterior > ref_ini:
            ref_ini = ini_real_anterior
        if ini_real > ref_ini:
            delta = ini_real - ref_ini
            ajustadas.append(
                VisitaAgendaItem(
                    visita_id=alvo.visita_id,
                    paragem_ordem=alvo.paragem_ordem,
                    estado=alvo.estado,
                    inicio_previsto=ini_prev_alvo,
                    fim_previsto=fim_prev_alvo + delta,
                    inicio_real=ini_real,
                    fim_real=None,
                )
            )

    if delta > timedelta(0):
        # Propaga o mesmo delta a todas as visitas que vêm depois da visita
        # afetada na ordem do itinerário, exceto as que já são factos
        # consumados (terminadas ou com fim real já registado) — o mesmo
        # critério usado em ajustar_por_atraso_saida.
        for posterior in visitas_ordenadas[indice_alvo + 1 :]:
            if posterior.estado in ESTADOS_VISITA_TERMINAIS or posterior.fim_real is not None:
                continue
            ini_p = _garantir_tz(posterior.inicio_previsto)
            fim_p = _garantir_tz(posterior.fim_previsto)
            if ini_p is None or fim_p is None:
                continue
            ajustadas.append(
                VisitaAgendaItem(
                    visita_id=posterior.visita_id,
                    paragem_ordem=posterior.paragem_ordem,
                    estado=posterior.estado,
                    inicio_previsto=ini_p + delta,
                    fim_previsto=fim_p + delta,
                    inicio_real=_garantir_tz(posterior.inicio_real),
                    fim_real=_garantir_tz(posterior.fim_real),
                )
            )
        novo_regresso = regresso_prev + delta if regresso_prev is not None else None
    else:
        novo_regresso = regresso_prev

    compromete, excesso, aviso = avaliar_regresso_beja(
        data_volta=data_volta,
        regresso_previsto=novo_regresso,
        hora_limite=hora_limite_beja,
    )

    return ResultadoAjusteHorarios(
        atraso_aplicado_min=int(round(delta.total_seconds() / 60)),
        novo_regresso_previsto=novo_regresso,
        visitas_ajustadas=ajustadas,
        compromete_regresso_beja=compromete,
        excesso_regresso_beja_min=excesso,
        aviso_regresso_beja=aviso,
    )


def calcular_resumo_volta(
    *,
    data_volta: date,
    partida_prevista: Optional[datetime],
    regresso_previsto: Optional[datetime],
    partida_real: Optional[datetime],
    regresso_real: Optional[datetime],
    distancia_estimada_km: Any,
    distancia_real_km: Any,
    paragens: list[dict[str, Any]],
    hora_limite_beja: time = HORA_LIMITE_BEJA_PADRAO,
) -> dict[str, Any]:
    """
    Calcula os totais da volta (durações e distâncias) e verifica coerência
    de horários e distâncias para prevenir erros operacionais.
    """
    # `alertas` acumula avisos de inconsistência de dados (nunca bloqueia
    # nada — isto é só para o GET /voltas/{id} informar quem está a ver a
    # ficha de que algo parece errado, ex. horários trocados ou distâncias
    # negativas introduzidas manualmente).
    alertas: list[str] = []

    p_prev = _garantir_tz(partida_prevista)
    r_prev = _garantir_tz(regresso_previsto)
    p_real = _garantir_tz(partida_real)
    r_real = _garantir_tz(regresso_real)

    duracao_prevista_volta_min: Optional[int] = None
    if p_prev is not None and r_prev is not None:
        if r_prev <= p_prev:
            alertas.append("O regresso previsto deve ser posterior à partida prevista.")
        else:
            duracao_prevista_volta_min = _minutos_entre(p_prev, r_prev)

    duracao_real_volta_min: Optional[int] = None
    if p_real is not None and r_real is not None:
        if r_real < p_real:
            alertas.append("O regresso real não pode ser anterior à partida real.")
        else:
            duracao_real_volta_min = _minutos_entre(p_real, r_real)

    atraso_saida_min = 0
    if p_prev is not None and p_real is not None and p_real > p_prev:
        atraso_saida_min = _minutos_entre(p_prev, p_real)

    visitas_ativas: list[dict[str, Any]] = []
    # Chave (início, fim) -> duração em minutos, contada uma única vez por
    # janela distinta. Enquanto não existir hora por paragem (RF39/RF21,
    # fora do âmbito essencial), todas as visitas de uma volta partilham o
    # mesmo início/fim previsto (o da volta toda) — somar a duração de cada
    # visita individualmente duplicava-a N vezes e disparava alertas falsos
    # de "sobreposição" e "soma excede o total" em qualquer volta com 2+
    # visitas.
    janelas_previstas_unicas: dict[tuple, int] = {}
    duracao_real_visitas_acum = 0
    tem_visita_real = False

    paragens_ordenadas = sorted(paragens, key=lambda p: p.get("ordem", 0))

    for paragem in paragens_ordenadas:
        dist_troco = _para_float(paragem.get("distancia_desde_anterior_km"))
        if dist_troco is not None and dist_troco < 0:
            alertas.append(f"Paragem {paragem.get('ordem')}: distância desde a paragem anterior negativa.")

        for visita in paragem.get("visitas", []):
            if visita.get("visita_id") is None:
                # Paragem sem nenhuma visita associada (join vazio) — nada a somar.
                continue
            estado = visita.get("visita_estado")
            if estado == "CANCELADA":
                # Visitas canceladas não contam para duração/alertas: não
                # aconteceram, não devem inflacionar totais nem disparar
                # falsos alertas de sobreposição.
                continue

            v_ini_prev = _garantir_tz(visita.get("inicio_previsto"))
            v_fim_prev = _garantir_tz(visita.get("fim_previsto"))
            v_ini_real = _garantir_tz(visita.get("inicio_real"))
            v_fim_real = _garantir_tz(visita.get("fim_real"))
            nome = visita.get("utente_nome") or f"Visita #{visita.get('visita_id')}"

            if v_ini_prev is not None and v_fim_prev is not None:
                if v_fim_prev <= v_ini_prev:
                    alertas.append(f"{nome}: fim previsto anterior ou igual ao início previsto.")
                else:
                    janelas_previstas_unicas.setdefault(
                        (v_ini_prev, v_fim_prev), _minutos_entre(v_ini_prev, v_fim_prev)
                    )
                    visitas_ativas.append(
                        {
                            "nome": nome,
                            "ordem": paragem.get("ordem", 0),
                            "inicio": v_ini_prev,
                            "fim": v_fim_prev,
                        }
                    )

                if p_prev is not None and v_ini_prev < p_prev:
                    alertas.append(f"{nome}: início previsto anterior à partida prevista da volta.")
                if r_prev is not None and v_fim_prev > r_prev:
                    alertas.append(f"{nome}: fim previsto posterior ao regresso previsto da volta.")

            if v_ini_real is not None and v_fim_real is not None:
                if v_fim_real <= v_ini_real:
                    alertas.append(f"{nome}: duração real inválida (fim real anterior ou igual ao início real).")
                else:
                    duracao_real_visitas_acum += _minutos_entre(v_ini_real, v_fim_real)
                    tem_visita_real = True

                if r_real is not None and v_fim_real > r_real:
                    alertas.append(f"{nome}: fim real posterior ao regresso real da volta.")

    # Soma das janelas previstas únicas (não da lista de visitas inteira) —
    # ver o comentário acima de janelas_previstas_unicas.
    duracao_prevista_visitas_min = sum(janelas_previstas_unicas.values())

    # Deteta sobreposições entre visitas consecutivas (já ordenadas por
    # paragem/início mais acima, em visitas_ativas). Duas visitas na mesma
    # janela exata (mesma_janela) não contam como sobreposição — é o caso
    # defensivo acima, visitas que partilham deliberadamente o mesmo
    # horário. Só há alerta quando a visita seguinte pertence a uma paragem
    # posterior (ordem maior) mas o seu início ainda cai dentro do intervalo
    # da anterior — ou seja, horários mal preenchidos/invertidos.
    for anterior, seguinte in zip(visitas_ativas, visitas_ativas[1:]):
        mesma_janela = anterior["inicio"] == seguinte["inicio"] and anterior["fim"] == seguinte["fim"]
        if not mesma_janela and seguinte["ordem"] > anterior["ordem"] and seguinte["inicio"] < anterior["fim"]:
            alertas.append(
                f"Horário sobreposto ou invertido entre {anterior['nome']} e {seguinte['nome']}."
            )

    # Tempo de deslocação previsto = duração total da volta menos o tempo
    # ocupado em visitas — o que sobra é assumido como estrada/deslocações
    # entre paragens. Se sair negativo, as visitas (previstas) não cabem
    # dentro da janela da volta, o que é um erro de preenchimento.
    tempo_deslocacao_previsto_min: Optional[int] = None
    if duracao_prevista_volta_min is not None:
        tempo_deslocacao_previsto_min = duracao_prevista_volta_min - duracao_prevista_visitas_min
        if tempo_deslocacao_previsto_min < 0:
            alertas.append(
                "A soma das durações previstas das visitas excede a duração total prevista da volta."
            )

    dist_estimada = _para_float(distancia_estimada_km)
    dist_real = _para_float(distancia_real_km)
    trocos = [
        _para_float(p.get("distancia_desde_anterior_km"))
        for p in paragens_ordenadas
        if p.get("distancia_desde_anterior_km") is not None
    ]
    distancia_paragens_soma_km: Optional[float] = (
        round(sum(t for t in trocos if t is not None), 1) if trocos else None
    )

    if dist_estimada is not None and dist_estimada < 0:
        alertas.append("Distância estimada da volta não pode ser negativa.")
    if dist_real is not None and dist_real < 0:
        alertas.append("Distância real da volta não pode ser negativa.")
    if (
        dist_estimada is not None
        and distancia_paragens_soma_km is not None
        # Margem de 0.05 km para absorver erros de arredondamento entre a
        # distância estimada da volta (um valor único) e a soma dos troços
        # entre paragens (arredondados individualmente) — sem esta margem,
        # arredondamentos legítimos disparariam o alerta sem haver erro real.
        and dist_estimada + 0.05 < distancia_paragens_soma_km
    ):
        alertas.append(
            f"Distância estimada da volta ({dist_estimada:.1f} km) é inferior à soma dos troços entre paragens ({distancia_paragens_soma_km:.1f} km)."
        )

    compromete_beja, excesso_beja, aviso_beja = avaliar_regresso_beja(
        data_volta=data_volta,
        regresso_previsto=r_prev,
        regresso_real=r_real,
        hora_limite=hora_limite_beja,
    )

    return {
        "duracao_prevista_volta_min": duracao_prevista_volta_min,
        "duracao_real_volta_min": duracao_real_volta_min,
        "duracao_prevista_visitas_min": duracao_prevista_visitas_min,
        "duracao_real_visitas_min": duracao_real_visitas_acum if tem_visita_real else None,
        "tempo_deslocacao_previsto_min": tempo_deslocacao_previsto_min,
        "atraso_saida_min": atraso_saida_min,
        "distancia_paragens_soma_km": distancia_paragens_soma_km,
        "hora_limite_regresso_beja": hora_limite_beja.strftime("%H:%M"),
        "compromete_regresso_beja": compromete_beja,
        "excesso_regresso_beja_min": excesso_beja,
        "aviso_regresso_beja": aviso_beja,
        "alertas_coerencia": alertas,
    }