import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { getUtilizadorAtual, logout } from '../services/authService';
import type { UtilizadorAtual } from '../services/authService';

// Texto a mostrar para cada perfil de utilizador (o backend devolve o código em maiúsculas).
const LABEL_PERFIL: Record<string, string> = {
  COORDENADOR: 'Coordenador(a)',
  PROFISSIONAL_SAUDE: 'Profissional de saúde',
  ADMINISTRADOR: 'Administrador(a)',
};

// Gera as iniciais (primeiro + último nome) a mostrar no avatar circular do utilizador.
const iniciais = (nome: string) => {
  const partes = nome.trim().split(/\s+/);
  const primeiras = partes[0]?.[0] ?? '';
  const ultimas = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeiras + ultimas).toUpperCase();
};

// Itens do menu lateral de navegação (caminho, texto e ícone Bootstrap Icons).
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

// Layout principal da aplicação (menu lateral + barra superior): envolve todas as
// páginas protegidas via <Outlet /> (ver App.tsx) e carrega os dados do utilizador autenticado.
const MainLayout: React.FC = () => {
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false); // menu lateral aberto em ecrãs pequenos (mobile)
  const [perfilAberto, setPerfilAberto] = useState(false); // dropdown do perfil (canto superior direito) aberto
  const [utilizador, setUtilizador] = useState<UtilizadorAtual | null>(null);

  // Carrega o utilizador autenticado uma única vez, ao montar o layout.
  useEffect(() => {
    getUtilizadorAtual().then(setUtilizador).catch((erro) => console.error('Falha ao carregar utilizador autenticado:', erro));
  }, []);

  // Destaca visualmente o item do menu correspondente à rota atual.
  const getMenuClass = (path: string) => {
    return location.pathname === path ? "side-link side-link-active" : "side-link";
  };

  return (
    <div className="d-flex vh-100 bg-light">

      {/* Fundo escurecido atrás do menu, só visível em mobile com o menu aberto */}
      {menuAberto && <div className="side-backdrop" onClick={() => setMenuAberto(false)} />}

      {/* Menu Lateral (Sidebar) — fixo em ecrãs largos, retrátil abaixo de 992px */}
      <aside className={`side-panel ${menuAberto ? 'side-panel-aberto' : ''}`}>
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
            <Link key={item.path} to={item.path} className={getMenuClass(item.path)} onClick={() => setMenuAberto(false)}>
              <i className={`bi ${item.icon}`}></i> {item.label}
            </Link>
          ))}
        </nav>

        {/* Botão Sair */}
        <div className="side-bottom">
          <button className="side-link border-0 bg-transparent w-100" onClick={logout}>
            <i className="bi bi-box-arrow-left"></i> Sair
          </button>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-grow-1 d-flex flex-column overflow-hidden">
        <header className="bg-white border-bottom d-flex align-items-center justify-content-between px-3 px-md-4 py-3 py-md-2 shadow-sm ulsba-topbar">
          <div className="d-flex align-items-center gap-2 gap-md-3">
            <button
              className="d-lg-none d-flex align-items-center justify-content-center flex-shrink-0 border-0 ulsba-menu-btn"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
            >
              <i className="bi bi-list"></i>
            </button>

            <nav aria-label="breadcrumb" className="d-none d-md-block">
              <ol className="breadcrumb mb-0 small">
                <li className="breadcrumb-item text-muted">Plataforma de apoio</li>
                <li className="breadcrumb-item active fw-medium text-dark" aria-current="page">Gestão de cuidados domiciliários</li>
              </ol>
            </nav>
          </div>

          <div className="d-flex align-items-center gap-3">
            {/* Sino de Notificações — só a partir de md (tal como na referência) */}
            <div className="position-relative cursor-pointer flex-shrink-0 d-none d-md-flex align-items-center">
              <i className="bi bi-bell fs-5 text-secondary"></i>
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: '0.6rem', padding: '0.2em 0.4em' }}>
                3
              </span>
            </div>

            {/* Separador — só faz sentido a partir de sm, quando há nome/cargo ao lado */}
            <div className="d-none d-sm-block vr"></div>

            {/* Perfil + seletor de acesso */}
            <div className="position-relative">
              <div
                className="d-flex align-items-center gap-2 cursor-pointer"
                onClick={() => setPerfilAberto((aberto) => !aberto)}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                  style={{ width: '36px', height: '36px', backgroundColor: 'var(--ulsba-verde-claro)', color: 'var(--ulsba-verde-claro-texto)', fontSize: '0.8rem' }}
                >
                  {utilizador ? iniciais(utilizador.nome) : '…'}
                </div>
                <div className="text-end d-none d-sm-block">
                  <p className="mb-0 fw-bold small text-dark lh-1 mt-1">{utilizador?.nome ?? 'A carregar…'}</p>
                  <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{utilizador ? LABEL_PERFIL[utilizador.perfil] ?? utilizador.perfil : ''}</p>
                </div>
                <i className="bi bi-chevron-down text-muted small d-none d-sm-inline"></i>
              </div>

              {perfilAberto && (
                <>
                  <div
                    className="position-fixed top-0 start-0 w-100 h-100"
                    style={{ zIndex: 1040 }}
                    onClick={() => setPerfilAberto(false)}
                  />
                  <div
                    className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm py-1"
                    style={{ top: '100%', minWidth: '160px', zIndex: 1050 }}
                  >
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 bg-transparent text-danger"
                      onClick={logout}
                    >
                      <i className="bi bi-box-arrow-left"></i> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Injeção de Páginas */}
        <div className="flex-grow-1 overflow-auto p-3 pt-4 p-md-4 bg-light">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default MainLayout;
