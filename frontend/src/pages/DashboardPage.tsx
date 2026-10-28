import React, { useEffect, useState } from 'react';
import FichaUtenteCard from '../components/FichaUtenteCard';
import MapaLeaflet from '../components/MapaLeaflet';
import PesquisaUtente from '../components/PesquisaUtente';
import PainelPrioridades from '../components/PainelPrioridades';
import BarraAcoesDashboard from '../components/BarraAcoesDashboard';
import { getUtentesFicticios } from '../services/utenteService';
import type { Utente } from '../types/utente';


const DashboardPage: React.FC = () => {
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [utenteSelecionado, setUtenteSelecionado] = useState<Utente | null>(null);
  const [filtroPrioridade, setFiltroPrioridade] = useState<string | null>(null);

  useEffect(() => {
    getUtentesFicticios().then((lista) => {
      setUtentes(lista);
      setUtenteSelecionado(lista[0] ?? null);
    });
  }, []);

  const executarPesquisa = (termo: string) => {
    // Procura o utente na lista carregada do serviço
    const utenteEncontrado = utentes.find(u => u.numeroUtente === termo || u.nome === termo);
    if (utenteEncontrado) {
      setUtenteSelecionado(utenteEncontrado);
    }
  };

  const aplicarFiltroMapa = (prioridade: string | null) => {
    setFiltroPrioridade(prioridade);
  };

  // Utentes inativos não entram no planeamento nem no mapa (RF03)
  const utentesNoMapa = utentes.filter(u => u.estado === 'Ativo');

  return (
    <div className="h-100 d-flex flex-column pb-3">
      <h1 className="h4 fw-bold mb-4 text-dark">Painel Operacional</h1>
      
      <div className="row g-4 flex-grow-1">
        <div className="col-md-4 d-flex flex-column gap-4">
          <PesquisaUtente utentes={utentes} onPesquisar={executarPesquisa} />
          <div className="flex-grow-1">
            <FichaUtenteCard utente={utenteSelecionado} />
          </div>
        </div>
        
        <div className="col-md-6 h-100">
          {/* Passamos a lista (sem inativos) e o filtro para o mapa */}
          <MapaLeaflet utentes={utentesNoMapa} filtroAtivo={filtroPrioridade} />
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