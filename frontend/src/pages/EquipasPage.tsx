import React, { useState, useEffect } from 'react';
import { getEquipas } from '../services/equipaService';
import { getViaturas } from '../services/viaturaService';
import type { Equipa } from '../types/equipa';
import type { Viatura } from '../types/viatura';
import EcraCarregamento from '../components/EcraCarregamento';


const EquipasPage: React.FC = () => {
  const [equipas, setEquipas] = useState<Equipa[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      getEquipas().then(setEquipas).catch((erro) => console.error('Falha ao carregar equipas:', erro)),
      getViaturas().then(setViaturas).catch((erro) => console.error('Falha ao carregar viaturas:', erro)),
    ]).finally(() => setCarregando(false));
  }, [])

  const viaturasDaEquipa = (equipa: Equipa) => {
    return viaturas.filter(v => v.equipa_codigo === equipa.codigo);
  }

  const viaturasSemEquipa = () => {
    return viaturas.filter(v => v.equipa_codigo === null);
  }

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
          <h1 className="h4 fw-bold text-dark mb-1">Equipas</h1>
          <p className="text-muted mb-0 small">Gestão de equipas, profissionais e viaturas associadas</p>
        </div>
        <button
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
          disabled
          title="Em breve"
        >
          <i className="bi bi-plus-lg"></i>
          Nova Equipa
        </button>
      </div>

      {/* Grelha de Cartões por Equipa */}
      <div className="row g-3">
        {equipas.map((equipa) => (
          <div key={equipa.id} className="col-12 col-md-6">
            <div className="ulsba-card h-100">

              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="fw-bold mb-1">Equipa {equipa.codigo}</h6>
                  <p className="text-muted small mb-2">{equipa.designacao}</p>
                </div>
                <button className="btn btn-sm btn-outline-secondary" disabled title="Em breve">
                  <i className="bi bi-pencil"></i>
                </button>
              </div>

              <div>
                <p className="text-muted small fw-medium mb-1">Profissionais</p>
                {equipa.membros.map((membro) => (
                  <div key={membro.id}>
                    {membro.nome + " — " + membro.funcao}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-muted small fw-medium mb-1">Viaturas</p>
                {viaturasDaEquipa(equipa).map((viatura) => (
                  <div key={viatura.id} className="small mb-1">
                    <span className="fw-medium">{viatura.matricula}</span> — {viatura.designacao} ({viatura.estado})
                  </div>
                ))}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Cartão "Sem equipa atribuída" */}
      {viaturasSemEquipa().length > 0 && (
        <div className="mt-3">
          <div className="ulsba-card">
            <p className="text-muted small fw-medium mb-1">Sem equipa atribuída</p>
            {viaturasSemEquipa().map((viatura) => (
              <div key={viatura.id} className="small mb-1">
                <span className="fw-medium">{viatura.matricula}</span> — {viatura.designacao} ({viatura.estado})
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default EquipasPage;
