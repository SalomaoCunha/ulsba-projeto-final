# Base de dados — PostgreSQL 16 + PostGIS 3.4

> **Dados fictícios exclusivamente.**

## Estrutura

| Caminho | Descrição |
|---|---|
| `init/01-postgis.sql` | Script já existente; ativa `postgis` **apenas na primeira inicialização de um volume vazio** |
| `migrations/0001_modelo_inicial.sql` | Base relacional: 30 tabelas, 18 ENUM, 235 atributos, FKs, índices, triggers e vistas |
| `migrations/0002_extensoes_modelo_documentado.sql` | Adiciona `escala_profissional`, `territorio_cobertura` e o snapshot das coordenadas de `paragem` |
| `migrations/0003_integridade_operacional.sql` | Reforça integridade de voltas, visitas, recursos, participantes e retificações |
| `migrations/0004_ajuste_niveis_urgencia.sql` | Alinha o catálogo `nivel_urgencia` com o mockup: desativa os níveis provisórios A/B/C/NU e insere os cinco níveis U0, U1, U2, NU1 e NU2 |
| `tests/0001_verificacao_postgis.sql` | Teste SQL de fumo com dados fictícios temporários e `ROLLBACK` |

**Resultado esperado após as quatro migrações:** 32 tabelas de domínio, 252 atributos e 18 ENUM (a `0004` só altera dados de referência, não o esquema), com cinco níveis de urgência ativos. Os diagramas e o dicionário devem manter-se alinhados com [`docs/requisitos.md`](../docs/requisitos.md) e com [`docs/modelo-dados.md`](../docs/modelo-dados.md).

### O que já existia neste projeto

O repositório **já tinha** `db/init/01-postgis.sql`, um serviço `db` com a imagem `postgis/postgis:16-3.4`, `DATABASE_URL` para a API FastAPI e as variáveis de ambiente na **raiz**. Mantivemos essa arquitetura.

**Não confundir:** os scripts em `db/init/` correm automaticamente uma única vez quando o volume Docker é inicializado; os de `db/migrations/` devem ser executados **explicitamente, por ordem**. Isto funciona tanto com volume novo como com volume já existente que contenha apenas a extensão PostGIS, desde que ainda não existam as tabelas deste modelo.

## 1. Preparação (PowerShell no VS Code, na raiz do repositório)

```powershell
# Se ainda não houver .env na raiz:
Copy-Item .env.example .env
notepad .env

# A password deve ser alterada; não comitar .env
# Arrancar APENAS a base de dados (não é preciso executar o frontend):
docker compose up -d db

# Confirmar que o contentor vê as migrações (devem aparecer as quatro):
docker compose exec db ls /migrations

# Verificar o estado do PostGIS e da ligação:
"SELECT PostGIS_Version();" | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

O servidor de PostgreSQL está disponível em **`localhost:5432`** no Windows, conforme o `docker-compose.yml` deste projeto; dentro da rede Docker, o backend liga-se a **`db:5432`**. A base, utilizador e palavra-passe vêm da **raiz** `.env` (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`); os valores de `.env.example` são apenas exemplos.

> Caso a porta 5432 já esteja ocupada no Windows, altera **somente a porta do anfitrião** em `docker-compose.yml`, por exemplo `127.0.0.1:5433:5432`. O backend continua a usar `db:5432`. A porta pode estar ocupada por contentores de outra cópia do projeto: verifica com `docker ps` e, se for o caso, pára-os com `docker stop <nome>`.

> **Nota sobre aspas no PowerShell:** algumas versões do PowerShell removem as aspas duplas dentro de um comando. Por isso, as consultas SQL abaixo são enviadas por *pipe* (`"SELECT ..." | docker compose exec -T db sh -c '...'`). Os comandos com `-f` (ficheiros) não têm este problema.

## 2. Aplicar migrações

Executar os quatro comandos **por ordem**, uma única vez, na **raiz do repositório**, **um de cada vez** (esperar que cada um termine em `COMMIT` antes de colar o seguinte):

```powershell
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /migrations/0001_modelo_inicial.sql'
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /migrations/0002_extensoes_modelo_documentado.sql'
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /migrations/0003_integridade_operacional.sql'
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /migrations/0004_ajuste_niveis_urgencia.sql'
```

Cada ficheiro tem `BEGIN` e `COMMIT`; `-v ON_ERROR_STOP=1` pára ao primeiro erro. **Não executar outra vez uma migração já aplicada.** A execução repetida não está preparada para ser idempotente e pode falhar com «table already exists» (a `0004` falha de propósito com «0004 já aplicada»). Se a base contiver outras tabelas de desenvolvimento, verificar primeiro antes de aplicar o esquema. Não executar em bases de dados reais.

**Atenção a volumes antigos:** `docker compose up -d` **não volta a executar** `db/init/01-postgis.sql` se o volume existir. Isso é normal. Se o PostGIS não estiver ativo no volume, um administrador pode ativá-lo na base correta com `CREATE EXTENSION IF NOT EXISTS postgis;`. **Não executar `docker compose down -v`** para tentar resolver isso: `-v` apaga irreversivelmente os dados do volume da BD (só é aceitável numa base de desenvolvimento descartável).

## 3. Teste de verificação (não guarda os dados de ensaio)

```powershell
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /db-tests/0001_verificacao_postgis.sql'
```

O teste verifica PostGIS e `btree_gist`, as **32 tabelas, 252 campos, 18 ENUM**, SRID 4326, distância em metros, prevenção de escalas sobrepostas, captura do ponto de uma paragem e verificação de cobertura territorial. Os dados de ensaio são fictícios e são revertidos por `ROLLBACK`. Termina com a mensagem `OK: 32 tabelas, 252 campos, 18 ENUM, SRID 4326, ...`.

O teste de fumo **não cobre** todas as regras de negócio, autorizações, concorrência, nem registos automáticos de auditoria, e **não verifica os níveis de urgência**. Estas áreas exigem testes de integração específicos na API FastAPI.

### Inspeção rápida (no psql)

```powershell
# Níveis de urgência (devem aparecer U0, U1, U2, NU1 e NU2 ativos; A, B, C e NU inativos):
"SELECT codigo, designacao, ordem, ativo FROM nivel_urgencia ORDER BY ativo DESC, ordem;" | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# Tabelas de domínio:
"\dt" | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# Tipos PostGIS das coordenadas:
"SELECT f_table_name, f_geography_column, srid, type FROM geography_columns ORDER BY f_table_name;" | docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

## 4. Limites e decisões pendentes

- Não há geração automática de eventos em `auditoria`; a futura API deverá registar mudanças sensíveis na mesma transação e assegurar restrições de acesso.
- `escala_profissional` permite planear turnos e impede sobreposições, mas **exigir uma escala prévia como requisito da confirmação** depende de validação operacional.
- Os limites geográficos aprovados dependem de dados oficiais. Não foram inventados polígonos do Baixo Alentejo.
- **Níveis de urgência provisórios:** os cinco níveis (U0, U1, U2, NU1, NU2) seguem o mockup e as cores do frontend, mas ainda não foram validados pela ULSBA (RF11, ponto em aberto 1). `prazo_max_sem_visita_dias` está a `NULL` («por definir») porque não se presume que «0 dias» seja um prazo; o CHECK atual só aceita valores positivos.
- As restrições de integridade em SQL não substituem validação na API nem testes concorrentes (operações simultâneas).
- Os requisitos RF/RNF e o modelo ER ainda podem evoluir durante a revisão pela equipa/professora.
- O script `0001` usa uma baseline inicial e deve ser aplicado **somente sobre uma base sem este esquema**. Não foi usado nenhum dado real de utentes.