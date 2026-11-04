import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const MainLayout: React.FC = () => {
  const location = useLocation(); // Isto descobre em que página estamos

  // Função que decide a cor do botão com base no URL atual
  const getMenuClass = (path: string) => {
    // Se o caminho atual for igual ao do botão, fica verde (ativo), senão fica escuro
    return location.pathname === path
      ? "btn btn-success text-start w-100 d-flex align-items-center gap-3 shadow-sm"
      : "btn text-white text-start w-100 d-flex align-items-center gap-3 border-0 bg-transparent";
  };

  return (
    <div className="d-flex vh-100 bg-light">
      
      {/* Menu Lateral (Sidebar) */}
      <aside className="bg-dark text-white d-flex flex-column" style={{ width: '260px' }}>
        <div className="p-3 d-flex align-items-center border-bottom border-secondary gap-2 mb-2">
          <div className="text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px' }}>
            <i className="bi bi-heart-pulse fs-3"></i>
          </div>
          <h1 className="h6 mb-0 lh-sm ms-2">Cuidados<br/>Domiciliários</h1>
        </div>
        
        <nav className="flex-grow-1 px-3 py-2 d-flex flex-column gap-2 overflow-auto">
          <Link to="/" className={getMenuClass('/')}>
            <i className="bi bi-house-door fs-5"></i> Dashboard
          </Link>
          <Link to="/utentes" className={getMenuClass('/utentes')}>
            <i className="bi bi-person fs-5"></i> Utentes
          </Link>
          <Link to="/mapa" className={getMenuClass('/mapa')}>
            <i className="bi bi-map fs-5"></i> Mapa
          </Link>
          <Link to="/agenda" className={getMenuClass('/agenda')}>
            <i className="bi bi-calendar3 fs-5"></i> Agenda
          </Link>
          <Link to="/visitas" className={getMenuClass('/visitas')}>
            <i className="bi bi-clipboard-check fs-5"></i> Visitas
          </Link>
          <Link to="/rotas" className={getMenuClass('/rotas')}>
            <i className="bi bi-signpost-split fs-5"></i> Rotas
          </Link>
          <Link to="/relatorios" className={getMenuClass('/relatorios')}>
            <i className="bi bi-bar-chart fs-5"></i> Relatórios
          </Link>
          <Link to="/mensagens" className={getMenuClass('/mensagens')}>
            <i className="bi bi-envelope fs-5"></i> Mensagens
          </Link>
          <Link to="/configuracoes" className={getMenuClass('/configuracoes')}>
            <i className="bi bi-gear fs-5"></i> Configurações
          </Link>
        </nav>

        {/* Botão Sair no fundo */}
        <div className="p-3 mt-auto border-top border-secondary">
          <button className="btn text-white text-start w-100 d-flex align-items-center gap-3 border-0 bg-transparent opacity-75 hover-opacity-100">
            <i className="bi bi-box-arrow-left fs-5"></i> Sair
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-grow-1 d-flex flex-column overflow-hidden">
        <header className="bg-white border-bottom d-flex align-items-center justify-content-between px-4 shadow-sm" style={{ height: '64px' }}>
          <h2 className="h6 mb-0 text-dark fw-bold">Plataforma de Gestão de Cuidados Domiciliários</h2>
          
          <div className="d-flex align-items-center gap-3">
            {/* Sino de Notificações com o número 3 */}
            <div className="position-relative cursor-pointer">
              <i className="bi bi-bell fs-5 text-secondary"></i>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: '0.6rem', padding: '0.2em 0.4em' }}>
                3
              </span>
            </div>
            
            <div className="d-flex align-items-center gap-2 ms-3 border-start ps-3 cursor-pointer">
              <div className="text-end d-none d-sm-block">
                <p className="mb-0 fw-bold small text-dark lh-1 mt-1">Enf. Ana Silva</p>
                <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Coordenadora</p>
              </div>
              {/* Imagem de perfil real (placeholder) em vez do ícone */}
              <div className="rounded-circle shadow-sm" style={{ width: '36px', height: '36px', overflow: 'hidden' }}>
                <img src="https://i.pravatar.cc/150?img=47" alt="Perfil" className="w-100 h-100 object-fit-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Injeção de Páginas */}
        <div className="flex-grow-1 overflow-auto p-4 bg-light">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
};

export default MainLayout;