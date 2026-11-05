# Base de dados — PostgreSQL 16 + PostGIS 3.4

> **Dados fictícios exclusivamente.**

## Estrutura

| Caminho | Descrição |
|---|---|
| `init/01-postgis.sql` | Script já existente; ativa `postgis` **apenas na primeira inicialização de um volume vazio** |
| `migrations/0001_modelo_inicial.sql` | Base relacional: 30 tabelas, 18 ENUM, 235 atributos, FKs, índices, triggers e vistas |
| `migrations/0002_extensoes_modelo_documentado.sql` | Adiciona `escala_profissional`, `territorio_cobertura` e o snapshot das coordenadas de `paragem` |
| `migrations/0003_integridade_operacional.sql` | Reforça integridade de voltas, visitas, recursos, participantes e retificações |
| `tests/0001_verificacao_postgis.sql` | Teste SQL de fumo com dados fictícios temporários e `ROLLBACK` |

**Resultado esperado após as três migrações:** 32 tabelas de domínio, 252 atributos e 18 ENUM. Os diagramas e o dicionário devem manter-se alinhados com [`docs/requisitos.md`](../docs/requisitos.md) e, quando estiver integrado na branch, com `docs/modelo-dados.md`.

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

# Verificar o estado do PostGIS e da ligação:
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT PostGIS_Version();"'
```

O servidor de PostgreSQL está disponível em **`localhost:5432`** no Windows, conforme o `docker-compose.yml` deste projeto; dentro da rede Docker, o backend liga-se a **`db:5432`**. A base, utilizador e palavra-passe vêm da **raiz** `.env` (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`); os valores de `.env.example` são apenas exemplos.

> Caso a porta 5432 já esteja ocupada no Windows, altera **somente a porta do anfitrião** em `docker-compose.yml`, por exemplo `127.0.0.1:5433:5432`. O backend continua a usar `db:5432`.

## 2. Aplicar migrações

Executar os três comandos **por ordem**, uma única vez, na **raiz do repositório**:

```powershell
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /migrations/0001_modelo_inicial.sql'
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /migrations/0002_extensoes_modelo_documentado.sql'
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /migrations/0003_integridade_operacional.sql'
```

Cada ficheiro tem `BEGIN` e `COMMIT`; `-v ON_ERROR_STOP=1` pára ao primeiro erro. **Não executar outra vez uma migração já aplicada.** A execução repetida não está preparada para ser idempotente e pode falhar com «table already exists». Se a base contiver outras tabelas de desenvolvimento, verificar primeiro antes de aplicar o esquema. Não executar em bases de dados reais.

**Atenção a volumes antigos:** `docker compose up -d` **não volta a executar** `db/init/01-postgis.sql` se o volume existir. Isso é normal. Se o PostGIS não estiver ativo no volume, um administrador pode ativá-lo na base correta com `CREATE EXTENSION IF NOT EXISTS postgis;`. **Não executar `docker compose down -v`** para tentar resolver isso: `-v` apaga irreversivelmente os dados do volume da BD.

## 3. Teste de verificação (não guarda os dados de ensaio)

```powershell
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /db-tests/0001_verificacao_postgis.sql'
```

O teste verifica PostGIS e `btree_gist`, as **32 tabelas, 252 campos, 18 ENUM**, SRID 4326, distância em metros, prevenção de escalas sobrepostas, captura do ponto de uma paragem e verificação de cobertura territorial. Os dados de ensaio são fictícios e são revertidos por `ROLLBACK`.

O teste de fumo **não cobre** todas as regras de negócio, autorizações, concorrência, nem registos automáticos de auditoria. Estas áreas exigem testes de integração específicos na API FastAPI.

### Inspeção rápida (no psql)

```powershell
# Tabelas de domínio:
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\\dt"'

# Tipos PostGIS das coordenadas:
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT f_table_name, f_geography_column, srid, type FROM geography_columns ORDER BY f_table_name;"'
```

## 4. Limites e decisões pendentes

- Não há geração automática de eventos em `auditoria`; a futura API deverá registar mudanças sensíveis na mesma transação e assegurar restrições de acesso.
- `escala_profissional` permite planear turnos e impede sobreposições, mas **exigir uma escala prévia como requisito da confirmação** depende de validação operacional.
- Os limites geográficos aprovados dependem de dados oficiais. Não foram inventados polígonos do Baixo Alentejo.
- As restrições de integridade em SQL não substituem validação na API nem testes concorrentes (operações simultâneas).
- Os requisitos RF/RNF e o modelo ER ainda podem evoluir durante a revisão pela equipa/professora.
- O script `0001` usa uma baseline inicial e deve ser aplicado **somente sobre uma base sem este esquema**. Não foi usado nenhum dado real de utentes.

