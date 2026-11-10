"""Migrações transacionais PostgreSQL/PostGIS do projeto ULSBA.

Aplica os SQL existentes sem modificar os ficheiros originais. O invólucro
BEGIN/COMMIT de cada script é substituído por uma transação psycopg que inclui
o registo da versão. Uma falha reverte ambos.

Uso:
  python runner.py migrate
  python runner.py status
  python runner.py baseline 4    # APENAS após conferir esquema existente
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path

MIGRATIONS_DIR = Path(os.environ.get("MIGRATIONS_DIR", "/migrations"))
FILE_RE = re.compile(r"^(\d{4})_[a-z0-9_]+\.sql$")
BEGIN_RE = re.compile(r"\s*BEGIN\s*;\s*", flags=re.IGNORECASE)
COMMIT_RE = re.compile(r"\s*COMMIT\s*;\s*", flags=re.IGNORECASE)
HISTORY_TABLE = "public.schema_migrations"
# Inteiro de aplicação partilhado apenas pelos processos deste projeto.
LOCK_A, LOCK_B = 85264, 2026


class MigrationError(Exception):
    """Estado de migração inválido; interromper sem alterar as tabelas do domínio."""


@dataclass(frozen=True)
class Migration:
    version: int
    filename: str
    checksum: str
    sql: str


def sql_without_transaction_wrapper(raw: str, name: str) -> str:
    """Aceita exclusivamente UM BEGIN/COMMIT de nível superior, em linhas isoladas.

    A validação impede que uma alteração futura aos scripts introduza commits
    independentes que comprometam a atomicidade da migração e do histórico.
    """
    lines = raw.splitlines(keepends=True)
    starts = [i for i, line in enumerate(lines) if BEGIN_RE.fullmatch(line)]
    ends = [i for i, line in enumerate(lines) if COMMIT_RE.fullmatch(line)]
    if len(starts) != 1 or len(ends) != 1 or starts[0] >= ends[0]:
        raise MigrationError(
            f"{name}: esperado exatamente um BEGIN; e um COMMIT; "
            "em linhas isoladas (invólucro da migração)."
        )
    # Todos os elementos fora do invólucro têm de ser comentários ou espaços.
    outer = lines[: starts[0]] + lines[ends[0] + 1 :]
    if any(line.strip() and not line.lstrip().startswith("--") for line in outer):
        raise MigrationError(f"{name}: instruções SQL fora de BEGIN/COMMIT.")
    # O SQL restante é enviado ao PostgreSQL tal como foi escrito, incluindo
    # CREATE FUNCTION ... $$ e blocos DO $$ ... $$ (sem dividir por ';').
    return "".join(lines[: starts[0]] + lines[starts[0] + 1 : ends[0]] + lines[ends[0] + 1 :])


def load_migrations(folder: Path) -> list[Migration]:
    if not folder.is_dir():
        raise MigrationError(f"Pasta de migrações não encontrada: {folder}")
    items = []
    for path in folder.iterdir():
        if path.suffix.lower() != ".sql":
            continue
        match = FILE_RE.fullmatch(path.name)
        if not match:
            raise MigrationError(f"Nome de migração inválido: {path.name}")
        raw_bytes = path.read_bytes()
        try:
            raw = raw_bytes.decode("utf-8-sig")
        except UnicodeDecodeError as error:
            raise MigrationError(f"{path.name}: ficheiro não está em UTF-8") from error
        items.append(
            Migration(
                version=int(match.group(1)),
                filename=path.name,
                checksum=hashlib.sha256(raw_bytes).hexdigest(),
                sql=sql_without_transaction_wrapper(raw, path.name),
            )
        )
    items.sort(key=lambda m: m.version)
    if not items:
        raise MigrationError(f"Não foram encontrados ficheiros SQL em {folder}")
    versions = [m.version for m in items]
    if versions != list(range(1, len(items) + 1)):
        raise MigrationError(
            "As migrações devem ter versões consecutivas 0001, 0002, ... "
            f"(encontradas: {versions})."
        )
    return items


def relation_exists(conn, name: str) -> bool:
    return conn.execute("SELECT to_regclass(%s) IS NOT NULL", (name,)).fetchone()[0]


def column_exists(conn, table: str, column: str) -> bool:
    return conn.execute(
        """SELECT EXISTS (
               SELECT 1 FROM information_schema.columns
               WHERE table_schema = 'public' AND table_name = %s
                 AND column_name = %s
           )""",
        (table, column),
    ).fetchone()[0]


def function_exists(conn, name: str) -> bool:
    return conn.execute(
        """SELECT EXISTS (
              SELECT 1 FROM pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public' AND p.proname = %s
           )""",
        (name,),
    ).fetchone()[0]


def trigger_exists(conn, table: str, trigger: str) -> bool:
    return conn.execute(
        """SELECT EXISTS (
             SELECT 1 FROM pg_trigger t
             JOIN pg_class c ON c.oid = t.tgrelid
             JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relname = %s
               AND t.tgname = %s AND NOT t.tgisinternal
           )""",
        (table, trigger),
    ).fetchone()[0]


def expected_tables(filename: str) -> set[str]:
    """Extrai apenas os nomes das CREATE TABLE das migrações originais.

    Serve para identificar esquemas legados incompletos antes da baseline;
    não executa SQL nem substitui os testes de integridade.
    """
    sql = next(
        m.sql for m in load_migrations(MIGRATIONS_DIR) if m.filename == filename
    )
    return set(re.findall(r"(?im)^CREATE\s+TABLE\s+([a-z][a-z0-9_]*)\s*\(", sql))


def detect_existing_version(conn) -> int:
    """Identifica sinais de v1..v4 e recusa instalações parciais.

    Baseline só com confirmação humana, backup e resultado coerente deste teste.
    A detecção estrutural não prova que alguém não alterou funções à mão.
    """
    core_tables = expected_tables("0001_modelo_inicial.sql")
    extra_tables = expected_tables("0002_extensoes_modelo_documentado.sql")
    if len(core_tables) != 30 or len(extra_tables) != 2:
        raise MigrationError("Migrações originais alteradas: esperadas 30 + 2 tabelas.")

    all_tables = {
        row[0] for row in conn.execute(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        ).fetchall()
    }
    model_tables = core_tables & all_tables
    core_view = relation_exists(conn, "public.vw_utente_ficha")
    has_profile_type = conn.execute(
        """SELECT EXISTS (
            SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
            WHERE n.nspname='public' AND t.typname='perfil_utilizador'
        )"""
    ).fetchone()[0]

    v2_indicators = [
        table in all_tables for table in sorted(extra_tables)
    ] + [
        column_exists(conn, "paragem", "geom_planeada"),
        column_exists(conn, "paragem", "coordenada_registada_em"),
        relation_exists(conn, "public.vw_local_cobertura"),
        trigger_exists(conn, "paragem", "trg_paragem_capturar_geometria"),
    ]
    v3_indicators = [
        function_exists(conn, "fn_validar_dependencia_operacional"),
        function_exists(conn, "fn_validar_volta_atual"),
        function_exists(conn, "fn_validar_visita_atual"),
        function_exists(conn, "fn_triagem_retificacao_mesmo_utente"),
    ] + [
        trigger_exists(conn, table, trigger) for table, trigger in [
            ("paragem", "trg_paragem_revalidar_volta"),
            ("visita", "trg_visita_revalidar_volta"),
            ("volta_profissional", "trg_tripulacao_revalidar_volta"),
            ("visita_participante", "trg_participacao_revalidar_visita"),
            ("viatura_indisponibilidade", "trg_indisponibilidade_revalidar_volta"),
            ("viatura", "trg_lotacao_revalidar_volta"),
            ("equipa_membro", "trg_equipa_membro_revalidar_volta"),
            ("utente", "trg_utente_revalidar_visitas"),
            ("avaliacao_triagem", "trg_triagem_retificacao_mesmo_utente"),
        ]
    ]
    if not model_tables and not core_view and not has_profile_type:
        if any(v2_indicators) or any(v3_indicators):
            raise MigrationError("Objetos de 0002/0003 encontrados sem esquema inicial.")
        # A extensão PostGIS e spatial_ref_sys são normais numa BD ainda vazia.
        return 0

    missing = sorted(core_tables - all_tables)
    if missing or not core_view or not has_profile_type:
        raise MigrationError(
            "0001 incompleta; tabelas em falta: " + ", ".join(missing[:10])
            + "; vista ou ENUM inicial ausente. Não fazer baseline."
        )
    version = 1

    if any(v2_indicators) and not all(v2_indicators):
        raise MigrationError("0002 parcialmente detetada; não fazer baseline.")
    if all(v2_indicators):
        version = 2

    if any(v3_indicators) and not all(v3_indicators):
        raise MigrationError("0003 parcialmente detetada; não fazer baseline.")
    if all(v3_indicators):
        if version != 2:
            raise MigrationError("0003 detetada sem 0002 completa.")
        version = 3

    catalog = conn.execute(
        "SELECT codigo, ativo, ordem FROM public.nivel_urgencia"
    ).fetchall()
    active = {code: order for code, enabled, order in catalog if enabled}
    inactive = {code for code, enabled, _ in catalog if not enabled}
    wanted = {"U0": 1, "U1": 2, "U2": 3, "NU1": 4, "NU2": 5}
    if any(code in active or code in inactive for code in wanted):
        if version != 3 or active != wanted or not {"A", "B", "C", "NU"}.issubset(inactive):
            raise MigrationError("0004 parcial/incoerente: níveis ativos ou ordem incorreta.")
        version = 4
    return version


def structural_version(conn, has_history: bool) -> int | None:
    """Deteção estrutural só para esquemas legados (sem histórico).

    Com histórico, a fonte de verdade é schema_migrations. Os dados de
    catálogo (por exemplo, os níveis de urgência) são configuráveis (RF11) e
    não podem bloquear o arranque.
    """
    return None if has_history else detect_existing_version(conn)


def read_history(conn) -> dict[int, tuple[str, str, str]]:
    if not relation_exists(conn, HISTORY_TABLE):
        return {}
    rows = conn.execute(
        "SELECT version, filename, checksum_sha256, origem FROM public.schema_migrations ORDER BY version"
    ).fetchall()
    return {v: (name, checksum.strip(), origin) for v, name, checksum, origin in rows}


def validate_history(history: dict[int, tuple[str, str, str]], migrations: list[Migration]):
    versions = sorted(history)
    if versions != list(range(1, len(versions) + 1)):
        raise MigrationError(f"Histórico de migrações não consecutivo: {versions}")
    if len(versions) > len(migrations):
        raise MigrationError("BD tem migrações mais recentes do que os ficheiros locais.")
    for m in migrations:
        if m.version not in history:
            continue
        stored_name, stored_checksum, _ = history[m.version]
        if stored_name != m.filename or stored_checksum != m.checksum:
            raise MigrationError(
                f"Migração {m.version:04d} alterada após aplicação: "
                "nome/checksum não correspondem. Não edites migrações antigas; "
                "cria uma migração nova."
            )


def create_history_table(conn) -> None:
    conn.execute(
        """CREATE TABLE IF NOT EXISTS public.schema_migrations (
             version integer PRIMARY KEY CHECK (version > 0),
             filename text NOT NULL UNIQUE,
             checksum_sha256 char(64) NOT NULL,
             origem text NOT NULL CHECK (origem IN ('migrate', 'baseline')),
             aplicada_em timestamptz NOT NULL DEFAULT clock_timestamp()
           )"""
    )


def insert_history(conn, migration: Migration, origin: str) -> None:
    conn.execute(
        """INSERT INTO public.schema_migrations
             (version, filename, checksum_sha256, origem)
           VALUES (%s, %s, %s, %s)""",
        (migration.version, migration.filename, migration.checksum, origin),
    )


def configure_connection():
    try:
        import psycopg
    except ImportError as exc:
        raise MigrationError("Dependência psycopg ausente no contentor db-migrate.") from exc
    required = ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"]
    absent = [name for name in required if not os.environ.get(name)]
    if absent:
        raise MigrationError("Variáveis de ambiente em falta: " + ", ".join(absent))
    return psycopg.connect(
        host=os.environ.get("DB_HOST", "db"),
        port=int(os.environ.get("DB_PORT", "5432")),
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        dbname=os.environ["POSTGRES_DB"],
        autocommit=True,
        connect_timeout=10,
        options="-c search_path=public",
    )


def run(command: str, baseline_version: int | None = None) -> None:
    migrations = load_migrations(MIGRATIONS_DIR)
    with configure_connection() as conn:
        # Evita dois migradores em paralelo na mesma base de dados.
        conn.execute("SELECT pg_advisory_lock(%s, %s)", (LOCK_A, LOCK_B))
        try:
            has_history = relation_exists(conn, HISTORY_TABLE)
            history = read_history(conn)
            schema_version = structural_version(conn, has_history)
            if has_history:
                validate_history(history, migrations)

            if command == "status":
                if has_history:
                    print(f"Histórico: {len(history)} migrações registadas em schema_migrations")
                else:
                    print(f"Estado do esquema ULSBA (verificação estrutural): v{schema_version}")
                    print("Ainda não existe public.schema_migrations")
                    if schema_version > 0:
                        print("ATENÇÃO: esquema legado sem histórico; baseline manual necessária.")
                for mig in migrations:
                    if mig.version in history:
                        status = history[mig.version][2]
                    elif not has_history and mig.version <= schema_version:
                        status = "detetada no esquema (sem histórico)"
                    else:
                        status = "pendente"
                    print(f"  {mig.filename}: {status}")
                return

            if command == "baseline":
                if has_history:
                    raise MigrationError("A tabela schema_migrations já existe. Baseline recusada.")
                if schema_version == 0:
                    raise MigrationError("Base nova: não uses baseline; executa migrate.")
                if baseline_version != schema_version:
                    raise MigrationError(
                        f"Baseline pedida v{baseline_version}, mas os sinais do "
                        f"esquema indicam v{schema_version}. Nenhuma alteração efetuada."
                    )
                if baseline_version is None or not (1 <= baseline_version <= len(migrations)):
                    raise MigrationError("Versão de baseline inválida.")
                with conn.transaction():
                    create_history_table(conn)
                    for mig in migrations[:baseline_version]:
                        insert_history(conn, mig, "baseline")
                print(f"Baseline v{baseline_version} registada. SQL antigo não foi reexecutado.")
                print("Agora executa: docker compose up -d --build")
                return

            # migrate: numa instalação existente SEM histórico, bloquear por segurança.
            # Uma BD sem objetos ULSBA mas com tabelas próprias também não é
            # considerada uma instalação nova: pode ser a BD errada.
            if schema_version == 0 and not has_history:
                unrelated_tables = conn.execute(
                    """SELECT tablename FROM pg_tables
                       WHERE schemaname = 'public'
                         AND tablename NOT IN ('spatial_ref_sys', 'schema_migrations')
                       ORDER BY tablename"""
                ).fetchall()
                if unrelated_tables:
                    raise MigrationError(
                        "A base não tem o esquema ULSBA, mas contém outras tabelas "
                        f"({', '.join(row[0] for row in unrelated_tables[:8])}). "
                        "Confirma POSTGRES_DB antes de aplicar migrações."
                    )
            if not has_history and schema_version > 0:
                raise MigrationError(
                    f"Esquema ULSBA já existe (v{schema_version}), sem histórico. "
                    "Faz backup, confirma a versão e executa uma única vez "
                    f"'docker compose run --rm db-migrate baseline {schema_version}'. "
                    "Não foi aplicada qualquer migração."
                )
            validate_history(history, migrations)
            pending = [m for m in migrations if m.version not in history]
            if not pending:
                print(f"BD atualizada: {len(history)} migrações registadas; nenhuma pendente.")
                return
            for migration in pending:
                print(f"A aplicar: {migration.filename}", flush=True)
                try:
                    with conn.transaction():
                        # O histórico (se ainda não existir), o DDL e a versão
                        # são confirmados na MESMA transação PostgreSQL.
                        if not relation_exists(conn, HISTORY_TABLE):
                            create_history_table(conn)
                        conn.execute(migration.sql)
                        insert_history(conn, migration, "migrate")
                except Exception as exc:
                    raise MigrationError(
                        f"Falha em {migration.filename}; transação revertida: {exc}"
                    ) from exc
                print(f"Aplicada: {migration.filename}", flush=True)
            print(f"Concluído: {len(migrations)} migrações registadas.")
        finally:
            conn.execute("SELECT pg_advisory_unlock(%s, %s)", (LOCK_A, LOCK_B))


def main() -> int:
    parser = argparse.ArgumentParser(description="Migrações ULSBA/PostgreSQL (Docker)")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("migrate")
    subparsers.add_parser("status")
    baseline_parser = subparsers.add_parser("baseline")
    baseline_parser.add_argument("version", type=int)
    args = parser.parse_args()
    try:
        run(args.command, getattr(args, "version", None))
        return 0
    except MigrationError as exc:
        print("ERRO DE MIGRAÇÃO:", exc, file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"ERRO DE LIGAÇÃO/BD: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
