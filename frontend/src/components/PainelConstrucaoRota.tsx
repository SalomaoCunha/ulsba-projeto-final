import { useState } from 'react';
import { criarVolta } from '../services/voltaService';
import { getNivelPrioridade } from '../config/niveis';
import type { Equipa } from '../types/equipa';
import type { Viatura } from '../types/viatura';
import type { Volta } from '../types/volta';
import type { Utente } from '../types/utente';

interface Props {
  data: Date;
  equipas: Equipa[];
  viaturas: Viatura[];
  utentes: Utente[];
  voltasDoMes: Volta[];
  onCriada: () => void;
}

const PainelConstrucaoRota = ({ data, equipas, viaturas, utentes, voltasDoMes, onCriada }: Props) => {
  const [equipaId, setEquipaId] = useState<number | undefined>();
  const [viaturaId, setViaturaId] = useState<number | undefined>();
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [aEnviar, setAEnviar] = useState(false);

  // Voltas já marcadas no MESMO dia (para não sugerir equipa/viatura ocupada).
  // toISOString() converte para UTC antes de cortar a data — à meia-noite
  // local, num fuso à frente de UTC (Lisboa no verão), isso dá o dia anterior.
  // Construímos a data a partir dos componentes locais para evitar isso.
  const diaIso = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  const voltasDesseDia = voltasDoMes.filter((v) => v.data === diaIso);

  const equipasDisponiveis = equipas.filter(
    (equipa) => !voltasDesseDia.some((v) => v.equipaId === equipa.id),
  );
  const viaturasDisponiveis = viaturas.filter(
    (viatura) => !voltasDesseDia.some((v) => v.viaturaId === viatura.id),
  );

  const utentesOrdenados = [...utentes].sort((a, b) => {
    const ordemA = getNivelPrioridade(a.prioridade)?.ordem ?? Infinity;
    const ordemB = getNivelPrioridade(b.prioridade)?.ordem ?? Infinity;
    if (ordemA !== ordemB) return ordemA - ordemB;
    // Sem ultimaVisita = nunca visitado: trata-se como "há mais tempo
    // possível" (0 = epoch), não como Date('').getTime() === NaN, que
    // desestabilizava o sort (NaN não é > nem < nada).
    const tempoA = a.ultimaVisita ? new Date(a.ultimaVisita).getTime() : 0;
    const tempoB = b.ultimaVisita ? new Date(b.ultimaVisita).getTime() : 0;
    return tempoA - tempoB;
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
            <option key={eq.id} value={eq.id}>{`Equipa ${eq.codigo}`}</option>
          ))}
        </select>
      </div>

      <div className="mb-2">
        <label className="form-label small fw-medium">Viatura</label>
        <select
          className="form-select form-select-sm"
          value={viaturaId ?? ''}
          onChange={(e) => setViaturaId(e.target.value === '' ? undefined : Number(e.target.value))}
        >
          <option value="">Escolher viatura</option>
          {viaturasDisponiveis.map((v) => (
            <option key={v.id} value={v.id}>{v.matricula}</option>
          ))}
        </select>
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
            <label className="form-check-label small">{u.nome} — {u.prioridade}</label>
          </div>
        ))}
      </div>

      <button className="btn btn-success btn-sm mt-3 w-100" disabled={aEnviar} onClick={submeter}>
        Criar volta
      </button>
    </div>
  );
};

export default PainelConstrucaoRota;
