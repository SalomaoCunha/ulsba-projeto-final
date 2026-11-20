# Arquitetura

Plataforma de apoio à Equipa de Cuidados Paliativos da ULSBA. Arquitetura
cliente-servidor em três camadas, executada em Docker Compose.

## Visão geral

```mermaid
flowchart TD
    U["Equipa de saúde (browser)"] --> F

    subgraph DC["Docker Compose"]
        F["Frontend<br/>React + TypeScript + Leaflet"]
        A["API backend<br/>FastAPI (REST, JWT)"]
        D[("PostgreSQL + PostGIS")]
        R["Algoritmo de rotas<br/>(fase futura)"]
        F -->|"HTTP + JSON"| A
        A -->|"SQL"| D
        A -.-> R
    end

    F -.->|"tiles do mapa"| OSM["OpenStreetMap"]
```

## Componentes

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Frontend | React, TypeScript, Leaflet | Interface, mapa de utentes, pesquisa, agenda |
| Backend | FastAPI (Python) | Regras de negócio, autenticação, endpoints REST |
| Base de dados | PostgreSQL + PostGIS | Utentes, visitas, viaturas e dados geográficos |
| Mapas | OpenStreetMap | Mapa base, carregado diretamente pelo browser |
| Infraestrutura | Docker Compose | Ambiente igual para toda a equipa |

## Fluxo de um pedido

```mermaid
sequenceDiagram
    participant B as Browser (React)
    participant A as API (FastAPI)
    participant D as PostgreSQL + PostGIS

    B->>A: POST /auth/login
    A->>D: validar utilizador
    A-->>B: token JWT
    B->>A: GET /utentes (Bearer token)
    A->>A: validar token
    A->>D: consulta com PostGIS
    D-->>A: utentes com coordenadas (lat/lng)
    A-->>B: JSON (lat/lng por utente, não GeoJSON)
    B->>B: Leaflet desenha os marcadores
```

Regras principais:
- O frontend nunca acede diretamente à base de dados.
- A API é o único ponto de acesso aos dados e aplica as permissões.
- Os tiles do mapa vêm diretamente do OpenStreetMap para o browser.

## Portas (desenvolvimento)

| Serviço | Porta |
|---|---|
| Frontend | 5173 |
| API | 8000 |
| Base de dados | 5432 |

## Escolha das tecnologias

A proposta sugere ASP.NET Core para o backend e admite outras tecnologias,
desde que fundamentadas nos requisitos, nos conhecimentos da equipa e no prazo.

### FastAPI vs ASP.NET Core

| Critério | FastAPI (Python) | ASP.NET Core (C#) |
|---|---|---|
| Sugestão da proposta | Alternativa admitida | Sugerido explicitamente |
| Tempo de desenvolvimento | Rápido, pouca configuração | Mais estrutura e código |
| Documentação da API | Automática (`/docs`), útil para validar o contrato com o frontend | Swagger disponível |
| Validação de dados | Pydantic integrado | Data annotations / FluentValidation |
| Integração com PostGIS | GeoAlchemy2, Shapely | Npgsql + NetTopologySuite |
| Algoritmo de rotas | Ecossistema forte de otimização (OR-Tools, NetworkX) | Existe, menos comum |
| Tipagem | Type hints (opcional) | Forte, em compilação |

Decisão: **FastAPI**. Justificação: a razão decisiva foi o conhecimento
prévio da equipa — quem ficou responsável pelo backend já tinha experiência
em Python e nenhuma em C#/.NET, e o prazo entre outubro de 2026 e fevereiro
de 2027, com a equipa a trabalhar em part-time, não comportava o tempo de
aprendizagem de uma linguagem e framework novas. A documentação automática
(`/docs`) revelou-se também útil na prática para validar o contrato dos
endpoints com o frontend antes de cada integração.

### PostgreSQL + PostGIS vs MySQL / SQL Server

- O PostGIS é a extensão geoespacial mais madura (`ST_Distance`,
  `ST_DWithin`, índices espaciais GiST), de código aberto.
- Georreferenciar utentes e calcular distâncias é central ao projeto.
- A imagem Docker `postgis/postgis` já vem pronta.
- O SQL Server implica licenciamento e imagem mais pesada. O MySQL tem
  funções espaciais mais limitadas.

Decisão: **PostgreSQL + PostGIS**.

### Frontend: React, TypeScript e Vite

React e TypeScript por serem o par mais comum para interfaces web
interativas com tipagem estática. Vite como ferramenta de desenvolvimento
pelo servidor de desenvolvimento rápido (arranque e recarregamento quase
instantâneos) e por ser hoje a opção por omissão para projetos React novos.
Leaflet + OpenStreetMap para o mapa, por serem as opções abertas mais usadas
para mapas interativos na web, sem custos de licenciamento.

Decisão: **PostgreSQL + PostGIS**.

## Segurança e perfis de acesso

- **Autenticação:** JWT com expiração curta. Palavras-passe guardadas com
  hash (argon2 ou bcrypt), nunca em texto simples.
- **Perfis:** `COORDENADOR`, `PROFISSIONAL_SAUDE`, `ADMINISTRADOR` (enum
  `perfil_utilizador` na BD). As permissões por rota pretendidas estão em
  `docs/endpoints.md`, mas a autorização por perfil **ainda não está
  implementada nos endpoints** — hoje qualquer utilizador autenticado acede a
  qualquer rota, independentemente do perfil (ver "Em aberto" em
  `docs/endpoints.md`).
- **Validação de entradas:** modelos Pydantic e queries parametrizadas,
  contra injeção SQL.
- **CORS** restrito à origem do frontend.
- **Segredos** no `.env`, fora do Git.
- **Auditoria:** registo de quem consultou ou alterou fichas de utentes.
- **Dados fictícios** em todo o desenvolvimento, por proteção de dados
  clínicos (RGPD). Não há integração com sistemas da ULSBA nesta fase.

## Evolução futura

Integração do algoritmo de otimização de rotas (conceção pela docente de
Matemática). Está planeado o backend expor a extração dos dados necessários
(`GET /rotas/dados`), mas este endpoint ainda não existe — ver "Rotas
(preparação para o algoritmo)" em `docs/endpoints.md`.