import React, { useState } from 'react';
import FichaUtenteCard from '../components/FichaUtenteCard';
import MapaLeaflet from '../components/MapaLeaflet';
import PesquisaUtente from '../components/PesquisaUtente';
import PainelPrioridades from '../components/PainelPrioridades';
import BarraAcoesDashboard from '../components/BarraAcoesDashboard';
import type { Utente } from '../types/utente';

// Base de dados simulada para a ficha ser dinâmica
const baseDadosMockup: Utente[] = [
  {
    id: '1', numeroUtente: '12569', nome: 'Maria Teresa Almeida', dataNascimento: '12-03-1942', ultimaVisita: '02-07-2026',
    telefone: '912 345 678', medicoAssistente: 'Dr. João Martins', cuidadorPrincipal: 'Ana Almeida',
    situacaoClinica: ['Insuficiência cardíaca', 'Diabetes tipo II', 'Hipertensão arterial'],
    morada: 'Rua das Flores, 120\n2780-120 Oeiras', coordenadas: '38.69120, -9.31215',
    notas: 'Utente autónoma. Vive com o filho.', prioridade: 'Urgente 0 dias', estado: 'Ativo'
  },
  {
    id: '2', numeroUtente: '12560', nome: 'Maria Teresa Godinho', dataNascimento: '15-05-1950', ultimaVisita: '01-10-2026',
    telefone: '911 222 333', medicoAssistente: 'Dra. Sofia Lima', cuidadorPrincipal: 'Carlos Godinho',
    situacaoClinica: ['Asma', 'Osteoporose'], morada: 'Av. da Liberdade, 45\n1250-096 Lisboa', coordenadas: '38.720, -9.145',
    notas: 'Precisa de ajuda para subir escadas.', prioridade: 'Urgente 1 dia', estado: 'Ativo'
  },
  {
    id: '3', numeroUtente: '12561', nome: 'Maria Teresa Sousa', dataNascimento: '22-11-1938', ultimaVisita: '28-09-2026',
    telefone: '966 555 444', medicoAssistente: 'Dr. Rui Costa', cuidadorPrincipal: 'Lar Doce Idade',
    situacaoClinica: ['Alzheimer'], morada: 'Praceta do Sol, 3\n2800-111 Almada', coordenadas: '38.675, -9.158',
    notas: 'Visitas apenas da parte da tarde.', prioridade: 'Não urgente 1', estado: 'Ativo'
  }
];

const DashboardPage: React.FC = () => {
  const [utenteSelecionado, setUtenteSelecionado] = useState<Utente | null>(baseDadosMockup[0]);
  const [filtroPrioridade, setFiltroPrioridade] = useState<string | null>(null);

  const executarPesquisa = (termo: string) => {
    // Procura o utente na nossa base de dados simulada
    const utenteEncontrado = baseDadosMockup.find(u => u.numeroUtente === termo || u.nome === termo);
    if (utenteEncontrado) {
      setUtenteSelecionado(utenteEncontrado);
    }
  };

  const aplicarFiltroMapa = (prioridade: string | null) => {
    setFiltroPrioridade(prioridade);
  };

  return (
    <div className="h-100 d-flex flex-column pb-3">
      <h1 className="h4 fw-bold mb-4 text-dark">Painel Operacional</h1>
      
      <div className="row g-4 flex-grow-1">
        <div className="col-md-4 d-flex flex-column gap-4">
          <PesquisaUtente onPesquisar={executarPesquisa} />
          <div className="flex-grow-1">
            <FichaUtenteCard utente={utenteSelecionado} />
          </div>
        </div>
        
        <div className="col-md-6 h-100">
          {/* Passamos o filtro para o mapa */}
          <MapaLeaflet filtroAtivo={filtroPrioridade} />
        </div>

        <div className="col-md-2 h-100">
          <PainelPrioridades filtroAtivo={filtroPrioridade} onAlterarFiltro={aplicarFiltroMapa} />
        </div>
      </div>

      <BarraAcoesDashboard />
    </div>
  );
};

export default DashboardPage;