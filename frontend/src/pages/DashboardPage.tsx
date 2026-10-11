import React, { useState } from 'react';
import FichaUtenteCard from '../components/FichaUtenteCard';
import MapaLeaflet from '../components/MapaLeaflet';
import PesquisaUtente from '../components/PesquisaUtente';
import PainelPrioridades from '../components/PainelPrioridades';
import BarraAcoesDashboard from '../components/BarraAcoesDashboard'; // <-- Nova importação
import type { Utente } from '../types/utente';

const DashboardPage: React.FC = () => {
  const utenteMockup: Utente = {
    id: '1',
    numeroUtente: '12569',
    nome: 'Maria Teresa Almeida',
    dataNascimento: '12-03-1942',
    ultimaVisita: '02-07-2026',
    telefone: '912 345 678',
    medicoAssistente: 'Dr. João Martins',
    cuidadorPrincipal: 'Ana Almeida',
    situacaoClinica: ['Insuficiência cardíaca', 'Diabetes tipo II', 'Hipertensão arterial'],
    morada: 'Rua das Flores, 120\n2780-120 Oeiras',
    coordenadas: '38.69120, -9.31215',
    notas: 'Utente autónoma. Vive com o filho.',
    prioridade: 'Urgente 0 dias',
    estado: 'Ativo'
  };

  const [utenteSelecionado, setUtenteSelecionado] = useState<Utente | null>(utenteMockup);
  const [filtroPrioridade, setFiltroPrioridade] = useState<string | null>(null);

  const executarPesquisa = (termo: string) => {
    console.log(`[ÁREA PARA API] Procurar na base de dados por: ${termo}`);
    alert(`No futuro, a API vai procurar por "${termo}" e atualizar a ficha abaixo!`);
    setUtenteSelecionado(utenteMockup); 
  };

  const aplicarFiltroMapa = (prioridade: string | null) => {
    console.log(`[ÁREA PARA API] Atualizar pinos no mapa para prioridade: ${prioridade}`);
    setFiltroPrioridade(prioridade);
  };

  return (
    <div className="h-100 d-flex flex-column pb-3">
      <h1 className="h4 fw-bold mb-4 text-dark">Painel Operacional</h1>
      
      {/* Grelha Principal (Pesquisa/Ficha | Mapa | Prioridades) */}
      <div className="row g-4 flex-grow-1">
        
        <div className="col-md-4 d-flex flex-column gap-4">
          <PesquisaUtente onPesquisar={executarPesquisa} />
          <div className="flex-grow-1">
            <FichaUtenteCard utente={utenteSelecionado} />
          </div>
        </div>
        
        <div className="col-md-6 h-100">
          <MapaLeaflet />
          {filtroPrioridade && (
            <div className="mt-2 text-center text-muted small">
              Filtro ativo no mapa: <span className="fw-bold">{filtroPrioridade}</span>
            </div>
          )}
        </div>

        <div className="col-md-2 h-100">
          <PainelPrioridades 
            filtroAtivo={filtroPrioridade} 
            onAlterarFiltro={aplicarFiltroMapa} 
          />
        </div>

      </div>

      {/* Nova Barra Inferior de Ações */}
      <BarraAcoesDashboard />
      
    </div>
  );
};

export default DashboardPage;