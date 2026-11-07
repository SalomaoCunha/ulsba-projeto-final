# Base de dados — PostgreSQL 16 + PostGIS 3.4

> **Projeto ULSBA — apenas dados fictícios.**
>
> Todos os comandos devem ser executados no **PowerShell, na raiz do repositório**, onde se encontra o ficheiro `docker-compose.yml`, com o Docker Desktop iniciado.

## 1. Estrutura

| Caminho | Descrição |
|---|---|
| `init/01-postgis.sql` | Ativa a extensão PostGIS na primeira inicialização de um volume PostgreSQL vazio. |
| `migrations/0001_modelo_inicial.sql` | Modelo relacional inicial: 30 tabelas, 18 ENUM, relações, índices, triggers e vistas. |
| `migrations/0002_extensoes_modelo_documentado.sql` | Adiciona `escala_profissional`, `territorio_cobertura` e o snapshot geográfico de `paragem`. |
| `migrations/0003_integridade_operacional.sql` | Reforça as regras de integridade de voltas, visitas, recursos, participantes e retificações. |
| `migrations/0004_ajuste_niveis_urgencia.sql` | Desativa os níveis provisórios A/B/C/NU e introduz U0, U1, U2, NU1 e NU2. |
| `migrate/Dockerfile` e `migrate/runner.py` | Serviço Docker `db-migrate` que aplica apenas as migrações pendentes e mantém o histórico de versões. |
| `migrate/test_runner.py` | Testes do mecanismo de migrações. |
| `tests/0001_verificacao_postgis.sql` | Verificação SQL do modelo e do PostGIS; reverte os dados temporários com `ROLLBACK`. |


**Após as quatro migrações:** 32 tabelas de domínio, 252 atributos, 18 ENUM e cinco níveis de urgência ativos. O migrador acrescenta a tabela técnica `public.schema_migrations`, que não pertence às 32 tabelas de domínio.

A documentação do modelo e dos requisitos encontra-se em [`docs/modelo-dados.md`](../docs/modelo-dados.md) e [`docs/requisitos.md`](../docs/requisitos.md).

## 2. Primeira instalação — base de dados nova

Se ainda não existir um ficheiro `.env` na raiz, cria-o a partir do exemplo:

```powershell
Copy-Item .env.example .env
notepad .env
```

Configura `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB`.

Inicia os serviços:

```powershell
docker compose up -d --build
```

O Docker segue esta sequência:

1. Inicia `db` (PostgreSQL/PostGIS) e aguarda que esteja disponível.
2. Executa `db-migrate`, aplicando `0001` → `0002` → `0003` → `0004`, ou apenas as versões pendentes.
3. Inicia o backend FastAPI após a conclusão bem-sucedida das migrações.
4. Inicia o frontend.

**Numa base nova não é necessário executar SQL manualmente nem utilizar `baseline`.** É normal que o contentor `db-migrate` termine com o estado `Exited (0)`; trata-se de um serviço de execução única.

## 3. Confirmar que as migrações foram aplicadas

```powershell
# Estado dos contentores
docker compose ps -a

# Logs das migrações
docker compose logs --tail=100 db-migrate

# Versões aplicadas e pendentes
docker compose run --rm db-migrate status
```

No DBeaver, consulta o histórico:

```sql
SELECT version, filename, origem, aplicada_em
FROM public.schema_migrations
ORDER BY version;
```

Numa instalação nova, devem existir as versões 1 a 4 com `origem = 'migrate'`. Para verificar os níveis de urgência:

```sql
SELECT codigo, designacao, ordem, ativo
FROM public.nivel_urgencia
ORDER BY ativo DESC, ordem;
```

Devem estar **ativos** U0, U1, U2, NU1 e NU2; os códigos antigos A, B, C e NU permanecem **inativos** para preservar o histórico.

## 4. Comandos do dia a dia

```powershell
# Iniciar/reconstruir o projeto
docker compose up -d --build

# Parar os serviços sem eliminar os dados
docker compose down

# Verificar as migrações
docker compose run --rm db-migrate status

# Aplicar explicitamente apenas as migrações pendentes
docker compose run --rm db-migrate migrate

# Ver erros do migrador
docker compose logs --tail=100 db-migrate
```

Ao acrescentar uma migração, o serviço deve aplicar **apenas essa nova versão**. O migrador regista versão, nome do ficheiro, data, origem e checksum SHA-256 na tabela `schema_migrations`.

**Não alteres ficheiros de migração já aplicados.** O migrador verifica os checksums e recusa discrepâncias. Para mudar o esquema, cria uma nova migração incremental.

> O serviço é executado pelo Docker Compose durante a criação/recriação de `db-migrate`, não por um simples `docker restart` isolado. Se quiseres garantir a verificação de migrações pendentes em qualquer momento, utiliza `docker compose run --rm db-migrate migrate`.

## 5. Base de dados existente — migrações anteriormente executadas à mão

**Esta secção não se aplica a instalações novas.** Se o volume já contém o esquema criado manualmente, é necessário registar uma *baseline* uma única vez, para impedir que o migrador tente recriar as mesmas tabelas.

Primeiro, inicia apenas a BD e constrói o migrador:

```powershell
docker compose up -d db
docker compose build db-migrate
```

Faz uma cópia de segurança:

```powershell
docker compose exec db sh -c 'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /tmp/ulsba_pre_baseline.dump'
docker compose cp db:/tmp/ulsba_pre_baseline.dump ./ulsba_pre_baseline.dump
```

Guarda o backup fora do Git. Depois, verifica o estado:

```powershell
docker compose run --rm db-migrate status
```

**Apenas se confirmares que as quatro migrações foram realmente aplicadas e que o esquema está na versão 4**, regista a baseline:

```powershell
docker compose run --rm db-migrate baseline 4
docker compose up -d --build
```

A `baseline` regista as migrações existentes sem executar de novo o SQL nem eliminar dados. Se o comando `status` indicar uma versão incompleta ou inconsistente, **não executes `baseline 4`**: verifica primeiro o esquema e as migrações em falta.

## 6. Executar o teste SQL da base de dados

Após as migrações, executa:

```powershell
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /db-tests/0001_verificacao_postgis.sql'
```

O teste verifica, entre outros aspetos, as 32 tabelas de domínio, os 252 atributos, os 18 ENUM, o SRID 4326 e algumas restrições geográficas e operacionais. Os dados criados durante a verificação são revertidos por `ROLLBACK`.

Este teste **não substitui** testes completos de regras de negócio, concorrência, autenticação ou auditoria da API.
