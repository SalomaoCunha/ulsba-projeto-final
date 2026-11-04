import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'bi-grid-1x2-fill' },
  { path: '/utentes', label: 'Utentes', icon: 'bi-person-fill' },
  { path: '/equipas', label: 'Equipas', icon: 'bi-people-fill' },
  { path: '/viaturas', label: 'Viaturas', icon: 'bi-truck' },
  { path: '/agenda', label: 'Agenda', icon: 'bi-calendar3' },
  { path: '/visitas', label: 'Visitas', icon: 'bi-clipboard2-check-fill' },
  { path: '/mapa', label: 'Mapa', icon: 'bi-geo-alt-fill' },
  { path: '/rotas', label: 'Rotas', icon: 'bi-signpost-split-fill' },
  { path: '/relatorios', label: 'Relatórios', icon: 'bi-bar-chart-fill' },
  { path: '/mensagens', label: 'Mensagens', icon: 'bi-envelope-fill' },
  { path: '/configuracoes', label: 'Configurações', icon: 'bi-gear-fill' },
];

const MainLayout: React.FC = () => {
  const location = useLocation();

  const getMenuClass = (path: string) => {
    return location.pathname === path ? "side-link side-link-active" : "side-link";
  };

  return (
    <div className="d-flex vh-100 bg-light">

      {/* Menu Lateral (Sidebar) */}
      <aside className="side-panel">
        <div className="brand-lockup">
          <div className="brand-symbol">
            <i className="bi bi-heart-pulse"></i>
          </div>
          <div>
            <strong>ULSBA</strong>
            <small>Cuidados Paliativos</small>
          </div>
        </div>

        <div className="side-section-label">PLATAFORMA</div>

        <nav className="side-nav flex-grow-1 overflow-auto" aria-label="Navegação principal">
          {NAV_ITEMS.map((item) => (
            <Link key={item.path} to={item.path} className={getMenuClass(item.path)}>
              <i className={`bi ${item.icon}`}></i> {item.label}
            </Link>
          ))}
        </nav>

        {/* Botão Sair */}
        <div className="side-bottom">
          <button className="side-link border-0 bg-transparent w-100">
            <i className="bi bi-box-arrow-left"></i> Sair
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-grow-1 d-flex flex-column overflow-hidden">
        <header className="bg-white border-bottom d-flex align-items-center justify-content-between px-4 shadow-sm" style={{ height: '64px' }}>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item text-muted">Plataforma de apoio</li>
              <li className="breadcrumb-item active fw-medium text-dark" aria-current="page">Gestão de cuidados domiciliários</li>
            </ol>
          </nav>

          <div className="d-flex align-items-center gap-3">
            {/* Sino de Notificações com o número 3 */}
            <div className="position-relative cursor-pointer">
              <i className="bi bi-bell fs-5 text-secondary"></i>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: '0.6rem', padding: '0.2em 0.4em' }}>
                3
              </span>
            </div>

            {/* Perfil + seletor de acesso */}
            <div className="d-flex align-items-center gap-2 ms-1 border-start ps-3 cursor-pointer">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                style={{ width: '36px', height: '36px', backgroundColor: 'var(--ulsba-verde-primario)', fontSize: '0.8rem' }}
              >
                AS
              </div>
              <div className="text-end d-none d-sm-block">
                <p className="mb-0 fw-bold small text-dark lh-1 mt-1">Enf. Ana Silva</p>
                <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Coordenadora</p>
              </div>
              <i className="bi bi-chevron-down text-muted small ms-1"></i>
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
