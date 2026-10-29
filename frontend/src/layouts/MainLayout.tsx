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
    return location.pathname === path
      ? "btn btn-success text-start w-100 d-flex align-items-center gap-3 shadow-sm"
      : "btn text-white text-start w-100 d-flex align-items-center gap-3 border-0 bg-transparent";
  };

  return (
    <div className="d-flex vh-100 bg-light">

      {/* Menu Lateral (Sidebar) */}
      <aside className="d-flex flex-column" style={{ width: '260px', backgroundColor: 'var(--ulsba-verde-escuro)' }}>
        <div className="p-3 d-flex align-items-center gap-2 mb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div
            className="text-white d-flex align-items-center justify-content-center fw-bold rounded-3"
            style={{ width: '36px', height: '36px', backgroundColor: 'var(--ulsba-verde-primario)' }}
          >
            <i className="bi bi-heart-pulse-fill fs-5"></i>
          </div>
          <div className="lh-sm">
            <h1 className="h6 mb-0 text-white fw-bold">ULSBA</h1>
            <p className="mb-0 text-white-50" style={{ fontSize: '0.7rem' }}>Cuidados Paliativos</p>
          </div>
        </div>

        <p className="px-3 mb-2 text-white-50" style={{ fontSize: '0.7rem', letterSpacing: '0.08em', fontWeight: 600 }}>
          PLATAFORMA
        </p>

        <nav className="flex-grow-1 px-3 py-1 d-flex flex-column gap-2 overflow-auto">
          {NAV_ITEMS.map((item) => (
            <Link key={item.path} to={item.path} className={getMenuClass(item.path)}>
              <i className={`bi ${item.icon} fs-5`}></i> {item.label}
            </Link>
          ))}
        </nav>

        {/* Botão Sair */}
        <div className="p-3 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <button className="btn text-white text-start w-100 d-flex align-items-center gap-3 border-0 bg-transparent opacity-75">
            <i className="bi bi-box-arrow-left fs-5"></i> Sair
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
