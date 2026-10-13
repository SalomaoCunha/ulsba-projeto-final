# ULSBA – Plataforma de Apoio à Equipa de Cuidados Paliativos

Aplicação web de apoio à equipa de cuidados paliativos da ULSBA, desenvolvida no âmbito do **Projeto Integrado 2026/2027** da Licenciatura em Engenharia Informática (Instituto Politécnico de Beja).

> **Estado:** em desenvolvimento. Todos os dados usados atualmente são **fictícios**.

## Tecnologias

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) (servidor de desenvolvimento e build)
- [Bootstrap](https://getbootstrap.com/) + [React Bootstrap](https://react-bootstrap.github.io/) (estilos e componentes)
- [React Router](https://reactrouter.com/) (navegação)
- [ESLint](https://eslint.org/) (qualidade do código)

> **Nota:** o projeto usou inicialmente Tailwind CSS, mas foi removido (configuração nunca ficou funcional e a app já seguia Bootstrap). Usar sempre classes Bootstrap nos componentes novos.

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recente) e npm
- [Git](https://git-scm.com/)

## Como arrancar

```bash
# 1. Clonar o repositório (se ainda não o fez) e entrar na pasta do frontend
git clone <URL-DO-REPOSITORIO>
cd <NOME-DO-REPOSITORIO>/frontend

# 2. Instalar as dependências
npm install

# 3. Criar o ficheiro de variáveis de ambiente
cp .env.example .env        # Windows (PowerShell): copy .env.example .env

# 4. Arrancar em modo de desenvolvimento
npm run dev
```

A aplicação fica disponível no endereço indicado no terminal (normalmente `http://localhost:5173`).

> **Windows / PowerShell:** se aparecer o erro *"running scripts is disabled on this system"*, use `npm.cmd` em vez de `npm`, ou execute uma vez `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

## Scripts disponíveis

| Comando           | O que faz                                              |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Arranca o servidor de desenvolvimento                  |
| `npm run build`   | Verifica os tipos e gera a versão de produção (`dist`) |
| `npm run preview` | Serve localmente a versão de produção                  |
| `npm run lint`    | Corre o ESLint sobre o código                          |

## Variáveis de ambiente

As variáveis ficam no ficheiro `.env` (local, **não é versionado**). O ficheiro `.env.example` é o modelo e é versionado.

| Variável       | Descrição                    | Exemplo                 |
| -------------- | ---------------------------- | ----------------------- |
| `VITE_API_URL` | URL base da API (backend)    | `http://localhost:8000` |

Notas:

- Só as variáveis com prefixo `VITE_` ficam disponíveis no código (`import.meta.env.VITE_API_URL`).
- Tudo o que chega ao browser é público. **Nunca colocar chaves secretas ou credenciais** nestas variáveis.
- Depois de alterar o `.env`, reiniciar o `npm run dev`.

## Estrutura do projeto

```
frontend/
├── public/              # Ficheiros estáticos
├── src/
│   ├── assets/          # Imagens e outros recursos
│   ├── layouts/         # Layouts partilhados (ex.: MainLayout)
│   ├── pages/           # Uma página por rota (ex.: DashboardPage)
│   ├── services/        # Acesso a dados (atualmente dados fictícios)
│   ├── types/           # Tipos TypeScript partilhados (ex.: Utente)
│   ├── App.tsx          # Definição das rotas
│   ├── main.tsx         # Ponto de entrada da aplicação
│   └── index.css        # Estilos globais
├── .env.example         # Modelo das variáveis de ambiente
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

### Alias de imports

O alias `@/` aponta para `src/`, para evitar caminhos relativos longos:

```ts
import MainLayout from '@/layouts/MainLayout';
import type { Utente } from '@/types/utente';
```

### Rotas

| Caminho          | Página             |
| ---------------- | ------------------ |
| `/`              | Dashboard          |
| `/utentes`       | Lista de utentes   |
| `/utentes/novo`  | Novo utente        |
| `/agenda`        | Agenda             |
| `/visitas`       | Visitas            |

Novas páginas: criar o ficheiro em `src/pages/` e registar a rota em `src/App.tsx`, dentro do `MainLayout`.

## Convenções de trabalho

**Git**

- Uma *branch* por tarefa (ex.: `feat/lista-utentes`, `fix/layout-sidebar`) e *pull request* para o `main`.
- Mensagens de commit no formato `tipo: descrição`, por exemplo:
  - `feat:` nova funcionalidade
  - `fix:` correção de erro
  - `chore:` configuração e manutenção
  - `docs:` documentação
- Fazer `git pull` antes de começar a trabalhar.

**Código**

- Um componente por ficheiro, nomes em `PascalCase` (`DashboardPage.tsx`).
- Hooks com prefixo `use` (`useUtentes`).
- Tipos importados com `import type`.
- Correr `npm run lint` e `npm run build` antes de abrir uma *pull request*.

## Privacidade e dados de saúde

Este projeto lida com um contexto de saúde. Por isso:

- Usar **apenas dados fictícios** no código, em commits, capturas de ecrã e documentação.
- Nunca versionar ficheiros `.env` ou qualquer credencial.
- Nunca colocar dados reais de utentes em dados de exemplo.

## Equipa

- Tiago Sanina
- Miguel Sanina
- Salomão Cunha
- Beatriz Caixeiro

Orientação: Elsa Rodrigues