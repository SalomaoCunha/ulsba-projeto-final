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
| PUT | /utentes/{id}/coordenadas | Corrigir manualmente lat/lng do utente (ex. a partir do ecrã de Mapa) | coordenador, admin |
| POST | /utentes/{id}/prioridade | Registar nova avaliação de prioridade/urgência | coordenador, enfermeiro |
| GET | /utentes/{id}/historico-prioridade | Histórico de avaliações de prioridade | todos |
| POST | /utentes/{id}/complexidade | Registar nova avaliação de complexidade (IPCPAL) | coordenador, enfermeiro |
| GET | /utentes/{id}/historico-complexidade | Histórico de avaliações de complexidade | todos |
| POST | /utentes/{id}/equipa | Atribuir equipa responsável (fecha o período anterior automaticamente) | coordenador |
| GET | /utentes/{id}/historico-equipa | Histórico de equipas responsáveis | todos |
| PUT | /utentes/{id}/ativar | Passar o utente de REFERENCIADO a ATIVO, com motivo e data | coordenador, admin |
| PUT | /utentes/{id}/inativar | Marcar utente como inativo, com motivo e data (RF03, RF07). 400 se já estiver inativo | coordenador, admin |

## Locais

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /locais | Lista locais ativos (id, tipo, nome, morada, localidade, concelho, lat/lng) | todos |
| GET | /locais/concelhos | Lista concelhos (id, nome) para criar locais | todos |
| POST | /locais | Criar local (morada + concelho; coordenadas opcionais, fornecidas pelo cliente, sem geocoding externo) | coordenador, admin |
| PUT | /locais/{id}/coordenadas | Definir/corrigir a coordenada de um local já existente (ex. ao marcar no mapa) | coordenador, admin |

## Equipas

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /equipas | Lista equipas visíveis ao utilizador autenticado, com membros atuais. Sem `vista_geral`, mostra só as do utilizador (RF49) | todos |
| GET | /equipas/profissionais | Lista profissionais disponíveis para compor equipas | todos |
| POST | /equipas | Criar equipa com código, designação opcional e membros | coordenador, admin |
| PUT | /equipas/{id} | Atualizar código, designação e composição da equipa | coordenador, admin |
| DELETE | /equipas/{id} | Apagar a equipa; se tiver histórico associado (membros, utentes ou voltas), desativa (`ativa=false`) em vez de apagar | coordenador, admin |

## Níveis (referência)

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /niveis/urgencia | Lista níveis de urgência ativos (id, codigo, designacao, cor_hex, ordem) | todos |
| GET | /niveis/complexidade | Lista níveis de complexidade ativos (id, codigo, designacao, ordem) | todos |

Servem para o frontend converter o texto mostrado ao utilizador (ex.: "Urgente
0 dias") no `id` real que `POST /utentes/{id}/prioridade` e
`.../complexidade` exigem.

## Viaturas

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /viaturas | Listar viaturas (matrícula, autonomia, estado, equipa associada) | todos |
| POST | /viaturas | Criar viatura | coordenador, admin |
| PUT | /viaturas/{id} | Editar viatura (matrícula, modelo, combustível, autonomia, lugares, estado, equipa associada) | coordenador, admin |
| DELETE | /viaturas/{id} | Apagar a viatura; se tiver voltas associadas, marca `estado=INATIVA` em vez de apagar | coordenador, admin |
| GET | /viaturas/bloqueios | Listar bloqueios/impedimentos, filtros opcionais `viatura_id`, `data_inicio`, `data_fim` | todos |
| POST | /viaturas/{id}/bloqueios | Registar um bloqueio por intervalo de dias (manutenção ou indisponibilidade pontual) | coordenador, admin |
| DELETE | /viaturas/bloqueios/{id} | Remover um bloqueio | coordenador, admin |

Criar/editar uma viatura não verifica conflitos de datas com bloqueios já
existentes — essa verificação acontece do lado do cliente, ao construir uma
volta (`PainelConstrucaoRota`), que exclui viaturas bloqueadas no dia.

## Voltas e visitas (agenda)

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| GET | /voltas | Voltas num intervalo `data_inicio`/`data_fim`, filtros opcionais `equipa_id`, `viatura_id`, `profissional_id`, `estado`. Sem `vista_geral`, mostra só voltas das equipas do utilizador (RF49) | todos |
| GET | /voltas/visitas | Visitas num intervalo `data_inicio`/`data_fim`, filtros opcionais `utente_id`, `profissional_id`, `estado` (ainda sem filtro por `equipa_id`/`viatura_id`) | todos |
| POST | /voltas | Cria uma volta (data + equipa + viatura + lista de `utente_ids`): agrupa os utentes por local em paragens e cria uma visita sequencial de 30 min por utente, já com estado `PLANEADA`. Recusa (400) se o número de visitas ultrapassar a hora-limite de regresso a Beja | coordenador |
| GET | /voltas/{id} | Detalhe completo: dados da volta + paragens aninhadas, cada uma com a sua lista de visitas (horários previstos/reais, estado, prioridade do utente) + resumo calculado (durações, distância, avisos de coerência) | todos |
| PUT | /voltas/{id}/confirmar | Confirma uma volta em RASCUNHO (grava `confirmada_por`/`confirmada_em`, exigidos pela BD para qualquer estado seguinte). Recusa (409) se a viatura/equipa já estiver confirmada noutra volta com horário sobreposto | coordenador |
| PUT | /voltas/{id}/concluir | Marca a volta como feita numa única chamada: confirma-a primeiro se ainda estiver em RASCUNHO, fecha com o horário previsto qualquer visita ainda não concluída/cancelada, e só depois fecha a volta | coordenador |
| PUT | /voltas/{id}/horarios-reais | Regista a saída e/ou o regresso reais da volta; se a saída for posterior à prevista, desloca automaticamente os horários previstos seguintes e o regresso | coordenador |
| PUT | /voltas/{id}/visitas/{visita_id}/horarios-reais | Regista o início e/ou fim reais de uma visita; propaga eventuais atrasos para as visitas seguintes da mesma volta | coordenador, profissional |
| PUT | /voltas/{id}/visitas/{visita_id}/cancelar | Cancela uma visita planeada/em curso, com motivo obrigatório (RF29). Não permite cancelar uma visita já concluída ou cancelada | coordenador |

Não existe ainda edição de uma volta já criada (mudar equipa/viatura,
adicionar ou remover uma visita) — só é possível cancelar visitas
individuais ou concluir/confirmar a volta toda.

## Ocorrências

| Método | Rota | Descrição | Perfis |
|---|---|---|---|
| POST | /ocorrencias | Cria uma ocorrência de uma volta OU de uma visita (exatamente uma das duas). `autor_id` é sempre o utilizador autenticado, nunca vindo do pedido (RNF04) | todos |
| GET | /ocorrencias | Lista ocorrências, filtros opcionais `volta_id`, `visita_id` | todos |

## Rotas (preparação para o algoritmo)

Ainda não implementado. Nesta fase não há cálculo de rotas nem endpoint de
exportação de dados para o algoritmo — é uma fase futura. O frontend já tem
um botão placeholder "Gerar Rota Ótima" (`BarraAcoesDashboard.tsx`).

## Relatórios

Ainda não implementado. A página `/relatorios` existe no frontend como
placeholder.

## Utilizadores

Ainda não implementado (gestão de contas/perfis por um admin).

## Sistema

| Método | Rota | Descrição | Estado |
|---|---|---|---|
| GET | /health | Estado da API e do PostGIS | implementado |

## Em aberto

- Autorização por perfil nos endpoints (hoje qualquer utilizador autenticado acede a tudo).
- Paginação em `GET /utentes` e `GET /voltas`.
- Editar uma volta depois de criada (mudar equipa/viatura, adicionar visita); cálculo real de distância da volta (hoje fica a `NULL`).
- Filtro por `equipa_id`/`viatura_id` em `GET /voltas/visitas`.
- Geocodificação automática a partir da morada ao criar um local (hoje as coordenadas são só marcadas manualmente no mapa).
- Vista de calendário por dia/semana (hoje `GET /voltas` já suporta os filtros, falta só o componente de calendário no frontend).
- Rotas (algoritmo), relatórios e gestão de utilizadores: por implementar.
- Mensagens e notificações (menu "Mensagens" e sino do mockup): fazem parte desta fase?
