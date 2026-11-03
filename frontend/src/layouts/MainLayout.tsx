import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const getMenuClass = (path: string) => location.pathname === path
    ? 'btn btn-success text-start w-100 d-flex align-items-center gap-3 shadow-sm'
    : 'btn text-white text-start w-100 d-flex align-items-center gap-3 border-0 bg-transparent';

  const fecharMenu = () => setMenuAberto(false);

  return (
    <div className="app-shell bg-light">
      {menuAberto && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={fecharMenu}
        />
      )}

      <aside className={`app-sidebar bg-dark text-white d-flex flex-column${menuAberto ? ' is-open' : ''}`}>
        <div className="p-3 d-flex align-items-center border-bottom border-secondary gap-2 mb-2">
          <div className="text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px' }}>
            <i className="bi bi-heart-pulse fs-3"></i>
          </div>
          <h1 className="h6 mb-0 lh-sm ms-2">Cuidados<br />Domiciliários</h1>
        </div>

        <nav className="flex-grow-1 px-3 py-2 d-flex flex-column gap-2 overflow-auto">
          <Link to="/" className={getMenuClass('/')} onClick={fecharMenu}>
            <i className="bi bi-house-door fs-5"></i> Dashboard
          </Link>
          <Link to="/utentes" className={getMenuClass('/utentes')} onClick={fecharMenu}>
            <i className="bi bi-person fs-5"></i> Utentes
          </Link>
          <Link to="/mapa" className={getMenuClass('/mapa')} onClick={fecharMenu}>
            <i className="bi bi-map fs-5"></i> Mapa
          </Link>
          <Link to="/agenda" className={getMenuClass('/agenda')} onClick={fecharMenu}>
            <i className="bi bi-calendar3 fs-5"></i> Agenda
          </Link>
          <Link to="/visitas" className={getMenuClass('/visitas')} onClick={fecharMenu}>
            <i className="bi bi-clipboard-check fs-5"></i> Visitas
          </Link>
          <Link to="/rotas" className={getMenuClass('/rotas')} onClick={fecharMenu}>
            <i className="bi bi-signpost-split fs-5"></i> Rotas
          </Link>
          <Link to="/relatorios" className={getMenuClass('/relatorios')} onClick={fecharMenu}>
            <i className="bi bi-bar-chart fs-5"></i> Relatórios
          </Link>
          <Link to="/mensagens" className={getMenuClass('/mensagens')} onClick={fecharMenu}>
            <i className="bi bi-envelope fs-5"></i> Mensagens
          </Link>
          <Link to="/configuracoes" className={getMenuClass('/configuracoes')} onClick={fecharMenu}>
            <i className="bi bi-gear fs-5"></i> Configurações
          </Link>
        </nav>

        <div className="p-3 mt-auto border-top border-secondary">
          <button className="btn text-white text-start w-100 d-flex align-items-center gap-3 border-0 bg-transparent opacity-75 hover-opacity-100">
            <i className="bi bi-box-arrow-left fs-5"></i> Sair
          </button>
        </div>
      </aside>

      <main className="app-main d-flex flex-column">
        <header className="app-header bg-white border-bottom d-flex align-items-center justify-content-between px-4 shadow-sm">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <button
              type="button"
              className="mobile-menu-toggle btn btn-outline-secondary"
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuAberto}
              onClick={() => setMenuAberto(!menuAberto)}
            >
              <i className="bi bi-list fs-5"></i>
            </button>
            <h2 className="h6 mb-0 text-dark fw-bold text-truncate">Plataforma de Gestão de Cuidados Domiciliários</h2>
          </div>

          <div className="d-flex align-items-center gap-3 flex-shrink-0">
            <div className="position-relative cursor-pointer" aria-label="Notificações: 3">
              <i className="bi bi-bell fs-5 text-secondary"></i>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: '0.6rem', padding: '0.2em 0.4em' }}>
                3
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 ms-1 ms-sm-3 border-start ps-2 ps-sm-3">
              <div className="text-end d-none d-sm-block">
                <p className="mb-0 fw-bold small text-dark lh-1 mt-1">Enf. Ana Silva</p>
                <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Coordenadora</p>
              </div>
              <div className="rounded-circle shadow-sm profile-avatar">
                <img src="https://i.pravatar.cc/150?img=47" alt="Perfil" className="w-100 h-100 object-fit-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="app-content flex-grow-1 overflow-auto p-4 bg-light">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
