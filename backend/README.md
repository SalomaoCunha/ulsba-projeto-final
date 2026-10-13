# Backend

API e lógica de servidor da plataforma ULSBA.

## Tecnologia

- **API:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Base de dados:** PostgreSQL com PostGIS ([psycopg](https://www.psycopg.org/psycopg3/))
- **Ambiente:** Docker Compose

> Responsável: Miguel Sanina (API) e Beatriz Caixeiro (modelo de dados).

## Como arrancar

A forma recomendada é via Docker, a partir da raiz do repositório (ver [README.md](../README.md)):

```bash
docker compose up --build
```

A API fica disponível em http://localhost:8000, com documentação interativa em http://localhost:8000/docs e verificação de estado (ligação à BD e PostGIS) em http://localhost:8000/health.

## Variáveis de ambiente

| Variável       | Descrição                                    |
| -------------- | --------------------------------------------- |
| `DATABASE_URL` | String de ligação PostgreSQL (definida pelo `docker-compose.yml` a partir das variáveis em `.env`) |

Os requisitos que a API deve cumprir estão em [docs/requisitos.md](../docs/requisitos.md).