import { useState } from 'react';
import { format } from 'date-fns';
import { criarVolta } from '../services/voltaService';
import { viaturaBloqueadaNoDia } from '../services/viaturaService';
import { getNivelPrioridade } from '../config/niveis';
import type { Equipa } from '../types/equipa';
import type { BloqueioViatura, Viatura } from '../types/viatura';
import type { Volta } from '../types/volta';
import type { Utente } from '../types/utente';

interface Props {
  data: Date;
  equipas: Equipa[];
  viaturas: Viatura[];
  bloqueiosViaturas: BloqueioViatura[];
  viaturaIdInicial?: number;
  utentes: Utente[];
  voltasDoMes: Volta[];
  onCriada: () => void;
}

const PainelConstrucaoRota = ({
  data,
  equipas,
  viaturas,
  bloqueiosViaturas,
  viaturaIdInicial,
  utentes,
  voltasDoMes,
  onCriada,
}: Props) => {
  // Usa a data local (evita desvio de -1 dia no fuso horário de verão com toISOString)
  const diaIso = format(data, 'yyyy-MM-dd');
  const voltasDesseDia = voltasDoMes.filter((v) => v.data === diaIso);

  const equipasDisponiveis = equipas.filter(
    (equipa) => !voltasDesseDia.some((v) => v.equipaId === equipa.id),
  );

  // Exclui automaticamente viaturas já alocadas nesse dia, inativas/em revisão ou com bloqueio no dia
  const viaturasDisponiveis = viaturas.filter((viatura) => {
    const ocupadaEmVolta = voltasDesseDia.some((v) => v.viaturaId === viatura.id);
    const bloqueadaNoDia = Boolean(viaturaBloqueadaNoDia(bloqueiosViaturas, viatura.id, diaIso));
    const operacional = viatura.estado === 'OPERACIONAL';
    return operacional && !ocupadaEmVolta && !bloqueadaNoDia;
  });

  const viaturasBloqueadasHoje = viaturas.filter((viatura) =>
    Boolean(viaturaBloqueadaNoDia(bloqueiosViaturas, viatura.id, diaIso)),
  );

  const [equipaId, setEquipaId] = useState<number | undefined>();
  const [viaturaId, setViaturaId] = useState<number | undefined>(() =>
    viaturaIdInicial && viaturasDisponiveis.some((v) => v.id === viaturaIdInicial)
      ? viaturaIdInicial
      : undefined,
  );
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [aEnviar, setAEnviar] = useState(false);

  const utentesOrdenados = [...utentes].sort((a, b) => {
    const ordemA = getNivelPrioridade(a.prioridade)?.ordem ?? Infinity;
    const ordemB = getNivelPrioridade(b.prioridade)?.ordem ?? Infinity;
    if (ordemA !== ordemB) return ordemA - ordemB;
    return new Date(a.ultimaVisita).getTime() - new Date(b.ultimaVisita).getTime();
  });

  const alternarSelecionado = (id: number) => {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((selecionadoId) => selecionadoId !== id) : [...atual, id],
    );
  };

  const submeter = async () => {
    if (!equipaId || !viaturaId || selecionados.length === 0) return;
    setAEnviar(true);
    try {
      await criarVolta({
        data: diaIso,
        equipaId,
        viaturaId,
        utenteIds: selecionados,
      });
      onCriada();
    } catch (erro) {
      console.error('Falha ao criar volta:', erro);
    } finally {
      setAEnviar(false);
    }
  };

  return (
    <div>
      <div className="mb-2">
        <label className="form-label small fw-medium">Equipa</label>
        <select
          className="form-select form-select-sm"
          value={equipaId ?? ''}
          onChange={(e) => setEquipaId(e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">Escolher equipa</option>
          {equipasDisponiveis.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.designacao ?? `Equipa ${eq.codigo}`}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="form-label small fw-medium">Viatura disponível</label>
        <select
          className="form-select form-select-sm"
          value={viaturaId ?? ''}
          onChange={(e) => setViaturaId(e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">
            {viaturasDisponiveis.length === 0
              ? 'Sem viaturas disponíveis neste dia'
              : 'Escolher viatura'}
          </option>
          {viaturasDisponiveis.map((v) => (
            <option key={v.id} value={v.id}>
              {v.matricula} {v.designacao ? `— ${v.designacao}` : ''}
            </option>
          ))}
        </select>
        {viaturasBloqueadasHoje.length > 0 && (
          <div className="form-text text-danger">
            Excluídas por bloqueio neste dia:{' '}
            {viaturasBloqueadasHoje.map((v) => v.matricula).join(', ')}
          </div>
        )}
      </div>

      <label className="form-label small fw-medium">Utentes</label>
      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
        {utentesOrdenados.map((u) => (
          <div key={u.id} className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              checked={selecionados.includes(Number(u.id))}
              onChange={() => alternarSelecionado(Number(u.id))}
            />
            <label className="form-check-label small">
              {u.nome} — {u.prioridade}
            </label>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-success btn-sm mt-3 w-100"
        disabled={aEnviar || !equipaId || !viaturaId || selecionados.length === 0}
        onClick={submeter}
      >
        {aEnviar ? 'A criar volta...' : 'Criar volta'}
      </button>
    </div>
  );
};

export default PainelConstrucaoRota;