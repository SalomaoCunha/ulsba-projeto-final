from datetime import date, datetime, time
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient

from app.db import get_conn
from app.main import app
from app.routers.auth import get_current_user
from app.services.horarios_volta import (
    VisitaAgendaItem,
    ajustar_por_atraso_saida,
    ajustar_por_atraso_visita,
    calcular_resumo_volta,
)

LISBON = ZoneInfo("Europe/Lisbon")
DIA = date(2026, 11, 12)


def _dt(hora: int, minuto: int) -> datetime:
    return datetime(2026, 11, 12, hora, minuto, tzinfo=LISBON)


def _visitas_base() -> list[VisitaAgendaItem]:
    return [
        VisitaAgendaItem(
            visita_id=1,
            paragem_ordem=1,
            estado="PLANEADA",
            inicio_previsto=_dt(10, 0),
            fim_previsto=_dt(10, 45),
        ),
        VisitaAgendaItem(
            visita_id=2,
            paragem_ordem=2,
            estado="PLANEADA",
            inicio_previsto=_dt(11, 15),
            fim_previsto=_dt(11, 50),
        ),
        VisitaAgendaItem(
            visita_id=3,
            paragem_ordem=3,
            estado="PLANEADA",
            inicio_previsto=_dt(12, 30),
            fim_previsto=_dt(13, 0),
        ),
    ]


# ---------------------------------------------------------------------
# 1. Atraso na saída real
# ---------------------------------------------------------------------
def test_atraso_saida_ajusta_todas_as_visitas_e_regresso_sem_comprometer_beja():
    resultado = ajustar_por_atraso_saida(
        data_volta=DIA,
        partida_prevista=_dt(9, 30),
        regresso_previsto=_dt(15, 0),
        partida_real_anterior=None,
        nova_partida_real=_dt(10, 0),  # +30 min de atraso
        visitas=_visitas_base(),
        hora_limite_beja=time(16, 0),
    )

    assert resultado.atraso_aplicado_min == 30
    assert resultado.novo_regresso_previsto == _dt(15, 30)
    assert len(resultado.visitas_ajustadas) == 3

    assert resultado.visitas_ajustadas[0].inicio_previsto == _dt(10, 30)
    assert resultado.visitas_ajustadas[0].fim_previsto == _dt(11, 15)
    assert resultado.visitas_ajustadas[1].inicio_previsto == _dt(11, 45)
    assert resultado.visitas_ajustadas[1].fim_previsto == _dt(12, 20)
    assert resultado.visitas_ajustadas[2].inicio_previsto == _dt(13, 0)
    assert resultado.visitas_ajustadas[2].fim_previsto == _dt(13, 30)

    assert resultado.compromete_regresso_beja is False
    assert resultado.excesso_regresso_beja_min == 0
    assert resultado.aviso_regresso_beja is None


def test_atraso_saida_avisa_quando_compromete_regresso_a_beja_sem_bloquear():
    resultado = ajustar_por_atraso_saida(
        data_volta=DIA,
        partida_prevista=_dt(9, 30),
        regresso_previsto=_dt(15, 30),
        partida_real_anterior=None,
        nova_partida_real=_dt(10, 15),  # +45 min -> regresso vai para 16:15
        visitas=_visitas_base(),
        hora_limite_beja=time(16, 0),
    )

    assert resultado.atraso_aplicado_min == 45
    assert resultado.novo_regresso_previsto == _dt(16, 15)
    assert resultado.compromete_regresso_beja is True
    assert resultado.excesso_regresso_beja_min == 15
    assert resultado.aviso_regresso_beja is not None
    assert "16:15" in resultado.aviso_regresso_beja
    assert "16:00" in resultado.aviso_regresso_beja


def test_saida_real_pontual_ou_antecipada_nao_altera_horarios():
    resultado = ajustar_por_atraso_saida(
        data_volta=DIA,
        partida_prevista=_dt(9, 30),
        regresso_previsto=_dt(15, 0),
        partida_real_anterior=None,
        nova_partida_real=_dt(9, 20),
        visitas=_visitas_base(),
    )

    assert resultado.atraso_aplicado_min == 0
    assert resultado.visitas_ajustadas == []
    assert resultado.novo_regresso_previsto == _dt(15, 0)


# ---------------------------------------------------------------------
# 2. Atraso numa visita intermédia
# ---------------------------------------------------------------------
def test_atraso_visita_intermedia_ajusta_apenas_seguintes_e_regresso():
    visitas = _visitas_base()
    # Visita 1 já foi concluída a horas
    visitas[0].estado = "CONCLUIDA"
    visitas[0].inicio_real = _dt(10, 0)
    visitas[0].fim_real = _dt(10, 45)

    # Visita 2 (intermédia) estava prevista terminar às 11:50 mas só terminou às 12:20 (+30 min)
    resultado = ajustar_por_atraso_visita(
        data_volta=DIA,
        regresso_previsto=_dt(15, 45),
        visita_id=2,
        novo_inicio_real=_dt(11, 15),
        novo_fim_real=_dt(12, 20),
        visitas=visitas,
        hora_limite_beja=time(16, 0),
    )

    assert resultado.atraso_aplicado_min == 30
    assert resultado.novo_regresso_previsto == _dt(16, 15)
    # Apenas a visita 3 (posterior à visita 2) é deslocada; a visita 1 não é tocada
    assert [v.visita_id for v in resultado.visitas_ajustadas] == [3]
    assert resultado.visitas_ajustadas[0].inicio_previsto == _dt(13, 0)
    assert resultado.visitas_ajustadas[0].fim_previsto == _dt(13, 30)

    # Atraso compromete o regresso às 16:00 em 15 min -> aviso, não bloqueio
    assert resultado.compromete_regresso_beja is True
    assert resultado.excesso_regresso_beja_min == 15
    assert resultado.aviso_regresso_beja is not None


def test_atraso_visita_intermedia_recusa_duracao_negativa_ou_nula():
    with pytest.raises(ValueError, match="estritamente posterior"):
        ajustar_por_atraso_visita(
            data_volta=DIA,
            regresso_previsto=_dt(15, 0),
            visita_id=2,
            novo_inicio_real=_dt(11, 30),
            novo_fim_real=_dt(11, 20),
            visitas=_visitas_base(),
        )


# ---------------------------------------------------------------------
# 3. Coerência de horários e totais (duração e distância)
# ---------------------------------------------------------------------
def test_totais_volta_coerentes_duracao_e_distancia():
    paragens = [
        {
            "ordem": 1,
            "distancia_desde_anterior_km": 12.5,
            "visitas": [
                {
                    "visita_id": 1,
                    "utente_nome": "Maria Teresa",
                    "visita_estado": "CONCLUIDA",
                    "inicio_previsto": _dt(10, 0),
                    "fim_previsto": _dt(10, 45),
                    "inicio_real": _dt(10, 5),
                    "fim_real": _dt(10, 50),
                }
            ],
        },
        {
            "ordem": 2,
            "distancia_desde_anterior_km": 18.0,
            "visitas": [
                {
                    "visita_id": 2,
                    "utente_nome": "José António",
                    "visita_estado": "PLANEADA",
                    "inicio_previsto": _dt(11, 15),
                    "fim_previsto": _dt(11, 50),
                    "inicio_real": None,
                    "fim_real": None,
                }
            ],
        },
    ]

    resumo = calcular_resumo_volta(
        data_volta=DIA,
        partida_prevista=_dt(9, 30),
        regresso_previsto=_dt(15, 0),
        partida_real=_dt(9, 40),
        regresso_real=None,
        distancia_estimada_km=42.0,  # >= 12.5 + 18.0 = 30.5 (inclui regresso a Beja)
        distancia_real_km=None,
        paragens=paragens,
        hora_limite_beja=time(16, 0),
    )

    assert resumo["duracao_prevista_volta_min"] == 330  # 5h30
    assert resumo["duracao_prevista_visitas_min"] == 80  # 45 + 35
    assert resumo["duracao_real_visitas_min"] == 45
    assert resumo["tempo_deslocacao_previsto_min"] == 250  # 330 - 80
    assert resumo["atraso_saida_min"] == 10
    assert resumo["distancia_paragens_soma_km"] == 30.5
    assert resumo["compromete_regresso_beja"] is False
    assert resumo["alertas_coerencia"] == []


def test_totais_volta_deteta_incoerencias_de_horarios_e_distancia():
    paragens = [
        {
            "ordem": 1,
            "distancia_desde_anterior_km": 25.0,
            "visitas": [
                {
                    "visita_id": 1,
                    "utente_nome": "Utente A",
                    "visita_estado": "PLANEADA",
                    "inicio_previsto": _dt(11, 0),
                    "fim_previsto": _dt(12, 0),
                    "inicio_real": None,
                    "fim_real": None,
                }
            ],
        },
        {
            "ordem": 2,
            "distancia_desde_anterior_km": 20.0,
            "visitas": [
                {
                    "visita_id": 2,
                    "utente_nome": "Utente B",
                    "visita_estado": "PLANEADA",
                    "inicio_previsto": _dt(11, 30),  # sobrepõe Utente A
                    "fim_previsto": _dt(15, 30),     # ultrapassa regresso previsto 15:00
                    "inicio_real": None,
                    "fim_real": None,
                }
            ],
        },
    ]

    resumo = calcular_resumo_volta(
        data_volta=DIA,
        partida_prevista=_dt(9, 30),
        regresso_previsto=_dt(15, 0),
        partida_real=None,
        regresso_real=None,
        distancia_estimada_km=30.0,  # incoerente: menor que soma dos troços (45.0 km)
        distancia_real_km=None,
        paragens=paragens,
        hora_limite_beja=time(16, 0),
    )

    assert any("sobreposto" in a.lower() for a in resumo["alertas_coerencia"])
    assert any("regresso previsto" in a.lower() for a in resumo["alertas_coerencia"])
    assert any("inferior à soma dos troços" in a.lower() for a in resumo["alertas_coerencia"])


def test_totais_volta_nao_gera_alertas_falsos_quando_visitas_partilham_o_horario_da_volta():
    # Enquanto não existir hora por paragem (RF39/RF21), POST /voltas dá a
    # todas as visitas o mesmo inicio_previsto/fim_previsto (o da volta
    # toda) — isto não é um conflito real e não pode gerar "sobreposição"
    # nem fazer a soma das durações "exceder" o total da volta.
    janela_unica = {"inicio_previsto": _dt(9, 30), "fim_previsto": _dt(16, 0)}
    paragens = [
        {
            "ordem": 1,
            "distancia_desde_anterior_km": 10.0,
            "visitas": [
                {"visita_id": 1, "utente_nome": "Utente A", "visita_estado": "PLANEADA", **janela_unica},
            ],
        },
        {
            "ordem": 2,
            "distancia_desde_anterior_km": 8.0,
            "visitas": [
                {"visita_id": 2, "utente_nome": "Utente B", "visita_estado": "PLANEADA", **janela_unica},
            ],
        },
        {
            "ordem": 3,
            "distancia_desde_anterior_km": 5.0,
            "visitas": [
                {"visita_id": 3, "utente_nome": "Utente C", "visita_estado": "PLANEADA", **janela_unica},
            ],
        },
    ]

    resumo = calcular_resumo_volta(
        data_volta=DIA,
        partida_prevista=_dt(9, 30),
        regresso_previsto=_dt(16, 0),
        partida_real=None,
        regresso_real=None,
        distancia_estimada_km=None,
        distancia_real_km=None,
        paragens=paragens,
        hora_limite_beja=time(16, 0),
    )

    assert resumo["duracao_prevista_volta_min"] == 390  # 6h30
    assert resumo["duracao_prevista_visitas_min"] == 390  # janela única, contada uma vez
    assert resumo["tempo_deslocacao_previsto_min"] == 0
    assert resumo["alertas_coerencia"] == []


# ---------------------------------------------------------------------
# 4. Teste de integração HTTP (FastAPI TestClient sem BD externa)
# ---------------------------------------------------------------------
class _FakeCursor:
    def __init__(self, rows):
        self._rows = rows

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return list(self._rows)


class _FakeConn:
    """Base de dados em memória mínima para testar os endpoints de horários reais."""

    def __init__(self):
        self.volta = {
            "id": 10,
            "data": DIA,
            "designacao": "RF40-V13",
            "estado": "CONFIRMADA",
            "equipa_id": 1,
            "equipa_codigo": "A",
            "viatura_id": 1,
            "viatura_matricula": "AA-24-BB",
            "partida_prevista": _dt(9, 30),
            "regresso_previsto": _dt(15, 30),
            "partida_real": None,
            "regresso_real": None,
            "distancia_estimada_km": 40.0,
            "metodo_distancia": "LINHA_RETA",
            "distancia_real_km": None,
            "fonte_distancia_real": None,
        }
        self.visitas = [
            {
                "paragem_id": 1,
                "ordem": 1,
                "local_id": 1,
                "distancia_desde_anterior_km": 10.0,
                "local_nome": None,
                "local_morada": "Rua A, 1",
                "lat": 38.01,
                "lng": -7.86,
                "visita_id": 101,
                "utente_id": 1,
                "utente_nome": "Utente 1",
                "visita_estado": "PLANEADA",
                "inicio_previsto": _dt(10, 0),
                "fim_previsto": _dt(10, 45),
                "duracao_estimada_min": 45,
                "inicio_real": None,
                "fim_real": None,
                "duracao_real_min": None,
                "urgencia_designacao": "Urgente 0 dias",
                "urgencia_cor": "#E0392B",
            },
            {
                "paragem_id": 2,
                "ordem": 2,
                "local_id": 2,
                "distancia_desde_anterior_km": 15.0,
                "local_nome": None,
                "local_morada": "Rua B, 2",
                "lat": 38.05,
                "lng": -7.88,
                "visita_id": 102,
                "utente_id": 2,
                "utente_nome": "Utente 2",
                "visita_estado": "PLANEADA",
                "inicio_previsto": _dt(11, 15),
                "fim_previsto": _dt(12, 0),
                "duracao_estimada_min": 45,
                "inicio_real": None,
                "fim_real": None,
                "duracao_real_min": None,
                "urgencia_designacao": "Urgente 1 dia",
                "urgencia_cor": "#EF8A1C",
            },
        ]

    def commit(self):
        # No-op: este fake não tem transação real para fechar. Existe para
        # que os endpoints que chamam _commit_ou_erro(conn) (ex. registo de
        # horários reais) funcionem neste teste sem precisar de uma BD real.
        pass

    def rollback(self):
        pass

    def execute(self, query: str, params=()):
        q = " ".join(query.split()).upper()

        if "FROM PARAMETRO_SISTEMA" in q:
            return _FakeCursor([{"valor": "16:00"}])

        if q.startswith("SELECT ID, DATA, ESTADO, PARTIDA_PREVISTA"):
            return _FakeCursor([dict(self.volta)] if params[0] == self.volta["id"] else [])

        if q.startswith("SELECT V.ID, V.DATA, V.DESIGNACAO"):
            return _FakeCursor([dict(self.volta)] if params[0] == self.volta["id"] else [])

        if "SELECT VIS.ID AS VISITA_ID, P.ORDEM AS PARAGEM_ORDEM" in q:
            return _FakeCursor(
                [
                    {
                        "visita_id": v["visita_id"],
                        "paragem_ordem": v["ordem"],
                        "estado": v["visita_estado"],
                        "inicio_previsto": v["inicio_previsto"],
                        "fim_previsto": v["fim_previsto"],
                        "inicio_real": v["inicio_real"],
                        "fim_real": v["fim_real"],
                    }
                    for v in self.visitas
                ]
            )

        if "SELECT P.ID AS PARAGEM_ID, P.ORDEM, P.LOCAL_ID" in q:
            return _FakeCursor([dict(v) for v in self.visitas])

        if q.startswith("UPDATE VISITA SET INICIO_PREVISTO = %S, FIM_PREVISTO = %S"):
            ini_p, fim_p, vid = params
            for v in self.visitas:
                if v["visita_id"] == vid:
                    v["inicio_previsto"] = ini_p
                    v["fim_previsto"] = fim_p
            return _FakeCursor([])

        if q.startswith("UPDATE VISITA SET INICIO_REAL = %S"):
            ini_r, fim_r, est, vid = params
            for v in self.visitas:
                if v["visita_id"] == vid:
                    v["inicio_real"] = ini_r
                    v["fim_real"] = fim_r
                    v["visita_estado"] = est
                    if ini_r and fim_r:
                        v["duracao_real_min"] = round((fim_r - ini_r).total_seconds() / 60, 2)
            return _FakeCursor([])

        if q.startswith("SELECT COUNT(*) AS TOTAL FROM VISITA_PARTICIPANTE"):
            return _FakeCursor([{"total": 1}])

        if q.startswith("UPDATE VOLTA SET PARTIDA_REAL = %S"):
            p_r, r_r, r_p, est, _ = params
            self.volta["partida_real"] = p_r
            self.volta["regresso_real"] = r_r
            self.volta["regresso_previsto"] = r_p
            self.volta["estado"] = est
            return _FakeCursor([])

        if q.startswith("UPDATE VOLTA SET REGRESSO_PREVISTO = %S"):
            self.volta["regresso_previsto"] = params[0]
            return _FakeCursor([])

        return _FakeCursor([])


def test_api_atraso_saida_e_visita_intermedia_nao_bloqueia_e_emite_aviso():
    fake_conn = _FakeConn()
    app.dependency_overrides[get_conn] = lambda: fake_conn
    app.dependency_overrides[get_current_user] = lambda: {
        "id": 1,
        "nome": "Coordenador Teste",
        "perfil": "COORDENADOR",
        "ativo": True,
        "vista_geral": True,
    }

    try:
        client = TestClient(app)

        # 1) Atraso na saída de 45 min (09:30 -> 10:15): regresso passa de 15:30 para 16:15 (compromete 16:00)
        resp_saida = client.put(
            "/api/v1/voltas/10/horarios-reais",
            json={"partida_real": _dt(10, 15).isoformat()},
        )
        assert resp_saida.status_code == 200
        dados_saida = resp_saida.json()
        assert dados_saida["resumo"]["atraso_saida_min"] == 45
        assert dados_saida["resumo"]["compromete_regresso_beja"] is True
        assert dados_saida["resumo"]["excesso_regresso_beja_min"] == 15
        assert dados_saida["paragens"][0]["visitas"][0]["inicio_previsto"].startswith("2026-11-12T10:45")
        assert dados_saida["paragens"][1]["visitas"][0]["inicio_previsto"].startswith("2026-11-12T12:00")

        # 2) Atraso adicional de 20 min na visita 1 (prevista terminar 11:30, terminou 11:50)
        resp_visita = client.put(
            "/api/v1/voltas/10/visitas/101/horarios-reais",
            json={
                "inicio_real": _dt(10, 45).isoformat(),
                "fim_real": _dt(11, 50).isoformat(),
            },
        )
        assert resp_visita.status_code == 200
        dados_visita = resp_visita.json()
        # Visita 2 deslocada mais 20 min (12:00 -> 12:20) e regresso passa para 16:35 (+35 min além das 16:00)
        assert dados_visita["paragens"][1]["visitas"][0]["inicio_previsto"].startswith("2026-11-12T12:20")
        assert dados_visita["resumo"]["excesso_regresso_beja_min"] == 35
        assert dados_visita["resumo"]["compromete_regresso_beja"] is True
    finally:
        app.dependency_overrides.clear()