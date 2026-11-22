import React, { useEffect, useState } from 'react';
import FichaUtenteCard from '../components/FichaUtenteCard';
import MapaLeaflet from '../components/MapaLeaflet';
import PesquisaUtente from '../components/PesquisaUtente';
import PainelPrioridades from '../components/PainelPrioridades';
import BarraAcoesDashboard from '../components/BarraAcoesDashboard';
import { getUtentes, updateUtente } from '../services/utenteService';
import EditarUtenteModal from '../components/EditarUtenteModal';
import EcraCarregamento from '../components/EcraCarregamento';
import { comAtrasoMinimo } from '../utils/comAtrasoMinimo';
import type { Utente } from '../types/utente';


// Página principal (Dashboard): mostra a ficha do utente selecionado, o mapa
// de utentes e o painel de prioridades, numa grelha de 3 colunas (ficha /
// mapa / prioridades). O painel de prioridades e o mapa partilham o mesmo
// filtro de prioridade (ex.: clicar numa prioridade no painel realça esses
// utentes no mapa), e a pesquisa/edição atuam sobre o utente em destaque.
const DashboardPage: React.FC = () => {
  const [utentes, setUtentes] = useState<Utente[]>([]);
  const [utenteSelecionado, setUtenteSelecionado] = useState<Utente | null>(null);
  const [filtroPrioridade, setFiltroPrioridade] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Carrega a lista de utentes uma única vez ao montar a página e seleciona
  // o primeiro como utente em destaque por defeito (para a ficha não
  // aparecer vazia). comAtrasoMinimo garante um tempo mínimo de ecrã de
  // carregamento, evitando um "flash" quando a resposta é muito rápida.
  useEffect(() => {
    comAtrasoMinimo(getUtentes())
      .then((lista) => {
        setUtentes(lista);
        setUtenteSelecionado(lista[0] ?? null);
      })
      .finally(() => setCarregando(false));
  }, []);

  // Pesquisa simples por correspondência exata ao número de utente ou nome
  // (o componente PesquisaUtente é responsável por sugerir/autocompletar;
  // aqui só se resolve o termo final escolhido para o utente correspondente).
  const executarPesquisa = (termo: string) => {
    // Procura o utente na lista carregada do serviço
    const utenteEncontrado = utentes.find(u => u.numeroUtente === termo || u.nome === termo);
    if (utenteEncontrado) {
      setUtenteSelecionado(utenteEncontrado);
    }
  };

  // Callback do PainelPrioridades: atualiza o filtro partilhado com o mapa
  // quando o utilizador seleciona (ou limpa) uma prioridade.
  const aplicarFiltroMapa = (prioridade: string | null) => {
    setFiltroPrioridade(prioridade);
  };

  // Utentes inativos não entram no planeamento nem no mapa (RF03)
  const utentesNoMapa = utentes.filter(u => u.estado === 'Ativo');

  // Abre o modal de edição da ficha do utente atualmente selecionado.
  const abrirEdicao = () => {
    setModalAberto(true);
  }

  // Guarda as alterações feitas no modal de edição: envia para a API,
  // atualiza o utente em destaque e substitui a sua entrada na lista local
  // (sem precisar de voltar a pedir todos os utentes ao servidor).
  const guardarEdicao = async (utenteAtualizado: Utente) => {
    const resultado = await updateUtente(utenteAtualizado);

    setUtenteSelecionado(resultado);
    setUtentes(utentes.map(u => u.id === resultado.id ? resultado : u));
    setModalAberto(false);
  }

  if (carregando) {
    return (
      <EcraCarregamento mensagem="A ligar ao servidor. Na primeira vez pode demorar um pouco mais (o servidor estava a dormir)." />
    );
  }

  return (
    <div className="h-100 d-flex flex-column overflow-hidden dashboard-shell">
      <div className="row g-3 flex-grow-1 dashboard-row">
        <div className="col-12 col-md-4 h-100 d-flex flex-column gap-2 dashboard-col dashboard-col-ficha">
          <PesquisaUtente utentes={utentes} onPesquisar={executarPesquisa} />
          {/* minHeight garante que a ficha tem espaço mesmo quando o conteúdo
              do utente é curto, já que o pai é flex e não tem altura fixa */}
          <div className="flex-grow-1" style={{ minHeight: '220px' }}>
            <FichaUtenteCard utente={utenteSelecionado} onEditar={abrirEdicao} />
          </div>
        </div>

        <div className="col-12 col-md-5 h-100 dashboard-col dashboard-col-mapa">
          {/* Passamos a lista (sem inativos) e o filtro para o mapa */}
          <MapaLeaflet utentes={utentesNoMapa} filtroAtivo={filtroPrioridade} />
        </div>

        <div className="col-12 col-md-3 h-100 dashboard-col dashboard-col-prioridades">
          <PainelPrioridades filtroAtivo={filtroPrioridade} onAlterarFiltro={aplicarFiltroMapa} />
        </div>
      </div>

      {/* flex-shrink-0: esta barra tem altura fixa e nunca deve encolher para
          dar espaço à grelha acima (flex-grow-1), mesmo que o ecrã seja baixo */}
      <div className="pt-2 flex-shrink-0">
        <BarraAcoesDashboard />
      </div>
      <EditarUtenteModal
        // Mudar a key quando o utente selecionado muda força o React a
        // desmontar/remontar o modal, repondo o seu estado interno do
        // formulário em vez de manter dados de edição do utente anterior.
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