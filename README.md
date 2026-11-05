# ULSBA – Plataforma de Apoio à Equipa de Cuidados Paliativos

Plataforma web de apoio à equipa de cuidados paliativos da ULSBA, desenvolvida no âmbito do **Projeto Integrado 2026/2027** da Licenciatura em Engenharia Informática do Instituto Politécnico de Beja (IPBeja).

> **Estado:** em desenvolvimento. Todos os dados usados atualmente são **fictícios**.

## Estrutura do repositório

Este repositório reúne todo o projeto (monorepo):

```
.
├── frontend/              # Aplicação web (React + TypeScript + Vite + Bootstrap)
├── backend/               # API (FastAPI)
├── db/
│   ├── init/              # Ativação de PostGIS no primeiro arranque
│   ├── migrations/        # Migrações SQL sequenciais do modelo relacional
│   ├── tests/             # Testes de verificação SQL
│   └── README.md          # Instruções de aplicação das migrações
├── docs/                  # Documentação: requisitos, arquitetura, relatórios
├── .github/workflows/     # CI (lint, build e verificação do backend em cada PR)
├── docker-compose.yml     # Orquestração de frontend + backend + base de dados
├── .env.example           # Modelo de variáveis de ambiente (Postgres)
├── CONTRIBUTING.md        # Convenções de branches, commits e pull requests
└── README.md              # Este ficheiro
```

| Pasta       | Conteúdo                                                        | Documentação                             |
| ----------- | --------------------------------------------------------------- | ---------------------------------------- |
| `frontend/` | Interface da aplicação                                          | [frontend/README.md](frontend/README.md) |
| `backend/`  | API (FastAPI)                                                   | [backend/README.md](backend/README.md)   |
| `db/`       | PostgreSQL + PostGIS, migrações e testes | [db/README.md](db/README.md)                                         |
| `docs/`     | Documentos do projeto                                           | [docs/README.md](docs/README.md)         |

## Como arrancar

Clonar o repositório:

```bash
git clone https://github.com/SalomaoCunha/ulsba-projeto-final.git
cd ulsba-projeto-final
git checkout develop
```

A forma recomendada de arrancar o projeto completo (frontend + backend + base de dados) é via Docker — ver secção seguinte. Para arrancar só o frontend em modo de desenvolvimento, ver [frontend/README.md](frontend/README.md): em resumo, `cd frontend`, `npm install`, copiar `.env.example` para `.env` e `npm run dev`.

## Arranque com Docker

1. `cp .env.example .env` (e mudar a password)
2. `docker compose up --build`
3. Frontend: http://localhost:5173 · API: http://localhost:8000/docs · Health: http://localhost:8000/health

**Importante — migrações:** `docker compose up` ativa o PostGIS num volume novo, mas **não cria automaticamente as tabelas da aplicação**. Depois do arranque, aplica `db/migrations/0001...` a `0003...` conforme os comandos em [db/README.md](db/README.md). Não uses `docker compose down -v` sem saberes que isso apaga o volume da base de dados.

### Problemas comuns
- `/health` falha por causa do PostGIS: confirma a extensão na BD indicada por `POSTGRES_DB` e a variável `DATABASE_URL`. Num volume antigo, o script `db/init/` não é executado novamente; **não apagues o volume como primeiro passo**.
- "Module not found" no frontend depois de um `git pull` com dependências novas: `docker compose up --build -V`.
- Porta 5432 ocupada: parar o Postgres local ou mudar a porta no `docker-compose.yml`.

> **Windows / PowerShell:** se aparecer o erro *"running scripts is disabled on this system"*, usar `npm.cmd` em vez de `npm`, ou executar uma vez `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

## Fluxo de trabalho

O fluxo completo está no [CONTRIBUTING.md](CONTRIBUTING.md). Em resumo:

- **Branches:** `main` é a versão estável e só recebe merge de `develop` no fim de cada sprint. `develop` é a branch de integração. Cada tarefa tem a sua branch, criada a partir de `develop`, com o nome `tipo/area-descricao` (ex.: `feat/frontend-mapa`, `fix/backend-auth`).
- **Pull requests:** vão sempre para `develop` e precisam da aprovação de outra pessoa da equipa. Não fazer commits diretos em `main` nem em `develop`.
- **Mensagens de commit** em inglês, no formato `tipo: descrição` (Conventional Commits):
  - `feat:` nova funcionalidade
  - `fix:` correção de erro
  - `chore:` configuração e manutenção
  - `docs:` documentação
  - `data:` dados fictícios e scripts de seed
  - `test:` testes
- **Antes de começar a trabalhar:** `git checkout develop` e `git pull`.
- **Antes de abrir uma pull request:** garantir que o projeto compila e passa no lint da parte alterada.
- **Evitar conflitos:** combinar quem mexe em quê. Ficheiros partilhados (rotas, configurações) são os mais propensos a conflitos.

## Privacidade e dados de saúde

Este projeto lida com um contexto de saúde. Por isso, toda a equipa deve:

- Usar **apenas dados fictícios** no código, em commits, capturas de ecrã e documentação.
- Nunca versionar ficheiros `.env` ou qualquer credencial, chave ou palavra-passe.
- Nunca colocar dados reais de utentes em dados de exemplo.

## Equipa

- Tiago Sanina
- Miguel Sanina
- Salomão Cunha
- Beatriz Caixeiro

Orientação: Elsa Rodrigues
