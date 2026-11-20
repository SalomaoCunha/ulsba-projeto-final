-- RF40 — verificação não destrutiva do seed inicial.
-- Executar na mesma base que recebeu as migrações 0001..0004.
BEGIN;
SET LOCAL TIME ZONE 'UTC';

DO $$
DECLARE n integer;
BEGIN
  IF (SELECT count(*) FROM utente WHERE numero_utente BETWEEN '12545' AND '12574') <> 30 THEN
    RAISE EXCEPTION 'RF40: esperados exatamente 30 utentes da demonstração';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM parametro_sistema WHERE chave='RF40_SEED_0001_BAIXO_ALENTEJO' AND valor='2026-11-09') THEN
    RAISE EXCEPTION 'RF40: não existe marcador da execução inicial do seed';
  END IF;
  IF (SELECT count(*) FROM equipa WHERE codigo IN ('A','B')) <> 2 OR
     (SELECT count(*) FROM profissional WHERE nome IN (
       'Enf. Ana Silva','Dr. João Martins','Enf. Rui Pacheco',
       'Enf. Marta Lopes','Dra. Sofia Lima','Enf. Inês Raposo')) <> 6 THEN
     RAISE EXCEPTION 'RF40: equipas ou profissionais incompletos';
  END IF;
  IF (SELECT count(*) FROM viatura WHERE matricula IN ('AA-24-BB','CC-18-DD')) <> 2 THEN
    RAISE EXCEPTION 'RF40: esperadas as duas viaturas dos mockups';
  END IF;
  IF (SELECT count(*) FROM volta WHERE designacao LIKE 'RF40-V%') <> 14 THEN
    RAISE EXCEPTION 'RF40: esperadas 14 voltas';
  END IF;
  IF (SELECT count(*) FROM visita v JOIN utente u ON u.id=v.utente_id
      WHERE u.numero_utente BETWEEN '12545' AND '12574') <> 46 THEN
    RAISE EXCEPTION 'RF40: esperadas 46 visitas';
  END IF;
  IF EXISTS (
    SELECT 1 FROM (VALUES
      ('CONCLUIDA'::estado_visita,36), ('PLANEADA'::estado_visita,6),
      ('PENDENTE'::estado_visita,3), ('CANCELADA'::estado_visita,1)
    ) e(estado,quantidade)
    LEFT JOIN (
      SELECT vi.estado, count(*)::integer quantidade
        FROM visita vi JOIN utente u ON u.id=vi.utente_id
       WHERE u.numero_utente BETWEEN '12545' AND '12574'
       GROUP BY vi.estado
    ) a USING(estado)
    WHERE a.quantidade IS DISTINCT FROM e.quantidade
  ) THEN RAISE EXCEPTION 'RF40: distribuição dos estados das visitas não corresponde ao plano'; END IF;
  IF (SELECT count(DISTINCT urgencia_codigo) FROM vw_utente_ficha
      WHERE numero_utente BETWEEN '12545' AND '12574') <> 5 THEN
    RAISE EXCEPTION 'RF40: não estão representados os 5 níveis U0/U1/U2/NU1/NU2';
  END IF;
  IF (SELECT count(DISTINCT complexidade_codigo) FROM vw_utente_ficha
      WHERE numero_utente BETWEEN '12545' AND '12574') <> 3 THEN
    RAISE EXCEPTION 'RF40: IPCPAL incompleto';
  END IF;
  IF EXISTS (
    SELECT 1 FROM vw_utente_ficha f
    WHERE f.numero_utente BETWEEN '12545' AND '12574'
      AND (f.geom IS NULL OR ST_SRID(f.geom::geometry) <> 4326
        OR f.pps_atual IS NULL OR f.urgencia_codigo IS NULL
        OR f.complexidade_codigo IS NULL OR f.data_referenciacao IS NULL
        OR f.data_triagem IS NULL)
  ) THEN RAISE EXCEPTION 'RF40: ficha incompleta, coordenadas ou SRID incorretos'; END IF;
  IF EXISTS (
    SELECT 1 FROM visita v JOIN paragem p ON p.id=v.paragem_id
           JOIN volta vo ON vo.id=p.volta_id
    WHERE vo.designacao LIKE 'RF40-V%'
      AND (v.inicio_previsto < vo.partida_prevista
        OR v.fim_previsto > vo.regresso_previsto)
  ) THEN RAISE EXCEPTION 'RF40: visita fora do horário da volta'; END IF;
  IF EXISTS (
    SELECT 1 FROM visita v JOIN utente u ON u.id=v.utente_id
    WHERE u.numero_utente BETWEEN '12545' AND '12574'
      AND v.estado='CONCLUIDA'
      AND NOT EXISTS(SELECT 1 FROM visita_participante x WHERE x.visita_id=v.id)
  ) THEN RAISE EXCEPTION 'RF40: visita concluída sem participante'; END IF;
  -- Cobertura territorial: os 13 concelhos do Baixo Alentejo (NUTS III).
  IF (SELECT COUNT(DISTINCT f.concelho) FROM vw_utente_ficha f
      WHERE f.numero_utente BETWEEN '12545' AND '12574') <> 13 THEN
    RAISE EXCEPTION 'RF40: os 30 utentes devem representar os 13 concelhos do Baixo Alentejo';
  END IF;
  IF EXISTS (
    SELECT 1 FROM vw_utente_ficha f
    WHERE f.numero_utente BETWEEN '12545' AND '12574'
      AND f.concelho NOT IN ('Aljustrel','Almodôvar','Alvito','Barrancos','Beja',
      'Castro Verde','Cuba','Ferreira do Alentejo','Mértola','Moura','Ourique','Serpa','Vidigueira')
  ) THEN RAISE EXCEPTION 'RF40: utente localizado fora do Baixo Alentejo'; END IF;
  IF EXISTS (
    SELECT 1 FROM volta v
    JOIN paragem p ON p.volta_id=v.id
    JOIN local l ON l.id=p.local_id
    JOIN concelho c ON c.id=l.concelho_id
    WHERE v.designacao LIKE 'RF40-V%'
      AND (c.nome NOT IN ('Aljustrel','Almodôvar','Alvito','Barrancos','Beja',
      'Castro Verde','Cuba','Ferreira do Alentejo','Mértola','Moura','Ourique','Serpa','Vidigueira')
      OR p.geom_planeada IS DISTINCT FROM l.geom)
  ) THEN RAISE EXCEPTION 'RF40: paragem fora da região ou snapshot geográfico desatualizado'; END IF;
  IF EXISTS (
    SELECT 1 FROM volta v
    JOIN local l ON l.id=v.local_base_id
    JOIN concelho c ON c.id=l.concelho_id
    WHERE v.designacao LIKE 'RF40-V%' AND c.nome <> 'Beja'
  ) THEN RAISE EXCEPTION 'RF40: base das voltas fora de Beja'; END IF;
  -- Correspondência exata dos cinco exemplos visíveis no frontend.
  IF EXISTS (
    SELECT 1 FROM (VALUES
       ('12569','Maria Teresa Almeida','912 345 678','A','U0','ATIVO',DATE '2026-10-02'),
       ('12560','Maria Teresa Godinho','911 222 333','B','U1','ATIVO',DATE '2026-10-01'),
       ('12570','Maria Teresa Silva','912 345 674','A','U2','ATIVO',DATE '2026-10-05'),
       ('12561','Maria Teresa Sousa','966 555 444','B','NU1','ATIVO',DATE '2026-09-28'),
       ('12562','Maria Isabel Ferreira','912 345 673','A','NU2','INATIVO',DATE '2026-09-15')
    ) e(numero,nome,telefone,equipa,urgencia,estado,ultima)
    LEFT JOIN vw_utente_ficha f ON f.numero_utente=e.numero
    WHERE f.numero_utente IS NULL OR f.nome IS DISTINCT FROM e.nome
      OR f.contacto_telefonico IS DISTINCT FROM e.telefone
      OR f.equipa_responsavel_codigo IS DISTINCT FROM e.equipa
      OR f.urgencia_codigo IS DISTINCT FROM e.urgencia
      OR f.estado::text IS DISTINCT FROM e.estado
      OR (f.ultima_visita AT TIME ZONE 'Europe/Lisbon')::date IS DISTINCT FROM e.ultima
  ) THEN RAISE EXCEPTION 'RF40: os primeiros cinco utentes diferem dos mockups'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM vw_utente_ficha
    WHERE numero_utente='12569' AND cuidador_principal_nome='Ana Almeida'
      AND data_nascimento=DATE '1942-03-12'
      AND local_tipo='DOMICILIO'
      AND morada='Rua de São João, 12' AND codigo_postal='7800-310'
      AND complexidade_codigo='ALTAMENTE_COMPLEXO'
  ) THEN RAISE EXCEPTION 'RF40: ficha detalhada da Maria Teresa Almeida difere do mockup'; END IF;
  RAISE NOTICE 'RF40 OK: 30 utentes, 2 viaturas, 2 equipas, 6 profissionais, 14 voltas e 46 visitas. Mockups verificados.';
END $$;

-- Dados da grelha do frontend
SELECT f.numero_utente, f.nome, f.equipa_responsavel_codigo AS equipa,
       f.contacto_telefonico, (f.ultima_visita AT TIME ZONE 'Europe/Lisbon')::date AS ultima_visita,
       f.urgencia_codigo, f.urgencia_designacao, f.estado
FROM vw_utente_ficha f
WHERE f.numero_utente BETWEEN '12545' AND '12574'
ORDER BY f.numero_utente;

-- Resumo por concelho para conferir o mapa
SELECT f.concelho, COUNT(*) AS total_utentes
FROM vw_utente_ficha f
WHERE f.numero_utente BETWEEN '12545' AND '12574'
GROUP BY f.concelho ORDER BY f.concelho;

-- Impressão digital dos dados de apresentação para comparar duas execuções
SELECT md5(string_agg(concat_ws('|',f.numero_utente,f.nome,f.contacto_telefonico,
    f.estado::text,f.urgencia_codigo,f.complexidade_codigo,f.concelho,
    ST_AsText(f.geom::geometry)), E'\n' ORDER BY f.numero_utente)) AS assinatura_rf40
FROM vw_utente_ficha f
WHERE f.numero_utente BETWEEN '12545' AND '12574';
ROLLBACK;
