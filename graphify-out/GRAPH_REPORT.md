# Graph Report - ulsba-projeto-final  (2026-11-22)

## Corpus Check
- 117 files · ~108,762 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 8, .example 2, .css 1)

## Summary
- 955 nodes · 2198 edges · 61 communities (36 shown, 25 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.88)
- Token cost: 413,068 input · 0 output

## Community Hubs (Navigation)
- Dashboard UI Components
- DB Migration Runner
- Route Planning UI
- Map Route Visualization
- Volta Schedule Calculation
- Docker Compose Config
- Data Model Entities & Decisions
- Auth & Health Endpoints
- Security & Seed Data
- Frontend App Routing
- Backend Tech Stack Decisions
- Requirements & Objectives
- GitHub CI Workflow
- Voltas Router Endpoints
- Novo Utente Registration UI
- Backend Pydantic Schemas
- Frontend TS Config (App)
- Utentes Router Endpoints
- Viaturas Router Endpoints
- Core Priority Requirements
- Frontend TS Config (Node)
- Equipas Router Endpoints
- Frontend Runtime Dependencies
- Volta & Ocorrencia Requirements
- ESLint Configuration
- Locais Router Endpoints
- Frontend Dev Dependencies
- Database Migration Files
- Debug Scripts (Ativar Utente)
- Reports Requirements (Backlog)
- Equipa Responsavel Planning
- Frontend Package Metadata
- Map Filtering Requirements
- Vite Build Config
- NPM Scripts
- Social/Brand Icon Set
- TS Project References
- Environment Variables
- Current User Session State
- Vercel Rewrites Config
- Docker DB Migration Startup
- Uvicorn Dependency
- Conventional Commits Rule
- PostGIS Init Script
- PostGIS Verification Test
- Login Request Flow
- Three-Layer Architecture
- Login Endpoint
- Health Check Endpoint
- Utilizadores Group (Not Implemented)
- Data Model Spec Document
- Requirement Origin Codes
- App Favicon Icon
- Import Alias Config
- Frontend Folder Structure
- Component Naming Conventions
- Monorepo Structure
- Project Team

## God Nodes (most connected - your core abstractions)
1. `MoSCoW Prioritization Convention` - 79 edges
2. `react` - 31 edges
3. `apiFetch()` - 30 edges
4. `Utente` - 23 edges
5. `compilerOptions` - 19 edges
6. `Utilizador` - 19 edges
7. `App()` - 18 edges
8. `ViaturasPage()` - 18 edges
9. `VoltaDetalhePage()` - 18 edges
10. `RF50: Painel de construcao da volta a partir de dia vazio do calendario` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Fictitious Data Only Rule` --semantically_similar_to--> `RNF01: So dados ficticios no desenvolvimento e nos testes`  [INFERRED] [semantically similar]
  CONTRIBUTING.md → docs/requisitos.md
- `Baseline Registration Mechanism` --semantically_similar_to--> `RNF28: Esquema da base de dados versionado com migracoes`  [INFERRED] [semantically similar]
  db/README.md → docs/requisitos.md
- `Tailwind CSS Removed (never worked, app uses Bootstrap)` --semantically_similar_to--> `Decision: React + TypeScript + Vite + Leaflet`  [INFERRED] [semantically similar]
  frontend/README.md → docs/arquitetura.md
- `0004_ajuste_niveis_urgencia.sql` --conceptually_related_to--> `RF11: Gerir catalogo configuravel de niveis de urgencia`  [INFERRED]
  db/README.md → docs/requisitos.md
- `0005_expor_situacao_clinica_notas.sql` --conceptually_related_to--> `RF02: Consultar ficha do utente (identificacao, cuidador, equipa responsavel)`  [INFERRED]
  db/README.md → docs/requisitos.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Três percursos de avaliação clínica independentes (urgência, IPCPAL, PPS)** — docs_modelo_dados_avaliacao_triagem, docs_modelo_dados_avaliacao_complexidade, docs_modelo_dados_registo_pps [EXTRACTED 1.00]
- **Hierarquia de planeamento Volta → Paragem → Visita** — docs_modelo_dados_volta, docs_modelo_dados_paragem, docs_modelo_dados_visita [EXTRACTED 1.00]
- **Relações distintas de equipa: pertença, escala, tripulação e participação** — docs_modelo_dados_equipa_membro, docs_modelo_dados_escala_profissional, docs_modelo_dados_volta_profissional, docs_modelo_dados_visita_participante [EXTRACTED 1.00]
- **User Profile Authorization Model (Coordenador/Profissional/Administrador)** — docs_requisitos_perfil_coordenador, docs_requisitos_perfil_profissional_saude, docs_requisitos_perfil_administrador, docs_endpoints_authorization_gap, docs_arquitetura_security [INFERRED 0.85]
- **Sequential SQL Migration Versioning System** — db_readme_migrate_runner, db_readme_schema_migrations_table, db_readme_checksum_rule, db_readme_baseline_mechanism, docs_requisitos_rnf28 [EXTRACTED 0.90]
- **Volta Construction Workflow (RF50 panel dependencies)** — docs_requisitos_rf50, docs_requisitos_rf20, docs_requisitos_rf21, docs_requisitos_rf24, docs_requisitos_rf48 [EXTRACTED 0.90]

## Communities (61 total, 25 thin omitted)

### Community 0 - "Dashboard UI Components"
Cohesion: 0.07
Nodes (68): BarraAcoesDashboard(), EcraCarregamento(), Props, EditarUtenteModal(), Props, TIPOS_LOCAL, DetailItem(), FichaUtenteCard() (+60 more)

### Community 1 - "DB Migration Runner"
Cohesion: 0.05
Nodes (24): column_exists(), configure_connection(), create_history_table(), detect_existing_version(), expected_tables(), function_exists(), HistoryEntry, insert_history() (+16 more)

### Community 2 - "Route Planning UI"
Cohesion: 0.08
Nodes (59): date-fns@^4.4.0, ModalConfirmacao(), Props, AjustarVistaPrevia(), BASE_BEJA, calcularDistanciaKm(), diasSemVisita(), obterCoordenadas() (+51 more)

### Community 3 - "Map Route Visualization"
Cohesion: 0.06
Nodes (59): AjustarTamanhoMapa(), corDaParagem(), criarIconeNumerado(), MapaPercursoVolta(), Props, COR_ESTADO_VISITA, LABEL_ESTADO_VISITA, COR_ESTADO_VOLTA (+51 more)

### Community 4 - "Volta Schedule Calculation"
Cohesion: 0.10
Nodes (25): ajustar_por_atraso_saida(), ajustar_por_atraso_visita(), avaliar_regresso_beja(), calcular_resumo_volta(), construir_limite_beja(), formatar_minutos_como_duracao(), _garantir_tz(), _minutos_entre() (+17 more)

### Community 5 - "Docker Compose Config"
Cohesion: 0.05
Nodes (44): build, command, depends_on, environment, ports, volumes, condition, environment (+36 more)

### Community 6 - "Data Model Entities & Decisions"
Cohesion: 0.10
Nodes (33): Atribuição equipa responsável, Auditoria, Avaliação IPCPAL, Avaliação de triagem, Concelho, Cuidador principal, Duração padrão, Equipa (+25 more)

### Community 7 - "Auth & Health Endpoints"
Cohesion: 0.11
Nodes (11): get_conn(), health(), eu(), get_current_user(), login(), listar_complexidade(), listar_urgencia(), criar() (+3 more)

### Community 8 - "Security & Seed Data"
Cohesion: 0.12
Nodes (28): bcrypt==4.3.0, pyjwt==2.10.1, assinatura_rf40 (reproducibility signature), RF40 Seed: Dados Fictícios do Baixo Alentejo, JWT Authentication with Short Expiration, Security & Access Profiles Section, GET /equipas (vista_geral scoping), PUT /utentes/{id}/inativar (+20 more)

### Community 9 - "Frontend App Routing"
Cohesion: 0.14
Nodes (18): App(), EmConstrucaoPage(), Props, ProtectedRoute(), iniciais(), LABEL_PERFIL, MainLayout(), NAV_ITEMS (+10 more)

### Community 10 - "Backend Tech Stack Decisions"
Cohesion: 0.08
Nodes (26): Backend (FastAPI API), Backend Tech Stack (FastAPI + PostgreSQL/PostGIS + psycopg), fastapi==0.143.0, psycopg[binary]==3.3.6, Pull Request Workflow, Database (PostgreSQL 16 + PostGIS 3.4), Future: Route Optimization Algorithm Integration, System Architecture Overview (+18 more)

### Community 11 - "Requirements & Objectives"
Cohesion: 0.11
Nodes (29): httpx==0.28.1, pytest==8.3.5, IPCPAL Complexity Scale, MoSCoW Prioritization Convention, O1: Aceder a informacao relevante dos utentes, O3: Definir e atualizar prioridades de atendimento, O5: Registar as visitas domiciliarias, PPS (Palliative Performance Scale) (+21 more)

### Community 12 - "GitHub CI Workflow"
Cohesion: 0.09
Nodes (24): defaults, runs-on, steps, run, defaults, runs-on, steps, jobs (+16 more)

### Community 13 - "Voltas Router Endpoints"
Cohesion: 0.21
Nodes (15): cancelar_visita(), _carregar_visitas_para_ajuste(), _commit_ou_erro(), concluir(), _concluir_visitas_pendentes(), confirmar(), criar(), listar() (+7 more)

### Community 14 - "Novo Utente Registration UI"
Cohesion: 0.19
Nodes (16): DadosLocalFormulario, LABEL_GENERO, NovoUtentePage(), PONTO_INICIAL, TIPOS_LOCAL, createLocal(), getConcelhos(), getLocais() (+8 more)

### Community 15 - "Backend Pydantic Schemas"
Cohesion: 0.18
Nodes (18): BloqueioViaturaResumo, EquipaResponsavelAlterar, EquipaResumo, MembroEquipa, PrioridadeAlterar, ProfissionalEquipaResumo, TokenResposta, UtenteAtivar (+10 more)

### Community 16 - "Frontend TS Config (App)"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 17 - "Utentes Router Endpoints"
Cohesion: 0.21
Nodes (16): alterar_complexidade(), alterar_equipa_responsavel(), alterar_prioridade(), ativar(), atualizar_coordenadas(), criar(), editar(), historico_complexidade() (+8 more)

### Community 18 - "Viaturas Router Endpoints"
Cohesion: 0.16
Nodes (11): apagar(), _associar_equipa(), criar(), criar_bloqueio(), editar(), listar(), listar_bloqueios(), _obter_viatura() (+3 more)

### Community 19 - "Core Priority Requirements"
Cohesion: 0.29
Nodes (18): Anexo B: Record of 28/10/2026 Meeting Proposals, mockup.png (anexo a proposta), RF01: Pesquisar utente por numero ou nome com sugestoes, RF15: Mostrar utentes no mapa (Leaflet/OpenStreetMap) com marcadores por nivel, RF16: Filtrar o mapa por prioridade, concelho, tipo de local e estado, RF19: Criar/reagendar/cancelar visitas; calendarios mensal/semanal/diario, RF20: Gerir equipas e viaturas como entidades proprias com disponibilidade, RF33: Apresentar Dashboard com Cuidador Principal e Equipa Responsavel distintos (+10 more)

### Community 20 - "Frontend TS Config (Node)"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 21 - "Equipas Router Endpoints"
Cohesion: 0.23
Nodes (11): _agrupar_equipas(), apagar(), criar(), editar(), listar(), listar_profissionais(), _normalizar_codigo(), _normalizar_designacao() (+3 more)

### Community 22 - "Frontend Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bootstrap@^5.3.8, bootstrap-icons@^1.13.2, leaflet@^1.9.4, react@^19.2.8, react-big-calendar@^1.20.0, react-bootstrap@^2.10.10, react-dom@^19.2.8 (+8 more)

### Community 23 - "Volta & Ocorrencia Requirements"
Cohesion: 0.30
Nodes (15): POST /ocorrencias, PUT /voltas/{id}/concluir, POST /voltas (creates volta with paragens/visitas), PUT /voltas/{id}/visitas/{visita_id}/cancelar, RF04: Definir/corrigir coordenadas de utente ou local no mapa, RF21: Planear visitas/voltas verificando conflitos de recursos, RF29: Registar execucao da visita com estado e instantes reais, RF43: Gerir a volta como agenda identificada de uma equipa numa data (+7 more)

### Community 24 - "ESLint Configuration"
Cohesion: 0.15
Nodes (12): eslint@^10.10.0, @eslint/js@^10.0.1, eslint-plugin-react-hooks@^7.1.1, eslint-plugin-react-refresh@^0.5.6, globals@^17.12.0, typescript-eslint@^8.69.0, eslint, @eslint/js (+4 more)

### Community 25 - "Locais Router Endpoints"
Cohesion: 0.24
Nodes (7): atualizar_coordenadas(), criar(), listar(), listar_concelhos(), CoordenadasAtualizar, LocalCriar, validar_coordenadas_portugal()

### Community 26 - "Frontend Dev Dependencies"
Cohesion: 0.17
Nodes (12): devDependencies, @types/leaflet@^1.9.22, @types/node@^24.19.1, @types/react@^19.2.18, @types/react-dom@^19.2.7, typescript@~6.0.2, vitest@^5.1.1, @types/leaflet (+4 more)

### Community 27 - "Database Migration Files"
Cohesion: 0.18
Nodes (11): 0001_modelo_inicial.sql, 0002_extensoes_modelo_documentado.sql, 0003_integridade_operacional.sql, 0004_ajuste_niveis_urgencia.sql, 0005_expor_situacao_clinica_notas.sql, 0006_viatura_bloqueio.sql, 0007_remover_zonas_ficticias_das_equipas.sql, 0008_backfill_volta_profissional.sql (+3 more)

### Community 28 - "Debug Scripts (Ativar Utente)"
Cohesion: 0.18
Nodes (6): botaoEditar, erros, respostas, trechoEstado, botaoEditar, erros

### Community 29 - "Reports Requirements (Backlog)"
Cohesion: 0.42
Nodes (9): Relatorios Group (not implemented), O6: Sistematizar informacao de acompanhamento, RF26: Exportar dados estruturados e versionados para o algoritmo de rotas, RF27: Integrar resultado do algoritmo de otimizacao quando disponibilizado, RF34: Apresentar relatorios filtraveis por periodo, equipa e concelho, RF35: Exportar relatorios/ficha em PDF/Excel (backlog), RF51: Acao 'Imprimir relatorio' no detalhe da volta, RNF20: API REST desacoplada da interface (JSON, CSV) (+1 more)

### Community 30 - "Equipa Responsavel Planning"
Cohesion: 0.33
Nodes (7): Equipa Responsavel (responsible clinical team), O4: Apoiar planeamento da agenda de visitas e viaturas, RF22: Produzir lista sugerida de necessidades de visita por prioridade, RF23: Registar visita pendente sem equipa/viatura/hora, RF24: Gerir profissionais, equipas e participantes efetivos nas visitas, RF25: Apresentar sequencia das paragens da volta num mapa, RF52: Ecra Equipas com listagem, composicao e viatura associada

### Community 31 - "Frontend Package Metadata"
Cohesion: 0.29
Nodes (6): @types/react-big-calendar@^1.16.3, name, private, type, version, @types/react-big-calendar

### Community 32 - "Map Filtering Requirements"
Cohesion: 0.33
Nodes (6): PainelConstrucaoRota (client-side bloqueio filtering), Viatura Bloqueios Endpoints, O2: Georreferenciar e visualizar distribuicao geografica, RF09: Sugerir coordenadas por geocodificacao da morada, RF17: Apresentar indicadores calculados do conjunto visivel e da volta selecionada, RF18: Abrir ficha do utente ao seleciona-lo no mapa

### Community 33 - "Vite Build Config"
Cohesion: 0.33
Nodes (4): vite@^8.3.0, @vitejs/plugin-react@^6.1.1, vite, @vitejs/plugin-react

### Community 34 - "NPM Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test

### Community 35 - "Social/Brand Icon Set"
Cohesion: 0.47
Nodes (6): Bluesky Icon, Discord Icon, Documentation Icon, GitHub Icon, Social/Profile Share Icon, X (Twitter) Icon

## Ambiguous Edges - Review These
- `RF24: Gerir profissionais, equipas e participantes efetivos nas visitas` → `RF26: Exportar dados estruturados e versionados para o algoritmo de rotas`  [AMBIGUOUS]
  docs/requisitos.md · relation: conceptually_related_to
- `Discord Icon` → `Social/Profile Share Icon`  [AMBIGUOUS]
  frontend/public/icons.svg · relation: conceptually_related_to

## Knowledge Gaps
- **60 isolated node(s):** `Desenho do Modelo de Dados — Plataforma de Cuidados Paliativos ULSBA`, `Concelho`, `Nível de urgência`, `Função clínica`, `Tipo de ocorrência` (+55 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 257 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MoSCoW Prioritization Convention` connect `Requirements & Objectives` to `Map Filtering Requirements`, `DB Migration Runner`, `Security & Seed Data`, `Core Priority Requirements`, `Volta & Ocorrencia Requirements`, `Reports Requirements (Backlog)`, `Equipa Responsavel Planning`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `apiFetch()` (e.g. with `equipaService.test.ts` and `localService.test.ts`) actually correct?**
  _`apiFetch()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Desenho do Modelo de Dados — Plataforma de Cuidados Paliativos ULSBA`, `Concelho`, `Nível de urgência` to the rest of the system?**
  _60 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07027168234064786 - nodes in this community are weakly interconnected._
- **Should `DB Migration Runner` be split into smaller, more focused modules?**
  _Cohesion score 0.05093167701863354 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `RF24: Gerir profissionais, equipas e participantes efetivos nas visitas` and `RF26: Exportar dados estruturados e versionados para o algoritmo de rotas`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Discord Icon` and `Social/Profile Share Icon`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._