-- 0005_expor_situacao_clinica_notas.sql
-- A vista vw_utente_ficha nunca expôs utente.situacao_clinica/utente.notas.
-- Consequência: GET /utentes e GET /utentes/{id} devolviam estes campos em
-- branco, o formulário de edição carregava-os vazios, e o PUT seguinte
-- gravava esse vazio por cima do valor real (perda de dados).
-- Dependência: 0001_modelo_inicial.sql (CREATE VIEW vw_utente_ficha).
BEGIN;

CREATE OR REPLACE VIEW vw_utente_ficha AS
SELECT
    u.id                                   AS utente_id,
    u.numero_utente,
    u.nome,
    u.genero,
    u.data_nascimento,
    date_part('year', age(CURRENT_DATE, u.data_nascimento))::integer AS idade,
    u.contacto_telefonico,
    u.estado,
    l.id                                   AS local_id,
    l.tipo                                 AS local_tipo,
    l.nome                                 AS local_nome,
    l.morada,
    l.codigo_postal,
    l.localidade,
    co.nome                                AS concelho,
    l.geom,
    cp.nome                                AS cuidador_principal_nome,
    cp.parentesco                          AS cuidador_principal_parentesco,
    cp.contacto_telefonico                 AS cuidador_principal_contacto,
    eq.id                                  AS equipa_responsavel_id,
    eq.codigo                              AS equipa_responsavel_codigo,
    (SELECT min(t.data_transicao) FROM utente_transicao_estado t
      WHERE t.utente_id = u.id AND t.estado_novo = 'REFERENCIADO') AS data_referenciacao,
    (SELECT min(t.data_transicao) FROM utente_transicao_estado t
      WHERE t.utente_id = u.id AND t.estado_novo = 'ATIVO')        AS data_admissao,
    (SELECT (min(a.avaliada_em) AT TIME ZONE 'Europe/Lisbon')::date
       FROM avaliacao_triagem a WHERE a.utente_id = u.id)          AS data_triagem,
    tr.nivel_urgencia_id,
    nu.codigo                              AS urgencia_codigo,
    nu.designacao                          AS urgencia_designacao,
    nu.cor_hex                             AS urgencia_cor,
    nu.ordem                               AS urgencia_ordem,
    tr.avaliada_em                         AS triagem_em,
    cx.nivel_complexidade_id,
    nc.codigo                              AS complexidade_codigo,
    nc.designacao                          AS complexidade_designacao,
    pps.valor                              AS pps_atual,
    uv.ultima_visita,                      -- NULL = «sem visitas» (RF30)
    u.situacao_clinica,
    u.notas
FROM utente u
JOIN local   l  ON l.id  = u.local_id
JOIN concelho co ON co.id = l.concelho_id
LEFT JOIN cuidador_principal cp ON cp.utente_id = u.id
-- Triagem atual: a mais recente que não foi retificada por outra.
LEFT JOIN LATERAL (
    SELECT a.*
      FROM avaliacao_triagem a
     WHERE a.utente_id = u.id
       AND NOT EXISTS (SELECT 1 FROM avaliacao_triagem r WHERE r.retifica_id = a.id)
     ORDER BY a.avaliada_em DESC, a.id DESC
     LIMIT 1
) tr ON true
LEFT JOIN nivel_urgencia nu ON nu.id = tr.nivel_urgencia_id
LEFT JOIN LATERAL (
    SELECT x.* FROM avaliacao_complexidade x
     WHERE x.utente_id = u.id
     ORDER BY x.avaliada_em DESC, x.id DESC LIMIT 1
) cx ON true
LEFT JOIN nivel_complexidade nc ON nc.id = cx.nivel_complexidade_id
LEFT JOIN LATERAL (
    SELECT p.valor FROM registo_pps p
     WHERE p.utente_id = u.id
     ORDER BY p.registado_em DESC, p.id DESC LIMIT 1
) pps ON true
-- Equipa responsável em vigor neste instante.
LEFT JOIN LATERAL (
    SELECT ae.equipa_id FROM atribuicao_equipa_responsavel ae
     WHERE ae.utente_id = u.id
       AND ae.valido_desde <= now()
       AND (ae.valido_ate IS NULL OR ae.valido_ate > now())
     LIMIT 1
) ar ON true
LEFT JOIN equipa eq ON eq.id = ar.equipa_id
LEFT JOIN LATERAL (
    SELECT max(v.fim_real) AS ultima_visita
      FROM visita v
     WHERE v.utente_id = u.id AND v.estado = 'CONCLUIDA'
) uv ON true;

COMMIT;
