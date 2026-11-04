import React, { useState, useEffect } from 'react';
import { getViaturasFicticias } from '../services/viaturaService';
import { getEquipasFicticias } from '../services/equipaService';
import type { Viatura, EstadoViatura } from '../types/viatura';
import type { Equipa } from '../types/equipa';

const ViaturasPage: React.FC = () => {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [equipas, setEquipas] = useState<Equipa[]>([]);

  useEffect(() => {
    getViaturasFicticias().then(setViaturas);
    getEquipasFicticias().then(setEquipas);
  }, []);

  const nomeDaEquipa = (equipaId: string | null) => {
    if (!equipaId) return 'Sem equipa atribuída';
    return equipas.find(e => e.id === equipaId)?.nome ?? 'Sem equipa atribuída';
  };

  const getBadgeEstado = (estado: EstadoViatura) => {
    const estilos: Record<EstadoViatura, string> = {
      'Ativa': 'bg-success-subtle text-success border-success-subtle',
      'Inativa': 'bg-secondary-subtle text-secondary border-secondary-subtle',
      'Em manutenção': 'bg-warning-subtle text-warning-emphasis border-warning-subtle',
    };
    return (
      <span className={`badge border px-2 py-1 rounded-pill ${estilos[estado]}`}>
        {estado}
      </span>
    );
  };

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
      <div className="card shadow-sm border-0 flex-grow-1 bg-white d-flex flex-column overflow-hidden">
        <div className="table-responsive flex-grow-1" style={{ minHeight: 0 }}>
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small">
              <tr>
                <th className="fw-medium border-bottom-0 ps-4 py-3">Matrícula</th>
                <th className="fw-medium border-bottom-0 py-3">Modelo</th>
                <th className="fw-medium border-bottom-0 py-3 d-none d-md-table-cell">Combustível</th>
                <th className="fw-medium border-bottom-0 py-3 d-none d-md-table-cell">Autonomia</th>
                <th className="fw-medium border-bottom-0 py-3 d-none d-md-table-cell">Lugares</th>
                <th className="fw-medium border-bottom-0 py-3 d-none d-md-table-cell">Equipa</th>
                <th className="fw-medium border-bottom-0 py-3 d-none d-md-table-cell">Próxima Revisão</th>
                <th className="fw-medium border-bottom-0 py-3">Estado</th>
                <th className="fw-medium border-bottom-0 pe-4 py-3 text-end">Ações</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {viaturas.map((viatura) => (
                <tr key={viatura.id}>
                  <td className="ps-4 py-3 fw-medium text-dark">{viatura.matricula}</td>
                  <td className="py-3 text-muted">{viatura.modelo}</td>
                  <td className="py-3 text-muted d-none d-md-table-cell">{viatura.combustivel}</td>
                  <td className="py-3 text-muted d-none d-md-table-cell">{viatura.autonomiaKm} km</td>
                  <td className="py-3 text-muted d-none d-md-table-cell">{viatura.lugares}</td>
                  <td className="py-3 text-muted d-none d-md-table-cell">{nomeDaEquipa(viatura.equipaId)}</td>
                  <td className="py-3 text-muted d-none d-md-table-cell">{viatura.proximaRevisao}</td>
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
