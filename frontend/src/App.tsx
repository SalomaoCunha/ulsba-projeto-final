import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import UtentesPage from '@/pages/UtentesPage';
import NovoUtentePage from './pages/NovoUtentePage';
import MapaPage from './pages/MapaPage';
import EquipasPage from './pages/EquipasPage';
import ViaturasPage from './pages/ViaturasPage';
import AgendaPage from './pages/AgendaPage';
import VisitasPage from './pages/VisitasPage';
import RotasPage from './pages/RotasPage';
import RelatoriosPage from './pages/RelatoriosPage';
import MensagensPage from './pages/MensagensPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import LoginPage from './pages/LoginPage';
import VoltaDetalhePage from './pages/VoltaDetalhePage';
import ProtectedRoute from './components/ProtectedRoute';

// Componente raiz da aplicação: define todas as rotas da SPA.
// ProtectedRoute garante que só utilizadores autenticados acedem às páginas dentro de
// MainLayout (menu lateral + topo); sem sessão válida, redireciona para /login.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública de Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas protegidas que exigem autenticação e utilizam o layout principal */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/utentes" element={<UtentesPage />} />
            <Route path="/utentes/novo" element={<NovoUtentePage />} />
            <Route path="/mapa" element={<MapaPage />} />
            <Route path="/equipas" element={<EquipasPage />} />
            <Route path="/viaturas" element={<ViaturasPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/agenda/voltas/:id" element={<VoltaDetalhePage />} />
            <Route path="/visitas" element={<VisitasPage />} />
            <Route path="/rotas" element={<RotasPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/mensagens" element={<MensagensPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          </Route>
        </Route>

        {/* Redirecionar qualquer URL inválido para a raiz */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}