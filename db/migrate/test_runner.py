"""Testes locais do carregador de migrações; não necessitam de PostgreSQL."""

import hashlib
import tempfile
import unittest
from pathlib import Path
from runner import MigrationError, load_migrations, sql_without_transaction_wrapper, validate_history


class MigrationRunnerTests(unittest.TestCase):
    def test_existing_scripts_are_supported(self):
        folder = Path(__file__).resolve().parents[1] / "migrations"
        migrations = load_migrations(folder)
        self.assertGreaterEqual(len(migrations), 4)
        self.assertEqual([1, 2, 3, 4], [m.version for m in migrations[:4]])
        self.assertIn("CREATE TYPE perfil_utilizador", migrations[0].sql)
        self.assertIn("'U0'", migrations[3].sql)
        for m in migrations:
            self.assertEqual(64, len(m.checksum))
            self.assertNotIn("\nCOMMIT;\n", m.sql)

    def test_preserves_do_blocks_and_stored_procedures(self):
        script = "-- comentário\nBEGIN;\nDO $$\nBEGIN\nRAISE NOTICE 'ok';\nEND\n$$;\nCOMMIT;\n"
        parsed = sql_without_transaction_wrapper(script, "test.sql")
        self.assertIn("RAISE NOTICE", parsed)
        self.assertIn("BEGIN\nRAISE", parsed)
        self.assertNotIn("COMMIT;", parsed)

    def test_rejects_missing_commit(self):
        with self.assertRaises(MigrationError):
            sql_without_transaction_wrapper("BEGIN;\nSELECT 1;", "broken.sql")

    def test_rejects_statements_outside_transaction(self):
        with self.assertRaises(MigrationError):
            sql_without_transaction_wrapper("SELECT 1;\nBEGIN;\nSELECT 2;\nCOMMIT;", "broken.sql")

    def test_rejects_duplicate_or_gapped_versions(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "0001_primeira.sql").write_text("BEGIN;\nSELECT 1;\nCOMMIT;\n")
            (folder / "0003_terceira.sql").write_text("BEGIN;\nSELECT 3;\nCOMMIT;\n")
            with self.assertRaises(MigrationError):
                load_migrations(folder)

    def test_checksum_detects_modified_migration(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "0001_primeira.sql"
            path.write_text("BEGIN;\nSELECT 1;\nCOMMIT;\n")
            original = load_migrations(Path(tmp))
            history = {1: (original[0].filename, original[0].checksum, "migrate")}
            path.write_text("BEGIN;\nSELECT 2;\nCOMMIT;\n")
            with self.assertRaises(MigrationError):
                validate_history(history, load_migrations(Path(tmp)))


class BaselineDetectionTests(unittest.TestCase):
    """Confere a decisão de baseline sem depender de PostgreSQL real."""

    def setUp(self):
        import runner
        from unittest.mock import patch
        self.runner = runner
        self.patch = patch.object(
            runner, 'MIGRATIONS_DIR',
            Path(__file__).resolve().parents[1] / 'migrations',
        )
        self.patch.start()

    def tearDown(self):
        self.patch.stop()

    @staticmethod
    def db(*, core=True, v2=True, v3=True, v4=True, partial=False):
        import runner
        tables = set()
        if core:
            tables |= runner.expected_tables('0001_modelo_inicial.sql')
            if partial:
                tables.discard('utente')
        if v2:
            tables |= runner.expected_tables('0002_extensoes_modelo_documentado.sql')
        funcs = {
            'fn_validar_dependencia_operacional',
            'fn_validar_volta_atual',
            'fn_validar_visita_atual',
            'fn_triagem_retificacao_mesmo_utente',
        } if v3 else set()
        triggers = {
            'trg_paragem_revalidar_volta', 'trg_visita_revalidar_volta',
            'trg_tripulacao_revalidar_volta', 'trg_participacao_revalidar_visita',
            'trg_indisponibilidade_revalidar_volta', 'trg_lotacao_revalidar_volta',
            'trg_equipa_membro_revalidar_volta', 'trg_utente_revalidar_visitas',
            'trg_triagem_retificacao_mesmo_utente',
        } if v3 else set()
        if v2:
            triggers.add('trg_paragem_capturar_geometria')
        catalog = (
            [(key, True, ix) for ix, key in enumerate(('U0','U1','U2','NU1','NU2'), 1)]
            + [(key, False, 100+ix) for ix,key in enumerate(('A','B','C','NU'), 1)]
        ) if v4 else [(key, True, ix) for ix,key in enumerate(('A','B','C','NU'), 1)]

        class Result:
            def __init__(self, data):
                self.data = data
            def fetchone(self):
                return self.data[0]
            def fetchall(self):
                return self.data

        class FakeConn:
            def execute(self, query, args=()):
                if 'FROM pg_tables' in query:
                    return Result([(name,) for name in tables])
                if 'FROM pg_type t' in query:
                    return Result([(core,)])
                if 'to_regclass' in query:
                    name = args[0]
                    return Result([(name in {'public.vw_utente_ficha',
                                           'public.vw_local_cobertura'}
                                    and (core if name.endswith('ficha') else v2),)])
                if 'information_schema.columns' in query:
                    return Result([(bool(v2 and args[0] == 'paragem'
                                         and args[1] in ('geom_planeada',
                                                         'coordenada_registada_em')),)])
                if 'FROM pg_proc p' in query:
                    return Result([(args[0] in funcs,)])
                if 'FROM pg_trigger t' in query:
                    return Result([(args[1] in triggers,)])
                if 'FROM public.nivel_urgencia' in query:
                    return Result(catalog)
                raise AssertionError('SQL não simulado: ' + query)
        return FakeConn()

    def test_blank_database_has_version_zero(self):
        self.assertEqual(0, self.runner.detect_existing_version(
            self.db(core=False, v2=False, v3=False, v4=False)))

    def test_full_develop_schema_matches_version_four(self):
        self.assertEqual(4, self.runner.detect_existing_version(self.db()))

    def test_missing_core_table_blocks_baseline(self):
        with self.assertRaises(self.runner.MigrationError):
            self.runner.detect_existing_version(self.db(partial=True))

    def test_out_of_order_schema_blocks_baseline(self):
        with self.assertRaises(self.runner.MigrationError):
            self.runner.detect_existing_version(self.db(v2=False, v3=True))

    def test_legacy_version_three_is_detected(self):
        self.assertEqual(3, self.runner.detect_existing_version(self.db(v4=False)))


if __name__ == "__main__":
    unittest.main()
