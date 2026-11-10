# RF40 — Dados fictícios do Baixo Alentejo

Este seed cria um conjunto **inteiramente fictício** de dados de demonstração para a plataforma ULSBA. É independente das migrações e destina-se **apenas a desenvolvimento/sandbox**.

## Conteúdo

- 30 utentes distribuídos pelos **13 concelhos do Baixo Alentejo**: Aljustrel, Almodôvar, Alvito, Barrancos, Beja, Castro Verde, Cuba, Ferreira do Alentejo, Mértola, Moura, Ourique, Serpa e Vidigueira.
- 27 locais georreferenciados, incluindo a base em Beja; domicílios, lares e unidades.
- 6 profissionais, 2 equipas e 2 viaturas.
- Prioridades **U0, U1, U2, NU1, NU2**, graus IPCPAL e registos PPS.
- 14 voltas e 46 visitas (36 concluídas, 6 planeadas, 3 pendentes e 1 cancelada).
- Exemplos de fichas do frontend, com nomes e informação clínica **inventados**.

As coordenadas são aproximadas às localidades; **não identificam domicílios reais**. As hipóteses operacionais ainda carecem de validação pela ULSBA.

## Pré-requisitos

Docker Desktop instalado, `.env` configurado e projeto iniciado **na raiz do repositório**. O serviço `db-migrate` aplica automaticamente as migrações `0001`–`0004` antes do backend.

```powershell
docker compose up -d --build
docker compose run --rm db-migrate status
```

## Executar o seed (PowerShell, na raiz do projeto)

```powershell
$cid = docker compose ps -q db
docker cp ".\db\seed\0001_dados_ficticios.sql" "${cid}:/tmp/rf40_seed.sql"
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /tmp/rf40_seed.sql'
```

A execução só é considerada bem-sucedida se terminar com **`COMMIT` sem erros**. O seed **não é executado automaticamente** ao iniciar o Docker.

## Verificar os dados

```powershell
docker cp ".\db\tests\0002_verificacao_seed_rf40.sql" "${cid}:/tmp/rf40_check.sql"
docker compose exec -T db sh -c 'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -f /tmp/rf40_check.sql'
```

Para verificar a reprodutibilidade, volta a executar o seed e os testes. Em condições normais, o seed não duplica os registos e a `assinatura_rf40` permanece igual se os dados não tiverem sido alterados.

No DBeaver, consulta a distribuição territorial:

```sql
SELECT concelho, COUNT(*) AS total_utentes
FROM vw_utente_ficha
WHERE numero_utente BETWEEN '12545' AND '12574'
GROUP BY concelho
ORDER BY concelho;
```

O ficheiro de testes valida também a presença dos 13 concelhos, as coordenadas PostGIS, os estados e as principais fichas do frontend.
