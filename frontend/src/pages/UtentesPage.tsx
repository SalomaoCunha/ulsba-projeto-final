import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUtentes, updateUtente } from '../services/utenteService'
import type { Utente } from '../types/utente'
import { getNivelPrioridade, getNivelComplexidade } from '@/config/niveis';
import VerUtenteModal from '../components/VerUtenteModal';
import EditarUtenteModal from '../components/EditarUtenteModal';
import FiltrosUtentesPainel from '../components/FiltrosUtentesPainel';
import EcraCarregamento from '../components/EcraCarregamento';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';
import { filtrarUtentes, filtrosVazios, type FiltrosUtentes } from '../utils/filtrosUtentes';
import { formatarData } from '../utils/formatarData';

const UtentesPage: React.FC = () => {
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [utentes, setUtentes] = useState<Utente[]>([]);

  const [filtros, setFiltros] = useState<FiltrosUtentes>(filtrosVazios);

  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const [utenteEmFoco, setUtenteEmFoco] = useState<Utente | null>(null);
  const [modalVerAberto, setModalVerAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;

  const navigate = useNavigate();

  useEffect(() => {
    comAtrasoMinimo(getUtentes()).then(setUtentes).finally(() => setCarregando(false));
  }, []);

  // Função auxiliar para renderizar a cor certa da prioridade
  const getBadgePrioridade = (prioridade: string) => {
    const nivel = getNivelPrioridade(prioridade);
    const { corDot, corTexto, label } = nivel ?? { corDot: '#6c757d', corTexto: '#fff', label: prioridade };

    return (
      <span className='badge fw-normal px-2 py-1' style={{ backgroundColor: corDot, color: corTexto }}>
        {label}
      </span>
    );

  };

  // Função auxiliar para renderizar o estado com o estilo do mockup
  const getBadgeEstado = (estado: string) => {
    if (estado === 'Ativo') {
      return <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill">Ativo</span>;
    }
    return <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1 rounded-pill">Inativo</span>;
  };

  // Função auxiliar para renderizar a cor certa da complexidade
  const getBadgeComplexidade = (complexidade: string) => {
    const nivel = getNivelComplexidade(complexidade);
    if (!nivel) {
      return <span className="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1">—</span>;
    }
    return (
      <span className="badge fw-normal px-2 py-1" style={{ backgroundColor: nivel.corBg, color: nivel.corTexto }}>
        {nivel.label}
      </span>
    );
  };

  const termo = termoPesquisa.trim().toLowerCase();
  const utentesFiltrados = filtrarUtentes(utentes, filtros).filter((u) =>
    !termo || u.nome.toLowerCase().includes(termo) || u.numeroUtente.toLowerCase().includes(termo),
  );

  const totalPaginas = Math.max(1, Math.ceil(utentesFiltrados.length / ITENS_POR_PAGINA));
  const paginaValida = Math.min(paginaAtual, totalPaginas);
  const utentesDaPagina = utentesFiltrados.slice(
    (paginaValida - 1) * ITENS_POR_PAGINA,
    paginaValida * ITENS_POR_PAGINA,
  );

  const abrirVisualizacao = (utente: Utente) => {
    setUtenteEmFoco(utente);
    setModalVerAberto(true);
  };

  const abrirEdicao = (utente: Utente) => {
    setUtenteEmFoco(utente);
    setModalEditarAberto(true);
  };

  const passarDeVerParaEditar = () => {
    setModalVerAberto(false);
    setModalEditarAberto(true);
  };

  const guardarEdicao = async (utenteAtualizado: Utente) => {
    const resultado = await updateUtente(utenteAtualizado);

    setUtentes(utentes.map(u => u.id === resultado.id ? resultado : u));
    setUtenteEmFoco(resultado);
    setModalEditarAberto(false);
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
          <h1 className="h4 fw-bold text-dark mb-1">Lista de Utentes</h1>
          <p className="text-muted mb-0 small">Gestão e consulta do diretório de pacientes</p>
        </div>
        <button
          className="btn btn-success d-flex align-items-center gap-2 shadow-sm"
          onClick={() => navigate('/utentes/novo')}
        >
          <i className="bi bi-person-plus"></i>
          Novo Utente
        </button>
      </div>

      {/* Cartão Branco Principal */}
      <div className="card shadow-sm border-0 flex-grow-1 bg-white d-flex flex-column overflow-hidden ulsba-table-card-shell">

        {/* Barra de Ferramentas (Filtros) */}
        <div className="card-header bg-white border-bottom p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="input-group flex-grow-1" style={{ minWidth: '220px', maxWidth: '420px' }}>
            <span className="input-group-text bg-light border-end-0 text-muted">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control bg-light border-start-0"
              placeholder="Pesquisar por nome ou número..."
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
            />
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary d-flex align-items-center gap-2" onClick={() => setFiltrosAbertos(!filtrosAbertos)}>
              <i className="bi bi-funnel"></i> Filtros
            </button>
          </div>
        </div>

        {filtrosAbertos && (
          <FiltrosUtentesPainel utentes={utentes} filtros={filtros} onChange={setFiltros} />
        )}

        {/* Lista em cartões — só em mobile (<md), cabe sempre sem scroll horizontal */}
        <div className="d-md-none">
          {utentesDaPagina.map((utente) => (
            <div key={utente.id} className="d-flex align-items-center gap-2 p-3 border-bottom">
              <div
                className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '38px', height: '38px' }}
              >
                <i className="bi bi-person-fill"></i>
              </div>

              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="fw-medium text-dark text-truncate">{utente.nome}</div>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {getBadgePrioridade(utente.prioridade)}
                  {getBadgeComplexidade(utente.complexidade)}
                  {getBadgeEstado(utente.estado)}
                </div>
              </div>

              <div className="d-flex gap-1 flex-shrink-0">
                <button
                  className="btn btn-sm btn-light text-primary shadow-sm border"
                  onClick={() => abrirVisualizacao(utente)}
                  title="Ver"
                >
                  <i className="bi bi-eye"></i>
                </button>
                <button
                  className="btn btn-sm btn-light text-secondary shadow-sm border"
                  onClick={() => abrirEdicao(utente)}
                  title="Editar"
                >
                  <i className="bi bi-pencil"></i>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tabela de Dados — a partir de md */}
        <div className="table-responsive flex-grow-1 d-none d-md-block">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small">
              <tr>
                <th className="fw-medium border-bottom-0 ps-4 py-3">N.º Utente</th>
                <th className="fw-medium border-bottom-0 py-3">Nome</th>
                <th className="fw-medium border-bottom-0 py-3">Equipa Responsável</th>
                <th className="fw-medium border-bottom-0 py-3">Contacto</th>
                <th className="fw-medium border-bottom-0 py-3">Última Visita</th>
                <th className="fw-medium border-bottom-0 py-3">Prioridade</th>
                <th className="fw-medium border-bottom-0 py-3">Complexidade</th>
                <th className="fw-medium border-bottom-0 py-3">Estado</th>
                <th className="fw-medium border-bottom-0 pe-4 py-3 text-end">Ações</th>
              </tr>
            </thead>
            <tbody className="border-top-0">
              {utentesDaPagina.map((utente) => (
                <tr key={utente.id}>
                  <td className="ps-4 py-3 text-muted">{utente.numeroUtente}</td>
                  <td className="py-3 fw-medium text-dark text-nowrap">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '32px', height: '32px' }}>
                        <i className="bi bi-person-fill"></i>
                      </div>
                      {utente.nome}
                    </div>
                  </td>
                  <td className="py-3 text-muted">{utente.equipaResponsavel}</td>
                  <td className="py-3 text-muted">{utente.telefone}</td>
                  <td className="py-3 text-muted">{formatarData(utente.ultimaVisita)}</td>
                  <td className="py-3">{getBadgePrioridade(utente.prioridade)}</td>
                  <td className="py-3">{getBadgeComplexidade(utente.complexidade)}</td>
                  <td className="py-3">{getBadgeEstado(utente.estado)}</td>
                  <td className="pe-4 py-3 text-end">
                    <button
                      className="btn btn-sm btn-light text-primary me-2 shadow-sm border"
                      onClick={() => abrirVisualizacao(utente)}
                      title="Ver"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-light text-secondary shadow-sm border"
                      onClick={() => abrirEdicao(utente)}
                      title="Editar"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela com Paginação */}
        <div className="card-footer bg-white border-top p-3 d-flex flex-wrap justify-content-between align-items-center gap-2 text-muted small">
          <span>
            {utentesFiltrados.length === 0
              ? 'Sem utentes para mostrar'
              : `A mostrar ${(paginaValida - 1) * ITENS_POR_PAGINA + 1} a ${Math.min(paginaValida * ITENS_POR_PAGINA, utentesFiltrados.length)} de ${utentesFiltrados.length} utentes`}
          </span>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${paginaValida === 1 ? 'disabled' : ''}`}>
                <button className="page-link" onClick={() => setPaginaAtual(paginaValida - 1)}>Anterior</button>
              </li>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                <li key={pagina} className={`page-item ${pagina === paginaValida ? 'active' : ''}`}>
                  <button
                    className={`page-link ${pagina === paginaValida ? 'bg-success border-success' : 'text-success'}`}
                    onClick={() => setPaginaAtual(pagina)}
                  >
                    {pagina}
                  </button>
                </li>
              ))}
              <li className={`page-item ${paginaValida === totalPaginas ? 'disabled' : ''}`}>
                <button className="page-link text-success" onClick={() => setPaginaAtual(paginaValida + 1)}>Próximo</button>
              </li>
            </ul>
          </nav>
        </div>

      </div>

      <VerUtenteModal
        utente={utenteEmFoco}
        show={modalVerAberto}
        onHide={() => setModalVerAberto(false)}
        onEditar={passarDeVerParaEditar}
      />

      <EditarUtenteModal
        key={utenteEmFoco?.id}
        utente={utenteEmFoco}
        show={modalEditarAberto}
        onHide={() => setModalEditarAberto(false)}
        onGuardar={guardarEdicao}
      />
    </div>
  );
};

export default UtentesPage;