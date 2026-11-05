-- 0004_ajuste_niveis_urgencia.sql
-- Alinha o catálogo nivel_urgencia com os cinco níveis do mockup:
-- Urgente 0 dias, Urgente 1 dia, Urgente 2 dias, Não urgente 1, Não urgente 2.
-- RF10, RF11, RF15, RNF08. Dependência: 0001_modelo_inicial.sql.
-- Aplicar apenas uma vez, numa BD de desenvolvimento (dados fictícios).
--
-- Os cinco níveis são os do mockup e foram revistos com a docente (a hipótese
-- inicial A/B/C/NU foi abandonada). O significado operacional dos rótulos em
-- dias e eventuais prazos de visita ainda não foram confirmados pela ULSBA
-- (requisitos, ponto em aberto 1). Por isso prazo_max_sem_visita_dias fica NULL
-- («por definir») e não se presume que «0 dias» signifique um prazo de 0 dias
-- (o CHECK ck_nivel_urgencia_prazo exige valor positivo ou NULL).
--
-- Os níveis da hipótese inicial abandonada (A, B, C, NU) são desativados, não apagados,
-- para preservar o histórico de avaliacao_triagem que os referencie.
BEGIN;

-- Segurança: falha se a migração já tiver sido aplicada (execução repetida).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM nivel_urgencia WHERE codigo IN ('U0', 'U1', 'U2', 'NU1', 'NU2')) THEN
        RAISE EXCEPTION '0004 já aplicada: existem níveis U0/U1/U2/NU1/NU2 em nivel_urgencia';
    END IF;
END
$$;

-- 1. Desativar os níveis da hipótese inicial.
--    A ordem é UNIQUE: desloca-se para libertar 1..5 aos novos níveis
--    (os inativos ficam em 101..104, sempre acima dos ativos).
UPDATE nivel_urgencia
   SET ativo = false,
       ordem = ordem + 100
 WHERE codigo IN ('A', 'B', 'C', 'NU');

-- 2. Inserir os cinco níveis do mockup (ordem clínica: 1 = mais urgente).
--    Cores = marcadores do frontend (--prioridade-N-dot em frontend/src/index.css).
--    O ícone complementa a cor e a designação (RNF08).
INSERT INTO nivel_urgencia (codigo, designacao, cor_hex, icone, ordem, prazo_max_sem_visita_dias, ativo) VALUES
    ('U0',  'Urgente 0 dias', '#E0392B', 'bi-exclamation-triangle-fill', 1, NULL, true),
    ('U1',  'Urgente 1 dia',  '#EF8A1C', 'bi-exclamation-triangle-fill', 2, NULL, true),
    ('U2',  'Urgente 2 dias', '#EEC11D', 'bi-exclamation-triangle-fill', 3, NULL, true),
    ('NU1', 'Não urgente 1',  '#E8D968', 'bi-exclamation-triangle-fill', 4, NULL, true),
    ('NU2', 'Não urgente 2',  '#38B89A', 'bi-exclamation-triangle-fill', 5, NULL, true);

-- 3. Verificação: exatamente cinco níveis ativos, com ordens 1..5.
DO $$
DECLARE
    v_ativos integer;
    v_ordens integer[];
BEGIN
    SELECT count(*), array_agg(ordem ORDER BY ordem)
      INTO v_ativos, v_ordens
      FROM nivel_urgencia
     WHERE ativo;

    IF v_ativos <> 5 OR v_ordens <> ARRAY[1, 2, 3, 4, 5] THEN
        RAISE EXCEPTION 'Esperados 5 níveis de urgência ativos com ordens 1..5; encontrados % (%)', v_ativos, v_ordens;
    END IF;
END
$$;

COMMIT;