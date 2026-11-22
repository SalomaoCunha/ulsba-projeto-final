import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Estilos globais de terceiros: Bootstrap (grelha/componentes), Bootstrap Icons
// (ícones usados em toda a app) e Leaflet (necessário para o mapa renderizar corretamente).
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'leaflet/dist/leaflet.css'; // <-- O CSS do Mapa
// Ponto de entrada da aplicação: monta o componente App na div #root do index.html.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)