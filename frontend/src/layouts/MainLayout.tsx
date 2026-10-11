import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
  return (
    <div className="d-flex vh-100 bg-light">
      
      {/* Menu Lateral (Sidebar) */}
      <aside className="bg-dark text-white d-flex flex-column" style={{ width: '260px' }}>
        <div className="p-3 d-flex align-items-center border-bottom border-secondary gap-2">
          <div className="bg-success text-white rounded d-flex align-items-center justify-content-center fw-bold" style={{ width: '32px', height: '32px' }}>
            +
          </div>
          <h1 className="h6 mb-0 lh-sm">Cuidados<br/>Domiciliários</h1>
        </div>
        
        <nav className="flex-grow-1 p-3 d-flex flex-column gap-2">
          <Link to="/" className="btn btn-dark text-start w-100">Dashboard</Link>
          <Link to="/utentes" className="btn btn-dark text-start w-100">Utentes</Link>
          <Link to="/agenda" className="btn btn-dark text-start w-100">Agenda</Link>
        </nav>
      </aside>

      {/* Área Principal */}
      <main className="flex-grow-1 d-flex flex-column overflow-hidden">
        <header className="bg-white border-bottom d-flex align-items-center justify-content-between px-4 shadow-sm" style={{ height: '64px' }}>
          <h2 className="h6 mb-0 text-secondary fw-bold">Plataforma ULSBA</h2>
          <div className="text-end">
            <p className="mb-0 fw-bold small">Enf. Ana Silva</p>
            <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Coordenadora</p>
          </div>
        </header>

        {/* Injeção de Páginas */}
        <div className="flex-grow-1 overflow-auto p-4">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
};

export default MainLayout;