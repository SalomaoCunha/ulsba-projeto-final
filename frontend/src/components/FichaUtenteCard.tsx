import React from 'react';
import type { Utente } from '../types/utente';
import { getNivelComplexidade } from '@/config/niveis';

interface Props {
  utente: Utente | null;
  onEditar: () => void;
}

const formatarMorada = (utente: Utente) =>
  `${utente.ruaNumero}, ${utente.codigoPostal} ${utente.localidade} (${utente.concelho})`;

const FichaUtenteCard: React.FC<Props> = ({ utente, onEditar }) => {
  // Se não houver utente selecionado, mostra um ecrã vazio
  if (!utente) {
    return (
      <div className="card shadow-sm border-0 h-100 bg-light d-flex align-items-center justify-content-center">
        <p className="text-muted">Selecione um utente para ver os detalhes.</p>
      </div>
    );
  }

  const nivelComplexidade = getNivelComplexidade(utente.complexidade);

  return (
    <div className="card shadow-sm border-0 h-100 d-flex flex-column" style={{ minHeight: 0, maxHeight: '100%' }}>
      {/* Cabeçalho */}
      <div className="card-header bg-white border-bottom-0 pt-3 pb-2 d-flex flex-wrap justify-content-between align-items-center gap-2 flex-shrink-0">
        <h6 className="fw-bold mb-0 text-dark text-nowrap">Ficha do Utente</h6>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {nivelComplexidade && (
            <span
              className="ulsba-pill"
              style={{ backgroundColor: nivelComplexidade.corBg, color: nivelComplexidade.corTexto }}
            >
              {nivelComplexidade.label}
            </span>
          )}
          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
            {utente.estado}
          </span>
          <button className="btn btn-sm btn-outline-secondary" onClick={onEditar} title="Editar">
            <i className="bi bi-pencil"></i>
          </button>
        </div>
      </div>

      <div className="card-body p-3" style={{ overflowY: 'auto', minHeight: 0, maxHeight: '100%' }}>
        {/* Identificação Base */}
        <div className="d-flex align-items-center gap-3 mb-2 pb-1 border-bottom border-light">
          <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '44px', height: '44px' }}>
            <i className="bi bi-person-fill" style={{ fontSize: '1.4rem' }}></i>
          </div>
          <div>
            <h6 className="fw-bold mb-0 text-dark">{utente.nome}</h6>
            <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>N.º Utente: {utente.numeroUtente}</p>
          </div>
        </div>

        {/* Grelha de Dados (2 Colunas) */}
        <div className="row g-2">
          {/* Coluna Esquerda */}
          <div className="col-12 col-md-6 d-flex flex-column gap-1">
            <DetailItem icon="bi-calendar3" label="Data de Nascimento:" value={utente.dataNascimento} />
            <DetailItem icon="bi-telephone" label="Telefone:" value={utente.telefone} />
            <DetailItem icon="bi-person-heart" label="Cuidador Principal:" value={utente.cuidadorPrincipal} />
            <DetailItem icon="bi-signpost" label="Tipo de Local:" value={utente.tipoLocal} />
            {utente.nomeInstituicao && (
              <DetailItem icon="bi-building" label="Instituição:" value={utente.nomeInstituicao} />
            )}
            <DetailItem icon="bi-geo-alt" label="Morada:" value={formatarMorada(utente)} />
          </div>

          {/* Coluna Direita */}
          <div className="col-12 col-md-6 d-flex flex-column gap-1">
            <DetailItem icon="bi-clock" label="Última Visita:" value={utente.ultimaVisita} />
            <DetailItem icon="bi-people" label="Equipa Responsável:" value={utente.equipaResponsavel} />

            {/* Situação Clínica (Lista) */}
            <div className="d-flex gap-2">
              <i className="bi bi-clipboard2-pulse text-success mt-1"></i>
              <div>
                <p className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Situação Clínica:</p>
                <ul className="mb-0 ps-3 fw-medium text-dark" style={{ fontSize: '0.8rem' }}>
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
    <i className={`bi ${icon} text-success`}></i>
    <div>
      <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>{label}</p>
      <p className="fw-medium text-dark mb-0" style={{ fontSize: '0.8rem' }}>{value}</p>
    </div>
  </div>
);

export default FichaUtenteCard;