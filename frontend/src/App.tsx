import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import UtentesPage from '@/pages/UtentesPage';
import AgendaPage from './pages/AgendaPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/utentes" element={<UtentesPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}