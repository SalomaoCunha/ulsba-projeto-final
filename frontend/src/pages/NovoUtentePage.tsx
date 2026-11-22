import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUtente } from '../services/utenteService';
import { createLocal, getConcelhos, getLocais } from '../services/localService';
import MapaLeaflet from '../components/MapaLeaflet';
import { coordenadasEmPortugalContinental } from '../utils/coordenadasPortugal';
import type { Concelho, Local, NovoLocalPayload, TipoLocalCodigo } from '../types/local';

const LABEL_GENERO: Record<string, string> = {
  FEMININO: 'Feminino',
  MASCULINO: 'Masculino',
  OUTRO: 'Outro',
  NAO_INDICADO: 'Prefere não indicar',
};

const TIPOS_LOCAL: { codigo: TipoLocalCodigo; label: string }[] = [
  { codigo: 'DOMICILIO', label: 'Domicílio' },
  { codigo: 'LAR', label: 'Lar' },
  { codigo: 'UNIDADE_CUIDADOS_CONTINUADOS', label: 'Unidade de cuidados continuados' },
  { codigo: 'UNIDADE_CUIDADOS_PALIATIVOS', label: 'Unidade de cuidados paliativos' },
  { codigo: 'BASE', label: 'Base' },
];

// Ponto de partida do mapa ao criar um novo local: Beja (sede da ULSBA),
// usado só como centro inicial — tem de ser confirmado/ajustado pelo utilizador.
const PONTO_INICIAL = { lat: 38.016, lng: -7.872 };

// Dados do formulário para criar um novo local diretamente nesta ficha
// (quando o utente ainda não tem nenhum local registado, ou se escolhe
// criar um novo em vez de escolher um existente).
interface DadosLocalFormulario {
  tipo: TipoLocalCodigo;
  nome: string;
  morada: string;
  codigoPostal: string;
  localidade: string;
  concelhoId: string;
  contactoTelefonico: string;
}

// Formulário de registo de um novo utente. Para além dos dados pessoais,
// permite escolher um local já existente ou criar um novo local (morada +
// coordenadas no mapa) sem saír desta página.
const NovoUtentePage: React.FC = () => {
  const navigate = useNavigate();
  const [locais, setLocais] = useState<Local[]>([]);
  const [concelhos, setConcelhos] = useState<Concelho[]>([]);
  const [carregandoReferencias, setCarregandoReferencias] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  // Alterna entre "escolher local existente" (false) e "criar novo local
  // nesta ficha" (true) — true por omissão se ainda não existir nenhum local.
  const [modoCriarLocal, setModoCriarLocal] = useState(false);
  const [pontoLocal, setPontoLocal] = useState(PONTO_INICIAL);
  // O pino do mapa começa por não estar confirmado: é preciso o utilizador
  // clicar/arrastar no mapa para validar a localização antes de poder guardar.
  const [pontoLocalConfirmado, setPontoLocalConfirmado] = useState(false);
  const [dadosLocal, setDadosLocal] = useState<DadosLocalFormulario>({
    tipo: 'DOMICILIO',
    nome: '',
    morada: '',
    codigoPostal: '',
    localidade: '',
    concelhoId: '',
    contactoTelefonico: '',
  });

  const [formData, setFormData] = useState({
    numeroUtente: '',
    nome: '',
    genero: 'NAO_INDICADO',
    dataNascimento: '',
    localId: '',
    contacto: '',
    situacaoClinica: '',
    notas: '',
  });

  // Carrega as listas de referência (locais existentes e concelhos) usadas
  // nos selects do formulário. Se ainda não existir nenhum local no sistema,
  // entra-se logo em modo "criar local" porque não há nada para escolher.
  useEffect(() => {
    Promise.all([getLocais(), getConcelhos()])
      .then(([locaisCarregados, concelhosCarregados]) => {
        setLocais(locaisCarregados);
        setConcelhos(concelhosCarregados);
        if (locaisCarregados.length === 0) setModoCriarLocal(true);
      })
      .catch((erroCarregamento) => {
        console.error('Falha ao carregar locais e concelhos:', erroCarregamento);
        setErro('Não foi possível carregar os locais. Atualiza a página e tenta novamente.');
      })
      .finally(() => setCarregandoReferencias(false));
  }, []);

  // Atualiza um campo genérico dos dados do utente (inputs/selects/textarea
  // partilham este handler porque o `name` do elemento coincide com a chave do estado).
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErro(null);
  };

  // Equivalente ao handleChange, mas para os campos do novo local. Sempre que
  // a morada/código postal/localidade/concelho mudam, a confirmação do pino
  // no mapa é invalidada — o ponto anterior já não corresponde à morada atual
  // e tem de ser reconfirmado antes de se poder guardar.
  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDadosLocal((atual) => ({
      ...atual,
      [name]: name === 'tipo' ? (value as TipoLocalCodigo) : value,
    }));
    setErroLocal(null);
    if (['morada', 'codigoPostal', 'localidade', 'concelhoId'].includes(name)) {
      setPontoLocalConfirmado(false);
    }
  };

  // Troca de "escolher local existente" para "criar novo local", repondo o
  // formulário de local e o pino do mapa ao estado inicial.
  const iniciarCriacaoLocal = () => {
    setModoCriarLocal(true);
    setPontoLocal(PONTO_INICIAL);
    setPontoLocalConfirmado(false);
    setErroLocal(null);
  };

  // Validação do formulário de novo local antes de submeter — cobre os
  // campos obrigatórios e garante que a localização no mapa foi confirmada
  // e cai dentro de Portugal continental (evita locais com coordenadas
  // trocadas ou fora da área de atuação da ULSBA).
  const validarLocal = (): string | null => {
    if (!dadosLocal.morada.trim()) return 'Indica a morada do local.';
    if (!dadosLocal.localidade.trim()) return 'Indica a localidade do local.';
    if (!dadosLocal.concelhoId) return 'Seleciona o concelho do local.';
    if (dadosLocal.tipo !== 'DOMICILIO' && !dadosLocal.nome.trim()) {
      return 'Indica o nome do local.';
    }
    if (!pontoLocalConfirmado) {
      return 'Confirma ou ajusta a localização no mapa antes de continuar.';
    }
    if (!coordenadasEmPortugalContinental(pontoLocal.lat, pontoLocal.lng)) {
      return 'A localização tem de estar dentro de Portugal continental.';
    }
    return null;
  };

  // Usado para colorir o pino no mapa (válido/inválido) mesmo antes de confirmar.
  const pontoLocalValido = coordenadasEmPortugalContinental(pontoLocal.lat, pontoLocal.lng);

  // Submissão do formulário: primeiro garante que há um local válido (escolhido
  // ou a criar), depois cria o local em falta (se aplicável) e só então cria o
  // utente já associado a esse local. Os dois passos são feitos em sequência
  // porque o utente precisa do ID do local que acabou de ser criado.
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!modoCriarLocal && !formData.localId) {
      setErro('Escolhe o local onde o utente se encontra.');
      return;
    }

    if (modoCriarLocal) {
      const erroValidacaoLocal = validarLocal();
      if (erroValidacaoLocal) {
        setErroLocal(erroValidacaoLocal);
        return;
      }
    }

    setErro(null);
    setErroLocal(null);
    setAGuardar(true);
    try {
      let localId = formData.localId ? Number(formData.localId) : undefined;

      if (modoCriarLocal) {
        const payloadLocal: NovoLocalPayload = {
          tipo: dadosLocal.tipo,
          nome: dadosLocal.nome.trim() || null,
          morada: dadosLocal.morada.trim(),
          codigoPostal: dadosLocal.codigoPostal.trim() || null,
          localidade: dadosLocal.localidade.trim(),
          concelhoId: Number(dadosLocal.concelhoId),
          contactoTelefonico: dadosLocal.contactoTelefonico.trim() || null,
          lat: pontoLocal.lat,
          lng: pontoLocal.lng,
        };
        const criado = await createLocal(payloadLocal);
        localId = criado.id;
        // Atualiza a lista local de locais e passa o formulário para modo
        // "escolher local existente", já com o local recém-criado selecionado —
        // evita um novo pedido ao servidor só para repovoar o select.
        const localSelecionado: Local = {
          id: criado.id,
          tipo: payloadLocal.tipo,
          nome: payloadLocal.nome ?? null,
          morada: payloadLocal.morada,
          localidade: payloadLocal.localidade,
          concelho: concelhos.find((concelho) => concelho.id === payloadLocal.concelhoId)?.nome ?? '',
        };
        setLocais((atuais) => [...atuais, localSelecionado]);
        setFormData((atual) => ({ ...atual, localId: String(criado.id) }));
        setModoCriarLocal(false);
      }

      // Guarda de segurança — nunca deveria acontecer dado as validações
      // acima, mas evita criar um utente sem local associado.
      if (localId === undefined) {
        throw new Error('Escolhe ou cria o local onde o utente se encontra.');
      }

      await createUtente({
        numeroUtente: formData.numeroUtente,
        nome: formData.nome,
        genero: formData.genero,
        dataNascimento: formData.dataNascimento,
        localId,
        contactoTelefonico: formData.contacto,
        situacaoClinica: formData.situacaoClinica,
        notas: formData.notas,
      });
      navigate('/utentes');
    } catch (erro) {
      console.error('Falha ao criar utente:', erro);
      setErro(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível criar o utente. Confirma os dados e tenta novamente.',
      );
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <div className="h-100 d-flex flex-column">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Registar Novo Utente</h1>
          <p className="text-muted mb-0 small">Preencha os dados para adicionar um paciente ao sistema</p>
        </div>
        <button
          className="btn btn-outline-secondary d-flex align-items-center gap-2 shadow-sm"
          onClick={() => navigate('/utentes')}
          type="button"
        >
          <i className="bi bi-arrow-left"></i> Voltar à Lista
        </button>
      </div>

      <div className="card shadow-sm border-0 flex-grow-1 bg-white p-4 overflow-auto">
        <form onSubmit={handleGuardar}>
          <h5 className="fw-bold text-dark mb-4"><i className="bi bi-person-lines-fill me-2"></i>Dados do Paciente</h5>

          {erro && <div className="alert alert-danger">{erro}</div>}

          <div className="row g-4 mb-4" style={{ maxWidth: '800px' }}>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-medium">N.º de Utente *</label>
              <input
                type="text"
                className="form-control bg-light"
                name="numeroUtente"
                value={formData.numeroUtente}
                onChange={handleChange}
                placeholder="Ex: 12575"
                required
              />
            </div>
            <div className="col-12 col-md-8">
              <label className="form-label text-muted small fw-medium">Nome Completo *</label>
              <input
                type="text"
                className="form-control bg-light"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Manuel Joaquim..."
                required
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-medium">Género *</label>
              <select
                className="form-select bg-light"
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                required
              >
                {Object.entries(LABEL_GENERO).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-medium">Data de Nascimento *</label>
              <input
                type="date"
                className="form-control bg-light"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label text-muted small fw-medium">Contacto Telefónico</label>
              <input
                type="text"
                className="form-control bg-light"
                name="contacto"
                value={formData.contacto}
                onChange={handleChange}
                placeholder="Ex: 912 345 678"
              />
            </div>

            <div className="col-12">
              {modoCriarLocal ? (
                <section className="border rounded p-3" aria-labelledby="titulo-novo-local">
                  <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                    <h6 id="titulo-novo-local" className="fw-bold mb-0">Criar local nesta ficha</h6>
                    {locais.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setModoCriarLocal(false);
                          setErroLocal(null);
                        }}
                        disabled={aGuardar}
                      >
                        Escolher local existente
                      </button>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <label htmlFor="novo-local-tipo" className="form-label text-muted small fw-medium">
                        Tipo de local *
                      </label>
                      <select
                        id="novo-local-tipo"
                        className="form-select bg-light"
                        name="tipo"
                        value={dadosLocal.tipo}
                        onChange={handleLocalChange}
                        required
                      >
                        {TIPOS_LOCAL.map((tipo) => (
                          <option key={tipo.codigo} value={tipo.codigo}>{tipo.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-8">
                      <label htmlFor="novo-local-nome" className="form-label text-muted small fw-medium">
                        Nome {dadosLocal.tipo !== 'DOMICILIO' ? '*' : '(opcional)'}
                      </label>
                      <input
                        id="novo-local-nome"
                        className="form-control bg-light"
                        name="nome"
                        value={dadosLocal.nome}
                        onChange={handleLocalChange}
                        required={dadosLocal.tipo !== 'DOMICILIO'}
                        placeholder="Ex.: nome da instituição"
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="novo-local-morada" className="form-label text-muted small fw-medium">
                        Morada *
                      </label>
                      <input
                        id="novo-local-morada"
                        className="form-control bg-light"
                        name="morada"
                        value={dadosLocal.morada}
                        onChange={handleLocalChange}
                        required
                        autoComplete="street-address"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="novo-local-codigo-postal" className="form-label text-muted small fw-medium">
                        Código postal
                      </label>
                      <input
                        id="novo-local-codigo-postal"
                        className="form-control bg-light"
                        name="codigoPostal"
                        value={dadosLocal.codigoPostal}
                        onChange={handleLocalChange}
                        autoComplete="postal-code"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="novo-local-localidade" className="form-label text-muted small fw-medium">
                        Localidade *
                      </label>
                      <input
                        id="novo-local-localidade"
                        className="form-control bg-light"
                        name="localidade"
                        value={dadosLocal.localidade}
                        onChange={handleLocalChange}
                        required
                        autoComplete="address-level2"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label htmlFor="novo-local-concelho" className="form-label text-muted small fw-medium">
                        Concelho *
                      </label>
                      <select
                        id="novo-local-concelho"
                        className="form-select bg-light"
                        name="concelhoId"
                        value={dadosLocal.concelhoId}
                        onChange={handleLocalChange}
                        required
                      >
                        <option value="">Selecionar concelho</option>
                        {concelhos.map((concelho) => (
                          <option key={concelho.id} value={concelho.id}>{concelho.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label htmlFor="novo-local-contacto" className="form-label text-muted small fw-medium">
                        Telefone do local
                      </label>
                      <input
                        id="novo-local-contacto"
                        className="form-control bg-light"
                        name="contactoTelefonico"
                        value={dadosLocal.contactoTelefonico}
                        onChange={handleLocalChange}
                      />
                    </div>
                  </div>
                  <div className="alert alert-info small mt-3 mb-2">
                    A morada não é enviada a serviços de geocodificação. O mapa usa tiles públicos do
                    OpenStreetMap, que podem revelar a área visualizada ao fornecedor. Clique no mapa ou
                    arraste o pino para definir e confirmar as coordenadas.
                  </div>
                  {/* Altura explícita: o MapaLeaflet tem um .card com h-100, que não
                      resolve percentagem nenhuma dentro de uma <section> sem altura
                      própria — sem isto o mapa fica com 0px de altura. */}
                  <div style={{ height: '360px' }}>
                    <MapaLeaflet
                      utentes={[]}
                      modoEdicao
                      mostrarLegenda={false}
                      pontoEdicao={pontoLocal}
                      pontoEdicaoValido={pontoLocalValido}
                      pontoEdicaoConfirmado={pontoLocalConfirmado}
                      onSelecionarPonto={(lat, lng) => {
                        setPontoLocal({ lat, lng });
                        setPontoLocalConfirmado(true);
                        setErroLocal(null);
                      }}
                    />
                  </div>
                  <div className="small mt-2" aria-live="polite">
                    {pontoLocalConfirmado && pontoLocalValido ? (
                      <span className="text-success">
                        Coordenadas confirmadas: {pontoLocal.lat.toFixed(5)}, {pontoLocal.lng.toFixed(5)}.
                      </span>
                    ) : pontoLocalConfirmado ? (
                      <span className="text-danger">
                        Ponto fora de Portugal continental. Escolhe uma localização dentro do território.
                      </span>
                    ) : (
                      <span className="text-muted">
                        Pino centrado em Beja. Confirma a localização no mapa antes de guardar.
                      </span>
                    )}
                  </div>
                  {erroLocal && <div className="alert alert-danger small mt-2 mb-0" role="alert">{erroLocal}</div>}
                </section>
              ) : (
                <>
                  <label htmlFor="utente-local" className="form-label text-muted small fw-medium">Local *</label>
                  <select
                    id="utente-local"
                    className="form-select bg-light"
                    name="localId"
                    value={formData.localId}
                    onChange={handleChange}
                    required
                    disabled={carregandoReferencias || locais.length === 0}
                  >
                    <option value="">
                      {carregandoReferencias ? 'A carregar locais...' : 'Escolhe o local onde o utente se encontra...'}
                    </option>
                    {locais.map((local) => (
                      <option key={local.id} value={local.id}>
                        {local.nome ? `${local.nome} — ` : ''}{local.morada}, {local.localidade}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-link btn-sm px-0"
                    onClick={iniciarCriacaoLocal}
                    disabled={aGuardar || carregandoReferencias}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Criar novo local
                  </button>
                </>
              )}
            </div>

            <div className="col-12">
              <label className="form-label text-muted small fw-medium">Situação Clínica</label>
              <textarea
                className="form-control bg-light"
                name="situacaoClinica"
                rows={3}
                value={formData.situacaoClinica}
                onChange={handleChange}
                placeholder="Resumo da situação clínica do utente"
              />
            </div>

            <div className="col-12">
              <label className="form-label text-muted small fw-medium">Notas</label>
              <textarea
                className="form-control bg-light"
                name="notas"
                rows={2}
                value={formData.notas}
                onChange={handleChange}
                placeholder="Notas adicionais"
              />
            </div>
          </div>

          <hr className="text-muted opacity-25 mb-4" />

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-light border text-dark"
              onClick={() => navigate('/utentes')}
              disabled={aGuardar}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-success px-4 shadow-sm" disabled={aGuardar}>
              <i className="bi bi-save me-2"></i> {aGuardar ? 'A guardar...' : 'Guardar Utente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovoUtentePage;
