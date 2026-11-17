import React, { useState, useEffect } from 'react';
import { getViaturas } from '../services/viaturaService';
import type { Viatura, EstadoViatura } from '../types/viatura';
import EcraCarregamento from '../components/EcraCarregamento';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';

const LABEL_MOTORIZACAO: Record<string, string> = {
  GASOLINA: 'Gasolina',
  GASOLEO: 'Gasóleo',
  HIBRIDO: 'Híbrido',
  ELETRICO: 'Elétrico',
  OUTRO: 'Outro',
};

const LABEL_ESTADO: Record<EstadoViatura, string> = {
  OPERACIONAL: 'Ativa',
  EM_MANUTENCAO: 'Em manutenção',
  INATIVA: 'Inativa',
};

const calcularProximaRevisao = (viatura: Viatura) => {
  if (!viatura.data_ultima_revisao || !viatura.periodicidade_revisao_meses) {
    return '—';
  }
  const data = new Date(viatura.data_ultima_revisao);
  data.setMonth(data.getMonth() + viatura.periodicidade_revisao_meses);
  return data.toLocaleDateString('pt-PT');
};

const ViaturasPage: React.FC = () => {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    comAtrasoMinimo(getViaturas()).then(setViaturas).catch((erro) => console.error('Falha ao carregar viaturas:', erro)).finally(() => setCarregando(false));
  }, []);

  const nomeDaEquipa = (equipaCodigo: string | null) => {
    return equipaCodigo ? `Equipa ${equipaCodigo}` : 'Sem equipa atribuída';
  };

  const getBadgeEstado = (estado: EstadoViatura) => {
    const estilos: Record<EstadoViatura, string> = {
      'OPERACIONAL': 'bg-success-subtle text-success border-success-subtle',
      'INATIVA': 'bg-secondary-subtle text-secondary border-secondary-subtle',
      'EM_MANUTENCAO': 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
    };
    return (
      <span className={`badge border px-2 py-1 rounded-pill ${estilos[estado]}`}>
        {LABEL_ESTADO[estado]}
      </span>
    );
  };

  if (carregando) {
    return (
      <EcraCarregamento mensagem="A ligar ao servidor. Na primeira vez pode demorar um pouco mais (o servidor estava a dormir)." />
    );
  }

  return (
    <div className="h-100 d-flex flex-column">

      {/* Cabeçalho da Página */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Viaturas</h1>
          <p className="text-muted mb-0 small">Gestão de viaturas, estado e disponibilidade</p>
        </div>
        <button
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
          disabled
          title="Em breve"
        >
          <i className="bi bi-plus-lg"></i>
          Nova Viatura
        </button>
      </div>

      {/* Cartão Branco Principal */}
      <div className="card shadow-sm border-0 flex-grow-1 bg-white d-flex flex-column overflow-hidden ulsba-table-card-shell">

        {/* Lista em cartões — só em mobile (<md) */}
        <div className="d-md-none">
          {viaturas.map((viatura) => (
            <div key={viatura.id} className="d-flex align-items-center gap-2 p-3 border-bottom">
              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="fw-medium text-dark text-truncate">{viatura.matricula} — {viatura.designacao}</div>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {getBadgeEstado(viatura.estado)}
                </div>
              </div>
              <button className="btn btn-sm btn-light text-secondary shadow-sm border flex-shrink-0" disabled title="Em breve">
                <i className="bi bi-pencil"></i>
              </button>
            </div>
          ))}
        </div>

        {/* Tabela de Dados — a partir de md */}
        <div className="table-responsive flex-grow-1 d-none d-md-block">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small">
              <tr>
                <th className="fw-medium border-bottom-0 ps-4 py-3">Matrícula</th>
                <th className="fw-medium border-bottom-0 py-3">Modelo</th>
                <th className="fw-medium border-bottom-0 py-3">Combustível</th>
                <th className="fw-medium border-bottom-0 py-3">Autonomia</th>
                <th className="fw-medium border-bottom-0 py-3">Lugares</th>
                <th className="fw-medium border-bottom-0 py-3">Equipa</th>
                <th className="fw-medium border-bottom-0 py-3">Próxima Revisão</th>
                <th className="fw-medium border-bottom-0 py-3">Estado</th>
                <th className="fw-medium border-bottom-0 pe-4 py-3 text-end">Ações</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {viaturas.map((viatura) => (
                <tr key={viatura.id}>
                  <td className="ps-4 py-3 fw-medium text-dark">{viatura.matricula}</td>
                  <td className="py-3 text-muted">{viatura.designacao}</td>
                  <td className="py-3 text-muted">{LABEL_MOTORIZACAO[viatura.tipo_motorizacao] ?? viatura.tipo_motorizacao}</td>
                  <td className="py-3 text-muted">{viatura.autonomia ?? '—'} {viatura.unidade_autonomia === 'KM' ? 'km' : viatura.unidade_autonomia === 'PERCENTAGEM' ? '%' : ''}</td>
                  <td className="py-3 text-muted">{viatura.lugares}</td>
                  <td className="py-3 text-muted">{nomeDaEquipa(viatura.equipa_codigo)}</td>
                  <td className="py-3 text-muted">{calcularProximaRevisao(viatura)}</td>
                  <td className="py-3">{getBadgeEstado(viatura.estado)}</td>
                  <td className="pe-4 py-3 text-end">
                    <button className="btn btn-sm btn-light text-secondary shadow-sm border" disabled title="Em breve">
                      <i className="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default ViaturasPage;
