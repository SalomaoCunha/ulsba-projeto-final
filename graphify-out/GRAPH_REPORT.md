# Graph Report - ulsba-projeto-final  (2026-11-24)

## Corpus Check
- 117 files · ~108,762 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 8, .example 2, .css 1)

## Summary
- 1106 nodes · 2679 edges · 59 communities (45 shown, 14 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 1% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.82)
- Token cost: 557,766 input · 0 output

## Community Hubs (Navigation)
- Dashboard & Utente UI Components
- Requirements Specification (RF/RNF)
- DB Migration Runner & Tests
- Modelo de Dados Entities & Decisions
- Volta Schedule Calculation
- Docker Compose Config
- Agenda / Volta Calendar UI
- Viaturas Page UI
- Auth & Health Endpoints
- Volta Validation Triggers (Migration)
- Volta Detail Page UI
- GitHub CI Workflow
- Core Entities Migration (Auditoria/Ocorrencia)
- Novo Utente & Local Registration
- Voltas Router Endpoints
- Backend Pydantic Schemas
- Equipas Page UI
- Frontend TS Config (App)
- Utentes Router Endpoints
- Viaturas Router Endpoints
- Visita Participante Triggers (Migration)
- Frontend TS Config (Node)
- Equipas Router Endpoints
- Utente & Core Cardinal Entities (Migration)
- Local/Paragem & PostGIS (Migration)
- Frontend ESLint Configuration
- Frontend Runtime Dependencies
- RF40 Seed Data & Voltas Endpoints
- Frontend Package Metadata
- Locais Router Endpoints
- Architecture & Endpoints Overview
- DB Migration Runner Docs
- Frontend Routing & Rotas Placeholder
- Debug Scripts (Ativar Utente)
- Map Route Construction Panel
- Contributing & Project Team
- JWT Auth & Security Docs
- Backend Tech Stack Decision
- Viatura Bloqueio Migration & Endpoints
- Map Route Visualization
- Triagem Retification Migration
- Vite Build Config
- NPM Scripts
- PostGIS Decision & Tests
- Brand/Social Icon Set
- TS Project References
- Backend Test Dependencies
- Fictitious Data Privacy Rule
- Modelo de Dados Doc Link
- Node Types Dependency
- Generic UI Icons
- Current User Session State
- Vercel Rewrites Config
- Uvicorn Dependency
- Ocorrencias Create Endpoint
- Frontend Index Entry Point
- App Favicon Icon
- README CI Workflows Reference

## God Nodes (most connected - your core abstractions)
1. `Section 8: Pontos em Aberto (21 Open Questions)` - 46 edges
2. `react` - 31 edges
3. `apiFetch()` - 30 edges
4. `Reuniao de 28/10/2026 com a docente Maria Teresa Godinho` - 25 edges
5. `visita` - 23 edges
6. `Utente` - 23 edges
7. `Section 9: Traceability (Objectives/RF/RNF)` - 22 edges
8. `utilizador` - 20 edges
9. `compilerOptions` - 19 edges
10. `Utilizador` - 19 edges

## Surprising Connections (you probably didn't know these)
- `Conventional Commits (English)` --semantically_similar_to--> `Frontend (React + TypeScript + Vite + Bootstrap)`  [INFERRED] [semantically similar]
  CONTRIBUTING.md → frontend/README.md
- `Utilizadores Group (not implemented)` --conceptually_related_to--> `Project Team`  [AMBIGUOUS]
  docs/endpoints.md → README.md
- `fastapi (dependência)` --implements--> `Decision: FastAPI over ASP.NET Core`  [INFERRED]
  backend/requirements.txt → docs/arquitetura.md
- `Decision: FastAPI over ASP.NET Core` --shares_data_with--> `Backend Tech Stack (FastAPI + PostgreSQL/PostGIS + psycopg)`  [INFERRED]
  docs/arquitetura.md → backend/README.md
- `Decision: PostgreSQL + PostGIS over MySQL/SQL Server` --shares_data_with--> `Database (PostgreSQL 16 + PostGIS 3.4)`  [INFERRED]
  docs/arquitetura.md → db/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Hierarquia Volta → Paragem → Visita** — docs_modelo_dados_volta, docs_modelo_dados_paragem, docs_modelo_dados_visita, docs_modelo_dados_decisao_volta_paragem_visita [EXTRACTED 1.00]
- **Avaliações clínicas independentes (triagem, IPCPAL, PPS)** — docs_modelo_dados_avaliacao_triagem, docs_modelo_dados_avaliacao_complexidade, docs_modelo_dados_registo_pps, docs_modelo_dados_decisao_avaliacoes_independentes [EXTRACTED 1.00]
- **Camadas de alocação de recursos de equipa (pertença, escala, tripulação, participação)** — docs_modelo_dados_equipa_membro, docs_modelo_dados_escala_profissional, docs_modelo_dados_volta_profissional, docs_modelo_dados_visita_participante, docs_modelo_dados_decisao_equipa_escala_participantes [INFERRED 0.85]
- **Volta Detail Single-Screen Flow** — docs_requisitos_rf43, docs_requisitos_rf44, docs_requisitos_rf45, docs_requisitos_rf25, docs_requisitos_rf51 [INFERRED 0.85]
- **Priority, Urgency and Complexity Triage System** — docs_requisitos_rf10, docs_requisitos_rf11, docs_requisitos_rf12, docs_requisitos_rf14, docs_requisitos_pps, docs_requisitos_ipcpal [INFERRED 0.85]
- **Volta Construction Panel from Empty Calendar Day** — docs_requisitos_rf50, docs_requisitos_rf20, docs_requisitos_rf21, docs_requisitos_rf24, docs_requisitos_rf48 [INFERRED 0.80]
- **Social Media / Brand Icon Set** — frontend_public_icons_bluesky, frontend_public_icons_discord, frontend_public_icons_github, frontend_public_icons_x [INFERRED 0.75]
- **Docker Compose Startup Sequence** — readme_docker_compose_setup, db_readme_migrate_runner, backend_readme_project, frontend_readme_project [INFERRED 0.85]
- **Profile Authorization Gap** — docs_arquitetura_security, docs_endpoints_authorization_gap, docs_arquitetura_jwt_auth [EXTRACTED 1.00]
- **Fictitious Data Policy Implementation** — readme_privacy_health_data_rule, contributing_fictitious_data_rule, db_seed_readme_rf40_seed [INFERRED 0.85]

## Communities (59 total, 14 thin omitted)

### Community 0 - "Dashboard & Utente UI Components"
Cohesion: 0.05
Nodes (86): App(), BarraAcoesDashboard(), EcraCarregamento(), Props, EditarUtenteModal(), Props, TIPOS_LOCAL, EmConstrucaoPage() (+78 more)

### Community 1 - "Requirements Specification (RF/RNF)"
Cohesion: 0.06
Nodes (117): Anexo A: Working Hypotheses about ULSBA Operation, Anexo B: Record of 28/10/2026 Meeting Proposals, Anexo C: Historico v0.1 -> v0.2, Emiliano et al. (2025) - Optimizing home health care DSS, Ramires, Pardal & Godinho (2023) - Integrated Info System for HEI Volunteering, Sar & Ghadimi (2024) - Web DSS for Home Healthcare Waste Collection VRP, Sommerville (2024) - Engineering Software Products, Um-in & Tharmmaphornphilas (2025) - Home health care routing review (+109 more)

### Community 2 - "DB Migration Runner & Tests"
Cohesion: 0.06
Nodes (21): column_exists(), configure_connection(), create_history_table(), detect_existing_version(), expected_tables(), function_exists(), HistoryEntry, insert_history() (+13 more)

### Community 3 - "Modelo de Dados Entities & Decisions"
Cohesion: 0.11
Nodes (40): Atribuição equipa responsável, Auditoria, Avaliação IPCPAL, Avaliação de triagem, Concelho, Cuidador principal, Duração padrão, Equipa (+32 more)

### Community 4 - "Volta Schedule Calculation"
Cohesion: 0.10
Nodes (25): ajustar_por_atraso_saida(), ajustar_por_atraso_visita(), avaliar_regresso_beja(), calcular_resumo_volta(), construir_limite_beja(), formatar_minutos_como_duracao(), _garantir_tz(), _minutos_entre() (+17 more)

### Community 5 - "Docker Compose Config"
Cohesion: 0.05
Nodes (44): build, command, depends_on, environment, ports, volumes, condition, environment (+36 more)

### Community 6 - "Agenda / Volta Calendar UI"
Cohesion: 0.10
Nodes (33): COR_ESTADO_VOLTA, LABEL_ESTADO_VOLTA, AgendaPage(), BarraCalendario(), COR_ESTADO_VISITA, EventoAgenda, EventoCalendario(), LABEL_ESTADO_VISITA (+25 more)

### Community 7 - "Viaturas Page UI"
Cohesion: 0.14
Nodes (31): Props, calcularProximaRevisao(), formatarDataParaInput(), formatarDataPt(), LABEL_ESTADO, LABEL_MOTORIZACAO, LABEL_TIPO_BLOQUEIO, ViaturasPage() (+23 more)

### Community 8 - "Auth & Health Endpoints"
Cohesion: 0.11
Nodes (11): get_conn(), health(), eu(), get_current_user(), login(), listar_complexidade(), listar_urgencia(), criar() (+3 more)

### Community 9 - "Volta Validation Triggers (Migration)"
Cohesion: 0.11
Nodes (23): equipa_membro, fn_volta_validar_confirmacao(), funcao_profissional, ix_volta_data, ix_volta_equipa_data, ix_volta_estado, profissional, trg_volta_validar_confirmacao (+15 more)

### Community 10 - "Volta Detail Page UI"
Cohesion: 0.15
Nodes (22): ModalConfirmacao(), Props, COR_ESTADO_VISITA, LABEL_ESTADO_VISITA, DetalheItem(), extrairHoraInput(), formatarDuracao(), montarIsoLocal() (+14 more)

### Community 11 - "GitHub CI Workflow"
Cohesion: 0.09
Nodes (24): defaults, runs-on, steps, run, defaults, runs-on, steps, jobs (+16 more)

### Community 12 - "Core Entities Migration (Auditoria/Ocorrencia)"
Cohesion: 0.15
Nodes (22): auditoria, duracao_padrao_complexidade, exportacao_algoritmo, ix_auditoria_entidade, ix_auditoria_utilizador, ix_complexidade_utente_data, ix_mensagem_destinatario, ix_ocorrencia_visita (+14 more)

### Community 13 - "Novo Utente & Local Registration"
Cohesion: 0.17
Nodes (17): vitest@^5.1.1, DadosLocalFormulario, LABEL_GENERO, NovoUtentePage(), PONTO_INICIAL, TIPOS_LOCAL, createLocal(), getConcelhos() (+9 more)

### Community 14 - "Voltas Router Endpoints"
Cohesion: 0.21
Nodes (15): cancelar_visita(), _carregar_visitas_para_ajuste(), _commit_ou_erro(), concluir(), _concluir_visitas_pendentes(), confirmar(), criar(), listar() (+7 more)

### Community 15 - "Backend Pydantic Schemas"
Cohesion: 0.18
Nodes (18): BloqueioViaturaResumo, EquipaResponsavelAlterar, EquipaResumo, MembroEquipa, PrioridadeAlterar, ProfissionalEquipaResumo, TokenResposta, UtenteAtivar (+10 more)

### Community 16 - "Equipas Page UI"
Cohesion: 0.25
Nodes (16): EquipasPage(), FormularioEquipa, apiFetch(), formatarDetailErro(), createEquipa(), deleteEquipa(), getEquipas(), getProfissionaisEquipa() (+8 more)

### Community 17 - "Frontend TS Config (App)"
Cohesion: 0.10
Nodes (20): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+12 more)

### Community 18 - "Utentes Router Endpoints"
Cohesion: 0.21
Nodes (16): alterar_complexidade(), alterar_equipa_responsavel(), alterar_prioridade(), ativar(), atualizar_coordenadas(), criar(), editar(), historico_complexidade() (+8 more)

### Community 19 - "Viaturas Router Endpoints"
Cohesion: 0.16
Nodes (11): apagar(), _associar_equipa(), criar(), criar_bloqueio(), editar(), listar(), listar_bloqueios(), _obter_viatura() (+3 more)

### Community 20 - "Visita Participante Triggers (Migration)"
Cohesion: 0.14
Nodes (14): fn_participante_validar(), fn_verifica_conflito_profissional(), fn_visita_revalidar_participantes(), ix_visita_equipa_inicio, ix_visita_estado, ix_visita_paragem, ix_visita_utente, trg_visita_participante_validar (+6 more)

### Community 21 - "Frontend TS Config (Node)"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 22 - "Equipas Router Endpoints"
Cohesion: 0.23
Nodes (11): _agrupar_equipas(), apagar(), criar(), editar(), listar(), listar_profissionais(), _normalizar_codigo(), _normalizar_designacao() (+3 more)

### Community 23 - "Utente & Core Cardinal Entities (Migration)"
Cohesion: 0.24
Nodes (16): atribuicao_equipa_responsavel, avaliacao_complexidade, concelho, cuidador_principal, equipa, ix_atribuicao_equipa, ix_transicao_utente, ix_utente_local (+8 more)

### Community 24 - "Local/Paragem & PostGIS (Migration)"
Cohesion: 0.18
Nodes (14): ix_local_concelho, ix_local_geom, ix_local_tipo, local, paragem, escala_profissional, fn_paragem_capturar_geometria(), ix_escala_equipa (+6 more)

### Community 25 - "Frontend ESLint Configuration"
Cohesion: 0.17
Nodes (15): devDependencies, eslint@^10.10.0, @eslint/js@^10.0.1, eslint-plugin-react-hooks@^7.1.1, eslint-plugin-react-refresh@^0.5.6, globals@^17.12.0, @types/leaflet@^1.9.22, typescript-eslint@^8.69.0 (+7 more)

### Community 26 - "Frontend Runtime Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bootstrap@^5.3.8, bootstrap-icons@^1.13.2, leaflet@^1.9.4, react@^19.2.8, react-big-calendar@^1.20.0, react-bootstrap@^2.10.10, react-dom@^19.2.8 (+8 more)

### Community 27 - "RF40 Seed Data & Voltas Endpoints"
Cohesion: 0.16
Nodes (10): _rf40_local, _rf40_prof, _rf40_utente, _rf40_visita, _rf40_volta, assinatura_rf40 (reproducibility signature), RF40 Seed: Dados Fictícios do Baixo Alentejo, PUT /voltas/{id}/concluir (+2 more)

### Community 28 - "Frontend Package Metadata"
Cohesion: 0.15
Nodes (12): @types/react@^19.2.18, @types/react-big-calendar@^1.16.3, @types/react-dom@^19.2.7, typescript@~6.0.2, name, private, type, version (+4 more)

### Community 29 - "Locais Router Endpoints"
Cohesion: 0.24
Nodes (7): atualizar_coordenadas(), criar(), listar(), listar_concelhos(), CoordenadasAtualizar, LocalCriar, validar_coordenadas_portugal()

### Community 30 - "Architecture & Endpoints Overview"
Cohesion: 0.23
Nodes (12): System Architecture Overview, Request Flow: Login + GET /utentes Sequence, Three-Layer Client-Server Architecture, POST /auth/login, GET /equipas (vista_geral scoping), API Endpoints Reference (/api/v1), Open Issue: Pagination Not Implemented (GET /utentes, GET /voltas), PUT /utentes/{id}/inativar (+4 more)

### Community 31 - "DB Migration Runner Docs"
Cohesion: 0.18
Nodes (11): Shared Files Coordination Rule, Migration Checksum Immutability Rule, migrate/Dockerfile (db-migrate Docker Image), migrate/runner.py (db-migrate service), public.schema_migrations tracking table, migrate/test_runner.py (Migration Mechanism Tests), GET /health, db-migrate Service (+3 more)

### Community 32 - "Frontend Routing & Rotas Placeholder"
Cohesion: 0.24
Nodes (11): Future: Route Optimization Algorithm Integration, Planned Endpoint GET /rotas/dados (not yet implemented), BarraAcoesDashboard.tsx placeholder button "Gerar Rota Otima", Relatorios Group (not implemented), Rotas Group (not implemented, placeholder button), Import Alias @/ -> src/, Frontend Folder Structure (components/config/layouts/pages/services/types/utils), Component Naming Conventions (PascalCase, use-prefixed hooks) (+3 more)

### Community 33 - "Debug Scripts (Ativar Utente)"
Cohesion: 0.18
Nodes (6): botaoEditar, erros, respostas, trechoEstado, botaoEditar, erros

### Community 34 - "Map Route Construction Panel"
Cohesion: 0.29
Nodes (10): date-fns@^4.4.0, AjustarVistaPrevia(), BASE_BEJA, calcularDistanciaKm(), diasSemVisita(), obterCoordenadas(), PainelConstrucaoRota(), viaturaBloqueadaNoDia() (+2 more)

### Community 35 - "Contributing & Project Team"
Cohesion: 0.27
Nodes (10): Branching Strategy (main/develop/feature), Conventional Commits (English), Pull Request Workflow, Utilizadores Group (not implemented), Elsa Rodrigues (Orientação/Advisor), Miguel Sanina (Team Member), ULSBA Platform (Projeto Integrado 2026/2027), Salomão Cunha (Team Member) (+2 more)

### Community 36 - "JWT Auth & Security Docs"
Cohesion: 0.25
Nodes (9): DATABASE_URL Environment Variable, Backend Environment Variables (DATABASE_URL, JWT_SECRET), JWT_SECRET Environment Variable, bcrypt (dependência), psycopg (dependência), pyjwt (dependência), JWT Authentication with Short Expiration, Security & Access Profiles Section (+1 more)

### Community 37 - "Backend Tech Stack Decision"
Cohesion: 0.28
Nodes (9): Backend (FastAPI API), Backend Tech Stack (FastAPI + PostgreSQL/PostGIS + psycopg), fastapi (dependência), Decision: FastAPI over ASP.NET Core, Decision: React + TypeScript + Vite + Leaflet, requisitos.md (Especificação de Requisitos v0.3), VITE_API_URL Environment Variable, Tailwind CSS Removed (never worked, app uses Bootstrap) (+1 more)

### Community 38 - "Viatura Bloqueio Migration & Endpoints"
Cohesion: 0.29
Nodes (5): idx_viatura_bloqueio_viatura_datas, viatura_bloqueio, Baseline Registration Mechanism, PainelConstrucaoRota (client-side bloqueio filtering), Viatura Bloqueios Endpoints

### Community 39 - "Map Route Visualization"
Cohesion: 0.48
Nodes (6): AjustarTamanhoMapa(), corDaParagem(), criarIconeNumerado(), MapaPercursoVolta(), Props, ParagemDetalhe

### Community 40 - "Triagem Retification Migration"
Cohesion: 0.33
Nodes (5): avaliacao_triagem, ix_triagem_utente_data, trg_avaliacao_triagem_imutavel, uq_triagem_retifica, fn_triagem_retificacao_mesmo_utente()

### Community 41 - "Vite Build Config"
Cohesion: 0.33
Nodes (4): vite@^8.3.0, @vitejs/plugin-react@^6.1.1, vite, @vitejs/plugin-react

### Community 42 - "NPM Scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, test

### Community 43 - "PostGIS Decision & Tests"
Cohesion: 0.40
Nodes (4): Database (PostgreSQL 16 + PostGIS 3.4), init/01-postgis.sql, Decision: PostgreSQL + PostGIS over MySQL/SQL Server, Beatriz Caixeiro (Team Member)

### Community 44 - "Brand/Social Icon Set"
Cohesion: 0.67
Nodes (4): Bluesky Icon, Discord Icon, GitHub Icon, X (Twitter) Icon

## Ambiguous Edges - Review These
- `Atribuição equipa responsável` → `Cuidador principal`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: conceptually_related_to
- `Nível IPCPAL` → `Registo PPS`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: conceptually_related_to
- `Paragem` → `Território de cobertura`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: conceptually_related_to
- `Bloqueio de viatura` → `Volta`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: conceptually_related_to
- `Decisão: cuidador principal, equipa responsável e equipa executante são entidades distintas` → `RF02: Consultar ficha do utente (identificacao, cuidador, equipa responsavel)`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: references
- `Decisão: cuidador principal, equipa responsável e equipa executante são entidades distintas` → `RF24: Gerir profissionais, equipas e participantes efetivos nas visitas`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: references
- `Decisão: cuidador principal, equipa responsável e equipa executante são entidades distintas` → `RF33: Apresentar Dashboard com Cuidador Principal e Equipa Responsavel distintos`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: references
- `Decisão: dados geográficos em WGS84 com preservação histórica` → `RNF27: Guardar coordenadas em WGS84/SRID 4326 com validacao territorial`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: references
- `Decisão: histórico e autoria não substituem auditoria` → `RNF04: Persistir trilho de auditoria das operacoes criticas`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: references
- `Decisão: locais partilhados entre utentes` → `RF05: Registar local do utente (domicilio, lar, unidade)`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: references
- `Decisão: rascunho versus confirmação` → `RF43: Gerir a volta como agenda identificada de uma equipa numa data`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: references
- `Decisão: rascunho versus confirmação` → `RF50: Painel de construcao da volta a partir de dia vazio do calendario`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: references
- `Decisão: FKs e tabelas não substituem permissões por perfil` → `RNF22: Aplicar minimo privilegio por perfil, equipa, utente e campo`  [AMBIGUOUS]
  docs/modelo-dados.md · relation: references
- `IPCPAL Complexity Scale` → `PPS (Palliative Performance Scale)`  [AMBIGUOUS]
  docs/requisitos.md · relation: conceptually_related_to
- `IPCPAL Complexity Scale` → `RF14: Calculo automatico de complexidade a partir do PPS (backlog, carece validacao clinica)`  [AMBIGUOUS]
  docs/requisitos.md · relation: conceptually_related_to
- `PPS (Palliative Performance Scale)` → `RF14: Calculo automatico de complexidade a partir do PPS (backlog, carece validacao clinica)`  [AMBIGUOUS]
  docs/requisitos.md · relation: conceptually_related_to
- `RF05: Registar local do utente (domicilio, lar, unidade)` → `RF21: Planear visitas/voltas verificando conflitos de recursos`  [AMBIGUOUS]
  docs/requisitos.md · relation: conceptually_related_to
- `RF11: Gerir catalogo configuravel de niveis de urgencia` → `Anexo A: Working Hypotheses about ULSBA Operation`  [AMBIGUOUS]
  docs/requisitos.md · relation: conceptually_related_to
- `RF19: Criar/reagendar/cancelar visitas; calendarios mensal/semanal/diario` → `Equipa Responsavel (responsible clinical team)`  [AMBIGUOUS]
  docs/requisitos.md · relation: conceptually_related_to
- `Future: Route Optimization Algorithm Integration` → `modelo-dados.md (Modelo de Dados v1.1)`  [AMBIGUOUS]
  docs/README.md · relation: conceptually_related_to
- `Utilizadores Group (not implemented)` → `Project Team`  [AMBIGUOUS]
  docs/endpoints.md · relation: conceptually_related_to

## Knowledge Gaps
- **40 isolated node(s):** `Desenho do Modelo de Dados — Plataforma de Cuidados Paliativos ULSBA`, `Concelho`, `Função clínica`, `Tipo de ocorrência`, `docs/requisitos.md (Especificação de Requisitos)` (+35 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 248 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Dashboard & Utente UI Components` to `Map Route Construction Panel`, `Agenda / Volta Calendar UI`, `Map Route Visualization`, `Viaturas Page UI`, `Volta Detail Page UI`, `Novo Utente & Local Registration`, `Equipas Page UI`, `Frontend Runtime Dependencies`, `Frontend Package Metadata`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `apiFetch()` (e.g. with `equipaService.test.ts` and `localService.test.ts`) actually correct?**
  _`apiFetch()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Desenho do Modelo de Dados — Plataforma de Cuidados Paliativos ULSBA`, `Concelho`, `Função clínica` to the rest of the system?**
  _40 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard & Utente UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05098988748041589 - nodes in this community are weakly interconnected._
- **Why does `scripts` connect `NPM Scripts` to `Frontend Package Metadata`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Atribuição equipa responsável` and `Cuidador principal`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Nível IPCPAL` and `Registo PPS`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._