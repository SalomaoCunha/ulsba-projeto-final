-- Testes para uma BD isolada de desenvolvimento.
-- Executar depois das migrações 0001 -> 0003. Não guarda dados de teste.
\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
    n_tabelas integer;
    n_colunas integer;
    n_enums integer;
    x integer;
    v_user integer;
    v_concelho integer;
    v_local integer;
    v_viatura integer;
    v_volta integer;
    v_paragem integer;
    v_profissional integer;
    v_equipa integer;
    v_funcao integer;
    v_escala integer;
    v_ok boolean;
    v_srid integer;
    v_metros double precision;
    v_excecao boolean;
BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='postgis') THEN
        RAISE EXCEPTION 'Extensão PostGIS não instalada';
    END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='btree_gist') THEN
        RAISE EXCEPTION 'Extensão btree_gist não instalada';
    END IF;

    SELECT count(*) INTO n_tabelas FROM information_schema.tables
     WHERE table_schema='public' AND table_type='BASE TABLE'
       AND table_name IN (
        'utilizador','concelho','nivel_urgencia','nivel_complexidade','funcao_profissional','tipo_ocorrencia',
        'parametro_sistema','duracao_padrao_complexidade','viatura','viatura_indisponibilidade','profissional',
        'equipa','equipa_membro','local','utente','cuidador_principal','utente_transicao_estado',
        'avaliacao_triagem','avaliacao_complexidade','registo_pps','atribuicao_equipa_responsavel',
        'volta','volta_profissional','paragem','visita','visita_participante','ocorrencia',
        'auditoria','exportacao_algoritmo','mensagem','escala_profissional','territorio_cobertura'
       );
    IF n_tabelas <> 32 THEN RAISE EXCEPTION 'Esperadas 32 tabelas; encontradas %', n_tabelas; END IF;

    SELECT count(*) INTO n_colunas FROM information_schema.columns
     WHERE table_schema='public'
       AND table_name IN (
        'utilizador','concelho','nivel_urgencia','nivel_complexidade','funcao_profissional','tipo_ocorrencia',
        'parametro_sistema','duracao_padrao_complexidade','viatura','viatura_indisponibilidade','profissional',
        'equipa','equipa_membro','local','utente','cuidador_principal','utente_transicao_estado',
        'avaliacao_triagem','avaliacao_complexidade','registo_pps','atribuicao_equipa_responsavel',
        'volta','volta_profissional','paragem','visita','visita_participante','ocorrencia',
        'auditoria','exportacao_algoritmo','mensagem','escala_profissional','territorio_cobertura'
       );
    IF n_colunas <> 252 THEN RAISE EXCEPTION 'Esperadas 252 colunas; encontradas %', n_colunas; END IF;

    SELECT count(*) INTO n_enums FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname='public' AND t.typtype='e';
    IF n_enums <> 18 THEN RAISE EXCEPTION 'Esperados 18 ENUM; encontrados %', n_enums; END IF;

    INSERT INTO utilizador(email,nome,password_hash,perfil)
        VALUES('ensaio.postgis@example.invalid','Conta fictícia','NAO_USAR_EM_PRODUCAO','COORDENADOR')
        RETURNING id INTO v_user;
    INSERT INTO concelho(nome,distrito) VALUES('Teste PostGIS', 'Teste') RETURNING id INTO v_concelho;
    INSERT INTO local(tipo,morada,localidade,concelho_id,geom,
                      origem_coordenadas,coordenadas_confirmadas)
        VALUES('DOMICILIO','Morada fictícia','Beja',v_concelho,
               ST_SetSRID(ST_MakePoint(-7.86, 38.015), 4326)::geography,
               'MARCADA_NO_MAPA',true)
        RETURNING id INTO v_local;
    SELECT ST_SRID(geom::geometry) INTO v_srid FROM local WHERE id=v_local;
    IF v_srid <> 4326 THEN RAISE EXCEPTION 'SRID incorreto: %', v_srid; END IF;
    SELECT ST_Distance(geom, ST_SetSRID(ST_MakePoint(-7.85,38.014),4326)::geography)
      INTO v_metros FROM local WHERE id=v_local;
    IF v_metros IS NULL OR v_metros <= 0 OR v_metros > 5000 THEN
        RAISE EXCEPTION 'Distância geográfica inverosímil: % metros', v_metros;
    END IF;

    INSERT INTO viatura(matricula,tipo_motorizacao,lugares)
        VALUES('TESTE-ULSBA','ELETRICO',2) RETURNING id INTO v_viatura;
    INSERT INTO funcao_profissional(codigo,designacao)
        VALUES('TESTE','Função fictícia') RETURNING id INTO v_funcao;
    INSERT INTO profissional(nome,funcao_id) VALUES('Profissional fictício',v_funcao)
        RETURNING id INTO v_profissional;
    INSERT INTO equipa(codigo) VALUES('Z') RETURNING id INTO v_equipa;
    INSERT INTO equipa_membro(equipa_id,profissional_id,valido_desde)
        VALUES(v_equipa,v_profissional,now() - INTERVAL '1 day');
    INSERT INTO escala_profissional(profissional_id,equipa_id,inicio,fim,registada_por)
        VALUES(v_profissional,v_equipa,now(),now()+INTERVAL '8 hours',v_user)
        RETURNING id INTO v_escala;
    v_excecao := false;
    BEGIN
        INSERT INTO escala_profissional(profissional_id,equipa_id,inicio,fim,registada_por)
        VALUES(v_profissional,v_equipa,now()+INTERVAL '1 hour',now()+INTERVAL '9 hours',v_user);
    EXCEPTION WHEN exclusion_violation THEN
        v_excecao := true;
    END;
    IF NOT v_excecao THEN RAISE EXCEPTION 'Escala sobreposta não foi rejeitada'; END IF;

    INSERT INTO volta(data,criada_por)
        VALUES(CURRENT_DATE, v_user) RETURNING id INTO v_volta;
    INSERT INTO paragem(volta_id,ordem,local_id)
        VALUES(v_volta,1,v_local) RETURNING id INTO v_paragem;
    IF NOT EXISTS (SELECT 1 FROM paragem p WHERE p.id=v_paragem
                   AND p.geom_planeada IS NOT NULL
                   AND p.coordenada_registada_em IS NOT NULL) THEN
        RAISE EXCEPTION 'Snapshot da paragem não foi capturado';
    END IF;

    INSERT INTO territorio_cobertura(nome,geom,origem,aprovado,valido_desde)
        VALUES('Polígono fictício de teste',
               ST_Multi(ST_MakeEnvelope(-8.5,37.5,-7.0,38.7,4326)),
               'TESTE - NAO OFICIAL',true,CURRENT_DATE);
    SELECT dentro_cobertura_aprovada INTO v_ok FROM vw_local_cobertura
     WHERE local_id=v_local;
    IF v_ok IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'O local deveria estar dentro do polígono de ensaio';
    END IF;
    RAISE NOTICE 'OK: 32 tabelas, 252 campos, 18 ENUM, SRID 4326, distância em metros, escalas, snapshot e cobertura';
END;
$$;

-- Dados de teste removidos automaticamente.
ROLLBACK;
