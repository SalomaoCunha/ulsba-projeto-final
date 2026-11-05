# API: endpoints principais

Prefixo: `/api/v1` (exceto `/health`). Formato: JSON; o mapa usa GeoJSON.
Autenticação: JWT no cabeçalho `Authorization: Bearer <token>`.
Documentação interativa gerada automaticamente: `http://localhost:8000/docs`.

Perfis: `admin`, `coordenador`, `enfermeiro` (a validar).

> Nomes de campos e tabelas devem coincidir com o modelo de dados
> (ver documentação do modelo ER na pasta `docs/`).

## Autenticação

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| POST | /auth/login | Login, devolve token JWT | público |
| GET | /auth/me | Utilizador autenticado e perfil | todos |

## Utentes

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /utentes | Lista com filtros `numero`, `nome`, `prioridade`, `ativo` e paginação | todos |
| GET | /utentes/{id} | Ficha completa do utente | todos |
| POST | /utentes | Criar utente | coordenador, admin |
| PATCH | /utentes/{id} | Editar dados da ficha | coordenador, admin |
| PATCH | /utentes/{id}/prioridade | Atualizar prioridade de atendimento | coordenador, enfermeiro |
| GET | /utentes/geo | Utentes em GeoJSON para o mapa (filtros `prioridade`, `bbox`) | todos |
| GET | /utentes/{id}/visitas | Histórico de visitas do utente | todos |

## Prioridades

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /prioridades | Níveis de prioridade e cores (legenda do mapa) | todos |

Níveis do mockup: Urgente 0 dias, Urgente 1 dia, Urgente 2 dias,
Não urgente 1, Não urgente 2 (a validar com a equipa de cuidados paliativos).

## Agenda e visitas

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /agenda | Visitas planeadas (filtros `data`, `viatura_id`) | todos |
| POST | /visitas | Agendar visita | coordenador |
| GET | /visitas/{id} | Detalhe da visita | todos |
| PATCH | /visitas/{id} | Reagendar, cancelar, atribuir viatura | coordenador |
| POST | /visitas/{id}/registo | Registar visita realizada | enfermeiro, coordenador |

## Viaturas

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /viaturas | Listar viaturas | todos |
| POST | /viaturas | Criar viatura | coordenador, admin |
| PATCH | /viaturas/{id} | Editar, ativar ou desativar | coordenador, admin |

## Rotas (preparação para o algoritmo)

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /rotas/dados?data=YYYY-MM-DD | Exporta os dados que o algoritmo precisa: utentes, coordenadas, prioridades, viaturas | coordenador |

Nesta fase não há cálculo de rotas. A integração do algoritmo é uma fase futura.

## Relatórios

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /relatorios/resumo | Totais do dashboard: utentes no mapa, urgentes, não urgentes, distância total | todos |
| GET | /relatorios/visitas | Visitas por período (`de`, `ate`) | coordenador |

## Utilizadores

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /utilizadores | Listar utilizadores | admin |
| POST | /utilizadores | Criar utilizador e perfil | admin |
| PATCH | /utilizadores/{id} | Editar ou desativar | admin |

## Sistema

| Método | Rota | Descrição | Estado |
|---|---|---|---|
| GET | /health | Estado da API e do PostGIS | implementado |

## Em aberto

- Níveis de prioridade e critérios (a validar com a equipa de cuidados paliativos).
- Perfis e permissões finais.
- Mensagens e notificações (menu "Mensagens" e sino do mockup): fazem parte desta fase?
- Alinhar nomes de campos com o modelo de dados.