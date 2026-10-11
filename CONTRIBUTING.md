# Guia de Contribuição

Regras de trabalho da equipa do Projeto Integrado ULSBA 2026/2027.

## Branches

- `main`: versão estável. Só recebe merge de `develop` no fim de cada sprint.
- `develop`: integração. Todas as Pull Requests vão para aqui.
- Branches de trabalho: criadas **a partir de `develop`**.

Nome da branch: `tipo/area-descricao`

- Tipos: `feat`, `fix`, `chore`, `docs`, `data`, `test`
- Áreas: `frontend`, `backend`, `db`
- Exemplos: `feat/backend-auth`, `feat/frontend-mapa`, `feat/db-utentes`, `data/seed-fictitious`

## Commits

Em **inglês**, no formato Conventional Commits: `tipo: descrição`

```
feat: add login endpoint
fix: correct marker color for triage A
docs: update architecture diagram
```

## Pull Requests

1. `git checkout develop` → `git pull` → `git checkout -b feat/backend-auth`
2. Fazer commits e `git push -u origin <branch>`
3. Abrir PR para `develop` e colar o link no cartão do Trello
4. Pelo menos uma pessoa aprova (o Tiago revê as PRs de todos; as do Tiago são revistas pelo Miguel)
5. Merge e apagar a branch

## Regras

- Nunca fazer commit direto em `main` ou `develop`.
- Nunca versionar `.env`, chaves, palavras-passe ou dados reais de utentes.
- Usar apenas dados fictícios (código, commits, capturas de ecrã e documentação).
- Antes de abrir a PR: o projeto compila e o lint passa na parte alterada.
- Ficheiros partilhados (rotas em `App.tsx`, configs, `docker-compose`): avisar no chat antes de mexer.