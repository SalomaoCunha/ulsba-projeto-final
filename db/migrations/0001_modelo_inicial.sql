-- =====================================================================
-- 0001_modelo_inicial.sql | RF/RNF v0.3 | ESQUEMA 30 tabelas (núcleo)
-- Plataforma de Apoio à Equipa de Serviços Integrados de Cuidados Paliativos da ULSBA
-- Projeto Integrado 2026-2027 — UPBeja, Licenciatura em Engenharia Informática
--
-- Modelo de dados inicial (PostgreSQL 16 + PostGIS 3). Corresponde ao diagrama
-- E/R e ao dicionário de dados do documento «Modelo de Dados» e baseia-se na
-- Especificação de Requisitos v0.3 (31/10/2026).
--
-- Como aplicar (base de dados vazia):
--   psql -U <utilizador> -d <base_de_dados> -v ON_ERROR_STOP=1 -f 0001_modelo_inicial.sql
--
-- Convenções:
--   * Nomes em português, sem acentos, em minúsculas e com sublinhados (snake_case).
--   * Instantes (início/fim de visita, partida/regresso, autoria) em timestamptz;
--     datas civis (nascimento, transições de estado) em date (RNF26).
--   * Coordenadas em WGS84 / SRID 4326 (RNF27).
--   * Nada se apaga fisicamente: desativa-se (ativo/estado) para preservar o histórico (RF03).
--   * Só dados fictícios nesta fase (RNF01).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Extensões
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;     -- tipos e funções geográficas (RNF11, RNF27)
CREATE EXTENSION IF NOT EXISTS btree_gist;  -- permite restrições EXCLUDE com igualdade + intervalos
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- pesquisa por nome com sugestões (RF01)

-- ---------------------------------------------------------------------
-- 2. Tipos enumerados
-- ---------------------------------------------------------------------
-- Perfil de acesso à plataforma (secção 3 dos requisitos). Distinto da função clínica da pessoa.
CREATE TYPE perfil_utilizador AS ENUM ('COORDENADOR', 'PROFISSIONAL_SAUDE', 'ADMINISTRADOR');

-- Género do utente. Representação provisória (ponto em aberto 9).
CREATE TYPE genero AS ENUM ('FEMININO', 'MASCULINO', 'OUTRO', 'NAO_INDICADO');

-- Ciclo de vida do utente (RF07). Readmissão = transição INATIVO → ATIVO. Estados finais (alta, óbito) por validar (ponto em aberto 11).
CREATE TYPE estado_utente AS ENUM ('REFERENCIADO', 'ATIVO', 'INATIVO');

-- Tipo de local (RF05, RF06). BASE é a unidade de partida e regresso das voltas (Beja).
CREATE TYPE tipo_local AS ENUM ('DOMICILIO', 'LAR', 'UNIDADE_CUIDADOS_CONTINUADOS', 'UNIDADE_CUIDADOS_PALIATIVOS', 'BASE');

-- Como as coordenadas foram obtidas (RF04, RF09, RF41).
CREATE TYPE origem_coordenadas AS ENUM ('MARCADA_NO_MAPA', 'GEOCODIFICADA', 'IMPORTADA');

-- Estado da volta. Um rascunho pode estar incompleto; só a confirmação exige equipa, viatura e horas (RF43, RF50).
CREATE TYPE estado_volta AS ENUM ('RASCUNHO', 'CONFIRMADA', 'EM_CURSO', 'CONCLUIDA', 'CANCELADA');

-- Estado da visita (RF23, RF29).
CREATE TYPE estado_visita AS ENUM ('PENDENTE', 'PLANEADA', 'EM_CURSO', 'CONCLUIDA', 'CANCELADA');

-- Tipo de motorização/energia da viatura (RF48). Categorias por validar (ponto em aberto 17).
CREATE TYPE tipo_motorizacao AS ENUM ('GASOLINA', 'GASOLEO', 'HIBRIDO', 'ELETRICO', 'OUTRO');

-- Estado administrativo atual da viatura. A disponibilidade num período calcula-se (RF48), não é este campo.
CREATE TYPE estado_viatura AS ENUM ('OPERACIONAL', 'EM_MANUTENCAO', 'INATIVA');

-- Unidade da capacidade do depósito/bateria (RF48).
CREATE TYPE unidade_deposito AS ENUM ('LITROS', 'KWH');

-- Unidade da autonomia (RF48; ponto em aberto 17).
CREATE TYPE unidade_autonomia AS ENUM ('KM', 'PERCENTAGEM');

-- Motivo de uma indisponibilidade da viatura (RF48).
CREATE TYPE tipo_indisponibilidade AS ENUM ('REVISAO', 'REPARACAO', 'OUTRA');

-- Separa avisos operacionais de notas clínicas (RF45).
CREATE TYPE visibilidade_ocorrencia AS ENUM ('OPERACIONAL', 'CLINICA');

-- Método usado para estimar a distância (RF32). Fonte por decidir (ponto em aberto 5).
CREATE TYPE metodo_distancia AS ENUM ('LINHA_RETA', 'ENCAMINHAMENTO_EXTERNO', 'MOTOR_PROPRIO');

-- Origem de uma distância realmente medida (RF32).
CREATE TYPE fonte_distancia_real AS ENUM ('ODOMETRO', 'GPS');

-- Origem da ordenação das paragens (RF27, RF28).
CREATE TYPE origem_plano AS ENUM ('MANUAL', 'VIZINHO_MAIS_PROXIMO', 'ALGORITMO');

-- Operação registada no trilho de auditoria (RNF04).
CREATE TYPE operacao_auditoria AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- Tipo do valor guardado em parametro_sistema.
CREATE TYPE tipo_valor_parametro AS ENUM ('TEXTO', 'INTEIRO', 'DECIMAL', 'HORA', 'BOOLEANO');

-- ---------------------------------------------------------------------
-- 3. Tabelas (por ordem de dependência)
--    Em cada coluna, o comentário à direita explica o seu propósito.
-- ---------------------------------------------------------------------

-- Conta de acesso à plataforma. Guarda a credencial e o perfil de acesso, que é independente da função clínica da pessoa (profissional).
-- Requisitos: RF37, RF38, RF49, RNF02, RNF22, RNF25
CREATE TABLE utilizador (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico do utilizador.
    email                         varchar(254) NOT NULL,  -- Correio eletrónico usado para iniciar sessão. Único sem distinguir maiúsculas de minúsculas.
    nome                          varchar(120) NOT NULL,  -- Nome apresentado na interface e nas autorias.
    password_hash                 varchar(255) NOT NULL,  -- Hash criptográfico da palavra-passe (Argon2id ou bcrypt). Nunca a palavra-passe em claro (RNF02).
    perfil                        perfil_utilizador NOT NULL,  -- Perfil de acesso: coordenador, profissional de saúde ou administrador.
    vista_geral                   boolean NOT NULL DEFAULT false,  -- Se verdadeiro, o coordenador tem vista transversal a todas as equipas (RF49). Só é possível para o perfil COORDENADOR.
    ativo                         boolean NOT NULL DEFAULT true,  -- Conta ativa. As contas não se apagam, desativam-se (preserva a autoria histórica).
    tentativas_falhadas           smallint NOT NULL DEFAULT 0,  -- Inícios de sessão falhados consecutivos; base do limite de tentativas (RNF25).
    bloqueado_ate                 timestamptz,  -- Instante até ao qual a conta está bloqueada por excesso de tentativas.
    ultimo_acesso_em              timestamptz,  -- Instante do último início de sessão bem-sucedido.
    criado_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante de criação da conta.
    CONSTRAINT pk_utilizador PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT ck_utilizador_vista_geral CHECK (vista_geral = false OR perfil = 'COORDENADOR'),  -- Só coordenadores podem ter vista geral (RF49, RNF22).
    CONSTRAINT ck_utilizador_tentativas CHECK (tentativas_falhadas >= 0)  -- O contador de tentativas não é negativo.
);
CREATE UNIQUE INDEX uq_utilizador_email ON utilizador (lower(email));  -- Unicidade do email sem distinção de maiúsculas.

-- Concelhos do território de atuação. Tabela própria para permitir acrescentar concelhos sem alterar o sistema.
-- Requisitos: RF05, RF08, RF16, RF34, RNF10
CREATE TABLE concelho (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    nome                          varchar(80) NOT NULL,  -- Nome do concelho.
    distrito                      varchar(60),  -- Distrito a que pertence (útil porque a unidade de Montemor pode estar fora do distrito de Beja; ponto em aberto 12).
    CONSTRAINT pk_concelho PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT uq_concelho_nome UNIQUE (nome)  -- nome é único.
);

-- Catálogo configurável de níveis de triagem/urgência. Determina a prioridade clínica e a cor no mapa. Independente da complexidade IPCPAL.
-- Requisitos: RF10, RF11, RF13, RF15, RNF08
CREATE TABLE nivel_urgencia (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    codigo                        varchar(10) NOT NULL,  -- Código curto (hipótese de trabalho: A, B, C, NU).
    designacao                    varchar(60) NOT NULL,  -- Designação por extenso (ex.: «Muito urgente»). Garante que a prioridade nunca depende só da cor (RNF08).
    cor_hex                       char(7) NOT NULL,  -- Cor do marcador no mapa, formato #RRGGBB.
    icone                         varchar(40),  -- Nome de ícone opcional, complementar à designação (RNF08).
    ordem                         smallint NOT NULL,  -- Ordem clínica: 1 = mais urgente. Usada na ordenação das listas e das necessidades de visita (RF22).
    prazo_max_sem_visita_dias     smallint,  -- Limite de dias sem visita para este nível, usado nos alertas (RF13). Nulo = por definir.
    ativo                         boolean NOT NULL DEFAULT true,  -- Nível em uso. Níveis antigos desativam-se para preservar o histórico de triagens.
    CONSTRAINT pk_nivel_urgencia PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT uq_nivel_urgencia_codigo UNIQUE (codigo),  -- codigo é único.
    CONSTRAINT uq_nivel_urgencia_ordem UNIQUE (ordem),  -- ordem é único.
    CONSTRAINT ck_nivel_urgencia_cor CHECK (cor_hex ~ '^#[0-9A-Fa-f]{6}$'),  -- A cor tem o formato #RRGGBB.
    CONSTRAINT ck_nivel_urgencia_ordem CHECK (ordem > 0),  -- A ordem é positiva.
    CONSTRAINT ck_nivel_urgencia_prazo CHECK (prazo_max_sem_visita_dias IS NULL OR prazo_max_sem_visita_dias > 0)  -- O limite de dias, quando definido, é positivo.
);

-- Catálogo da classificação de complexidade IPCPAL (altamente complexo, complexo, não complexo). Conceito distinto da urgência e do PPS.
-- Requisitos: RF12, RF14
CREATE TABLE nivel_complexidade (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    codigo                        varchar(30) NOT NULL,  -- Código estável (ex.: ALTAMENTE_COMPLEXO, COMPLEXO, NAO_COMPLEXO).
    designacao                    varchar(60) NOT NULL,  -- Designação por extenso.
    ordem                         smallint NOT NULL,  -- Ordem de apresentação: 1 = mais complexo.
    ativo                         boolean NOT NULL DEFAULT true,  -- Nível em uso.
    CONSTRAINT pk_nivel_complexidade PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT uq_nivel_complexidade_codigo UNIQUE (codigo),  -- codigo é único.
    CONSTRAINT uq_nivel_complexidade_ordem UNIQUE (ordem),  -- ordem é único.
    CONSTRAINT ck_nivel_complexidade_ordem CHECK (ordem > 0)  -- A ordem é positiva.
);

-- Catálogo das funções clínicas dos profissionais (médico, enfermeiro, …). Não confundir com o perfil de acesso.
-- Requisitos: RF24
CREATE TABLE funcao_profissional (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    codigo                        varchar(30) NOT NULL,  -- Código estável da função (ex.: MEDICO, ENFERMEIRO).
    designacao                    varchar(80) NOT NULL,  -- Designação por extenso.
    ativo                         boolean NOT NULL DEFAULT true,  -- Função em uso.
    CONSTRAINT pk_funcao_profissional PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT uq_funcao_profissional_codigo UNIQUE (codigo)  -- codigo é único.
);

-- Catálogo dos tipos de ocorrência (atraso, incidente, nota clínica, …), cada um com uma visibilidade por omissão.
-- Requisitos: RF45, RF47
CREATE TABLE tipo_ocorrencia (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    codigo                        varchar(30) NOT NULL,  -- Código estável (ex.: ATRASO, INCIDENTE, NOTA_CLINICA).
    designacao                    varchar(80) NOT NULL,  -- Designação por extenso.
    visibilidade_padrao           visibilidade_ocorrencia NOT NULL,  -- Visibilidade sugerida para ocorrências deste tipo (operacional ou clínica).
    ativo                         boolean NOT NULL DEFAULT true,  -- Tipo em uso. Os tipos reais estão por validar (ponto em aberto 19).
    CONSTRAINT pk_tipo_ocorrencia PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT uq_tipo_ocorrencia_codigo UNIQUE (codigo)  -- codigo é único.
);

-- Parâmetros de planeamento configuráveis, com histórico de quem os alterou e desde quando vigoram. O valor em vigor é o de maior valido_desde que não esteja no futuro.
-- Requisitos: RF39, RF12, RF13, RF46
CREATE TABLE parametro_sistema (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    chave                         varchar(80) NOT NULL,  -- Nome do parâmetro (ex.: HORARIO_INICIO_VISITAS, HORARIO_FIM_VISITAS, DURACAO_MINIMA_SUSPEITA_MIN).
    valor                         varchar(200) NOT NULL,  -- Valor em texto; a interpretação depende de tipo_valor.
    tipo_valor                    tipo_valor_parametro NOT NULL,  -- Tipo do valor, para validação e conversão.
    descricao                     varchar(300),  -- Descrição legível do parâmetro.
    valido_desde                  timestamptz NOT NULL DEFAULT now(),  -- Instante a partir do qual este valor vigora.
    definido_por                  integer NOT NULL,  -- Utilizador que definiu o valor.
    CONSTRAINT pk_parametro_sistema PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_parametro_sistema_definido_por FOREIGN KEY (definido_por) REFERENCES utilizador (id),  -- definido_por → utilizador.id
    CONSTRAINT uq_parametro_sistema_versao UNIQUE (chave, valido_desde)  -- Não há dois valores do mesmo parâmetro com o mesmo início de vigência.
);

-- Duração padrão de uma visita por nível de complexidade, com histórico. Serve apenas para estimar o esforço; não altera a ordem clínica de urgência.
-- Requisitos: RF12, RF22, RF39
CREATE TABLE duracao_padrao_complexidade (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    nivel_complexidade_id         integer NOT NULL,  -- Nível de complexidade a que se aplica.
    minutos                       smallint NOT NULL,  -- Duração padrão, em minutos.
    valido_desde                  timestamptz NOT NULL DEFAULT now(),  -- Instante a partir do qual este valor vigora.
    definido_por                  integer NOT NULL,  -- Utilizador que definiu o valor.
    CONSTRAINT pk_duracao_padrao_complexidade PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_duracao_padrao_complexidade_nivel_complexidade_id FOREIGN KEY (nivel_complexidade_id) REFERENCES nivel_complexidade (id),  -- nivel_complexidade_id → nivel_complexidade.id
    CONSTRAINT fk_duracao_padrao_complexidade_definido_por FOREIGN KEY (definido_por) REFERENCES utilizador (id),  -- definido_por → utilizador.id
    CONSTRAINT ck_duracao_padrao_minutos CHECK (minutos > 0),  -- A duração é positiva.
    CONSTRAINT uq_duracao_padrao_versao UNIQUE (nivel_complexidade_id, valido_desde)  -- Um único valor por nível e início de vigência.
);

-- Viatura da unidade, com as características necessárias ao planeamento (lugares, depósito, autonomia, revisões).
-- Requisitos: RF20, RF48, RNF10
CREATE TABLE viatura (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    matricula                     varchar(12) NOT NULL,  -- Matrícula da viatura.
    designacao                    varchar(80),  -- Nome ou descrição (ex.: marca e modelo).
    tipo_motorizacao              tipo_motorizacao NOT NULL,  -- Tipo de motorização/energia.
    lugares                       smallint NOT NULL,  -- Lotação: número total de lugares, condutor incluído. Limita os profissionais escalados numa volta (RF50).
    capacidade_deposito           numeric(6,1),  -- Capacidade do depósito (ou bateria). Opcional.
    unidade_deposito              unidade_deposito,  -- Unidade da capacidade; obrigatória se a capacidade existir.
    autonomia                     numeric(7,1),  -- Autonomia, quando aplicável.
    unidade_autonomia             unidade_autonomia,  -- Unidade da autonomia; obrigatória se a autonomia existir.
    estado                        estado_viatura NOT NULL DEFAULT 'OPERACIONAL',  -- Estado administrativo atual. Não substitui o cálculo de disponibilidade num período.
    data_ultima_revisao           date,  -- Data da última revisão (data civil, sem hora).
    periodicidade_revisao_meses   smallint,  -- Periodicidade das revisões, em meses (valor por confirmar).
    criada_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante de criação do registo.
    CONSTRAINT pk_viatura PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT uq_viatura_matricula UNIQUE (matricula),  -- matricula é único.
    CONSTRAINT ck_viatura_lugares CHECK (lugares >= 1),  -- Pelo menos um lugar.
    CONSTRAINT ck_viatura_deposito CHECK ((capacidade_deposito IS NULL) = (unidade_deposito IS NULL) AND (capacidade_deposito IS NULL OR capacidade_deposito > 0)),  -- Capacidade e unidade surgem sempre em conjunto; capacidade positiva.
    CONSTRAINT ck_viatura_autonomia CHECK ((autonomia IS NULL) = (unidade_autonomia IS NULL) AND (autonomia IS NULL OR autonomia >= 0)),  -- Autonomia e unidade surgem sempre em conjunto; autonomia não negativa.
    CONSTRAINT ck_viatura_periodicidade CHECK (periodicidade_revisao_meses IS NULL OR periodicidade_revisao_meses > 0)  -- Periodicidade positiva.
);

-- Períodos em que uma viatura não pode ser usada (revisão, reparação, outro). É o que a ação «Agendar» da página Viaturas grava no calendário; não é uma visita.
-- Requisitos: RF20, RF48, RF50
CREATE TABLE viatura_indisponibilidade (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    viatura_id                    integer NOT NULL,  -- Viatura afetada.
    tipo                          tipo_indisponibilidade NOT NULL,  -- Motivo da indisponibilidade.
    inicio                        timestamptz NOT NULL,  -- Início da indisponibilidade (instante).
    fim                           timestamptz NOT NULL,  -- Fim da indisponibilidade (instante).
    descricao                     varchar(300),  -- Descrição livre (ex.: oficina, tipo de reparação).
    criada_por                    integer NOT NULL,  -- Utilizador que registou a indisponibilidade.
    criada_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante do registo.
    CONSTRAINT pk_viatura_indisponibilidade PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_viatura_indisponibilidade_viatura_id FOREIGN KEY (viatura_id) REFERENCES viatura (id),  -- viatura_id → viatura.id
    CONSTRAINT fk_viatura_indisponibilidade_criada_por FOREIGN KEY (criada_por) REFERENCES utilizador (id),  -- criada_por → utilizador.id
    CONSTRAINT ck_viatura_indisp_intervalo CHECK (fim > inicio),  -- O fim é posterior ao início.
    CONSTRAINT ex_viatura_indisp_sem_sobreposicao EXCLUDE USING gist (viatura_id WITH =, tstzrange(inicio, fim) WITH &&)  -- A mesma viatura não tem duas indisponibilidades sobrepostas.
);

-- Profissional de saúde com a sua função clínica. Pode ou não ter conta de utilizador; a mesma enfermeira pode ter o perfil de coordenador sem deixar de ser profissional.
-- Requisitos: RF24, RF29, RF37
CREATE TABLE profissional (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    utilizador_id                 integer,  -- Conta de acesso associada, se existir (relação 1 para 0..1).
    nome                          varchar(120) NOT NULL,  -- Nome do profissional.
    funcao_id                     integer NOT NULL,  -- Função clínica (médico, enfermeiro, …).
    contacto_telefonico           varchar(20),  -- Contacto telefónico profissional.
    ativo                         boolean NOT NULL DEFAULT true,  -- Profissional ativo. Registos históricos mantêm-se ao desativar.
    criado_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante de criação do registo.
    CONSTRAINT pk_profissional PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT uq_profissional_utilizador_id UNIQUE (utilizador_id),  -- utilizador_id é único.
    CONSTRAINT fk_profissional_utilizador_id FOREIGN KEY (utilizador_id) REFERENCES utilizador (id),  -- utilizador_id → utilizador.id
    CONSTRAINT fk_profissional_funcao_id FOREIGN KEY (funcao_id) REFERENCES funcao_profissional (id)  -- funcao_id → funcao_profissional.id
);

-- Equipa com código próprio (A, B, C, …) e viatura habitual opcional. A composição varia no tempo (equipa_membro).
-- Requisitos: RF20, RF24, RF52, RNF10
CREATE TABLE equipa (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    codigo                        varchar(5) NOT NULL,  -- Código legível da equipa (A, B, C, …).
    designacao                    varchar(80),  -- Designação opcional.
    viatura_habitual_id           integer,  -- Viatura habitualmente associada. Pode diferir da usada numa volta concreta (RF52).
    ativa                         boolean NOT NULL DEFAULT true,  -- Equipa em atividade.
    criada_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante de criação do registo.
    CONSTRAINT pk_equipa PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT uq_equipa_codigo UNIQUE (codigo),  -- codigo é único.
    CONSTRAINT fk_equipa_viatura_habitual_id FOREIGN KEY (viatura_habitual_id) REFERENCES viatura (id)  -- viatura_habitual_id → viatura.id
);

-- Composição de uma equipa ao longo do tempo: que profissional pertence a que equipa e em que período.
-- Requisitos: RF24, RF49, RF52
CREATE TABLE equipa_membro (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    equipa_id                     integer NOT NULL,  -- Equipa.
    profissional_id               integer NOT NULL,  -- Profissional.
    valido_desde                  timestamptz NOT NULL DEFAULT now(),  -- Início da pertença à equipa.
    valido_ate                    timestamptz,  -- Fim da pertença (exclusivo). Nulo = em vigor.
    CONSTRAINT pk_equipa_membro PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_equipa_membro_equipa_id FOREIGN KEY (equipa_id) REFERENCES equipa (id),  -- equipa_id → equipa.id
    CONSTRAINT fk_equipa_membro_profissional_id FOREIGN KEY (profissional_id) REFERENCES profissional (id),  -- profissional_id → profissional.id
    CONSTRAINT ck_equipa_membro_periodo CHECK (valido_ate IS NULL OR valido_ate > valido_desde),  -- O fim é posterior ao início.
    CONSTRAINT ex_equipa_membro_sem_sobreposicao EXCLUDE USING gist (equipa_id WITH =, profissional_id WITH =, tstzrange(valido_desde, valido_ate) WITH &&)  -- Um profissional não tem dois períodos sobrepostos na mesma equipa.
);

-- Local onde o utente se encontra ou de onde as equipas partem (domicílio, lar, unidade, base). Entidade própria e partilhável: vários utentes do mesmo lar apontam para o mesmo local, com uma só morada e um só ponto no mapa. As coordenadas (WGS84) vivem aqui.
-- Requisitos: RF04, RF05, RF06, RF09, RF15, RNF11, RNF27
CREATE TABLE local (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    tipo                          tipo_local NOT NULL,  -- Domicílio, lar, unidade de cuidados continuados/paliativos ou base de partida.
    nome                          varchar(120),  -- Nome da instituição. Obrigatório para lar, unidade e base.
    morada                        varchar(200) NOT NULL,  -- Morada.
    codigo_postal                 varchar(8),  -- Código postal no formato 0000-000.
    localidade                    varchar(80) NOT NULL,  -- Localidade.
    concelho_id                   integer NOT NULL,  -- Concelho.
    contacto_telefonico           varchar(20),  -- Contacto telefónico do local.
    geom                          geography(Point,4326),  -- Ponto no mapa, WGS84/SRID 4326 (RNF27). Nulo até ser marcado ou geocodificado.
    origem_coordenadas            origem_coordenadas,  -- Como o ponto foi obtido. Preenchido se e só se geom existir.
    coordenadas_confirmadas       boolean NOT NULL DEFAULT false,  -- Verdadeiro quando um utilizador confirmou ou corrigiu o ponto (RF09: o resultado da geocodificação é sugestão).
    ativo                         boolean NOT NULL DEFAULT true,  -- Local em uso.
    criado_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante de criação do registo.
    CONSTRAINT pk_local PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_local_concelho_id FOREIGN KEY (concelho_id) REFERENCES concelho (id),  -- concelho_id → concelho.id
    CONSTRAINT ck_local_nome_obrigatorio CHECK (tipo = 'DOMICILIO' OR nome IS NOT NULL),  -- Lares, unidades e base exigem nome (RF05).
    CONSTRAINT ck_local_codigo_postal CHECK (codigo_postal IS NULL OR codigo_postal ~ '^[0-9]{4}-[0-9]{3}$'),  -- Formato do código postal.
    CONSTRAINT ck_local_origem_coordenadas CHECK ((geom IS NULL) = (origem_coordenadas IS NULL)),  -- A origem existe se e só se houver ponto.
    CONSTRAINT ck_local_confirmadas CHECK (NOT coordenadas_confirmadas OR geom IS NOT NULL) -- Só se confirma um ponto com coordenadas. O limite territorial oficial é configurável numa migração posterior.
);
CREATE INDEX ix_local_geom ON local USING gist (geom);  -- Índice espacial (GiST) para consultas por zona e distância (RNF11).
CREATE INDEX ix_local_concelho ON local (concelho_id);  -- Filtro por concelho.
CREATE INDEX ix_local_tipo ON local (tipo);  -- Filtro por tipo de local.

-- Utente (doente) acompanhado. Guarda apenas dados estáveis. A idade, as datas de referenciação/triagem/admissão, a prioridade atual, a complexidade atual, a equipa responsável atual e a última visita são derivadas (vista vw_utente_ficha) e não se duplicam aqui.
-- Requisitos: RF01, RF02, RF03, RF05, RF07, RF08, RF30, RNF01, RNF23
CREATE TABLE utente (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    numero_utente                 varchar(20) NOT NULL,  -- Número de utente. Desambigua nomes repetidos (RF01).
    nome                          varchar(150) NOT NULL,  -- Nome completo.
    genero                        genero NOT NULL,  -- Género.
    data_nascimento               date NOT NULL,  -- Data de nascimento (data civil). A idade calcula-se, não se guarda.
    local_id                      integer NOT NULL,  -- Local onde o utente se encontra. Exatamente um por utente (RF05).
    contacto_telefonico           varchar(20),  -- Contacto telefónico do utente.
    situacao_clinica              text,  -- Resumo da situação clínica. Campo clínico: acesso restrito (RNF22). Conteúdo mínimo por validar (ponto em aberto 3).
    notas                         text,  -- Notas gerais sobre o utente. Campo clínico: acesso restrito.
    estado                        estado_utente NOT NULL DEFAULT 'REFERENCIADO',  -- Estado atual do ciclo de vida. Cada mudança fica em utente_transicao_estado.
    criado_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante de criação da ficha.
    criado_por                    integer NOT NULL,  -- Utilizador que criou a ficha.
    CONSTRAINT pk_utente PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT uq_utente_numero_utente UNIQUE (numero_utente),  -- numero_utente é único.
    CONSTRAINT fk_utente_local_id FOREIGN KEY (local_id) REFERENCES local (id),  -- local_id → local.id
    CONSTRAINT fk_utente_criado_por FOREIGN KEY (criado_por) REFERENCES utilizador (id),  -- criado_por → utilizador.id
    CONSTRAINT ck_utente_nascimento CHECK (data_nascimento <= CURRENT_DATE)  -- A data de nascimento não está no futuro.
);
CREATE INDEX ix_utente_nome_trgm ON utente USING gin (lower(nome) gin_trgm_ops);  -- Pesquisa por nome com sugestões à medida que se escreve (RF01, RNF09).
CREATE INDEX ix_utente_estado ON utente (estado);  -- Filtro por estado (RF08).
CREATE INDEX ix_utente_local ON utente (local_id);  -- Utentes de um local.

-- Cuidador Principal: familiar ou outra pessoa que presta cuidados no domicílio. Entidade distinta da Equipa Responsável; alterar uma não altera nem elimina a outra.
-- Requisitos: RF02, RF33
CREATE TABLE cuidador_principal (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    utente_id                     integer NOT NULL,  -- Utente a quem presta cuidados (no máximo um cuidador principal por utente).
    nome                          varchar(150) NOT NULL,  -- Nome do cuidador.
    parentesco                    varchar(60),  -- Relação com o utente (filho, cônjuge, vizinho, …).
    contacto_telefonico           varchar(20),  -- Contacto telefónico do cuidador.
    criado_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante de criação do registo.
    CONSTRAINT pk_cuidador_principal PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT uq_cuidador_principal_utente_id UNIQUE (utente_id),  -- utente_id é único.
    CONSTRAINT fk_cuidador_principal_utente_id FOREIGN KEY (utente_id) REFERENCES utente (id)  -- utente_id → utente.id
);

-- Histórico do ciclo de vida do utente. As datas de referenciação e de admissão mostradas na ficha são lidas daqui (primeira transição para REFERENCIADO e para ATIVO), sem campos redundantes.
-- Requisitos: RF02, RF07, RNF04
CREATE TABLE utente_transicao_estado (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    utente_id                     integer NOT NULL,  -- Utente.
    estado_anterior               estado_utente,  -- Estado de origem. Nulo na primeira transição.
    estado_novo                   estado_utente NOT NULL,  -- Estado de destino.
    data_transicao                date NOT NULL,  -- Data civil da transição (referenciação, admissão, inativação, readmissão).
    motivo                        varchar(300),  -- Motivo da transição.
    registada_por                 integer NOT NULL,  -- Autor do registo (atribuído pela API).
    registada_em                  timestamptz NOT NULL DEFAULT now(),  -- Instante do registo.
    CONSTRAINT pk_utente_transicao_estado PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_utente_transicao_estado_utente_id FOREIGN KEY (utente_id) REFERENCES utente (id),  -- utente_id → utente.id
    CONSTRAINT fk_utente_transicao_estado_registada_por FOREIGN KEY (registada_por) REFERENCES utilizador (id),  -- registada_por → utilizador.id
    CONSTRAINT ck_transicao_estados_distintos CHECK (estado_anterior IS NULL OR estado_anterior <> estado_novo)  -- Uma transição muda de facto o estado.
);
CREATE INDEX ix_transicao_utente ON utente_transicao_estado (utente_id, data_transicao);  -- Histórico de um utente por ordem temporal.

-- Avaliações de triagem (urgência). Cada reavaliação é um registo novo e imutável; a prioridade atual é a mais recente não retificada. Uma reavaliação pode aumentar ou reduzir a urgência.
-- Requisitos: RF08, RF10, RF11, RNF04
CREATE TABLE avaliacao_triagem (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    utente_id                     integer NOT NULL,  -- Utente avaliado.
    nivel_urgencia_id             integer NOT NULL,  -- Nível de urgência atribuído.
    motivo                        varchar(500) NOT NULL,  -- Motivo da avaliação ou da alteração (obrigatório, RF08).
    avaliada_em                   timestamptz NOT NULL DEFAULT now(),  -- Instante da avaliação. A data de triagem mostrada na ficha é a da primeira avaliação.
    avaliada_por                  integer NOT NULL,  -- Autor autenticado, atribuído pela API (RNF04).
    retifica_id                   integer,  -- Se preenchido, esta avaliação corrige a indicada (retificação auditada, sem editar o original).
    CONSTRAINT pk_avaliacao_triagem PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_avaliacao_triagem_utente_id FOREIGN KEY (utente_id) REFERENCES utente (id),  -- utente_id → utente.id
    CONSTRAINT fk_avaliacao_triagem_nivel_urgencia_id FOREIGN KEY (nivel_urgencia_id) REFERENCES nivel_urgencia (id),  -- nivel_urgencia_id → nivel_urgencia.id
    CONSTRAINT fk_avaliacao_triagem_avaliada_por FOREIGN KEY (avaliada_por) REFERENCES utilizador (id),  -- avaliada_por → utilizador.id
    CONSTRAINT fk_avaliacao_triagem_retifica_id FOREIGN KEY (retifica_id) REFERENCES avaliacao_triagem (id),  -- retifica_id → avaliacao_triagem.id
    CONSTRAINT ck_triagem_nao_autoretifica CHECK (retifica_id IS NULL OR retifica_id <> id)  -- Uma avaliação não se retifica a si própria.
);
CREATE INDEX ix_triagem_utente_data ON avaliacao_triagem (utente_id, avaliada_em DESC);  -- Avaliação atual e histórico por utente.
CREATE UNIQUE INDEX uq_triagem_retifica ON avaliacao_triagem (retifica_id) WHERE retifica_id IS NOT NULL;  -- Cada avaliação é retificada no máximo uma vez.

-- Avaliações de complexidade IPCPAL, separadas da triagem de urgência, com data e autor. O histórico consulta-se; a mais recente é a atual.
-- Requisitos: RF08, RF12, RNF04
CREATE TABLE avaliacao_complexidade (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    utente_id                     integer NOT NULL,  -- Utente avaliado.
    nivel_complexidade_id         integer NOT NULL,  -- Nível de complexidade atribuído.
    avaliada_em                   timestamptz NOT NULL DEFAULT now(),  -- Instante da avaliação.
    avaliada_por                  integer NOT NULL,  -- Autor autenticado, atribuído pela API.
    observacao                    varchar(500),  -- Observação opcional.
    CONSTRAINT pk_avaliacao_complexidade PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_avaliacao_complexidade_utente_id FOREIGN KEY (utente_id) REFERENCES utente (id),  -- utente_id → utente.id
    CONSTRAINT fk_avaliacao_complexidade_nivel_complexidade_id FOREIGN KEY (nivel_complexidade_id) REFERENCES nivel_complexidade (id),  -- nivel_complexidade_id → nivel_complexidade.id
    CONSTRAINT fk_avaliacao_complexidade_avaliada_por FOREIGN KEY (avaliada_por) REFERENCES utilizador (id)  -- avaliada_por → utilizador.id
);
CREATE INDEX ix_complexidade_utente_data ON avaliacao_complexidade (utente_id, avaliada_em DESC);  -- Avaliação atual e histórico por utente.

-- Valores da Palliative Performance Scale (PPS), registados como valor independente da complexidade. Nenhuma regra converte PPS em IPCPAL sem validação clínica (RF14).
-- Requisitos: RF12, RF14
CREATE TABLE registo_pps (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    utente_id                     integer NOT NULL,  -- Utente avaliado.
    valor                         smallint NOT NULL,  -- Valor do PPS: 0 a 100, em múltiplos de 10.
    registado_em                  timestamptz NOT NULL DEFAULT now(),  -- Instante do registo.
    registado_por                 integer NOT NULL,  -- Autor autenticado, atribuído pela API.
    observacao                    varchar(500),  -- Observação opcional.
    CONSTRAINT pk_registo_pps PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_registo_pps_utente_id FOREIGN KEY (utente_id) REFERENCES utente (id),  -- utente_id → utente.id
    CONSTRAINT fk_registo_pps_registado_por FOREIGN KEY (registado_por) REFERENCES utilizador (id),  -- registado_por → utilizador.id
    CONSTRAINT ck_pps_valor CHECK (valor BETWEEN 0 AND 100 AND valor % 10 = 0)  -- O PPS é um múltiplo de 10 entre 0 e 100.
);
CREATE INDEX ix_pps_utente_data ON registo_pps (utente_id, registado_em DESC);  -- Último PPS e histórico por utente.

-- Equipa Responsável pelo acompanhamento do utente, com histórico de atribuições. É a equipa que acompanha o utente; não é necessariamente a equipa que executa uma visita (visita.equipa_executante_id). Substitui o antigo campo «Médico Assistente» no Dashboard.
-- Requisitos: RF02, RF08, RF24, RF33, RF49
CREATE TABLE atribuicao_equipa_responsavel (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    utente_id                     integer NOT NULL,  -- Utente.
    equipa_id                     integer NOT NULL,  -- Equipa responsável.
    valido_desde                  timestamptz NOT NULL DEFAULT now(),  -- Início da atribuição.
    valido_ate                    timestamptz,  -- Fim da atribuição (exclusivo). Nulo = em vigor.
    motivo                        varchar(300),  -- Motivo da atribuição ou da mudança.
    registada_por                 integer NOT NULL,  -- Autor do registo.
    registada_em                  timestamptz NOT NULL DEFAULT now(),  -- Instante do registo.
    CONSTRAINT pk_atribuicao_equipa_responsavel PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_atribuicao_equipa_responsavel_utente_id FOREIGN KEY (utente_id) REFERENCES utente (id),  -- utente_id → utente.id
    CONSTRAINT fk_atribuicao_equipa_responsavel_equipa_id FOREIGN KEY (equipa_id) REFERENCES equipa (id),  -- equipa_id → equipa.id
    CONSTRAINT fk_atribuicao_equipa_responsavel_registada_por FOREIGN KEY (registada_por) REFERENCES utilizador (id),  -- registada_por → utilizador.id
    CONSTRAINT ck_atribuicao_periodo CHECK (valido_ate IS NULL OR valido_ate > valido_desde),  -- O fim é posterior ao início.
    CONSTRAINT ex_atribuicao_sem_sobreposicao EXCLUDE USING gist (utente_id WITH =, tstzrange(valido_desde, valido_ate) WITH &&)  -- Um utente tem no máximo uma equipa responsável em cada instante.
);
CREATE INDEX ix_atribuicao_equipa ON atribuicao_equipa_responsavel (equipa_id);  -- Utentes de uma equipa (âmbito de acesso do profissional, RF49).

-- Agenda identificada de uma equipa num dia: viatura, partida e regresso previstos/reais, estado e sequência de paragens. Um rascunho pode estar incompleto e vazio; uma volta confirmada tem equipa, viatura, horas e pelo menos uma visita.
-- Requisitos: RF19, RF20, RF21, RF25, RF27, RF32, RF43, RF44, RF47, RF50, RF51
CREATE TABLE volta (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    data                          date NOT NULL,  -- Dia do calendário (Europe/Lisbon). Existe mesmo nos rascunhos sem horas, para aparecerem no calendário (RF50).
    designacao                    varchar(100),  -- Identificação legível da volta (ex.: «Volta A — 03/11/2026»).
    estado                        estado_volta NOT NULL DEFAULT 'RASCUNHO',  -- Estado da volta.
    equipa_id                     integer,  -- Equipa que executa a volta. Obrigatória para confirmar.
    viatura_id                    integer,  -- Viatura usada. Obrigatória para confirmar.
    local_base_id                 integer,  -- Base de partida e regresso (tipo BASE, normalmente Beja).
    partida_prevista              timestamptz,  -- Instante previsto de partida.
    regresso_previsto             timestamptz,  -- Instante previsto de regresso.
    partida_real                  timestamptz,  -- Instante real de partida. Pode não existir (RF44).
    regresso_real                 timestamptz,  -- Instante real de regresso. Pode não existir.
    distancia_estimada_km         numeric(7,1),  -- Distância estimada da volta, em km. Só preenchida quando calculada (RF17, RF32).
    metodo_distancia              metodo_distancia,  -- Método da estimativa; obrigatório se houver distância estimada.
    distancia_real_km             numeric(7,1),  -- Distância realmente medida, em km. Só com leitura de odómetro ou GPS (RF32).
    fonte_distancia_real          fonte_distancia_real,  -- Origem da medição; obrigatória se houver distância real.
    origem_plano                  origem_plano NOT NULL DEFAULT 'MANUAL',  -- Como foi ordenada a volta: manualmente, por referência simples ou por algoritmo.
    motivo_cancelamento           varchar(300),  -- Motivo, obrigatório ao cancelar.
    criada_por                    integer NOT NULL,  -- Utilizador que criou a volta.
    criada_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante de criação.
    confirmada_por                integer,  -- Utilizador que confirmou a volta.
    confirmada_em                 timestamptz,  -- Instante da confirmação.
    CONSTRAINT pk_volta PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_volta_equipa_id FOREIGN KEY (equipa_id) REFERENCES equipa (id),  -- equipa_id → equipa.id
    CONSTRAINT fk_volta_viatura_id FOREIGN KEY (viatura_id) REFERENCES viatura (id),  -- viatura_id → viatura.id
    CONSTRAINT fk_volta_local_base_id FOREIGN KEY (local_base_id) REFERENCES local (id),  -- local_base_id → local.id
    CONSTRAINT fk_volta_criada_por FOREIGN KEY (criada_por) REFERENCES utilizador (id),  -- criada_por → utilizador.id
    CONSTRAINT fk_volta_confirmada_por FOREIGN KEY (confirmada_por) REFERENCES utilizador (id),  -- confirmada_por → utilizador.id
    CONSTRAINT ck_volta_intervalo_previsto CHECK (partida_prevista IS NULL OR regresso_previsto IS NULL OR regresso_previsto > partida_prevista),  -- O regresso previsto é posterior à partida prevista.
    CONSTRAINT ck_volta_intervalo_real CHECK (partida_real IS NULL OR regresso_real IS NULL OR regresso_real >= partida_real),  -- O regresso real não é anterior à partida real.
    CONSTRAINT ck_volta_distancia_estimada CHECK ((distancia_estimada_km IS NULL) = (metodo_distancia IS NULL) AND (distancia_estimada_km IS NULL OR distancia_estimada_km >= 0)),  -- Distância estimada e método surgem juntos (não se apresentam distâncias sem método, RF32).
    CONSTRAINT ck_volta_distancia_real CHECK ((distancia_real_km IS NULL) = (fonte_distancia_real IS NULL) AND (distancia_real_km IS NULL OR distancia_real_km >= 0)),  -- Distância real só existe com fonte de medição; nunca se infere (RF32).
    CONSTRAINT ck_volta_confirmada_completa CHECK (estado IN ('RASCUNHO','CANCELADA') OR (equipa_id IS NOT NULL AND viatura_id IS NOT NULL AND partida_prevista IS NOT NULL AND regresso_previsto IS NOT NULL AND confirmada_por IS NOT NULL AND confirmada_em IS NOT NULL)),  -- Confirmar exige equipa, viatura, horas previstas e quem confirmou (RF50).
    CONSTRAINT ck_volta_cancelada_motivo CHECK (estado <> 'CANCELADA' OR motivo_cancelamento IS NOT NULL),  -- Cancelar exige motivo.
    CONSTRAINT ex_volta_viatura_sem_sobreposicao EXCLUDE USING gist (viatura_id WITH =, tstzrange(partida_prevista, regresso_previsto) WITH &&) WHERE (estado IN ('CONFIRMADA','EM_CURSO')),  -- Uma viatura não está em duas voltas confirmadas sobrepostas (RF20, RF21). Rascunhos não reservam recursos.
    CONSTRAINT ex_volta_equipa_sem_sobreposicao EXCLUDE USING gist (equipa_id WITH =, tstzrange(partida_prevista, regresso_previsto) WITH &&) WHERE (estado IN ('CONFIRMADA','EM_CURSO'))  -- Uma equipa não está em duas voltas confirmadas sobrepostas (RF21).
);
CREATE INDEX ix_volta_data ON volta (data);  -- Calendário mensal/semanal/diário (RF19).
CREATE INDEX ix_volta_equipa_data ON volta (equipa_id, data);  -- Voltas de uma equipa (RF49, RF52).
CREATE INDEX ix_volta_estado ON volta (estado);  -- Filtro por estado.

-- Profissionais efetivamente escalados numa volta (por omissão, a composição da equipa nesse dia, ajustável). Serve o limite de lugares da viatura e a agenda por profissional.
-- Requisitos: RF21, RF24, RF50
CREATE TABLE volta_profissional (
    volta_id                      integer,  -- Volta.
    profissional_id               integer,  -- Profissional escalado.
    CONSTRAINT pk_volta_profissional PRIMARY KEY (volta_id, profissional_id),  -- Chave primária.
    CONSTRAINT fk_volta_profissional_volta_id FOREIGN KEY (volta_id) REFERENCES volta (id) ON DELETE CASCADE,  -- volta_id → volta.id (apaga em cascata)
    CONSTRAINT fk_volta_profissional_profissional_id FOREIGN KEY (profissional_id) REFERENCES profissional (id)  -- profissional_id → profissional.id
);

-- Paragem de uma volta: um local visitado numa determinada ordem. Várias visitas de utentes do mesmo lar partilham uma só paragem, sem que isso signifique que uma pessoa as faça em simultâneo.
-- Requisitos: RF21, RF25, RF43, RF50
CREATE TABLE paragem (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    volta_id                      integer NOT NULL,  -- Volta a que pertence.
    ordem                         smallint NOT NULL,  -- Posição na sequência da volta (1, 2, 3, …). Definida manualmente (RF50).
    local_id                      integer NOT NULL,  -- Local visitado.
    distancia_desde_anterior_km   numeric(6,1),  -- Distância desde a paragem anterior (ou desde a base), quando calculada.
    CONSTRAINT pk_paragem PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_paragem_volta_id FOREIGN KEY (volta_id) REFERENCES volta (id),  -- volta_id → volta.id
    CONSTRAINT fk_paragem_local_id FOREIGN KEY (local_id) REFERENCES local (id),  -- local_id → local.id
    CONSTRAINT ck_paragem_ordem CHECK (ordem > 0),  -- A ordem é positiva.
    CONSTRAINT ck_paragem_distancia CHECK (distancia_desde_anterior_km IS NULL OR distancia_desde_anterior_km >= 0),  -- Distância não negativa.
    CONSTRAINT uq_paragem_ordem UNIQUE (volta_id, ordem) DEFERRABLE INITIALLY DEFERRED,  -- Sem ordens repetidas na mesma volta; diferida para permitir reordenar numa transação.
    CONSTRAINT uq_paragem_local UNIQUE (volta_id, local_id)  -- Cada local aparece uma só vez por volta (agrupa utentes). A confirmar caso um local seja revisitado no mesmo dia.
);

-- Visita a um utente. Nasce como pendente (sem equipa, viatura nem hora), passa a planeada ao ser atribuída a uma paragem e termina concluída ou cancelada. Guarda horários previstos e reais como instantes.
-- Requisitos: RF19, RF21, RF23, RF29, RF30, RF31, RF46, RNF12, RNF26
CREATE TABLE visita (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    utente_id                     integer NOT NULL,  -- Utente visitado.
    paragem_id                    integer,  -- Paragem da volta em que a visita se realiza. Nula enquanto pendente.
    equipa_executante_id          integer,  -- Equipa que executa a visita (distinta da equipa responsável pelo utente). Nula enquanto pendente.
    estado                        estado_visita NOT NULL DEFAULT 'PENDENTE',  -- Estado da visita.
    inicio_previsto               timestamptz,  -- Início previsto.
    fim_previsto                  timestamptz,  -- Fim previsto.
    duracao_estimada_min          smallint,  -- Duração estimada em minutos (por omissão, a duração padrão da complexidade).
    inicio_real                   timestamptz,  -- Início real. Não é obrigatório antes da conclusão.
    fim_real                      timestamptz,  -- Fim real. Obrigatório ao concluir.
    duracao_real_min              numeric(8,2) GENERATED ALWAYS AS (round(EXTRACT(EPOCH FROM (fim_real - inicio_real))::numeric / 60, 2)) STORED,  -- Duração real em minutos, calculada pelos instantes completos (atravessa meia-noite e mudança de hora). Coluna gerada.
    duracao_suspeita_confirmada   boolean NOT NULL DEFAULT false,  -- Verdadeiro se o utilizador confirmou uma duração positiva mas abaixo do limiar de alerta (RF46).
    excecao_horario_motivo        varchar(300),  -- Motivo de uma exceção ao horário habitual (RF21).
    excecao_confirmada_por        integer,  -- Utilizador autorizado que confirmou a exceção.
    motivo_cancelamento           varchar(300),  -- Motivo, obrigatório ao cancelar.
    criada_por                    integer NOT NULL,  -- Utilizador que criou a visita.
    criada_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante de criação.
    CONSTRAINT pk_visita PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_visita_utente_id FOREIGN KEY (utente_id) REFERENCES utente (id),  -- utente_id → utente.id
    CONSTRAINT fk_visita_paragem_id FOREIGN KEY (paragem_id) REFERENCES paragem (id),  -- paragem_id → paragem.id
    CONSTRAINT fk_visita_equipa_executante_id FOREIGN KEY (equipa_executante_id) REFERENCES equipa (id),  -- equipa_executante_id → equipa.id
    CONSTRAINT fk_visita_excecao_confirmada_por FOREIGN KEY (excecao_confirmada_por) REFERENCES utilizador (id),  -- excecao_confirmada_por → utilizador.id
    CONSTRAINT fk_visita_criada_por FOREIGN KEY (criada_por) REFERENCES utilizador (id),  -- criada_por → utilizador.id
    CONSTRAINT ck_visita_intervalo_previsto CHECK (inicio_previsto IS NULL OR fim_previsto IS NULL OR fim_previsto > inicio_previsto),  -- O fim previsto é posterior ao início previsto.
    CONSTRAINT ck_visita_intervalo_real CHECK (inicio_real IS NULL OR fim_real IS NULL OR fim_real >= inicio_real),  -- Recusa durações negativas (RF29, RNF12).
    CONSTRAINT ck_visita_duracao_estimada CHECK (duracao_estimada_min IS NULL OR duracao_estimada_min > 0),  -- Duração estimada positiva.
    CONSTRAINT ck_visita_pendente_sem_recursos CHECK (estado <> 'PENDENTE' OR (paragem_id IS NULL AND equipa_executante_id IS NULL)),  -- Uma visita pendente ainda não tem paragem nem equipa (RF23).
    CONSTRAINT ck_visita_planeada_completa CHECK (estado IN ('PENDENTE','CANCELADA') OR (paragem_id IS NOT NULL AND equipa_executante_id IS NOT NULL AND inicio_previsto IS NOT NULL AND fim_previsto IS NOT NULL)),  -- Planear exige paragem, equipa e horas previstas (RF21, RF23).
    CONSTRAINT ck_visita_inicio_real CHECK (estado NOT IN ('EM_CURSO','CONCLUIDA') OR inicio_real IS NOT NULL),  -- Visita em curso ou concluída tem início real.
    CONSTRAINT ck_visita_concluida CHECK (estado <> 'CONCLUIDA' OR (fim_real IS NOT NULL AND fim_real > inicio_real)),  -- Concluir exige fim real estritamente posterior ao início (RF29).
    CONSTRAINT ck_visita_cancelada_motivo CHECK (estado <> 'CANCELADA' OR motivo_cancelamento IS NOT NULL),  -- Cancelar exige motivo (RF29).
    CONSTRAINT ck_visita_excecao CHECK ((excecao_horario_motivo IS NULL) = (excecao_confirmada_por IS NULL)),  -- Uma exceção de horário tem sempre motivo e confirmação (RF21).
    CONSTRAINT ex_visita_utente_sem_sobreposicao EXCLUDE USING gist (utente_id WITH =, tstzrange(inicio_previsto, fim_previsto) WITH &&) WHERE (estado IN ('PLANEADA','EM_CURSO') AND inicio_previsto IS NOT NULL AND fim_previsto IS NOT NULL)  -- Um utente não tem duas visitas ativas em horários sobrepostos (RF21).
);
CREATE INDEX ix_visita_utente ON visita (utente_id, estado);  -- Histórico e última visita por utente (RF30, RF31).
CREATE INDEX ix_visita_paragem ON visita (paragem_id);  -- Visitas de uma paragem/volta.
CREATE INDEX ix_visita_equipa_inicio ON visita (equipa_executante_id, inicio_previsto);  -- Agenda por equipa.
CREATE INDEX ix_visita_estado ON visita (estado);  -- Listagem de pendentes e planeadas (RF23).

-- Profissionais que efetivamente participaram numa visita. Alimenta a agenda por profissional e a deteção de conflitos. Cada participante tem de estar escalado na volta da visita.
-- Requisitos: RF21, RF24, RF29
CREATE TABLE visita_participante (
    visita_id                     integer,  -- Visita.
    profissional_id               integer,  -- Profissional participante.
    CONSTRAINT pk_visita_participante PRIMARY KEY (visita_id, profissional_id),  -- Chave primária.
    CONSTRAINT fk_visita_participante_visita_id FOREIGN KEY (visita_id) REFERENCES visita (id) ON DELETE CASCADE,  -- visita_id → visita.id (apaga em cascata)
    CONSTRAINT fk_visita_participante_profissional_id FOREIGN KEY (profissional_id) REFERENCES profissional (id)  -- profissional_id → profissional.id
);

-- Ocorrências e notas, ligadas a uma volta (ocorrências gerais) ou a uma visita, com visibilidade operacional ou clínica, autor e instante atribuídos pelo servidor. Imutável: correções são novas ocorrências que retificam a anterior.
-- Requisitos: RF29, RF44, RF45, RF47, RNF04, RNF22
CREATE TABLE ocorrencia (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    volta_id                      integer,  -- Volta, quando é uma ocorrência geral da volta.
    visita_id                     integer,  -- Visita, quando é uma nota ou ocorrência da visita.
    tipo_ocorrencia_id            integer NOT NULL,  -- Tipo de ocorrência.
    visibilidade                  visibilidade_ocorrencia NOT NULL,  -- Operacional ou clínica. Define quem pode consultar (RF45, RNF22).
    texto                         text NOT NULL,  -- Conteúdo da ocorrência.
    minutos_atraso                smallint,  -- Minutos de atraso, quando o tipo é atraso. Dispara a proposta de novas previsões (RF47).
    autor_id                      integer NOT NULL,  -- Autor autenticado, atribuído pelo servidor; o cliente não o pode forjar (RNF04).
    criada_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante do registo, atribuído pelo servidor.
    retifica_id                   integer,  -- Ocorrência que esta retifica ou completa (adenda), sem editar a original.
    CONSTRAINT pk_ocorrencia PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_ocorrencia_volta_id FOREIGN KEY (volta_id) REFERENCES volta (id),  -- volta_id → volta.id
    CONSTRAINT fk_ocorrencia_visita_id FOREIGN KEY (visita_id) REFERENCES visita (id),  -- visita_id → visita.id
    CONSTRAINT fk_ocorrencia_tipo_ocorrencia_id FOREIGN KEY (tipo_ocorrencia_id) REFERENCES tipo_ocorrencia (id),  -- tipo_ocorrencia_id → tipo_ocorrencia.id
    CONSTRAINT fk_ocorrencia_autor_id FOREIGN KEY (autor_id) REFERENCES utilizador (id),  -- autor_id → utilizador.id
    CONSTRAINT fk_ocorrencia_retifica_id FOREIGN KEY (retifica_id) REFERENCES ocorrencia (id),  -- retifica_id → ocorrencia.id
    CONSTRAINT ck_ocorrencia_alvo CHECK (num_nonnulls(volta_id, visita_id) = 1),  -- Pertence exatamente a uma volta ou a uma visita.
    CONSTRAINT ck_ocorrencia_atraso CHECK (minutos_atraso IS NULL OR minutos_atraso > 0),  -- Atraso positivo.
    CONSTRAINT ck_ocorrencia_nao_autoretifica CHECK (retifica_id IS NULL OR retifica_id <> id)  -- Uma ocorrência não se retifica a si própria.
);
CREATE INDEX ix_ocorrencia_volta ON ocorrencia (volta_id) WHERE volta_id IS NOT NULL;  -- Ocorrências gerais de uma volta.
CREATE INDEX ix_ocorrencia_visita ON ocorrencia (visita_id) WHERE visita_id IS NOT NULL;  -- Ocorrências de uma visita.

-- Trilho de auditoria só de acrescentar: quem fez o quê, quando, a que entidade e com que valores antes e depois. Cobre triagens, autorizações, alterações à ficha, horários, ocorrências e alterações às voltas (inclui o registo de alterações da volta que deixou de ter separador Histórico).
-- Requisitos: RF03, RF19, RF31, RF44, RF47, RNF04
CREATE TABLE auditoria (
    id                            bigint GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico do evento.
    entidade                      varchar(60) NOT NULL,  -- Nome da tabela/entidade afetada.
    entidade_id                   varchar(40) NOT NULL,  -- Identificador do registo afetado (texto, para suportar chaves compostas).
    operacao                      operacao_auditoria NOT NULL,  -- Operação: INSERT, UPDATE ou DELETE.
    utilizador_id                 integer,  -- Autor autenticado. Nulo para operações do sistema.
    instante                      timestamptz NOT NULL DEFAULT now(),  -- Instante da operação.
    valores_anteriores            jsonb,  -- Estado do registo antes da alteração.
    valores_novos                 jsonb,  -- Estado do registo depois da alteração.
    motivo                        varchar(300),  -- Motivo, quando exigido (ex.: exceção de horário, retificação).
    CONSTRAINT pk_auditoria PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_auditoria_utilizador_id FOREIGN KEY (utilizador_id) REFERENCES utilizador (id)  -- utilizador_id → utilizador.id
);
CREATE INDEX ix_auditoria_entidade ON auditoria (entidade, entidade_id, instante DESC);  -- Histórico de um registo.
CREATE INDEX ix_auditoria_utilizador ON auditoria (utilizador_id, instante DESC);  -- Ações de um utilizador.

-- Registo de cada exportação de dados para o algoritmo de otimização de rotas, com a versão do contrato e uma impressão digital do ficheiro. O conteúdo exportado não inclui identificadores diretos (RNF24).
-- Requisitos: RF26, RF27, RNF24
CREATE TABLE exportacao_algoritmo (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    versao_contrato               varchar(20) NOT NULL,  -- Versão do formato acordado com a docente de Matemática.
    intervalo_inicio              date NOT NULL,  -- Primeiro dia coberto pela exportação.
    intervalo_fim                 date NOT NULL,  -- Último dia coberto pela exportação.
    numero_paragens               integer NOT NULL,  -- Número de paragens exportadas.
    matriz_distancias_disponivel  boolean NOT NULL DEFAULT false,  -- Falso quando não havia matriz de distâncias; comunica-se a ausência, nunca se inventam valores (RF26).
    hash_sha256                   char(64) NOT NULL,  -- Impressão digital SHA-256 do ficheiro exportado.
    gerada_por                    integer NOT NULL,  -- Utilizador que gerou a exportação.
    gerada_em                     timestamptz NOT NULL DEFAULT now(),  -- Instante da exportação.
    CONSTRAINT pk_exportacao_algoritmo PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_exportacao_algoritmo_gerada_por FOREIGN KEY (gerada_por) REFERENCES utilizador (id),  -- gerada_por → utilizador.id
    CONSTRAINT ck_exportacao_intervalo CHECK (intervalo_fim >= intervalo_inicio),  -- O intervalo é válido.
    CONSTRAINT ck_exportacao_paragens CHECK (numero_paragens >= 0)  -- Número de paragens não negativo.
);

-- Mensagens internas entre membros da equipa. Modelo opcional: o RF36 é Could e a sua necessidade real está por confirmar (ponto em aberto 7).
-- Requisitos: RF36
CREATE TABLE mensagem (
    id                            integer GENERATED ALWAYS AS IDENTITY,  -- Identificador técnico (chave primária gerada pela base de dados).
    remetente_id                  integer NOT NULL,  -- Utilizador que envia.
    destinatario_id               integer NOT NULL,  -- Utilizador que recebe.
    assunto                       varchar(150),  -- Assunto.
    corpo                         text NOT NULL,  -- Texto da mensagem.
    enviada_em                    timestamptz NOT NULL DEFAULT now(),  -- Instante de envio.
    lida_em                       timestamptz,  -- Instante de leitura. Nulo = por ler.
    CONSTRAINT pk_mensagem PRIMARY KEY (id),  -- Chave primária.
    CONSTRAINT fk_mensagem_remetente_id FOREIGN KEY (remetente_id) REFERENCES utilizador (id),  -- remetente_id → utilizador.id
    CONSTRAINT fk_mensagem_destinatario_id FOREIGN KEY (destinatario_id) REFERENCES utilizador (id),  -- destinatario_id → utilizador.id
    CONSTRAINT ck_mensagem_destinatario CHECK (remetente_id <> destinatario_id)  -- Não se envia uma mensagem a si próprio.
);
CREATE INDEX ix_mensagem_destinatario ON mensagem (destinatario_id, enviada_em DESC);  -- Caixa de entrada.

-- ---------------------------------------------------------------------
-- 4. Comentários na própria base de dados (o dicionário de dados fica
--    consultável com \d+ <tabela> ou na ferramenta de administração)
-- ---------------------------------------------------------------------
COMMENT ON TABLE utilizador IS 'Conta de acesso à plataforma. Guarda a credencial e o perfil de acesso, que é independente da função clínica da pessoa (profissional).';
COMMENT ON COLUMN utilizador.id IS 'Identificador técnico do utilizador.';
COMMENT ON COLUMN utilizador.email IS 'Correio eletrónico usado para iniciar sessão. Único sem distinguir maiúsculas de minúsculas.';
COMMENT ON COLUMN utilizador.nome IS 'Nome apresentado na interface e nas autorias.';
COMMENT ON COLUMN utilizador.password_hash IS 'Hash criptográfico da palavra-passe (Argon2id ou bcrypt). Nunca a palavra-passe em claro (RNF02).';
COMMENT ON COLUMN utilizador.perfil IS 'Perfil de acesso: coordenador, profissional de saúde ou administrador.';
COMMENT ON COLUMN utilizador.vista_geral IS 'Se verdadeiro, o coordenador tem vista transversal a todas as equipas (RF49). Só é possível para o perfil COORDENADOR.';
COMMENT ON COLUMN utilizador.ativo IS 'Conta ativa. As contas não se apagam, desativam-se (preserva a autoria histórica).';
COMMENT ON COLUMN utilizador.tentativas_falhadas IS 'Inícios de sessão falhados consecutivos; base do limite de tentativas (RNF25).';
COMMENT ON COLUMN utilizador.bloqueado_ate IS 'Instante até ao qual a conta está bloqueada por excesso de tentativas.';
COMMENT ON COLUMN utilizador.ultimo_acesso_em IS 'Instante do último início de sessão bem-sucedido.';
COMMENT ON COLUMN utilizador.criado_em IS 'Instante de criação da conta.';
COMMENT ON TABLE concelho IS 'Concelhos do território de atuação. Tabela própria para permitir acrescentar concelhos sem alterar o sistema.';
COMMENT ON COLUMN concelho.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN concelho.nome IS 'Nome do concelho.';
COMMENT ON COLUMN concelho.distrito IS 'Distrito a que pertence (útil porque a unidade de Montemor pode estar fora do distrito de Beja; ponto em aberto 12).';
COMMENT ON TABLE nivel_urgencia IS 'Catálogo configurável de níveis de triagem/urgência. Determina a prioridade clínica e a cor no mapa. Independente da complexidade IPCPAL.';
COMMENT ON COLUMN nivel_urgencia.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN nivel_urgencia.codigo IS 'Código curto (hipótese de trabalho: A, B, C, NU).';
COMMENT ON COLUMN nivel_urgencia.designacao IS 'Designação por extenso (ex.: «Muito urgente»). Garante que a prioridade nunca depende só da cor (RNF08).';
COMMENT ON COLUMN nivel_urgencia.cor_hex IS 'Cor do marcador no mapa, formato #RRGGBB.';
COMMENT ON COLUMN nivel_urgencia.icone IS 'Nome de ícone opcional, complementar à designação (RNF08).';
COMMENT ON COLUMN nivel_urgencia.ordem IS 'Ordem clínica: 1 = mais urgente. Usada na ordenação das listas e das necessidades de visita (RF22).';
COMMENT ON COLUMN nivel_urgencia.prazo_max_sem_visita_dias IS 'Limite de dias sem visita para este nível, usado nos alertas (RF13). Nulo = por definir.';
COMMENT ON COLUMN nivel_urgencia.ativo IS 'Nível em uso. Níveis antigos desativam-se para preservar o histórico de triagens.';
COMMENT ON TABLE nivel_complexidade IS 'Catálogo da classificação de complexidade IPCPAL (altamente complexo, complexo, não complexo). Conceito distinto da urgência e do PPS.';
COMMENT ON COLUMN nivel_complexidade.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN nivel_complexidade.codigo IS 'Código estável (ex.: ALTAMENTE_COMPLEXO, COMPLEXO, NAO_COMPLEXO).';
COMMENT ON COLUMN nivel_complexidade.designacao IS 'Designação por extenso.';
COMMENT ON COLUMN nivel_complexidade.ordem IS 'Ordem de apresentação: 1 = mais complexo.';
COMMENT ON COLUMN nivel_complexidade.ativo IS 'Nível em uso.';
COMMENT ON TABLE funcao_profissional IS 'Catálogo das funções clínicas dos profissionais (médico, enfermeiro, …). Não confundir com o perfil de acesso.';
COMMENT ON COLUMN funcao_profissional.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN funcao_profissional.codigo IS 'Código estável da função (ex.: MEDICO, ENFERMEIRO).';
COMMENT ON COLUMN funcao_profissional.designacao IS 'Designação por extenso.';
COMMENT ON COLUMN funcao_profissional.ativo IS 'Função em uso.';
COMMENT ON TABLE tipo_ocorrencia IS 'Catálogo dos tipos de ocorrência (atraso, incidente, nota clínica, …), cada um com uma visibilidade por omissão.';
COMMENT ON COLUMN tipo_ocorrencia.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN tipo_ocorrencia.codigo IS 'Código estável (ex.: ATRASO, INCIDENTE, NOTA_CLINICA).';
COMMENT ON COLUMN tipo_ocorrencia.designacao IS 'Designação por extenso.';
COMMENT ON COLUMN tipo_ocorrencia.visibilidade_padrao IS 'Visibilidade sugerida para ocorrências deste tipo (operacional ou clínica).';
COMMENT ON COLUMN tipo_ocorrencia.ativo IS 'Tipo em uso. Os tipos reais estão por validar (ponto em aberto 19).';
COMMENT ON TABLE parametro_sistema IS 'Parâmetros de planeamento configuráveis, com histórico de quem os alterou e desde quando vigoram. O valor em vigor é o de maior valido_desde que não esteja no futuro.';
COMMENT ON COLUMN parametro_sistema.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN parametro_sistema.chave IS 'Nome do parâmetro (ex.: HORARIO_INICIO_VISITAS, HORARIO_FIM_VISITAS, DURACAO_MINIMA_SUSPEITA_MIN).';
COMMENT ON COLUMN parametro_sistema.valor IS 'Valor em texto; a interpretação depende de tipo_valor.';
COMMENT ON COLUMN parametro_sistema.tipo_valor IS 'Tipo do valor, para validação e conversão.';
COMMENT ON COLUMN parametro_sistema.descricao IS 'Descrição legível do parâmetro.';
COMMENT ON COLUMN parametro_sistema.valido_desde IS 'Instante a partir do qual este valor vigora.';
COMMENT ON COLUMN parametro_sistema.definido_por IS 'Utilizador que definiu o valor.';
COMMENT ON TABLE duracao_padrao_complexidade IS 'Duração padrão de uma visita por nível de complexidade, com histórico. Serve apenas para estimar o esforço; não altera a ordem clínica de urgência.';
COMMENT ON COLUMN duracao_padrao_complexidade.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN duracao_padrao_complexidade.nivel_complexidade_id IS 'Nível de complexidade a que se aplica.';
COMMENT ON COLUMN duracao_padrao_complexidade.minutos IS 'Duração padrão, em minutos.';
COMMENT ON COLUMN duracao_padrao_complexidade.valido_desde IS 'Instante a partir do qual este valor vigora.';
COMMENT ON COLUMN duracao_padrao_complexidade.definido_por IS 'Utilizador que definiu o valor.';
COMMENT ON TABLE viatura IS 'Viatura da unidade, com as características necessárias ao planeamento (lugares, depósito, autonomia, revisões).';
COMMENT ON COLUMN viatura.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN viatura.matricula IS 'Matrícula da viatura.';
COMMENT ON COLUMN viatura.designacao IS 'Nome ou descrição (ex.: marca e modelo).';
COMMENT ON COLUMN viatura.tipo_motorizacao IS 'Tipo de motorização/energia.';
COMMENT ON COLUMN viatura.lugares IS 'Lotação: número total de lugares, condutor incluído. Limita os profissionais escalados numa volta (RF50).';
COMMENT ON COLUMN viatura.capacidade_deposito IS 'Capacidade do depósito (ou bateria). Opcional.';
COMMENT ON COLUMN viatura.unidade_deposito IS 'Unidade da capacidade; obrigatória se a capacidade existir.';
COMMENT ON COLUMN viatura.autonomia IS 'Autonomia, quando aplicável.';
COMMENT ON COLUMN viatura.unidade_autonomia IS 'Unidade da autonomia; obrigatória se a autonomia existir.';
COMMENT ON COLUMN viatura.estado IS 'Estado administrativo atual. Não substitui o cálculo de disponibilidade num período.';
COMMENT ON COLUMN viatura.data_ultima_revisao IS 'Data da última revisão (data civil, sem hora).';
COMMENT ON COLUMN viatura.periodicidade_revisao_meses IS 'Periodicidade das revisões, em meses (valor por confirmar).';
COMMENT ON COLUMN viatura.criada_em IS 'Instante de criação do registo.';
COMMENT ON TABLE viatura_indisponibilidade IS 'Períodos em que uma viatura não pode ser usada (revisão, reparação, outro). É o que a ação «Agendar» da página Viaturas grava no calendário; não é uma visita.';
COMMENT ON COLUMN viatura_indisponibilidade.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN viatura_indisponibilidade.viatura_id IS 'Viatura afetada.';
COMMENT ON COLUMN viatura_indisponibilidade.tipo IS 'Motivo da indisponibilidade.';
COMMENT ON COLUMN viatura_indisponibilidade.inicio IS 'Início da indisponibilidade (instante).';
COMMENT ON COLUMN viatura_indisponibilidade.fim IS 'Fim da indisponibilidade (instante).';
COMMENT ON COLUMN viatura_indisponibilidade.descricao IS 'Descrição livre (ex.: oficina, tipo de reparação).';
COMMENT ON COLUMN viatura_indisponibilidade.criada_por IS 'Utilizador que registou a indisponibilidade.';
COMMENT ON COLUMN viatura_indisponibilidade.criada_em IS 'Instante do registo.';
COMMENT ON TABLE profissional IS 'Profissional de saúde com a sua função clínica. Pode ou não ter conta de utilizador; a mesma enfermeira pode ter o perfil de coordenador sem deixar de ser profissional.';
COMMENT ON COLUMN profissional.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN profissional.utilizador_id IS 'Conta de acesso associada, se existir (relação 1 para 0..1).';
COMMENT ON COLUMN profissional.nome IS 'Nome do profissional.';
COMMENT ON COLUMN profissional.funcao_id IS 'Função clínica (médico, enfermeiro, …).';
COMMENT ON COLUMN profissional.contacto_telefonico IS 'Contacto telefónico profissional.';
COMMENT ON COLUMN profissional.ativo IS 'Profissional ativo. Registos históricos mantêm-se ao desativar.';
COMMENT ON COLUMN profissional.criado_em IS 'Instante de criação do registo.';
COMMENT ON TABLE equipa IS 'Equipa com código próprio (A, B, C, …) e viatura habitual opcional. A composição varia no tempo (equipa_membro).';
COMMENT ON COLUMN equipa.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN equipa.codigo IS 'Código legível da equipa (A, B, C, …).';
COMMENT ON COLUMN equipa.designacao IS 'Designação opcional.';
COMMENT ON COLUMN equipa.viatura_habitual_id IS 'Viatura habitualmente associada. Pode diferir da usada numa volta concreta (RF52).';
COMMENT ON COLUMN equipa.ativa IS 'Equipa em atividade.';
COMMENT ON COLUMN equipa.criada_em IS 'Instante de criação do registo.';
COMMENT ON TABLE equipa_membro IS 'Composição de uma equipa ao longo do tempo: que profissional pertence a que equipa e em que período.';
COMMENT ON COLUMN equipa_membro.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN equipa_membro.equipa_id IS 'Equipa.';
COMMENT ON COLUMN equipa_membro.profissional_id IS 'Profissional.';
COMMENT ON COLUMN equipa_membro.valido_desde IS 'Início da pertença à equipa.';
COMMENT ON COLUMN equipa_membro.valido_ate IS 'Fim da pertença (exclusivo). Nulo = em vigor.';
COMMENT ON TABLE local IS 'Local onde o utente se encontra ou de onde as equipas partem (domicílio, lar, unidade, base). Entidade própria e partilhável: vários utentes do mesmo lar apontam para o mesmo local, com uma só morada e um só ponto no mapa. As coordenadas (WGS84) vivem aqui.';
COMMENT ON COLUMN local.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN local.tipo IS 'Domicílio, lar, unidade de cuidados continuados/paliativos ou base de partida.';
COMMENT ON COLUMN local.nome IS 'Nome da instituição. Obrigatório para lar, unidade e base.';
COMMENT ON COLUMN local.morada IS 'Morada.';
COMMENT ON COLUMN local.codigo_postal IS 'Código postal no formato 0000-000.';
COMMENT ON COLUMN local.localidade IS 'Localidade.';
COMMENT ON COLUMN local.concelho_id IS 'Concelho.';
COMMENT ON COLUMN local.contacto_telefonico IS 'Contacto telefónico do local.';
COMMENT ON COLUMN local.geom IS 'Ponto no mapa, WGS84/SRID 4326 (RNF27). Nulo até ser marcado ou geocodificado.';
COMMENT ON COLUMN local.origem_coordenadas IS 'Como o ponto foi obtido. Preenchido se e só se geom existir.';
COMMENT ON COLUMN local.coordenadas_confirmadas IS 'Verdadeiro quando um utilizador confirmou ou corrigiu o ponto (RF09: o resultado da geocodificação é sugestão).';
COMMENT ON COLUMN local.ativo IS 'Local em uso.';
COMMENT ON COLUMN local.criado_em IS 'Instante de criação do registo.';
COMMENT ON TABLE utente IS 'Utente (doente) acompanhado. Guarda apenas dados estáveis. A idade, as datas de referenciação/triagem/admissão, a prioridade atual, a complexidade atual, a equipa responsável atual e a última visita são derivadas (vista vw_utente_ficha) e não se duplicam aqui.';
COMMENT ON COLUMN utente.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN utente.numero_utente IS 'Número de utente. Desambigua nomes repetidos (RF01).';
COMMENT ON COLUMN utente.nome IS 'Nome completo.';
COMMENT ON COLUMN utente.genero IS 'Género.';
COMMENT ON COLUMN utente.data_nascimento IS 'Data de nascimento (data civil). A idade calcula-se, não se guarda.';
COMMENT ON COLUMN utente.local_id IS 'Local onde o utente se encontra. Exatamente um por utente (RF05).';
COMMENT ON COLUMN utente.contacto_telefonico IS 'Contacto telefónico do utente.';
COMMENT ON COLUMN utente.situacao_clinica IS 'Resumo da situação clínica. Campo clínico: acesso restrito (RNF22). Conteúdo mínimo por validar (ponto em aberto 3).';
COMMENT ON COLUMN utente.notas IS 'Notas gerais sobre o utente. Campo clínico: acesso restrito.';
COMMENT ON COLUMN utente.estado IS 'Estado atual do ciclo de vida. Cada mudança fica em utente_transicao_estado.';
COMMENT ON COLUMN utente.criado_em IS 'Instante de criação da ficha.';
COMMENT ON COLUMN utente.criado_por IS 'Utilizador que criou a ficha.';
COMMENT ON TABLE cuidador_principal IS 'Cuidador Principal: familiar ou outra pessoa que presta cuidados no domicílio. Entidade distinta da Equipa Responsável; alterar uma não altera nem elimina a outra.';
COMMENT ON COLUMN cuidador_principal.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN cuidador_principal.utente_id IS 'Utente a quem presta cuidados (no máximo um cuidador principal por utente).';
COMMENT ON COLUMN cuidador_principal.nome IS 'Nome do cuidador.';
COMMENT ON COLUMN cuidador_principal.parentesco IS 'Relação com o utente (filho, cônjuge, vizinho, …).';
COMMENT ON COLUMN cuidador_principal.contacto_telefonico IS 'Contacto telefónico do cuidador.';
COMMENT ON COLUMN cuidador_principal.criado_em IS 'Instante de criação do registo.';
COMMENT ON TABLE utente_transicao_estado IS 'Histórico do ciclo de vida do utente. As datas de referenciação e de admissão mostradas na ficha são lidas daqui (primeira transição para REFERENCIADO e para ATIVO), sem campos redundantes.';
COMMENT ON COLUMN utente_transicao_estado.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN utente_transicao_estado.utente_id IS 'Utente.';
COMMENT ON COLUMN utente_transicao_estado.estado_anterior IS 'Estado de origem. Nulo na primeira transição.';
COMMENT ON COLUMN utente_transicao_estado.estado_novo IS 'Estado de destino.';
COMMENT ON COLUMN utente_transicao_estado.data_transicao IS 'Data civil da transição (referenciação, admissão, inativação, readmissão).';
COMMENT ON COLUMN utente_transicao_estado.motivo IS 'Motivo da transição.';
COMMENT ON COLUMN utente_transicao_estado.registada_por IS 'Autor do registo (atribuído pela API).';
COMMENT ON COLUMN utente_transicao_estado.registada_em IS 'Instante do registo.';
COMMENT ON TABLE avaliacao_triagem IS 'Avaliações de triagem (urgência). Cada reavaliação é um registo novo e imutável; a prioridade atual é a mais recente não retificada. Uma reavaliação pode aumentar ou reduzir a urgência.';
COMMENT ON COLUMN avaliacao_triagem.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN avaliacao_triagem.utente_id IS 'Utente avaliado.';
COMMENT ON COLUMN avaliacao_triagem.nivel_urgencia_id IS 'Nível de urgência atribuído.';
COMMENT ON COLUMN avaliacao_triagem.motivo IS 'Motivo da avaliação ou da alteração (obrigatório, RF08).';
COMMENT ON COLUMN avaliacao_triagem.avaliada_em IS 'Instante da avaliação. A data de triagem mostrada na ficha é a da primeira avaliação.';
COMMENT ON COLUMN avaliacao_triagem.avaliada_por IS 'Autor autenticado, atribuído pela API (RNF04).';
COMMENT ON COLUMN avaliacao_triagem.retifica_id IS 'Se preenchido, esta avaliação corrige a indicada (retificação auditada, sem editar o original).';
COMMENT ON TABLE avaliacao_complexidade IS 'Avaliações de complexidade IPCPAL, separadas da triagem de urgência, com data e autor. O histórico consulta-se; a mais recente é a atual.';
COMMENT ON COLUMN avaliacao_complexidade.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN avaliacao_complexidade.utente_id IS 'Utente avaliado.';
COMMENT ON COLUMN avaliacao_complexidade.nivel_complexidade_id IS 'Nível de complexidade atribuído.';
COMMENT ON COLUMN avaliacao_complexidade.avaliada_em IS 'Instante da avaliação.';
COMMENT ON COLUMN avaliacao_complexidade.avaliada_por IS 'Autor autenticado, atribuído pela API.';
COMMENT ON COLUMN avaliacao_complexidade.observacao IS 'Observação opcional.';
COMMENT ON TABLE registo_pps IS 'Valores da Palliative Performance Scale (PPS), registados como valor independente da complexidade. Nenhuma regra converte PPS em IPCPAL sem validação clínica (RF14).';
COMMENT ON COLUMN registo_pps.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN registo_pps.utente_id IS 'Utente avaliado.';
COMMENT ON COLUMN registo_pps.valor IS 'Valor do PPS: 0 a 100, em múltiplos de 10.';
COMMENT ON COLUMN registo_pps.registado_em IS 'Instante do registo.';
COMMENT ON COLUMN registo_pps.registado_por IS 'Autor autenticado, atribuído pela API.';
COMMENT ON COLUMN registo_pps.observacao IS 'Observação opcional.';
COMMENT ON TABLE atribuicao_equipa_responsavel IS 'Equipa Responsável pelo acompanhamento do utente, com histórico de atribuições. É a equipa que acompanha o utente; não é necessariamente a equipa que executa uma visita (visita.equipa_executante_id). Substitui o antigo campo «Médico Assistente» no Dashboard.';
COMMENT ON COLUMN atribuicao_equipa_responsavel.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN atribuicao_equipa_responsavel.utente_id IS 'Utente.';
COMMENT ON COLUMN atribuicao_equipa_responsavel.equipa_id IS 'Equipa responsável.';
COMMENT ON COLUMN atribuicao_equipa_responsavel.valido_desde IS 'Início da atribuição.';
COMMENT ON COLUMN atribuicao_equipa_responsavel.valido_ate IS 'Fim da atribuição (exclusivo). Nulo = em vigor.';
COMMENT ON COLUMN atribuicao_equipa_responsavel.motivo IS 'Motivo da atribuição ou da mudança.';
COMMENT ON COLUMN atribuicao_equipa_responsavel.registada_por IS 'Autor do registo.';
COMMENT ON COLUMN atribuicao_equipa_responsavel.registada_em IS 'Instante do registo.';
COMMENT ON TABLE volta IS 'Agenda identificada de uma equipa num dia: viatura, partida e regresso previstos/reais, estado e sequência de paragens. Um rascunho pode estar incompleto e vazio; uma volta confirmada tem equipa, viatura, horas e pelo menos uma visita.';
COMMENT ON COLUMN volta.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN volta.data IS 'Dia do calendário (Europe/Lisbon). Existe mesmo nos rascunhos sem horas, para aparecerem no calendário (RF50).';
COMMENT ON COLUMN volta.designacao IS 'Identificação legível da volta (ex.: «Volta A — 03/11/2026»).';
COMMENT ON COLUMN volta.estado IS 'Estado da volta.';
COMMENT ON COLUMN volta.equipa_id IS 'Equipa que executa a volta. Obrigatória para confirmar.';
COMMENT ON COLUMN volta.viatura_id IS 'Viatura usada. Obrigatória para confirmar.';
COMMENT ON COLUMN volta.local_base_id IS 'Base de partida e regresso (tipo BASE, normalmente Beja).';
COMMENT ON COLUMN volta.partida_prevista IS 'Instante previsto de partida.';
COMMENT ON COLUMN volta.regresso_previsto IS 'Instante previsto de regresso.';
COMMENT ON COLUMN volta.partida_real IS 'Instante real de partida. Pode não existir (RF44).';
COMMENT ON COLUMN volta.regresso_real IS 'Instante real de regresso. Pode não existir.';
COMMENT ON COLUMN volta.distancia_estimada_km IS 'Distância estimada da volta, em km. Só preenchida quando calculada (RF17, RF32).';
COMMENT ON COLUMN volta.metodo_distancia IS 'Método da estimativa; obrigatório se houver distância estimada.';
COMMENT ON COLUMN volta.distancia_real_km IS 'Distância realmente medida, em km. Só com leitura de odómetro ou GPS (RF32).';
COMMENT ON COLUMN volta.fonte_distancia_real IS 'Origem da medição; obrigatória se houver distância real.';
COMMENT ON COLUMN volta.origem_plano IS 'Como foi ordenada a volta: manualmente, por referência simples ou por algoritmo.';
COMMENT ON COLUMN volta.motivo_cancelamento IS 'Motivo, obrigatório ao cancelar.';
COMMENT ON COLUMN volta.criada_por IS 'Utilizador que criou a volta.';
COMMENT ON COLUMN volta.criada_em IS 'Instante de criação.';
COMMENT ON COLUMN volta.confirmada_por IS 'Utilizador que confirmou a volta.';
COMMENT ON COLUMN volta.confirmada_em IS 'Instante da confirmação.';
COMMENT ON TABLE volta_profissional IS 'Profissionais efetivamente escalados numa volta (por omissão, a composição da equipa nesse dia, ajustável). Serve o limite de lugares da viatura e a agenda por profissional.';
COMMENT ON COLUMN volta_profissional.volta_id IS 'Volta.';
COMMENT ON COLUMN volta_profissional.profissional_id IS 'Profissional escalado.';
COMMENT ON TABLE paragem IS 'Paragem de uma volta: um local visitado numa determinada ordem. Várias visitas de utentes do mesmo lar partilham uma só paragem, sem que isso signifique que uma pessoa as faça em simultâneo.';
COMMENT ON COLUMN paragem.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN paragem.volta_id IS 'Volta a que pertence.';
COMMENT ON COLUMN paragem.ordem IS 'Posição na sequência da volta (1, 2, 3, …). Definida manualmente (RF50).';
COMMENT ON COLUMN paragem.local_id IS 'Local visitado.';
COMMENT ON COLUMN paragem.distancia_desde_anterior_km IS 'Distância desde a paragem anterior (ou desde a base), quando calculada.';
COMMENT ON TABLE visita IS 'Visita a um utente. Nasce como pendente (sem equipa, viatura nem hora), passa a planeada ao ser atribuída a uma paragem e termina concluída ou cancelada. Guarda horários previstos e reais como instantes.';
COMMENT ON COLUMN visita.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN visita.utente_id IS 'Utente visitado.';
COMMENT ON COLUMN visita.paragem_id IS 'Paragem da volta em que a visita se realiza. Nula enquanto pendente.';
COMMENT ON COLUMN visita.equipa_executante_id IS 'Equipa que executa a visita (distinta da equipa responsável pelo utente). Nula enquanto pendente.';
COMMENT ON COLUMN visita.estado IS 'Estado da visita.';
COMMENT ON COLUMN visita.inicio_previsto IS 'Início previsto.';
COMMENT ON COLUMN visita.fim_previsto IS 'Fim previsto.';
COMMENT ON COLUMN visita.duracao_estimada_min IS 'Duração estimada em minutos (por omissão, a duração padrão da complexidade).';
COMMENT ON COLUMN visita.inicio_real IS 'Início real. Não é obrigatório antes da conclusão.';
COMMENT ON COLUMN visita.fim_real IS 'Fim real. Obrigatório ao concluir.';
COMMENT ON COLUMN visita.duracao_real_min IS 'Duração real em minutos, calculada pelos instantes completos (atravessa meia-noite e mudança de hora). Coluna gerada.';
COMMENT ON COLUMN visita.duracao_suspeita_confirmada IS 'Verdadeiro se o utilizador confirmou uma duração positiva mas abaixo do limiar de alerta (RF46).';
COMMENT ON COLUMN visita.excecao_horario_motivo IS 'Motivo de uma exceção ao horário habitual (RF21).';
COMMENT ON COLUMN visita.excecao_confirmada_por IS 'Utilizador autorizado que confirmou a exceção.';
COMMENT ON COLUMN visita.motivo_cancelamento IS 'Motivo, obrigatório ao cancelar.';
COMMENT ON COLUMN visita.criada_por IS 'Utilizador que criou a visita.';
COMMENT ON COLUMN visita.criada_em IS 'Instante de criação.';
COMMENT ON TABLE visita_participante IS 'Profissionais que efetivamente participaram numa visita. Alimenta a agenda por profissional e a deteção de conflitos. Cada participante tem de estar escalado na volta da visita.';
COMMENT ON COLUMN visita_participante.visita_id IS 'Visita.';
COMMENT ON COLUMN visita_participante.profissional_id IS 'Profissional participante.';
COMMENT ON TABLE ocorrencia IS 'Ocorrências e notas, ligadas a uma volta (ocorrências gerais) ou a uma visita, com visibilidade operacional ou clínica, autor e instante atribuídos pelo servidor. Imutável: correções são novas ocorrências que retificam a anterior.';
COMMENT ON COLUMN ocorrencia.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN ocorrencia.volta_id IS 'Volta, quando é uma ocorrência geral da volta.';
COMMENT ON COLUMN ocorrencia.visita_id IS 'Visita, quando é uma nota ou ocorrência da visita.';
COMMENT ON COLUMN ocorrencia.tipo_ocorrencia_id IS 'Tipo de ocorrência.';
COMMENT ON COLUMN ocorrencia.visibilidade IS 'Operacional ou clínica. Define quem pode consultar (RF45, RNF22).';
COMMENT ON COLUMN ocorrencia.texto IS 'Conteúdo da ocorrência.';
COMMENT ON COLUMN ocorrencia.minutos_atraso IS 'Minutos de atraso, quando o tipo é atraso. Dispara a proposta de novas previsões (RF47).';
COMMENT ON COLUMN ocorrencia.autor_id IS 'Autor autenticado, atribuído pelo servidor; o cliente não o pode forjar (RNF04).';
COMMENT ON COLUMN ocorrencia.criada_em IS 'Instante do registo, atribuído pelo servidor.';
COMMENT ON COLUMN ocorrencia.retifica_id IS 'Ocorrência que esta retifica ou completa (adenda), sem editar a original.';
COMMENT ON TABLE auditoria IS 'Trilho de auditoria só de acrescentar: quem fez o quê, quando, a que entidade e com que valores antes e depois. Cobre triagens, autorizações, alterações à ficha, horários, ocorrências e alterações às voltas (inclui o registo de alterações da volta que deixou de ter separador Histórico).';
COMMENT ON COLUMN auditoria.id IS 'Identificador técnico do evento.';
COMMENT ON COLUMN auditoria.entidade IS 'Nome da tabela/entidade afetada.';
COMMENT ON COLUMN auditoria.entidade_id IS 'Identificador do registo afetado (texto, para suportar chaves compostas).';
COMMENT ON COLUMN auditoria.operacao IS 'Operação: INSERT, UPDATE ou DELETE.';
COMMENT ON COLUMN auditoria.utilizador_id IS 'Autor autenticado. Nulo para operações do sistema.';
COMMENT ON COLUMN auditoria.instante IS 'Instante da operação.';
COMMENT ON COLUMN auditoria.valores_anteriores IS 'Estado do registo antes da alteração.';
COMMENT ON COLUMN auditoria.valores_novos IS 'Estado do registo depois da alteração.';
COMMENT ON COLUMN auditoria.motivo IS 'Motivo, quando exigido (ex.: exceção de horário, retificação).';
COMMENT ON TABLE exportacao_algoritmo IS 'Registo de cada exportação de dados para o algoritmo de otimização de rotas, com a versão do contrato e uma impressão digital do ficheiro. O conteúdo exportado não inclui identificadores diretos (RNF24).';
COMMENT ON COLUMN exportacao_algoritmo.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN exportacao_algoritmo.versao_contrato IS 'Versão do formato acordado com a docente de Matemática.';
COMMENT ON COLUMN exportacao_algoritmo.intervalo_inicio IS 'Primeiro dia coberto pela exportação.';
COMMENT ON COLUMN exportacao_algoritmo.intervalo_fim IS 'Último dia coberto pela exportação.';
COMMENT ON COLUMN exportacao_algoritmo.numero_paragens IS 'Número de paragens exportadas.';
COMMENT ON COLUMN exportacao_algoritmo.matriz_distancias_disponivel IS 'Falso quando não havia matriz de distâncias; comunica-se a ausência, nunca se inventam valores (RF26).';
COMMENT ON COLUMN exportacao_algoritmo.hash_sha256 IS 'Impressão digital SHA-256 do ficheiro exportado.';
COMMENT ON COLUMN exportacao_algoritmo.gerada_por IS 'Utilizador que gerou a exportação.';
COMMENT ON COLUMN exportacao_algoritmo.gerada_em IS 'Instante da exportação.';
COMMENT ON TABLE mensagem IS 'Mensagens internas entre membros da equipa. Modelo opcional: o RF36 é Could e a sua necessidade real está por confirmar (ponto em aberto 7).';
COMMENT ON COLUMN mensagem.id IS 'Identificador técnico (chave primária gerada pela base de dados).';
COMMENT ON COLUMN mensagem.remetente_id IS 'Utilizador que envia.';
COMMENT ON COLUMN mensagem.destinatario_id IS 'Utilizador que recebe.';
COMMENT ON COLUMN mensagem.assunto IS 'Assunto.';
COMMENT ON COLUMN mensagem.corpo IS 'Texto da mensagem.';
COMMENT ON COLUMN mensagem.enviada_em IS 'Instante de envio.';
COMMENT ON COLUMN mensagem.lida_em IS 'Instante de leitura. Nulo = por ler.';

-- ---------------------------------------------------------------------
-- 5. Funções e gatilhos (regras que um CHECK não consegue exprimir)
-- ---------------------------------------------------------------------
-- ---------------------------------------------------------------------
-- 5.1  Tabelas imutáveis (só admitem INSERT)
--      Triagens, complexidade, PPS, transições de estado, ocorrências e
--      auditoria são factos históricos: não se editam nem se apagam.
--      Correções fazem-se com um novo registo (retifica_id) — RF10, RF45, RNF04.
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_bloquear_alteracao() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    -- TG_TABLE_NAME é o nome da tabela onde o gatilho disparou.
    RAISE EXCEPTION 'A tabela % é imutável: só admite inserções. Use uma retificação ou um novo registo.', TG_TABLE_NAME
        USING ERRCODE = 'restrict_violation';
END;
$$;

CREATE TRIGGER trg_auditoria_imutavel
    BEFORE UPDATE OR DELETE ON auditoria
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao();

CREATE TRIGGER trg_avaliacao_triagem_imutavel
    BEFORE UPDATE OR DELETE ON avaliacao_triagem
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao();

CREATE TRIGGER trg_avaliacao_complexidade_imutavel
    BEFORE UPDATE OR DELETE ON avaliacao_complexidade
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao();

CREATE TRIGGER trg_registo_pps_imutavel
    BEFORE UPDATE OR DELETE ON registo_pps
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao();

CREATE TRIGGER trg_utente_transicao_estado_imutavel
    BEFORE UPDATE OR DELETE ON utente_transicao_estado
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao();

CREATE TRIGGER trg_ocorrencia_imutavel
    BEFORE UPDATE OR DELETE ON ocorrencia
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_alteracao();

-- ---------------------------------------------------------------------
-- 5.2  Confirmação de uma volta (RF20, RF43, RF50)
--      Regras que envolvem várias tabelas e por isso não cabem num CHECK.
--      O gatilho é DEFERRED: valida-se no COMMIT, o que permite criar a
--      volta, as paragens, as visitas e os profissionais escalados na
--      mesma transação, por qualquer ordem.
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_volta_validar_confirmacao() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_visitas   integer;   -- visitas não canceladas da volta
    v_lugares   smallint;  -- lotação da viatura
    v_escalados integer;   -- profissionais escalados na volta
BEGIN
    -- (a) Uma volta confirmada tem pelo menos uma visita (não uma mínima de duas: RF43).
    SELECT count(*) INTO v_visitas
      FROM visita vi
      JOIN paragem pa ON pa.id = vi.paragem_id
     WHERE pa.volta_id = NEW.id
       AND vi.estado <> 'CANCELADA';
    IF v_visitas < 1 THEN
        RAISE EXCEPTION 'A volta % não pode ser confirmada sem pelo menos uma visita.', NEW.id
            USING ERRCODE = 'check_violation';
    END IF;

    -- (b) Lugares suficientes para os profissionais escalados (RF50).
    SELECT lugares INTO v_lugares FROM viatura WHERE id = NEW.viatura_id;
    SELECT count(*) INTO v_escalados FROM volta_profissional WHERE volta_id = NEW.id;
    IF v_escalados > v_lugares THEN
        RAISE EXCEPTION 'A viatura % tem % lugares mas a volta % escala % profissionais.',
            NEW.viatura_id, v_lugares, NEW.id, v_escalados
            USING ERRCODE = 'check_violation';
    END IF;

    -- (c) A viatura não pode estar indisponível durante a volta (RF20, RF48).
    IF NEW.estado IN ('CONFIRMADA', 'EM_CURSO') AND EXISTS (
        SELECT 1
          FROM viatura_indisponibilidade i
         WHERE i.viatura_id = NEW.viatura_id
           AND tstzrange(i.inicio, i.fim) && tstzrange(NEW.partida_prevista, NEW.regresso_previsto)
    ) THEN
        RAISE EXCEPTION 'A viatura % está indisponível no intervalo previsto da volta %.', NEW.viatura_id, NEW.id
            USING ERRCODE = 'exclusion_violation';
    END IF;

    RETURN NULL;  -- gatilho AFTER: o valor de retorno é ignorado
END;
$$;

CREATE CONSTRAINT TRIGGER trg_volta_validar_confirmacao
    AFTER INSERT OR UPDATE ON volta
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    WHEN (NEW.estado IN ('CONFIRMADA', 'EM_CURSO', 'CONCLUIDA'))
    EXECUTE FUNCTION fn_volta_validar_confirmacao();

-- ---------------------------------------------------------------------
-- 5.3  Conflitos de profissional (RF21)
--      Um profissional não executa duas visitas clínicas em simultâneo.
--      Duas visitas no mesmo lar podem partilhar a paragem, desde que
--      tenham participantes diferentes.
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_verifica_conflito_profissional(p_visita integer, p_profissional integer) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v visita%ROWTYPE;
BEGIN
    SELECT * INTO v FROM visita WHERE id = p_visita;

    -- Só se compara o que tem horário previsto e está ativo.
    IF v.estado NOT IN ('PLANEADA', 'EM_CURSO') OR v.inicio_previsto IS NULL OR v.fim_previsto IS NULL THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM visita_participante vp
          JOIN visita o ON o.id = vp.visita_id
         WHERE vp.profissional_id = p_profissional
           AND o.id <> p_visita
           AND o.estado IN ('PLANEADA', 'EM_CURSO')
           AND o.inicio_previsto IS NOT NULL
           AND o.fim_previsto IS NOT NULL
           AND tstzrange(o.inicio_previsto, o.fim_previsto) && tstzrange(v.inicio_previsto, v.fim_previsto)
    ) THEN
        RAISE EXCEPTION 'O profissional % já tem outra visita no intervalo da visita %.', p_profissional, p_visita
            USING ERRCODE = 'exclusion_violation';
    END IF;
END;
$$;

-- Ao inserir um participante: tem de estar escalado na volta da visita e sem conflitos.
CREATE FUNCTION fn_participante_validar() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_volta integer;
BEGIN
    SELECT pa.volta_id INTO v_volta
      FROM visita vi
      JOIN paragem pa ON pa.id = vi.paragem_id
     WHERE vi.id = NEW.visita_id;

    IF v_volta IS NULL THEN
        RAISE EXCEPTION 'A visita % não está associada a uma volta; não pode ter participantes.', NEW.visita_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM volta_profissional vp
         WHERE vp.volta_id = v_volta AND vp.profissional_id = NEW.profissional_id
    ) THEN
        RAISE EXCEPTION 'O profissional % não está escalado na volta % da visita %.', NEW.profissional_id, v_volta, NEW.visita_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    PERFORM fn_verifica_conflito_profissional(NEW.visita_id, NEW.profissional_id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_visita_participante_validar
    BEFORE INSERT OR UPDATE ON visita_participante
    FOR EACH ROW EXECUTE FUNCTION fn_participante_validar();

-- Ao reagendar uma visita, revalidam-se os participantes já registados.
CREATE FUNCTION fn_visita_revalidar_participantes() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT profissional_id FROM visita_participante WHERE visita_id = NEW.id LOOP
        PERFORM fn_verifica_conflito_profissional(NEW.id, r.profissional_id);
    END LOOP;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_visita_revalidar_participantes
    AFTER UPDATE OF inicio_previsto, fim_previsto, estado ON visita
    FOR EACH ROW EXECUTE FUNCTION fn_visita_revalidar_participantes();

-- ---------------------------------------------------------------------
-- 6. Vistas (dados derivados que não se duplicam nas tabelas)
-- ---------------------------------------------------------------------
-- ---------------------------------------------------------------------
-- 6.1  Ficha do utente (RF02, RF08, RF30, RF33)
--      Junta os dados guardados com os derivados: idade, datas de
--      referenciação/triagem/admissão, prioridade atual (triagem mais
--      recente não retificada), complexidade e PPS atuais, equipa
--      responsável em vigor e última visita concluída.
--      Os campos clínicos de texto (situacao_clinica, notas) ficam de fora:
--      leem-se da tabela utente com verificação de permissão (RNF22).
-- ---------------------------------------------------------------------
CREATE VIEW vw_utente_ficha AS
SELECT
    u.id                                   AS utente_id,
    u.numero_utente,
    u.nome,
    u.genero,
    u.data_nascimento,
    date_part('year', age(CURRENT_DATE, u.data_nascimento))::integer AS idade,
    u.contacto_telefonico,
    u.estado,
    l.id                                   AS local_id,
    l.tipo                                 AS local_tipo,
    l.nome                                 AS local_nome,
    l.morada,
    l.codigo_postal,
    l.localidade,
    co.nome                                AS concelho,
    l.geom,
    cp.nome                                AS cuidador_principal_nome,
    cp.parentesco                          AS cuidador_principal_parentesco,
    cp.contacto_telefonico                 AS cuidador_principal_contacto,
    eq.id                                  AS equipa_responsavel_id,
    eq.codigo                              AS equipa_responsavel_codigo,
    (SELECT min(t.data_transicao) FROM utente_transicao_estado t
      WHERE t.utente_id = u.id AND t.estado_novo = 'REFERENCIADO') AS data_referenciacao,
    (SELECT min(t.data_transicao) FROM utente_transicao_estado t
      WHERE t.utente_id = u.id AND t.estado_novo = 'ATIVO')        AS data_admissao,
    (SELECT (min(a.avaliada_em) AT TIME ZONE 'Europe/Lisbon')::date
       FROM avaliacao_triagem a WHERE a.utente_id = u.id)          AS data_triagem,
    tr.nivel_urgencia_id,
    nu.codigo                              AS urgencia_codigo,
    nu.designacao                          AS urgencia_designacao,
    nu.cor_hex                             AS urgencia_cor,
    nu.ordem                               AS urgencia_ordem,
    tr.avaliada_em                         AS triagem_em,
    cx.nivel_complexidade_id,
    nc.codigo                              AS complexidade_codigo,
    nc.designacao                          AS complexidade_designacao,
    pps.valor                              AS pps_atual,
    uv.ultima_visita                       -- NULL = «sem visitas» (RF30)
FROM utente u
JOIN local   l  ON l.id  = u.local_id
JOIN concelho co ON co.id = l.concelho_id
LEFT JOIN cuidador_principal cp ON cp.utente_id = u.id
-- Triagem atual: a mais recente que não foi retificada por outra.
LEFT JOIN LATERAL (
    SELECT a.*
      FROM avaliacao_triagem a
     WHERE a.utente_id = u.id
       AND NOT EXISTS (SELECT 1 FROM avaliacao_triagem r WHERE r.retifica_id = a.id)
     ORDER BY a.avaliada_em DESC, a.id DESC
     LIMIT 1
) tr ON true
LEFT JOIN nivel_urgencia nu ON nu.id = tr.nivel_urgencia_id
LEFT JOIN LATERAL (
    SELECT x.* FROM avaliacao_complexidade x
     WHERE x.utente_id = u.id
     ORDER BY x.avaliada_em DESC, x.id DESC LIMIT 1
) cx ON true
LEFT JOIN nivel_complexidade nc ON nc.id = cx.nivel_complexidade_id
LEFT JOIN LATERAL (
    SELECT p.valor FROM registo_pps p
     WHERE p.utente_id = u.id
     ORDER BY p.registado_em DESC, p.id DESC LIMIT 1
) pps ON true
-- Equipa responsável em vigor neste instante.
LEFT JOIN LATERAL (
    SELECT ae.equipa_id FROM atribuicao_equipa_responsavel ae
     WHERE ae.utente_id = u.id
       AND ae.valido_desde <= now()
       AND (ae.valido_ate IS NULL OR ae.valido_ate > now())
     LIMIT 1
) ar ON true
LEFT JOIN equipa eq ON eq.id = ar.equipa_id
LEFT JOIN LATERAL (
    SELECT max(v.fim_real) AS ultima_visita
      FROM visita v
     WHERE v.utente_id = u.id AND v.estado = 'CONCLUIDA'
) uv ON true;

-- ---------------------------------------------------------------------
-- 6.2  Calendário na perspetiva «Unidade» (RF19, RF48)
--      Voltas e indisponibilidades de viaturas no mesmo calendário.
-- ---------------------------------------------------------------------
CREATE VIEW vw_calendario_unidade AS
SELECT 'VOLTA'::text                AS tipo_evento,
       v.id                         AS referencia_id,
       v.data                       AS dia,
       v.partida_prevista           AS inicio,
       v.regresso_previsto          AS fim,
       v.estado::text               AS estado,
       v.equipa_id,
       v.viatura_id,
       v.designacao                 AS titulo
  FROM volta v
UNION ALL
SELECT 'INDISPONIBILIDADE_VIATURA',
       i.id,
       (i.inicio AT TIME ZONE 'Europe/Lisbon')::date,
       i.inicio,
       i.fim,
       i.tipo::text,
       NULL::integer,
       i.viatura_id,
       i.descricao
  FROM viatura_indisponibilidade i;

-- ---------------------------------------------------------------------
-- 6.3  Calendário na perspetiva «Utente» e «Profissional» (RF19)
--      Uma linha por visita, com a volta e os participantes efetivos.
--      A perspetiva Profissional filtra pela coluna profissionais.
-- ---------------------------------------------------------------------
CREATE VIEW vw_calendario_visitas AS
SELECT vi.id                       AS visita_id,
       vi.utente_id,
       vi.estado,
       vi.inicio_previsto,
       vi.fim_previsto,
       vi.inicio_real,
       vi.fim_real,
       pa.volta_id,
       vi.equipa_executante_id,
       COALESCE(array_agg(vp.profissional_id) FILTER (WHERE vp.profissional_id IS NOT NULL), '{}') AS profissionais
  FROM visita vi
  LEFT JOIN paragem pa ON pa.id = vi.paragem_id
  LEFT JOIN visita_participante vp ON vp.visita_id = vi.id
 GROUP BY vi.id, pa.volta_id;

-- ---------------------------------------------------------------------
-- 7. Dados de referência provisórios
-- ---------------------------------------------------------------------
-- Dados de referência PROVISÓRIOS. Os níveis A/B/C/Não urgente vêm do Anexo A
-- (hipótese de trabalho) e o mockup mostra cinco níveis: tudo isto está por
-- validar com a ULSBA (RF11, ponto em aberto 1). Como é um catálogo, ajusta-se
-- com UPDATE/INSERT, sem alterar código.
INSERT INTO nivel_urgencia (codigo, designacao, cor_hex, ordem) VALUES
    ('A',  'Muito urgente', '#C62828', 1),
    ('B',  'Urgente',       '#EF6C00', 2),
    ('C',  'Pouco urgente', '#F9A825', 3),
    ('NU', 'Não urgente',   '#2E7D32', 4);

INSERT INTO nivel_complexidade (codigo, designacao, ordem) VALUES
    ('ALTAMENTE_COMPLEXO', 'Altamente complexo', 1),
    ('COMPLEXO',           'Complexo',           2),
    ('NAO_COMPLEXO',       'Não complexo',       3);

INSERT INTO funcao_profissional (codigo, designacao) VALUES
    ('MEDICO',     'Médico'),
    ('ENFERMEIRO', 'Enfermeiro');

INSERT INTO tipo_ocorrencia (codigo, designacao, visibilidade_padrao) VALUES
    ('ATRASO',      'Atraso',                'OPERACIONAL'),
    ('INCIDENTE',   'Incidente operacional', 'OPERACIONAL'),
    ('AVISO',       'Aviso operacional',     'OPERACIONAL'),
    ('NOTA_CLINICA','Nota clínica',          'CLINICA');

COMMIT;
