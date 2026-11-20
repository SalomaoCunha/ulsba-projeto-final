-- ============================================================================
-- RF40 | Seed ULSBA (ficcional) — COMPATÍVEL COM AS MIGRAÇÕES 0001..0004
-- Âmbito: APENAS Baixo Alentejo (NUTS III/CIMBAL, 13 concelhos).
-- NÃO É UMA MIGRAÇÃO. Nunca executar em bases clínicas ou partilhadas.
-- Repetível: 1ª execução insere; execuções seguintes não alteram os dados.
-- Preparado para a primeira instalação; não altera nem apaga registos existentes.
-- Identificadores 12545..12574 (apenas demonstração, não SNS); cinco fichas iguais ao mockup.
-- ATENÇÃO: matrículas e contactos dos mockups são valores de demonstração, não verificados externamente.
-- Não contém DELETE, TRUNCATE, UPDATE a dados preexistentes nem credenciais válidas.
-- Requisitos ULSBA v0.3: hipóteses e dados exclusivamente simulados.
-- ============================================================================
BEGIN;
SET LOCAL search_path = public, pg_temp;
SET LOCAL TIME ZONE 'UTC';
SELECT pg_advisory_xact_lock(20261109, 40);

DO $$
BEGIN
  IF (SELECT count(*) FROM nivel_urgencia WHERE codigo IN ('U0','U1','U2','NU1','NU2') AND ativo) <> 5 THEN
    RAISE EXCEPTION 'RF40: aplicar previamente as migrações 0001 a 0004';
  END IF;
  IF (SELECT count(*) FROM nivel_complexidade WHERE codigo IN ('ALTAMENTE_COMPLEXO','COMPLEXO','NAO_COMPLEXO') AND ativo) <> 3 THEN
    RAISE EXCEPTION 'RF40: catálogo IPCPAL incompleto';
  END IF;
  IF (SELECT count(*) FROM funcao_profissional WHERE codigo IN ('MEDICO','ENFERMEIRO') AND ativo) <> 2 THEN
    RAISE EXCEPTION 'RF40: funções clínicas em falta';
  END IF;
END $$;

-- Dados de entrada explícitos: nunca usar random(), clock_timestamp() ou now().
-- Os 13 concelhos permitidos: Aljustrel, Almodôvar, Alvito, Barrancos, Beja,
-- Castro Verde, Cuba, Ferreira do Alentejo, Mértola, Moura, Ourique, Serpa e Vidigueira.
-- As coordenadas são aproximadas aos centros das localidades, NÃO domicílios reais.
CREATE TEMP TABLE _rf40_local (
  chave text PRIMARY KEY, tipo text NOT NULL, nome text, localidade text,
  concelho text NOT NULL, lat numeric NOT NULL, lon numeric NOT NULL,
  morada text NOT NULL, codigo_postal text NOT NULL
) ON COMMIT DROP;

INSERT INTO _rf40_local VALUES
    ('L01', 'DOMICILIO', '', 'Beja', 'Beja', 38.0148, -7.8641, 'Rua de São João, 12', '7800-310'),
    ('L02', 'DOMICILIO', '', 'Cuba', 'Cuba', 38.1657, -7.8932, 'Rua das Oliveiras, 8', '7940-143'),
    ('L03', 'DOMICILIO', '', 'Beja', 'Beja', 38.0183, -7.8619, 'Rua das Acácias, 20', '7800-213'),
    ('L04', 'DOMICILIO', '', 'Beja', 'Beja', 38.0104, -7.8695, 'Travessa da Planície, 6', '7800-427'),
    ('L05', 'DOMICILIO', '', 'Serpa', 'Serpa', 37.9441, -7.6001, 'Rua do Moinho, 6', '7830-300'),
    ('L06', 'DOMICILIO', '', 'Moura', 'Moura', 38.1409, -7.45, 'Travessa das Estevas, 7', '7860-210'),
    ('L07', 'DOMICILIO', '', 'Cuba', 'Cuba', 38.167, -7.887, 'Rua dos Sobreiros, 8', '7940-143'),
    ('L08', 'DOMICILIO', '', 'Cuba', 'Cuba', 38.1589, -7.8884, 'Rua do Pinhal, 9', '7940-143'),
    ('L09', 'DOMICILIO', '', 'Vidigueira', 'Vidigueira', 38.2112, -7.8, 'Rua das Tílias, 10', '7960-221'),
    ('L10', 'DOMICILIO', '', 'Vila de Frades', 'Vidigueira', 38.2342, -7.8202, 'Rua da Planície, 11', '7960-221'),
    ('L11', 'DOMICILIO', '', 'Trigaches', 'Beja', 37.9844, -7.8192, 'Rua da Fonte, 12', '7800-310'),
    ('L12', 'DOMICILIO', '', 'Ferreira do Alentejo', 'Ferreira do Alentejo', 38.0588, -8.1139, 'Travessa do Monte, 13', '7900-540'),
    ('L13', 'DOMICILIO', '', 'Ferreira do Alentejo', 'Ferreira do Alentejo', 38.0555, -8.1091, 'Rua das Cerejeiras, 14', '7900-540'),
    ('L14', 'DOMICILIO', '', 'Aljustrel', 'Aljustrel', 37.8786, -8.162, 'Rua dos Pomares, 15', '7600-134'),
    ('L15', 'DOMICILIO', '', 'Rio de Moinhos', 'Aljustrel', 37.8617, -8.1881, 'Rua do Olival, 16', '7600-134'),
    ('L16', 'DOMICILIO', '', 'Castro Verde', 'Castro Verde', 37.6982, -8.083, 'Rua do Girassol, 17', '7780-212'),
    ('L17', 'DOMICILIO', '', 'Almodôvar', 'Almodôvar', 37.5128, -8.0636, 'Rua dos Salgueiros, 18', '7700-141'),
    ('L18', 'DOMICILIO', '', 'Ourique', 'Ourique', 37.6511, -8.2242, 'Rua do Pomar, 19', '7670-217'),
    ('L19', 'DOMICILIO', '', 'Alvito', 'Alvito', 38.2558, -7.9910, 'Rua das Azinheiras, 20', '7920-101'),
    ('L20', 'LAR', 'Residência Fictícia Planície', 'Beja', 'Beja', 38.0155, -7.8678, 'Largo do Jardim, 8', '7800-427'),
    ('L21', 'UNIDADE_CUIDADOS_CONTINUADOS', 'Unidade Fictícia Guadiana', 'Serpa', 'Serpa', 37.9456, -7.5972, 'Rua da Escola, 22', '7830-300'),
    ('L22', 'LAR', 'Lar Fictício da Serra', 'Serpa', 'Serpa', 37.9391, -7.6042, 'Rua do Vale Verde, 23', '7830-300'),
    ('L23', 'LAR', 'Residência Fictícia do Ardila', 'Moura', 'Moura', 38.1395, -7.4457, 'Travessa da Ermida, 24', '7860-210'),
    ('L24', 'LAR', 'Lar Fictício de Mértola', 'Mértola', 'Mértola', 37.6429, -7.661, 'Rua do Sobreiral, 25', '7750-337'),
    ('L25', 'UNIDADE_CUIDADOS_PALIATIVOS', 'Unidade Fictícia da Planície de Moura', 'Moura', 'Moura', 38.1413, -7.4507, 'Rua da Unidade Fictícia, 26', '7860-220'),
    ('L26', 'LAR', 'Residência Fictícia do Vale', 'Barrancos', 'Barrancos', 38.1311, -6.9772, 'Rua das Oliveiras, 27', '7230-130'),
    ('BASE', 'BASE', 'Base Fictícia de Planeamento RF40', 'Beja', 'Beja', 38.016, -7.872, 'Rua de Demonstração da Unidade, s/n', '7800-309');


CREATE TEMP TABLE _rf40_utente (
  numero text PRIMARY KEY, nome text NOT NULL, genero text NOT NULL, nascimento date NOT NULL,
  local_chave text NOT NULL, equipa text NOT NULL, urgencia text NOT NULL,
  complexidade text NOT NULL, pps smallint NOT NULL, clinica text NOT NULL,
  estado text NOT NULL, dt_ref date NOT NULL, dt_tri date NOT NULL, dt_adm date,
  telefone text, notas text, cuidador text, parentesco text
) ON COMMIT DROP;

INSERT INTO _rf40_utente VALUES
    ('12569', 'Maria Teresa Almeida', 'FEMININO', '1942-03-12', 'L01', 'A', 'U0', 'ALTAMENTE_COMPLEXO', 40, 'Insuficiência cardíaca; Diabetes tipo II; Hipertensão arterial', 'ATIVO', '2026-06-03', '2026-06-05', '2026-06-08', '912 345 678', 'Utente autónoma. Vive com o filho.', 'Ana Almeida', 'Nora'),
    ('12560', 'Maria Teresa Godinho', 'FEMININO', '1940-07-18', 'L02', 'B', 'U1', 'COMPLEXO', 50, 'Insuficiência respiratória crónica', 'ATIVO', '2026-06-04', '2026-06-06', '2026-06-09', '911 222 333', 'Recebe apoio de familiares nas deslocações.', 'Rui Godinho', 'Filho'),
    ('12570', 'Maria Teresa Silva', 'FEMININO', '1945-08-03', 'L03', 'A', 'U2', 'NAO_COMPLEXO', 60, 'Hipertensão arterial; mobilidade reduzida', 'ATIVO', '2026-06-05', '2026-06-07', '2026-06-10', '912 345 674', 'Necessita de apoio para deslocações fora do domicílio.', 'José Silva', 'Cônjuge'),
    ('12561', 'Maria Teresa Sousa', 'FEMININO', '1938-11-22', 'L20', 'B', 'NU1', 'COMPLEXO', 40, 'Demência; dependência funcional', 'ATIVO', '2026-06-06', '2026-06-08', '2026-06-11', '966 555 444', 'Acompanhamento da família ao final da tarde.', NULL, NULL),
    ('12562', 'Maria Isabel Ferreira', 'FEMININO', '1935-02-10', 'L04', 'A', 'NU2', 'NAO_COMPLEXO', 70, 'Mobilidade reduzida', 'INATIVO', '2026-06-07', '2026-06-09', '2026-06-12', '912 345 673', 'Processo inativado; sem novas visitas agendadas.', 'Helena Ferreira', 'Filha'),
    ('12545', 'José António Marques', 'MASCULINO', '1941-07-19', 'L05', 'B', 'U2', 'COMPLEXO', 50, 'DPOC', 'ATIVO', '2026-06-08', '2026-06-10', '2026-06-13', '910 900 006', 'A esposa ajuda na gestão da medicação e está presente durante o dia.', 'Familiar de demonstração 12545', 'Familiar'),
    ('12546', 'Ana Rita Bento', 'FEMININO', '1949-09-27', 'L21', 'B', 'U0', 'ALTAMENTE_COMPLEXO', 30, 'Dor crónica', 'ATIVO', '2026-06-09', '2026-06-11', '2026-06-14', '910 900 007', 'Residente em unidade; a família acompanha por telefone.', NULL, NULL),
    ('12547', 'Fernanda Maria Caeiro', 'FEMININO', '1944-01-30', 'L21', 'B', 'NU1', 'COMPLEXO', 50, 'Doença renal crónica', 'ATIVO', '2026-06-10', '2026-06-12', '2026-06-15', '910 900 008', 'Necessita de apoio no controlo sintomático; visitas com vigilância regular.', NULL, NULL),
    ('12548', 'Rosa Maria Palma', 'FEMININO', '1932-11-11', 'L22', 'B', 'NU2', 'NAO_COMPLEXO', 60, 'Doença de Parkinson', 'ATIVO', '2026-06-11', '2026-06-13', '2026-06-16', '910 900 009', 'Residente em lar; contactos concentrados no cuidador de referência.', NULL, NULL),
    ('12549', 'Armando Jorge Rosado', 'MASCULINO', '1947-05-23', 'L06', 'B', 'U2', 'COMPLEXO', 50, 'Doença cardíaca', 'ATIVO', '2026-06-12', '2026-06-14', '2026-06-17', '910 900 010', 'Vive com apoio da vizinhança e necessita de transporte ocasional.', 'Familiar de demonstração 12549', 'Familiar'),
    ('12550', 'Maria da Conceição Prates', 'FEMININO', '1939-08-14', 'L23', 'B', 'U1', 'COMPLEXO', 40, 'Problemas nutricionais', 'ATIVO', '2026-06-13', '2026-06-15', '2026-06-18', '910 900 011', 'A família solicita acompanhamento e aconselhamento nutricional.', NULL, NULL),
    ('12551', 'António Francisco Raposo', 'MASCULINO', '1934-12-02', 'L23', 'B', 'NU2', 'NAO_COMPLEXO', 60, 'Fragilidade física', 'INATIVO', '2026-06-14', '2026-06-16', '2026-06-19', '910 900 012', 'Inativação administrativa após encerramento do processo de demonstração.', NULL, NULL),
    ('12552', 'Luísa Cristina Piçarra', 'FEMININO', '1952-03-08', 'L07', 'B', 'U1', 'NAO_COMPLEXO', 60, 'Sequelas de AVC', 'ATIVO', '2026-06-15', '2026-06-17', '2026-06-20', '910 900 013', 'Utiliza cadeira de rodas; acesso pela porta lateral do domicílio.', 'Familiar de demonstração 12552', 'Familiar'),
    ('12553', 'Manuel dos Santos Colaço', 'MASCULINO', '1943-06-17', 'L08', 'B', 'NU1', 'NAO_COMPLEXO', 50, 'Diabetes', 'ATIVO', '2026-06-16', '2026-06-18', '2026-06-21', '910 900 014', 'A esposa acompanha a organização dos cuidados diários.', 'Familiar de demonstração 12553', 'Familiar'),
    ('12554', 'Maria Adelaide Fialho', 'FEMININO', '1946-02-25', 'L09', 'B', 'U1', 'COMPLEXO', 50, 'Insuficiência cardíaca', 'ATIVO', '2026-06-17', '2026-06-19', '2026-06-22', '910 900 015', 'O filho trabalha por turnos; contacto preferencial ao fim da tarde.', 'Familiar de demonstração 12554', 'Familiar'),
    ('12555', 'João Carlos Candeias', 'MASCULINO', '1951-10-09', 'L10', 'B', 'U2', 'NAO_COMPLEXO', 70, 'Limitação de mobilidade', 'ATIVO', '2026-06-18', '2026-06-20', '2026-06-23', '910 900 016', 'Tem acompanhamento familiar e limitação da marcha.', 'Familiar de demonstração 12555', 'Familiar'),
    ('12556', 'Alberto José Garrido', 'MASCULINO', '1937-09-03', 'L24', 'B', 'U1', 'ALTAMENTE_COMPLEXO', 30, 'Insuficiência respiratória', 'ATIVO', '2026-06-19', '2026-06-21', '2026-06-24', '910 900 017', 'Residente em lar; contacto principal através da receção.', NULL, NULL),
    ('12557', 'Júlia Maria Passinhas', 'FEMININO', '1940-12-21', 'L25', 'A', 'U1', 'ALTAMENTE_COMPLEXO', 30, 'Dor e fadiga', 'ATIVO', '2026-06-20', '2026-06-22', '2026-06-25', '910 900 018', 'Em unidade de cuidados; contacto com a família por videochamada.', NULL, NULL),
    ('12558', 'Carlos Alberto Feliciano', 'MASCULINO', '1946-04-12', 'L25', 'A', 'NU1', 'COMPLEXO', 60, 'Aguarda admissão', 'ATIVO', '2026-06-21', '2026-06-23', '2026-06-26', '910 900 019', 'Família disponível para acompanhar o plano de visitas.', NULL, NULL),
    ('12559', 'Maria de Lurdes Brito', 'FEMININO', '1933-06-06', 'L20', 'A', 'U1', 'ALTAMENTE_COMPLEXO', 30, 'Insuficiência cardíaca', 'ATIVO', '2026-06-22', '2026-06-24', '2026-06-27', '910 900 020', 'O filho visita ao domingo e está disponível para chamadas.', NULL, NULL),
    ('12563', 'Albertina Maria Estevens', 'FEMININO', '1944-07-28', 'L11', 'A', 'NU2', 'NAO_COMPLEXO', 70, 'Diabetes', 'ATIVO', '2026-06-23', '2026-06-25', '2026-06-28', '910 900 021', 'Necessita de pensos programados; acesso sem barreiras arquitetónicas.', 'Familiar de demonstração 12563', 'Familiar'),
    ('12564', 'Francisco Manuel Calado', 'MASCULINO', '1940-03-19', 'L12', 'A', 'U1', 'COMPLEXO', 50, 'DPOC', 'ATIVO', '2026-06-24', '2026-06-26', '2026-06-29', '910 900 022', 'Vive com a esposa; necessita de ajuda na medicação.', 'Familiar de demonstração 12564', 'Familiar'),
    ('12565', 'Gertrudes Rosa Mira', 'FEMININO', '1931-10-24', 'L13', 'A', 'NU1', 'NAO_COMPLEXO', 60, 'Fragilidade', 'ATIVO', '2026-06-25', '2026-06-27', '2026-06-30', '910 900 023', 'Acompanhamento em articulação com o pessoal do lar.', 'Familiar de demonstração 12565', 'Familiar'),
    ('12566', 'Hélder Joaquim Charrua', 'MASCULINO', '1953-01-05', 'L14', 'A', 'U2', 'COMPLEXO', 50, 'Hipertensão', 'ATIVO', '2026-06-26', '2026-06-28', '2026-07-01', '910 900 024', 'Requer deslocação planeada; caminho secundário de acesso.', 'Familiar de demonstração 12566', 'Familiar'),
    ('12567', 'Aurora Santos Barradas', 'FEMININO', '1937-05-09', 'L15', 'A', 'NU1', 'NAO_COMPLEXO', 70, 'Osteoartrose', 'ATIVO', '2026-06-27', '2026-06-29', '2026-07-02', '910 900 025', 'Necessita de apoio na marcha; cuidador informal presente.', 'Familiar de demonstração 12567', 'Familiar'),
    ('12568', 'Vítor Manuel Dores', 'MASCULINO', '1945-09-01', 'L16', 'A', 'U0', 'ALTAMENTE_COMPLEXO', 30, 'Dispneia', 'ATIVO', '2026-06-28', '2026-06-30', '2026-07-03', '910 900 026', 'Foi admitido recentemente para controlo de sintomas.', 'Familiar de demonstração 12568', 'Familiar'),
    ('12571', 'Ilda Maria Lourenço', 'FEMININO', '1942-11-30', 'L17', 'A', 'NU2', 'COMPLEXO', 50, 'Insuficiência cardíaca', 'INATIVO', '2026-06-29', '2026-07-01', '2026-07-04', '910 900 027', 'Inativação demonstrativa; sem visitas programadas após encerramento.', 'Familiar de demonstração 12571', 'Familiar'),
    ('12572', 'Casimiro José Mestre', 'MASCULINO', '1936-08-13', 'L18', 'A', 'NU1', 'NAO_COMPLEXO', 60, 'Doença respiratória', 'ATIVO', '2026-06-30', '2026-07-02', '2026-07-05', '910 900 028', 'A filha reside noutra cidade; contacto telefónico recomendado.', 'Familiar de demonstração 12572', 'Familiar'),
    ('12573', 'Domingos Manuel Mendes', 'MASCULINO', '1948-02-14', 'L19', 'A', 'U1', 'COMPLEXO', 50, 'Aguarda admissão', 'REFERENCIADO', '2026-07-01', '2026-07-03', NULL, '910 900 029', 'Aguarda admissão e planeamento da primeira visita.', 'Familiar de demonstração 12573', 'Familiar'),
    ('12574', 'Isabel Maria Monteiro', 'FEMININO', '1954-04-11', 'L26', 'B', 'NU2', 'NAO_COMPLEXO', 70, 'Aguarda admissão', 'REFERENCIADO', '2026-07-02', '2026-07-04', NULL, '910 900 030', 'Referenciado; primeira visita por agendar.', NULL, NULL);


-- Validação territorial ANTES de qualquer inserção persistente.
-- NUTS III Baixo Alentejo: exclui Odemira (Alentejo Litoral) e Montemor-o-Novo (Alentejo Central).
DO $$
DECLARE v_concelhos integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM _rf40_local
    WHERE concelho NOT IN (
      'Aljustrel','Almodôvar','Alvito','Barrancos','Beja',
      'Castro Verde','Cuba','Ferreira do Alentejo','Mértola',
      'Moura','Ourique','Serpa','Vidigueira'
    )
  ) THEN RAISE EXCEPTION 'RF40: local fora do Baixo Alentejo'; END IF;
  IF EXISTS (
    SELECT 1 FROM _rf40_utente u
    LEFT JOIN _rf40_local l ON l.chave=u.local_chave
    WHERE l.chave IS NULL
  ) THEN RAISE EXCEPTION 'RF40: utente sem local definido'; END IF;
  SELECT count(DISTINCT l.concelho) INTO v_concelhos
    FROM _rf40_utente u JOIN _rf40_local l ON l.chave=u.local_chave;
  IF v_concelhos <> 13 THEN
    RAISE EXCEPTION 'RF40: esperados utentes nos 13 concelhos do Baixo Alentejo, obtidos %',v_concelhos;
  END IF;
END $$;

-- Proteção: na primeira execução, os 30 números devem estar livres.
-- Na repetição, verificar o marcador de autoria e o conjunto completo. Não modificar nada.
DO $$
DECLARE n integer; marcador integer;
BEGIN
  SELECT count(*) INTO n FROM utente WHERE numero_utente IN (SELECT numero FROM _rf40_utente);
  SELECT count(*) INTO marcador FROM parametro_sistema
    WHERE chave='RF40_SEED_0001_BAIXO_ALENTEJO' AND valor='2026-11-09';
  IF marcador > 0 THEN
    IF n <> 30 OR EXISTS (
      SELECT 1 FROM _rf40_utente s
      LEFT JOIN utente u ON u.numero_utente=s.numero
      WHERE u.id IS NULL OR u.nome IS DISTINCT FROM s.nome
            OR u.contacto_telefonico IS DISTINCT FROM s.telefone
    ) THEN
       RAISE EXCEPTION 'RF40: marcador existente mas dados alterados/incompletos; não modificar.';
    END IF;
  ELSE
    IF n > 0 THEN RAISE EXCEPTION
      'RF40: os números 12545..12574 já estão em uso (%). Não sobrepor dados.',n; END IF;
    IF EXISTS (SELECT 1 FROM equipa WHERE codigo IN ('A','B'))
       OR EXISTS (SELECT 1 FROM viatura WHERE matricula IN ('AA-24-BB','CC-18-DD'))
       OR EXISTS (SELECT 1 FROM utilizador WHERE email='sistema.rf40@exemplo.invalid')
       OR EXISTS (SELECT 1 FROM profissional WHERE nome IN ('Enf. Ana Silva','Dr. João Martins','Enf. Rui Pacheco','Enf. Marta Lopes','Dra. Sofia Lima','Enf. Inês Raposo'))
       OR EXISTS (SELECT 1 FROM local l JOIN _rf40_local s
                   ON l.morada=s.morada AND l.localidade=s.localidade)
    THEN RAISE EXCEPTION
      'RF40: há identificadores do mockup ocupados. Usar base sandbox nova.';
    END IF;
  END IF;
END $$;
CREATE TEMP TABLE _rf40_exec ON COMMIT DROP AS
SELECT NOT EXISTS(SELECT 1 FROM parametro_sistema WHERE chave='RF40_SEED_0001_BAIXO_ALENTEJO' AND valor='2026-11-09') AS aplicar;

-- 1. Concelhos de referência: esta é a única tabela partilhada que se reutiliza.
INSERT INTO concelho(nome, distrito)
SELECT DISTINCT s.concelho,
       'Beja'
FROM _rf40_local s WHERE (SELECT aplicar FROM _rf40_exec)
ON CONFLICT (nome) DO NOTHING;

-- 2. Utilizador técnico INATIVO; não tem hash válido, não permite login.
INSERT INTO utilizador(email,nome,password_hash,perfil,ativo,vista_geral,criado_em)
SELECT 'sistema.rf40@exemplo.invalid','Conta técnica RF40 (sem login)',
       '!RF40-SEM-HASH-VALIDO!', 'ADMINISTRADOR'::perfil_utilizador,
       FALSE,FALSE,TIMESTAMPTZ '2026-06-01 09:00:00+00'
WHERE (SELECT aplicar FROM _rf40_exec);

-- 3. Duas viaturas (matrículas inequivocamente fictícias).
INSERT INTO viatura(matricula,designacao,tipo_motorizacao,lugares,
  autonomia,unidade_autonomia,estado,data_ultima_revisao,periodicidade_revisao_meses,criada_em)
SELECT x.matricula,x.nome,x.motor::tipo_motorizacao,5,x.autonomia,'KM'::unidade_autonomia,
       'OPERACIONAL'::estado_viatura,CASE WHEN x.matricula='AA-24-BB' THEN DATE '2026-09-15' ELSE DATE '2026-01-20' END,
  CASE WHEN x.matricula='AA-24-BB' THEN 6 ELSE 12 END,TIMESTAMPTZ '2026-06-01 09:00+00'
FROM (VALUES
  ('AA-24-BB','Renault Kangoo','GASOLEO',640.0::numeric),
  ('CC-18-DD','Peugeot e-Rifter','ELETRICO',245.0::numeric)
) x(matricula,nome,motor,autonomia)
WHERE (SELECT aplicar FROM _rf40_exec);

-- 4. Seis profissionais, sem contas de autenticação.
CREATE TEMP TABLE _rf40_prof(chave text,nome text,funcao text,equipa text) ON COMMIT DROP;
INSERT INTO _rf40_prof VALUES
  ('ANA','Enf. Ana Silva','ENFERMEIRO','A'),
  ('JOAO','Dr. João Martins','MEDICO','A'),
  ('RUI','Enf. Rui Pacheco','ENFERMEIRO','A'),
  ('MARTA','Enf. Marta Lopes','ENFERMEIRO','B'),
  ('SOFIA','Dra. Sofia Lima','MEDICO','B'),
  ('INES','Enf. Inês Raposo','ENFERMEIRO','B');
INSERT INTO profissional(nome,funcao_id,contacto_telefonico,ativo,criado_em)
SELECT p.nome,f.id,'910 902 '||CASE p.chave WHEN 'ANA' THEN '001' WHEN 'JOAO' THEN '002' WHEN 'RUI' THEN '003' WHEN 'MARTA' THEN '004' WHEN 'SOFIA' THEN '005' ELSE '006' END,TRUE,TIMESTAMPTZ '2026-06-01 09:00+00'
FROM _rf40_prof p JOIN funcao_profissional f ON f.codigo=p.funcao
WHERE (SELECT aplicar FROM _rf40_exec);
INSERT INTO equipa(codigo,designacao,viatura_habitual_id,ativa,criada_em)
SELECT t.codigo,t.nome,v.id,TRUE,TIMESTAMPTZ '2026-06-01 09:00+00'
FROM (VALUES ('A','Beja e arredores','AA-24-BB'),
             ('B','Cuba, Serpa e Vidigueira','CC-18-DD')) AS t(codigo,nome,matricula)
JOIN viatura v ON v.matricula=t.matricula
WHERE (SELECT aplicar FROM _rf40_exec);
INSERT INTO equipa_membro(equipa_id,profissional_id,valido_desde)
SELECT e.id,p.id,TIMESTAMPTZ '2026-06-01 00:00+00'
FROM _rf40_prof sp
JOIN profissional p ON p.nome=sp.nome
JOIN equipa e ON e.codigo=sp.equipa
WHERE (SELECT aplicar FROM _rf40_exec);

-- 5. Locais: moradas e códigos postais de demonstração, sem associar coordenadas
-- a casas reais. Nenhum polígono de cobertura oficial é presumido.
INSERT INTO local(tipo,nome,morada,codigo_postal,localidade,concelho_id,
  geom,origem_coordenadas,coordenadas_confirmadas,ativo,criado_em)
SELECT s.tipo::tipo_local,NULLIF(s.nome,''),
       s.morada,s.codigo_postal,s.localidade,c.id,
       ST_SetSRID(ST_MakePoint(s.lon,s.lat),4326)::geography,
       'IMPORTADA'::origem_coordenadas,FALSE,TRUE,TIMESTAMPTZ '2026-06-01 10:00+00'
FROM _rf40_local s JOIN concelho c ON c.nome=s.concelho
WHERE (SELECT aplicar FROM _rf40_exec);

-- 6. Utentes: estado atual e histórico guardados separadamente.
INSERT INTO utente(numero_utente,nome,genero,data_nascimento,local_id,
  contacto_telefonico,situacao_clinica,notas,estado,criado_em,criado_por)
SELECT s.numero,s.nome,s.genero::genero,s.nascimento,l.id,s.telefone,
       s.clinica,s.notas,s.estado::estado_utente,
       (s.dt_ref::timestamp + interval '10 hours') AT TIME ZONE 'Europe/Lisbon',u.id
FROM _rf40_utente s
JOIN _rf40_local sl ON sl.chave=s.local_chave
JOIN local l ON l.morada=sl.morada AND l.localidade=sl.localidade
JOIN utilizador u ON u.email='sistema.rf40@exemplo.invalid'
WHERE (SELECT aplicar FROM _rf40_exec);

-- 7. Cuidadores (simulados; um por utente em domicílio).
INSERT INTO cuidador_principal(utente_id,nome,parentesco,contacto_telefonico,criado_em)
SELECT u.id,s.cuidador,s.parentesco,
       CASE WHEN s.telefone IS NULL THEN NULL ELSE '910 901 '||lpad((s.numero::int % 1000)::text,3,'0') END,
       TIMESTAMPTZ '2026-06-01 10:00+00'
FROM _rf40_utente s JOIN utente u ON u.numero_utente=s.numero
JOIN _rf40_local l ON l.chave=s.local_chave
WHERE s.cuidador IS NOT NULL AND (SELECT aplicar FROM _rf40_exec);

-- 8. Transições: referenciação, admissão e inativação (sem UPDATE ao histórico).
INSERT INTO utente_transicao_estado(utente_id,estado_anterior,estado_novo,
  data_transicao,motivo,registada_por,registada_em)
SELECT u.id,NULL,'REFERENCIADO'::estado_utente,s.dt_ref,
       'Referenciação simulada RF40',au.id,
       (s.dt_ref::timestamp+interval '10 hours') AT TIME ZONE 'Europe/Lisbon'
FROM _rf40_utente s JOIN utente u ON u.numero_utente=s.numero
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE (SELECT aplicar FROM _rf40_exec);
INSERT INTO utente_transicao_estado(utente_id,estado_anterior,estado_novo,
  data_transicao,motivo,registada_por,registada_em)
SELECT u.id,'REFERENCIADO'::estado_utente,'ATIVO'::estado_utente,s.dt_adm,
       'Admissão simulada RF40',au.id,
       (s.dt_adm::timestamp+interval '10 hours') AT TIME ZONE 'Europe/Lisbon'
FROM _rf40_utente s JOIN utente u ON u.numero_utente=s.numero
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE s.dt_adm IS NOT NULL AND (SELECT aplicar FROM _rf40_exec);
INSERT INTO utente_transicao_estado(utente_id,estado_anterior,estado_novo,
  data_transicao,motivo,registada_por,registada_em)
SELECT u.id,'ATIVO'::estado_utente,'INATIVO'::estado_utente,DATE '2026-11-01',
       'Inativação simulada RF40',au.id,TIMESTAMPTZ '2026-11-01 10:00+00'
FROM _rf40_utente s JOIN utente u ON u.numero_utente=s.numero
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE s.estado='INATIVO' AND (SELECT aplicar FROM _rf40_exec);

-- 9. Triagem com os cinco níveis de 0004; IPCPAL e PPS são independentes.
INSERT INTO avaliacao_triagem(utente_id,nivel_urgencia_id,motivo,avaliada_em,avaliada_por)
SELECT u.id,n.id,'Avaliação fictícia RF40',
       (s.dt_tri::timestamp+interval '11 hours') AT TIME ZONE 'Europe/Lisbon',au.id
FROM _rf40_utente s JOIN utente u ON u.numero_utente=s.numero
JOIN nivel_urgencia n ON n.codigo=s.urgencia AND n.ativo
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE (SELECT aplicar FROM _rf40_exec);
INSERT INTO avaliacao_complexidade(utente_id,nivel_complexidade_id,avaliada_em,avaliada_por,observacao)
SELECT u.id,n.id,(s.dt_tri::timestamp+interval '12 hours') AT TIME ZONE 'Europe/Lisbon',au.id,
       'Avaliação fictícia RF40'
FROM _rf40_utente s JOIN utente u ON u.numero_utente=s.numero
JOIN nivel_complexidade n ON n.codigo=s.complexidade
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE (SELECT aplicar FROM _rf40_exec);
INSERT INTO registo_pps(utente_id,valor,registado_em,registado_por,observacao)
SELECT u.id,s.pps,(s.dt_tri::timestamp+interval '12 hours 30 minutes') AT TIME ZONE 'Europe/Lisbon',au.id,
       'Pontuação fictícia RF40'
FROM _rf40_utente s JOIN utente u ON u.numero_utente=s.numero
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE (SELECT aplicar FROM _rf40_exec);

-- 10. Atribuição da equipa: mantém a última equipa de referência, mesmo em inatividade, como no mockup.
INSERT INTO atribuicao_equipa_responsavel(utente_id,equipa_id,valido_desde,valido_ate,
  motivo,registada_por,registada_em)
SELECT u.id,e.id,
       (s.dt_ref::timestamp+interval '09 hours') AT TIME ZONE 'Europe/Lisbon',
       NULL::timestamptz,
       'Atribuição fictícia RF40',au.id,
       (s.dt_ref::timestamp+interval '09 hours') AT TIME ZONE 'Europe/Lisbon'
FROM _rf40_utente s JOIN utente u ON u.numero_utente=s.numero
JOIN equipa e ON e.codigo=s.equipa
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE (SELECT aplicar FROM _rf40_exec);

-- 11. Durações hipotéticas usadas apenas na agenda de teste.
INSERT INTO duracao_padrao_complexidade(nivel_complexidade_id,minutos,valido_desde,definido_por)
SELECT n.id, CASE n.codigo WHEN 'ALTAMENTE_COMPLEXO' THEN 45
                          WHEN 'COMPLEXO' THEN 35 ELSE 25 END,
       TIMESTAMPTZ '2026-06-01 08:00+00',au.id
FROM nivel_complexidade n
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE n.codigo IN ('ALTAMENTE_COMPLEXO','COMPLEXO','NAO_COMPLEXO')
  AND (SELECT aplicar FROM _rf40_exec);


-- 12. Voltas de demonstração: 12 concluídas + 2 confirmadas.
CREATE TEMP TABLE _rf40_volta(chave text PRIMARY KEY,dia date,equipa text,estado text) ON COMMIT DROP;

INSERT INTO _rf40_volta VALUES
    ('RF40-V01', '2026-08-04', 'A', 'CONCLUIDA'),
    ('RF40-V02', '2026-08-13', 'B', 'CONCLUIDA'),
    ('RF40-V03', '2026-09-15', 'A', 'CONCLUIDA'),
    ('RF40-V04', '2026-09-28', 'B', 'CONCLUIDA'),
    ('RF40-V05', '2026-10-01', 'B', 'CONCLUIDA'),
    ('RF40-V06', '2026-10-02', 'A', 'CONCLUIDA'),
    ('RF40-V07', '2026-10-05', 'A', 'CONCLUIDA'),
    ('RF40-V08', '2026-10-08', 'B', 'CONCLUIDA'),
    ('RF40-V09', '2026-10-20', 'A', 'CONCLUIDA'),
    ('RF40-V10', '2026-10-22', 'B', 'CONCLUIDA'),
    ('RF40-V11', '2026-11-03', 'A', 'CONCLUIDA'),
    ('RF40-V12', '2026-11-05', 'B', 'CONCLUIDA'),
    ('RF40-V13', '2026-11-12', 'A', 'CONFIRMADA'),
    ('RF40-V14', '2026-11-13', 'B', 'CONFIRMADA');


INSERT INTO volta(data,designacao,estado,equipa_id,viatura_id,local_base_id,
  partida_prevista,regresso_previsto,partida_real,regresso_real,
  origem_plano,criada_por,criada_em,confirmada_por,confirmada_em)
SELECT s.dia,s.chave,s.estado::estado_volta,e.id,e.viatura_habitual_id,b.id,
       (s.dia::timestamp+interval '09 hours 30 minutes') AT TIME ZONE 'Europe/Lisbon',
       (s.dia::timestamp+interval '15 hours 00 minutes') AT TIME ZONE 'Europe/Lisbon',
       CASE WHEN s.estado='CONCLUIDA' THEN (s.dia::timestamp+interval '09 hours 35 minutes') AT TIME ZONE 'Europe/Lisbon' END,
       CASE WHEN s.estado='CONCLUIDA' THEN (s.dia::timestamp+interval '15 hours 05 minutes') AT TIME ZONE 'Europe/Lisbon' END,
       'MANUAL'::origem_plano,au.id,
       (LEAST(s.dia-2, DATE '2026-11-06')::timestamp+interval '12 hours') AT TIME ZONE 'Europe/Lisbon',au.id,
       (LEAST(s.dia-1, DATE '2026-11-06')::timestamp+interval '16 hours') AT TIME ZONE 'Europe/Lisbon'
FROM _rf40_volta s JOIN equipa e ON e.codigo=s.equipa
CROSS JOIN (SELECT id FROM local WHERE morada='Rua de Demonstração da Unidade, s/n') b
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE (SELECT aplicar FROM _rf40_exec);
-- A tripulação tem dois membros da equipa respetiva (enfermeiro e médico).
INSERT INTO volta_profissional(volta_id,profissional_id)
SELECT v.id,p.id FROM _rf40_volta s
JOIN volta v ON v.designacao=s.chave
JOIN _rf40_prof sp ON sp.equipa=s.equipa AND sp.funcao IN ('ENFERMEIRO','MEDICO')
JOIN profissional p ON p.nome=sp.nome
WHERE (SELECT aplicar FROM _rf40_exec)
  AND sp.chave IN ('ANA','JOAO','MARTA','SOFIA');

-- 13. Três visitas por volta, sem sobreposição de horários.
CREATE TEMP TABLE _rf40_visita(chave text,ordem smallint,numero text,horas text,PRIMARY KEY(chave,ordem)) ON COMMIT DROP;

INSERT INTO _rf40_visita VALUES
    ('RF40-V01', 1, '12569', '10:00'),
    ('RF40-V01', 2, '12570', '11:15'),
    ('RF40-V01', 3, '12562', '12:30'),
    ('RF40-V02', 1, '12560', '10:00'),
    ('RF40-V02', 2, '12561', '11:15'),
    ('RF40-V02', 3, '12545', '12:30'),
    ('RF40-V03', 1, '12562', '10:00'),
    ('RF40-V03', 2, '12559', '11:15'),
    ('RF40-V03', 3, '12563', '12:30'),
    ('RF40-V04', 1, '12561', '10:00'),
    ('RF40-V04', 2, '12552', '11:15'),
    ('RF40-V04', 3, '12553', '12:30'),
    ('RF40-V05', 1, '12560', '10:00'),
    ('RF40-V05', 2, '12554', '11:15'),
    ('RF40-V05', 3, '12555', '12:30'),
    ('RF40-V06', 1, '12569', '10:00'),
    ('RF40-V06', 2, '12559', '11:15'),
    ('RF40-V06', 3, '12563', '12:30'),
    ('RF40-V07', 1, '12570', '10:00'),
    ('RF40-V07', 2, '12564', '11:15'),
    ('RF40-V07', 3, '12565', '12:30'),
    ('RF40-V08', 1, '12545', '10:00'),
    ('RF40-V08', 2, '12546', '11:15'),
    ('RF40-V08', 3, '12548', '12:30'),
    ('RF40-V09', 1, '12557', '10:00'),
    ('RF40-V09', 2, '12549', '11:15'),
    ('RF40-V09', 3, '12550', '12:30'),
    ('RF40-V10', 1, '12556', '10:00'),
    ('RF40-V10', 2, '12551', '11:15'),
    ('RF40-V10', 3, '12547', '12:30'),
    ('RF40-V11', 1, '12566', '10:00'),
    ('RF40-V11', 2, '12567', '11:15'),
    ('RF40-V11', 3, '12568', '12:30'),
    ('RF40-V12', 1, '12545', '10:00'),
    ('RF40-V12', 2, '12546', '11:15'),
    ('RF40-V12', 3, '12548', '12:30'),
    ('RF40-V13', 1, '12569', '10:00'),
    ('RF40-V13', 2, '12570', '11:15'),
    ('RF40-V13', 3, '12564', '12:30'),
    ('RF40-V14', 1, '12560', '10:00'),
    ('RF40-V14', 2, '12553', '11:15'),
    ('RF40-V14', 3, '12554', '12:30');


-- Paragens — uma por visita, ligadas aos locais associados aos utentes.
INSERT INTO paragem(volta_id,ordem,local_id,distancia_desde_anterior_km)
SELECT v.id,s.ordem,u.local_id,NULL
FROM _rf40_visita s JOIN volta v ON v.designacao=s.chave
JOIN utente u ON u.numero_utente=s.numero
WHERE (SELECT aplicar FROM _rf40_exec);
-- Fixar o instante do snapshot GIS sem usar now() do trigger PostGIS.
UPDATE paragem pa SET coordenada_registada_em=v.criada_em
FROM volta v WHERE v.id=pa.volta_id AND v.designacao LIKE 'RF40-V%'
  AND (SELECT aplicar FROM _rf40_exec) AND pa.geom_planeada IS NOT NULL;

-- Duração histórica: avaliação IPCPAL válida no instante da visita (não a complexidade atual).
INSERT INTO visita(utente_id,paragem_id,equipa_executante_id,estado,
  inicio_previsto,fim_previsto,duracao_estimada_min,inicio_real,fim_real,
  motivo_cancelamento,criada_por,criada_em)
SELECT u.id,pa.id,v.equipa_id,
       CASE WHEN v.estado='CONCLUIDA' THEN 'CONCLUIDA'::estado_visita ELSE 'PLANEADA'::estado_visita END,
       tt.inicio,tt.inicio+make_interval(mins=>d.minutos),d.minutos,
       CASE WHEN v.estado='CONCLUIDA' THEN tt.inicio+interval '05 minutes' END,
       CASE WHEN v.estado='CONCLUIDA' THEN tt.inicio+interval '05 minutes'+make_interval(mins=>d.minutos) END,
       NULL,au.id,v.criada_em
FROM _rf40_visita s JOIN volta v ON v.designacao=s.chave
JOIN utente u ON u.numero_utente=s.numero
JOIN paragem pa ON pa.volta_id=v.id AND pa.ordem=s.ordem
CROSS JOIN LATERAL (SELECT (v.data::text||' '||s.horas)::timestamp AT TIME ZONE 'Europe/Lisbon' AS inicio) tt
JOIN LATERAL (
  SELECT ac.nivel_complexidade_id FROM avaliacao_complexidade ac
  WHERE ac.utente_id=u.id AND ac.avaliada_em<=tt.inicio
  ORDER BY ac.avaliada_em DESC,ac.id DESC LIMIT 1
) cx ON TRUE
JOIN LATERAL (
  SELECT dc.minutos FROM duracao_padrao_complexidade dc
  WHERE dc.nivel_complexidade_id=cx.nivel_complexidade_id AND dc.valido_desde<=tt.inicio
  ORDER BY dc.valido_desde DESC,dc.id DESC LIMIT 1
) d ON TRUE
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE (SELECT aplicar FROM _rf40_exec);

-- Visitas concluídas têm participante da tripulação (exigido pela migração 0003).
INSERT INTO visita_participante(visita_id,profissional_id)
SELECT vi.id,p.id FROM visita vi
JOIN paragem pa ON pa.id=vi.paragem_id
JOIN volta v ON v.id=pa.volta_id AND v.designacao LIKE 'RF40-V%'
JOIN equipa e ON e.id=v.equipa_id
JOIN _rf40_prof sp ON sp.equipa=e.codigo AND sp.chave IN ('ANA','MARTA')
JOIN profissional p ON p.nome=sp.nome
WHERE vi.estado='CONCLUIDA' AND (SELECT aplicar FROM _rf40_exec);

-- Em visitas de complexidade média/elevada, participa também o médico da tripulação.
-- A complexidade é determinada à data da visita, não pelo valor atual da ficha.
INSERT INTO visita_participante(visita_id,profissional_id)
SELECT vi.id,p.id
FROM visita vi
JOIN paragem pa ON pa.id=vi.paragem_id
JOIN volta v ON v.id=pa.volta_id AND v.designacao LIKE 'RF40-V%'
JOIN equipa e ON e.id=v.equipa_id
JOIN _rf40_prof sp ON sp.equipa=e.codigo AND sp.funcao='MEDICO'
JOIN profissional p ON p.nome=sp.nome
JOIN LATERAL (
  SELECT nc.codigo FROM avaliacao_complexidade ac
  JOIN nivel_complexidade nc ON nc.id=ac.nivel_complexidade_id
  WHERE ac.utente_id=vi.utente_id AND ac.avaliada_em<=vi.inicio_real
  ORDER BY ac.avaliada_em DESC,ac.id DESC LIMIT 1
) cx ON TRUE
WHERE vi.estado='CONCLUIDA' AND cx.codigo<>'NAO_COMPLEXO'
  AND (SELECT aplicar FROM _rf40_exec);

-- Pendentes, sem equipa e sem paragem; uma visita cancelada com motivo.
INSERT INTO visita(utente_id,estado,motivo_cancelamento,criada_por,criada_em)
SELECT u.id,x.estado::estado_visita,x.motivo,au.id,
       (x.dia::timestamp+interval '10 hours') AT TIME ZONE 'Europe/Lisbon'
FROM (VALUES
  ('12573','PENDENTE',NULL::text,DATE '2026-11-06'),
  ('12574','PENDENTE',NULL::text,DATE '2026-11-06'),
  ('12558','PENDENTE',NULL::text,DATE '2026-11-07'),
  ('12562','CANCELADA','Visita fictícia cancelada após inativação',DATE '2026-11-02')
) AS x(numero,estado,motivo,dia)
JOIN utente u ON u.numero_utente=x.numero
CROSS JOIN (SELECT id FROM utilizador WHERE email='sistema.rf40@exemplo.invalid') au
WHERE (SELECT aplicar FROM _rf40_exec);

-- Registo de versão do seed — na mesma transação que as fichas.
INSERT INTO parametro_sistema(chave,valor,tipo_valor,descricao,valido_desde,definido_por)
SELECT 'RF40_SEED_0001_BAIXO_ALENTEJO','2026-11-09','TEXTO'::tipo_valor_parametro,
       'Seed RF40: dados fictícios do Baixo Alentejo; não é uma migração',
       TIMESTAMPTZ '2026-06-01 08:00+00',u.id
FROM utilizador u WHERE u.email='sistema.rf40@exemplo.invalid'
  AND (SELECT aplicar FROM _rf40_exec);

-- Verificação final da carga: erro aborta a transação inteira.
DO $$
DECLARE v_n integer;
BEGIN
  SELECT count(*) INTO v_n FROM utente WHERE numero_utente BETWEEN '12545' AND '12574';
  IF v_n<>30 THEN RAISE EXCEPTION 'RF40: esperados 30 utentes, encontrados %',v_n; END IF;
  IF (SELECT count(*) FROM viatura WHERE matricula IN ('AA-24-BB','CC-18-DD'))<>2 THEN
    RAISE EXCEPTION 'RF40: viaturas em falta'; END IF;
  IF (SELECT count(*) FROM equipa WHERE codigo IN ('A','B'))<>2 THEN
    RAISE EXCEPTION 'RF40: equipas em falta'; END IF;
  IF (SELECT count(*) FROM profissional WHERE nome IN ('Enf. Ana Silva','Dr. João Martins','Enf. Rui Pacheco','Enf. Marta Lopes','Dra. Sofia Lima','Enf. Inês Raposo'))<>6 THEN
    RAISE EXCEPTION 'RF40: profissionais em falta'; END IF;
  IF (SELECT count(*) FROM local WHERE (morada,localidade) IN (SELECT morada,localidade FROM _rf40_local))<>27 THEN
    RAISE EXCEPTION 'RF40: esperados 27 locais (incluindo base)'; END IF;
  IF (SELECT count(*) FROM volta WHERE designacao LIKE 'RF40-V%')<>14 THEN
    RAISE EXCEPTION 'RF40: esperadas 14 voltas'; END IF;
  IF (SELECT count(*) FROM visita vi JOIN utente u ON vi.utente_id=u.id
      WHERE u.numero_utente BETWEEN '12545' AND '12574')<>46 THEN
    RAISE EXCEPTION 'RF40: esperadas 46 visitas'; END IF;
  IF (SELECT count(DISTINCT f.urgencia_codigo) FROM vw_utente_ficha f
      WHERE f.numero_utente BETWEEN '12545' AND '12574')<>5 THEN
    RAISE EXCEPTION 'RF40: nem todas as prioridades estão representadas'; END IF;
  IF (SELECT count(DISTINCT f.complexidade_codigo) FROM vw_utente_ficha f
      WHERE f.numero_utente BETWEEN '12545' AND '12574')<>3 THEN
    RAISE EXCEPTION 'RF40: nem todas as complexidades estão representadas'; END IF;
  IF EXISTS (
    SELECT 1 FROM vw_utente_ficha f
    WHERE f.numero_utente BETWEEN '12545' AND '12574'
      AND (f.geom IS NULL OR f.urgencia_codigo IS NULL OR f.complexidade_codigo IS NULL)
  ) THEN RAISE EXCEPTION 'RF40: ficha incompleta'; END IF;
  -- Todos os utentes RF40 e paragens das voltas RF40 devem ficar na NUTS III Baixo Alentejo.
  IF EXISTS (
    SELECT 1 FROM utente u
    JOIN local l ON l.id=u.local_id
    JOIN concelho c ON c.id=l.concelho_id
    WHERE u.numero_utente BETWEEN '12545' AND '12574'
      AND c.nome NOT IN ('Aljustrel','Almodôvar','Alvito','Barrancos','Beja',
        'Castro Verde','Cuba','Ferreira do Alentejo','Mértola','Moura','Ourique','Serpa','Vidigueira')
  ) THEN RAISE EXCEPTION 'RF40: utente fora do Baixo Alentejo'; END IF;
  IF EXISTS (
    SELECT 1 FROM paragem p
    JOIN volta v ON v.id=p.volta_id
    JOIN local l ON l.id=p.local_id
    JOIN concelho c ON c.id=l.concelho_id
    WHERE v.designacao LIKE 'RF40-V%'
      AND (c.nome NOT IN ('Aljustrel','Almodôvar','Alvito','Barrancos','Beja',
        'Castro Verde','Cuba','Ferreira do Alentejo','Mértola','Moura','Ourique','Serpa','Vidigueira')
      OR p.geom_planeada IS DISTINCT FROM l.geom)
  ) THEN RAISE EXCEPTION 'RF40: paragem fora do Baixo Alentejo ou snapshot GIS divergente'; END IF;
  IF EXISTS (
    SELECT 1 FROM volta v
    JOIN local b ON b.id=v.local_base_id
    JOIN concelho c ON c.id=b.concelho_id
    WHERE v.designacao LIKE 'RF40-V%'
      AND c.nome <> 'Beja'
  ) THEN RAISE EXCEPTION 'RF40: a base das voltas deve ser Beja'; END IF;
  IF EXISTS(
    SELECT 1 FROM (VALUES
      ('12569','Maria Teresa Almeida','A','U0','ATIVO', DATE '2026-10-02'),
      ('12560','Maria Teresa Godinho','B','U1','ATIVO', DATE '2026-10-01'),
      ('12570','Maria Teresa Silva','A','U2','ATIVO', DATE '2026-10-05'),
      ('12561','Maria Teresa Sousa','B','NU1','ATIVO', DATE '2026-09-28'),
      ('12562','Maria Isabel Ferreira','A','NU2','INATIVO', DATE '2026-09-15')
    ) AS exp(numero,nome,equipa,urgencia,estado,ultima_visita)
    LEFT JOIN vw_utente_ficha f ON f.numero_utente=exp.numero
    WHERE f.numero_utente IS NULL OR f.nome IS DISTINCT FROM exp.nome
      OR f.equipa_responsavel_codigo IS DISTINCT FROM exp.equipa
      OR f.urgencia_codigo IS DISTINCT FROM exp.urgencia
      OR f.estado::text IS DISTINCT FROM exp.estado
      OR (f.ultima_visita AT TIME ZONE 'Europe/Lisbon')::date IS DISTINCT FROM exp.ultima_visita
  ) THEN RAISE EXCEPTION 'RF40: as 5 fichas do mockup divergem'; END IF;
  RAISE NOTICE 'RF40: 30 utentes presentes, 5 fichas do mockup validadas; sem alterações aos dados preexistentes.';
END $$;
COMMIT;
