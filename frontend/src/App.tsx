import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import UtentesPage from '@/pages/UtentesPage';
import NovoUtentePage from './pages/NovoUtentePage';
import AgendaPage from './pages/AgendaPage';
import VisitasPage from './pages/VisitasPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/utentes" element={<UtentesPage />} />
          <Route path="/utentes/novo" element={<NovoUtentePage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/visitas" element={<VisitasPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}