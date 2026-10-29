import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/utentes" element={<UtentesPage />} />
          <Route path="/utentes/novo" element={<NovoUtentePage />} />
          <Route path="/mapa" element={<MapaPage />} />
          <Route path="/equipas" element={<EquipasPage />} />
          <Route path="/viaturas" element={<ViaturasPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/visitas" element={<VisitasPage />} />
          <Route path="/rotas" element={<RotasPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/mensagens" element={<MensagensPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}