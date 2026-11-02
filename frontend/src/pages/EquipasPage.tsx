import React, { useState, useEffect } from 'react';
import { getEquipasFicticias } from '../services/equipaService';
import { getViaturasFicticias } from '../services/viaturaService';
import type { Equipa } from '../types/equipa';
import type { Viatura } from '../types/viatura';


const EquipasPage: React.FC = () => {
  const [equipas, setEquipas] = useState<Equipa[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);

  useEffect(() => {
    getEquipasFicticias().then(setEquipas);
    getViaturasFicticias().then(setViaturas);
  }, [])

  const viaturasDaEquipa = (equipa: Equipa) => {
    return viaturas.filter(e => e.equipaId === equipa.id);
  }

  const viaturasSemEquipa = () => {
    return viaturas.filter(e => e.equipaId === null);
  }

  return (
    <div className="h-100 d-flex flex-column">

      {/* Cabeçalho da Página */}
      <div className="d-flex justify-content-between align-items-center mb-4">
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
          <div key={equipa.id} className="col-md-6">
            <div className="ulsba-card h-100">

              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="fw-bold mb-1">{equipa.nome}</h6>
                  <p className="text-muted small mb-2">{equipa.zona}</p>
                </div>
                <button className="btn btn-sm btn-outline-secondary" disabled title="Em breve">
                  <i className="bi bi-pencil"></i>
                </button>
              </div>

              <div>
                <p className="text-muted small fw-medium mb-1">Profissionais</p>
                {equipa.profissionais.map((profissional, idx) => (
                  <div key={idx}>
                    {profissional.nome + " " + profissional.funcao}
                  </div>
                ))}
              </div>

              <div>
                <p className="text-muted small fw-medium mb-1">Viaturas</p>
                {viaturasDaEquipa(equipa).map((viatura) => (
                  <div key={viatura.id} className="small mb-1">
                    <span className="fw-medium">{viatura.matricula}</span> — {viatura.modelo} ({viatura.estado})
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
                <span className="fw-medium">{viatura.matricula}</span> — {viatura.modelo} ({viatura.estado})
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default EquipasPage;
