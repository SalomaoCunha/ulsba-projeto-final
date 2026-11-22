-- Voltas criadas antes do POST /voltas passar a gravar a composição da
-- equipa em volta_profissional ficaram sem nenhum profissional associado.
-- Sem isto, trg_volta_validar_confirmacao (DEFERRABLE INITIALLY DEFERRED,
-- só corre no COMMIT) impede para sempre que essas voltas avancem para
-- CONFIRMADA/EM_CURSO/CONCLUIDA, com "falta atribuir pelo menos um
-- profissional" — usa a composição atual da equipa de cada volta, tal como
-- o POST /voltas faz para as novas.
BEGIN;

INSERT INTO volta_profissional (volta_id, profissional_id)
SELECT v.id, em.profissional_id
FROM volta v
JOIN equipa_membro em ON em.equipa_id = v.equipa_id AND em.valido_ate IS NULL
WHERE NOT EXISTS (
    SELECT 1 FROM volta_profissional vp WHERE vp.volta_id = v.id
);

COMMIT;
