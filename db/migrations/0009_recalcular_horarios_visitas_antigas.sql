-- Voltas criadas antes de POST /voltas passar a atribuir um horário
-- sequencial de 30 min por visita (em vez do horário da volta toda
-- repetido em todas as visitas) ficaram "congeladas" com esse padrão
-- antigo: todas as visitas da mesma volta partilhando o mesmo
-- inicio_previsto/fim_previsto, mesmo depois de registos de saída real
-- (que só deslocam esse horário, não o corrigem). Recalcula, para cada
-- volta afetada, um horário sequencial de 30 min por visita (mesma regra
-- de backend/app/routers/voltas.py, DURACAO_VISITA_PADRAO_MIN), a partir
-- da partida real já registada ou, na sua falta, da partida prevista.
BEGIN;

WITH afetadas AS (
    SELECT p.volta_id
    FROM paragem p
    JOIN visita vis ON vis.paragem_id = p.id
    GROUP BY p.volta_id
    HAVING count(vis.id) > 1 AND count(DISTINCT vis.inicio_previsto) = 1
),
referencia AS (
    SELECT v.id AS volta_id, COALESCE(v.partida_real, v.partida_prevista) AS inicio_base
    FROM volta v
    WHERE v.id IN (SELECT volta_id FROM afetadas)
),
visitas_ordenadas AS (
    SELECT vis.id AS visita_id,
           p.volta_id,
           ROW_NUMBER() OVER (PARTITION BY p.volta_id ORDER BY p.ordem, vis.id) - 1 AS posicao
    FROM visita vis
    JOIN paragem p ON p.id = vis.paragem_id
    WHERE p.volta_id IN (SELECT volta_id FROM afetadas)
)
UPDATE visita vis
SET inicio_previsto = r.inicio_base + (vo.posicao * 30 || ' minutes')::interval,
    fim_previsto = r.inicio_base + ((vo.posicao + 1) * 30 || ' minutes')::interval
FROM visitas_ordenadas vo
JOIN referencia r ON r.volta_id = vo.volta_id
WHERE vis.id = vo.visita_id;

COMMIT;
