import React from 'react';
import type { Utente } from '../types/utente';

interface Props {
  utente: Utente | null;
}

const FichaUtenteCard: React.FC<Props> = ({ utente }) => {
  // Se não houver utente selecionado, mostra um ecrã vazio
  if (!utente) {
    return (
      <div className="card shadow-sm border-0 h-100 bg-light d-flex align-items-center justify-content-center">
        <p className="text-muted">Selecione um utente para ver os detalhes.</p>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 h-100">
      {/* Cabeçalho */}
      <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
        <h6 className="fw-bold mb-0 text-dark">Ficha do Utente</h6>
        <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
          {utente.estado}
        </span>
      </div>
      
      <div className="card-body p-4">
        {/* Identificação Base */}
        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom border-light">
          <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{width: '64px', height: '64px'}}>
            <i className="bi bi-person-fill" style={{ fontSize: '2rem' }}></i>
          </div>
          <div>
            <h5 className="fw-bold mb-1 text-dark">{utente.nome}</h5>
            <p className="text-muted mb-0 small">N.º Utente: {utente.numeroUtente}</p>
          </div>
        </div>

        {/* Grelha de Dados (2 Colunas) */}
        <div className="row g-4">
          {/* Coluna Esquerda */}
          <div className="col-md-6 d-flex flex-column gap-3">
            <DetailItem icon="bi-calendar3" label="Data de Nascimento:" value={utente.dataNascimento} />
            <DetailItem icon="bi-telephone" label="Telefone:" value={utente.telefone} />
            <DetailItem icon="bi-person-heart" label="Cuidador Principal:" value={utente.cuidadorPrincipal} />
            <DetailItem icon="bi-geo-alt" label="Morada:" value={utente.morada} />
            <DetailItem icon="bi-geo" label="Coordenadas GPS:" value={utente.coordenadas} />
          </div>
          
          {/* Coluna Direita */}
          <div className="col-md-6 d-flex flex-column gap-3">
            <DetailItem icon="bi-clock" label="Última Visita:" value={utente.ultimaVisita} />
            <DetailItem icon="bi-stethoscope" label="Médico Assistente:" value={utente.medicoAssistente} />
            
            {/* Situação Clínica (Lista) */}
            <div className="d-flex gap-2">
              <i className="bi bi-clipboard2-pulse text-success fs-5 mt-1"></i>
              <div>
                <p className="text-muted small mb-1">Situação Clínica:</p>
                <ul className="mb-0 ps-3 small fw-medium text-dark">
                  {utente.situacaoClinica.map((sit, idx) => <li key={idx}>{sit}</li>)}
                </ul>
              </div>
            </div>

            <DetailItem icon="bi-journal-text" label="Notas:" value={utente.notas} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-componente auxiliar para manter o código limpo (ESTA É A PARTE QUE FALTAVA)
const DetailItem = ({ icon, label, value }: { icon: string, label: string, value: string }) => (
  <div className="d-flex gap-2">
    <i className={`bi ${icon} text-success fs-5`}></i>
    <div>
      <p className="text-muted small mb-0">{label}</p>
      <p className="fw-medium text-dark mb-0 small">{value}</p>
    </div>
  </div>
);

export default FichaUtenteCard;