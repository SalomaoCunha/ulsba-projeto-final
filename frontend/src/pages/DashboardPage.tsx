import React, { useEffect, useState } from 'react';
import FichaUtenteCard from '../components/FichaUtenteCard';
import MapaLeaflet from '../components/MapaLeaflet';
import PesquisaUtente from '../components/PesquisaUtente';
import PainelPrioridades from '../components/PainelPrioridades';
import BarraAcoesDashboard from '../components/BarraAcoesDashboard';
import { getUtentesFicticios, updateUtente } from '../services/utenteService';
import EditarUtenteModal from '../components/EditarUtenteModal';
import type { Utente } from '../types/utente';


const DashboardPage: React.FC = () => {
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [utenteSelecionado, setUtenteSelecionado] = useState<Utente | null>(null);
  const [filtroPrioridade, setFiltroPrioridade] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

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

  const abrirEdicao = () => {
    setModalAberto(true);
  }

  const guardarEdicao = async (utenteAtualizado: Utente) => {
    const resultado = await updateUtente(utenteAtualizado);

    setUtenteSelecionado(resultado);
    setUtentes(utentes.map(u => u.id === resultado.id ? resultado : u));
    setModalAberto(false);
  }

  return (
    <div className="h-100 d-flex flex-column overflow-hidden">
      <div className="row g-3 flex-grow-1" style={{ minHeight: 0, overflow: 'hidden' }}>
        <div className="col-md-4 h-100 d-flex flex-column gap-2" style={{ minHeight: 0, maxHeight: '100%', overflowY: 'auto' }}>
          <PesquisaUtente utentes={utentes} onPesquisar={executarPesquisa} />
          <div className="flex-grow-1" style={{ minHeight: '220px' }}>
            <FichaUtenteCard utente={utenteSelecionado} onEditar={abrirEdicao} />
          </div>
        </div>

        <div className="col-md-5 h-100" style={{ minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
          {/* Passamos a lista (sem inativos) e o filtro para o mapa */}
          <MapaLeaflet utentes={utentesNoMapa} filtroAtivo={filtroPrioridade} />
        </div>

        <div className="col-md-3 h-100" style={{ minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
          <PainelPrioridades filtroAtivo={filtroPrioridade} onAlterarFiltro={aplicarFiltroMapa} />
        </div>
      </div>

      <div className="pt-2 flex-shrink-0">
        <BarraAcoesDashboard />
      </div>
      <EditarUtenteModal
        key={utenteSelecionado?.id}
        utente={utenteSelecionado}
        show={modalAberto}
        onHide={() => setModalAberto(false)}
        onGuardar={guardarEdicao}
      />
    </div>
  );
};

export default DashboardPage;