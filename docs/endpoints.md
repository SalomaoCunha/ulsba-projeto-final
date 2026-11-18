# API: endpoints principais

Prefixo: `/api/v1` (exceto `/health`). Formato: JSON.
Autenticação: JWT no cabeçalho `Authorization: Bearer <token>`.
Documentação interativa gerada automaticamente: `http://localhost:8000/docs`.

Perfis existentes (`perfil_utilizador`): `COORDENADOR`, `PROFISSIONAL_SAUDE`, `ADMINISTRADOR`.
Um coordenador pode ainda ter `vista_geral = true` (RF49), dando-lhe acesso a
todas as equipas em vez de só às suas.

> **Em aberto:** a autorização por perfil ainda não está implementada nos
> endpoints — qualquer utilizador autenticado (token válido) pode chamar
> qualquer rota abaixo, independentemente do `perfil`. A única restrição real
> hoje é o âmbito por equipa (`vista_geral`) em `GET /equipas` e `GET /voltas`.
> A coluna "Perfis" abaixo é a intenção, não o que o código impõe.

> Nomes de campos e tabelas devem coincidir com o modelo de dados
> (ver `docs/modelo-dados.md`).

## Autenticação

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| POST | /auth/login | Login, devolve token JWT | público |
| GET | /auth/me | Utilizador autenticado, perfil e `vista_geral` | todos |

## Utentes

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /utentes | Lista com filtros opcionais `nome`, `numero`. Exclui utentes com `estado=INATIVO` por omissão (RF03/RF07) | todos |
| GET | /utentes/{id} | Ficha completa do utente (inclui inativos, para consulta de histórico) | todos |
| POST | /utentes | Criar utente | coordenador, admin |
| PUT | /utentes/{id} | Editar dados da ficha (nome, contacto, situação clínica, notas) | coordenador, admin |
| POST | /utentes/{id}/prioridade | Registar nova avaliação de prioridade/urgência | coordenador, enfermeiro |
| GET | /utentes/{id}/historico-prioridade | Histórico de avaliações de prioridade | todos |
| POST | /utentes/{id}/complexidade | Registar nova avaliação de complexidade (IPCPAL) | coordenador, enfermeiro |
| GET | /utentes/{id}/historico-complexidade | Histórico de avaliações de complexidade | todos |
| POST | /utentes/{id}/equipa | Atribuir equipa responsável (fecha o período anterior automaticamente) | coordenador |
| GET | /utentes/{id}/historico-equipa | Histórico de equipas responsáveis | todos |
| PUT | /utentes/{id}/inativar | Marcar utente como inativo, com motivo e data (RF03, RF07). 400 se já estiver inativo | coordenador, admin |

## Locais

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| POST | /locais | Criar local (morada + concelho; coordenadas opcionais, fornecidas pelo cliente, sem geocoding externo) | coordenador, admin |

## Equipas e viaturas

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /equipas | Lista equipas e membros. Sem `vista_geral`, mostra só as equipas do utilizador autenticado (RF49) | todos |
| GET | /viaturas | Listar viaturas (matrícula, autonomia, estado, equipa associada) | todos |

Criar/editar viaturas ainda não está implementado (botões "Em breve" no frontend).

## Voltas (agenda)

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /voltas | Voltas num intervalo `data_inicio`/`data_fim`, filtros opcionais `equipa_id`, `viatura_id`, `estado`. Sem `vista_geral`, mostra só voltas das equipas do utilizador (RF49) | todos |
| POST | /voltas | Cria uma volta (data + equipa + viatura + lista de `utente_ids`): agrupa os utentes por local em paragens e cria uma visita por utente, já com estado `PLANEADA` | coordenador |

Não existe um recurso "visita" isolado — visitas nascem sempre dentro de uma
volta, através de `POST /voltas`. Não existe ainda `GET /voltas/{id}` com o
detalhe completo (paragens, visitas, ocorrências) nem edição de uma volta
depois de criada — isso é o âmbito do cartão "Detalhe da volta" (por fazer).

## Ocorrências

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| POST | /ocorrencias | Cria uma ocorrência de uma volta OU de uma visita (exatamente uma das duas). `autor_id` é sempre o utilizador autenticado, nunca vindo do pedido (RNF04) | todos |
| GET | /ocorrencias | Lista ocorrências, filtros opcionais `volta_id`, `visita_id` | todos |

## Rotas (preparação para o algoritmo)

Ainda não implementado. Nesta fase não há cálculo de rotas nem endpoint de
exportação de dados para o algoritmo — é uma fase futura.

## Relatórios

Ainda não implementado.

## Utilizadores

Ainda não implementado (gestão de contas/perfis por um admin).

## Sistema

| Método | Rota | Descrição | Estado |
|---|---|---|---|
| GET | /health | Estado da API e do PostGIS | implementado |

## Em aberto

- Autorização por perfil nos endpoints (hoje qualquer utilizador autenticado acede a tudo).
- Paginação em `GET /utentes` e `GET /voltas`.
- `GET /voltas/{id}` com detalhe completo, mapa do percurso e distância (cartão "Detalhe da volta").
- Recálculo de horários quando há atraso (cartão "Atrasos: recálculo de horários").
- CRUD de viaturas (criar/editar).
- Rotas (algoritmo), relatórios e gestão de utilizadores: por implementar.
- Mensagens e notificações (menu "Mensagens" e sino do mockup): fazem parte desta fase?
