-- 0003_integridade_operacional.sql
-- Reforço de regras entre tabelas para RF21, RF29, RF43, RF50.
-- As validações são diferidas até COMMIT para suportar operações transacionais.
-- Não substituem controlo de acesso, auditoria, regras clínicas nem bloqueios
-- de concorrência definidos na API FastAPI.
BEGIN;

-- Não propagar exclusões físicas de visitas/voltas para históricos associativos.
ALTER TABLE volta_profissional DROP CONSTRAINT fk_volta_profissional_volta_id;
ALTER TABLE volta_profissional ADD CONSTRAINT fk_volta_profissional_volta_id
    FOREIGN KEY (volta_id) REFERENCES volta(id) ON DELETE RESTRICT;
ALTER TABLE visita_participante DROP CONSTRAINT fk_visita_participante_visita_id;
ALTER TABLE visita_participante ADD CONSTRAINT fk_visita_participante_visita_id
    FOREIGN KEY (visita_id) REFERENCES visita(id) ON DELETE RESTRICT;

-- A integridade da visita é usada também durante a validação da volta.
CREATE FUNCTION fn_validar_visita_atual(p_visita_id integer) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v visita%ROWTYPE;
    pa paragem%ROWTYPE;
    vo volta%ROWTYPE;
    u_local integer;
BEGIN
    SELECT * INTO v FROM visita WHERE id = p_visita_id;
    IF NOT FOUND THEN RETURN; END IF;

    IF v.estado = 'CONCLUIDA'
       AND NOT EXISTS (SELECT 1 FROM visita_participante p WHERE p.visita_id = v.id) THEN
        RAISE EXCEPTION 'Visita %: conclusão exige pelo menos um participante.', v.id;
    END IF;

    IF v.paragem_id IS NULL THEN RETURN; END IF;
    SELECT * INTO pa FROM paragem WHERE id = v.paragem_id;
    SELECT * INTO vo FROM volta WHERE id = pa.volta_id;

    IF v.estado IN ('PLANEADA','EM_CURSO','CONCLUIDA')
       AND vo.equipa_id IS NOT NULL
       AND v.equipa_executante_id IS DISTINCT FROM vo.equipa_id THEN
        RAISE EXCEPTION 'Visita %: equipa executante incoerente com a volta.', v.id;
    END IF;

    IF v.estado IN ('PLANEADA','EM_CURSO') THEN
        SELECT local_id INTO u_local FROM utente WHERE id = v.utente_id;
        IF u_local IS DISTINCT FROM pa.local_id THEN
            RAISE EXCEPTION 'Visita %: local da paragem diverge do local atual do utente.', v.id;
        END IF;
    END IF;

    IF vo.estado IN ('CONFIRMADA', 'EM_CURSO') AND v.estado IN ('PLANEADA','EM_CURSO')
       AND (v.inicio_previsto < vo.partida_prevista OR v.fim_previsto > vo.regresso_previsto) THEN
        RAISE EXCEPTION 'Visita %: horário planeado fora do intervalo da volta.', v.id;
    END IF;
END;
$$;


-- Examina o estado FINAL da volta após todas as escritas da transação.
CREATE FUNCTION fn_validar_volta_atual(p_volta_id integer) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    v volta%ROWTYPE;
    v_contagem integer;
    v_lugares integer;
BEGIN
    SELECT * INTO v FROM volta WHERE id = p_volta_id;
    IF NOT FOUND OR v.estado NOT IN ('CONFIRMADA', 'EM_CURSO', 'CONCLUIDA') THEN
        RETURN;
    END IF;

    SELECT count(*) INTO v_contagem
      FROM visita vi JOIN paragem pa ON pa.id = vi.paragem_id
     WHERE pa.volta_id = v.id AND vi.estado <> 'CANCELADA';
    IF v_contagem < 1 THEN
        RAISE EXCEPTION 'Volta %: é obrigatória pelo menos uma visita não cancelada.', v.id;
    END IF;

    SELECT lugares INTO v_lugares FROM viatura WHERE id = v.viatura_id;
    SELECT count(*) INTO v_contagem FROM volta_profissional WHERE volta_id = v.id;
    IF v_contagem < 1 THEN
        RAISE EXCEPTION 'Volta %: falta atribuir pelo menos um profissional.', v.id;
    END IF;
    IF v_contagem > v_lugares THEN
        RAISE EXCEPTION 'Volta %: tripulação excede lotação da viatura.', v.id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM viatura_indisponibilidade i
         WHERE i.viatura_id = v.viatura_id
           AND tstzrange(i.inicio, i.fim, '[)') && tstzrange(v.partida_prevista, v.regresso_previsto, '[)')
    ) THEN
        RAISE EXCEPTION 'Volta %: viatura indisponível no horário previsto.', v.id;
    END IF;

    -- Um profissional não pode ser colocado em duas voltas ativas sobrepostas;
    -- a restrição também confronta voltas já concluídas (integridade histórica).
    IF EXISTS (
        SELECT 1
          FROM volta_profissional vp
          JOIN volta_profissional vp2 ON vp2.profissional_id = vp.profissional_id
          JOIN volta outra ON outra.id = vp2.volta_id
         WHERE vp.volta_id = v.id
           AND outra.id <> v.id
           AND outra.estado IN ('CONFIRMADA', 'EM_CURSO', 'CONCLUIDA')
           AND outra.partida_prevista IS NOT NULL AND outra.regresso_previsto IS NOT NULL
           AND tstzrange(outra.partida_prevista, outra.regresso_previsto, '[)')
               && tstzrange(v.partida_prevista, v.regresso_previsto, '[)')
    ) THEN
        RAISE EXCEPTION 'Volta %: profissional atribuído a outra volta sobreposta.', v.id;
    END IF;

    -- Membro da equipa no intervalo planeado completo. Esta condição é
    -- independente da tabela opcional de escalas de turnos.
    IF EXISTS (
        SELECT 1 FROM volta_profissional vp
         WHERE vp.volta_id = v.id
           AND NOT EXISTS (
               SELECT 1 FROM equipa_membro em
                WHERE em.equipa_id = v.equipa_id
                  AND em.profissional_id = vp.profissional_id
                  AND em.valido_desde <= v.partida_prevista
                  AND (em.valido_ate IS NULL OR em.valido_ate >= v.regresso_previsto)
           )
    ) THEN
        RAISE EXCEPTION 'Volta %: profissional fora da composição da equipa no intervalo.', v.id;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM paragem pa
          JOIN visita vi ON vi.paragem_id = pa.id
         WHERE pa.volta_id = v.id
           AND vi.estado NOT IN ('PENDENTE','CANCELADA')
           AND vi.equipa_executante_id IS DISTINCT FROM v.equipa_id
    ) THEN
        RAISE EXCEPTION 'Volta %: equipa executante da visita diverge da equipa da volta.', v.id;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM paragem pa JOIN visita vi ON vi.paragem_id = pa.id
          JOIN visita_participante p ON p.visita_id = vi.id
         WHERE pa.volta_id = v.id
           AND NOT EXISTS (
               SELECT 1 FROM volta_profissional vp
                WHERE vp.volta_id = v.id AND vp.profissional_id = p.profissional_id
           )
    ) THEN
        RAISE EXCEPTION 'Volta %: participante de visita ausente da tripulação.', v.id;
    END IF;

    -- Em confirmação, a visita deve ter uma paragem coerente e, quando
    -- planeada, situar-se dentro do intervalo temporal da volta.
    FOR v_contagem IN
        SELECT vi.id FROM visita vi JOIN paragem pa ON pa.id = vi.paragem_id
         WHERE pa.volta_id = v.id
    LOOP
        PERFORM fn_validar_visita_atual(v_contagem);
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION fn_volta_validar_confirmacao() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    PERFORM fn_validar_volta_atual(NEW.id);
    RETURN NULL;
END;
$$;


-- Disparador diferido genérico de integridade sobre dependências diretas.
CREATE FUNCTION fn_validar_dependencia_operacional() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    old_volta_id integer;
    new_volta_id integer;
    old_visita_id integer;
    new_visita_id integer;
    old_alvo_id integer;
    new_alvo_id integer;
    r record;
BEGIN
    IF TG_TABLE_NAME = 'paragem' THEN
        IF TG_OP <> 'INSERT' THEN old_volta_id := OLD.volta_id; END IF;
        IF TG_OP <> 'DELETE' THEN new_volta_id := NEW.volta_id; END IF;
        IF TG_OP = 'DELETE' THEN old_alvo_id := OLD.id;
        ELSE new_alvo_id := NEW.id; END IF;
        FOR r IN SELECT id FROM visita WHERE paragem_id IN (old_alvo_id,new_alvo_id)
        LOOP
            PERFORM fn_validar_visita_atual(r.id);
        END LOOP;
    ELSIF TG_TABLE_NAME = 'volta_profissional' THEN
        IF TG_OP <> 'INSERT' THEN old_volta_id := OLD.volta_id; END IF;
        IF TG_OP <> 'DELETE' THEN new_volta_id := NEW.volta_id; END IF;
    ELSIF TG_TABLE_NAME = 'visita' THEN
        IF TG_OP <> 'INSERT' THEN
            old_visita_id := OLD.id;
            SELECT volta_id INTO old_volta_id FROM paragem WHERE id = OLD.paragem_id;
        END IF;
        IF TG_OP <> 'DELETE' THEN
            new_visita_id := NEW.id;
            SELECT volta_id INTO new_volta_id FROM paragem WHERE id = NEW.paragem_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'visita_participante' THEN
        IF TG_OP <> 'INSERT' THEN
            old_visita_id := OLD.visita_id;
            SELECT pa.volta_id INTO old_volta_id
              FROM visita vi JOIN paragem pa ON vi.paragem_id = pa.id
             WHERE vi.id = OLD.visita_id;
        END IF;
        IF TG_OP <> 'DELETE' THEN
            new_visita_id := NEW.visita_id;
            SELECT pa.volta_id INTO new_volta_id
              FROM visita vi JOIN paragem pa ON vi.paragem_id = pa.id
             WHERE vi.id = NEW.visita_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'viatura_indisponibilidade' THEN
        -- As exclusões de intervalos na mesma tabela já são verificadas pelo núcleo.
        IF TG_OP <> 'INSERT' THEN old_alvo_id := OLD.viatura_id; END IF;
        IF TG_OP <> 'DELETE' THEN new_alvo_id := NEW.viatura_id; END IF;
        FOR r IN SELECT id FROM volta WHERE viatura_id IN (old_alvo_id,new_alvo_id) LOOP
            PERFORM fn_validar_volta_atual(r.id);
        END LOOP;
    ELSIF TG_TABLE_NAME = 'viatura' THEN
        FOR r IN SELECT id FROM volta WHERE viatura_id = NEW.id LOOP
            PERFORM fn_validar_volta_atual(r.id);
        END LOOP;
    ELSIF TG_TABLE_NAME = 'equipa_membro' THEN
        IF TG_OP <> 'INSERT' THEN old_alvo_id := OLD.equipa_id; END IF;
        IF TG_OP <> 'DELETE' THEN new_alvo_id := NEW.equipa_id; END IF;
        FOR r IN SELECT DISTINCT vo.id FROM volta vo
             JOIN volta_profissional vp ON vp.volta_id = vo.id
             WHERE vo.equipa_id IN (old_alvo_id,new_alvo_id) LOOP
            PERFORM fn_validar_volta_atual(r.id);
        END LOOP;
    END IF;

    IF old_visita_id IS NOT NULL THEN PERFORM fn_validar_visita_atual(old_visita_id); END IF;
    IF new_visita_id IS NOT NULL AND new_visita_id IS DISTINCT FROM old_visita_id THEN
        PERFORM fn_validar_visita_atual(new_visita_id);
    END IF;
    IF old_volta_id IS NOT NULL THEN PERFORM fn_validar_volta_atual(old_volta_id); END IF;
    IF new_volta_id IS NOT NULL AND new_volta_id IS DISTINCT FROM old_volta_id THEN
        PERFORM fn_validar_volta_atual(new_volta_id);
    END IF;
    RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_paragem_revalidar_volta
    AFTER INSERT OR UPDATE OR DELETE ON paragem
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    EXECUTE FUNCTION fn_validar_dependencia_operacional();
CREATE CONSTRAINT TRIGGER trg_visita_revalidar_volta
    AFTER INSERT OR UPDATE OR DELETE ON visita
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    EXECUTE FUNCTION fn_validar_dependencia_operacional();
CREATE CONSTRAINT TRIGGER trg_tripulacao_revalidar_volta
    AFTER INSERT OR UPDATE OR DELETE ON volta_profissional
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    EXECUTE FUNCTION fn_validar_dependencia_operacional();
CREATE CONSTRAINT TRIGGER trg_participacao_revalidar_visita
    AFTER INSERT OR UPDATE OR DELETE ON visita_participante
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    EXECUTE FUNCTION fn_validar_dependencia_operacional();
CREATE CONSTRAINT TRIGGER trg_indisponibilidade_revalidar_volta
    AFTER INSERT OR UPDATE OR DELETE ON viatura_indisponibilidade
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    EXECUTE FUNCTION fn_validar_dependencia_operacional();
CREATE CONSTRAINT TRIGGER trg_lotacao_revalidar_volta
    AFTER UPDATE OF lugares ON viatura
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    EXECUTE FUNCTION fn_validar_dependencia_operacional();
CREATE CONSTRAINT TRIGGER trg_equipa_membro_revalidar_volta
    AFTER INSERT OR UPDATE OR DELETE ON equipa_membro
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    EXECUTE FUNCTION fn_validar_dependencia_operacional();

-- Ao transferir um utente de local, impedir que visitas ainda planeadas
-- permaneçam apontadas ao local anterior sem correção na mesma transação.
CREATE FUNCTION fn_utente_revalidar_visitas() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT id FROM visita WHERE utente_id = NEW.id
        AND estado IN ('PLANEADA','EM_CURSO') LOOP
        PERFORM fn_validar_visita_atual(r.id);
    END LOOP;
    RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER trg_utente_revalidar_visitas
    AFTER UPDATE OF local_id ON utente
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
    EXECUTE FUNCTION fn_utente_revalidar_visitas();

-- Conferência das retificações clínicas no mesmo utente de origem.
CREATE FUNCTION fn_triagem_retificacao_mesmo_utente() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_utente_id integer;
BEGIN
    IF NEW.retifica_id IS NULL THEN RETURN NEW; END IF;
    SELECT utente_id INTO v_utente_id FROM avaliacao_triagem WHERE id = NEW.retifica_id;
    IF v_utente_id IS DISTINCT FROM NEW.utente_id THEN
        RAISE EXCEPTION 'Triagem: a avaliação retificada deve ser do mesmo utente.';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_triagem_retificacao_mesmo_utente
    BEFORE INSERT ON avaliacao_triagem
    FOR EACH ROW EXECUTE FUNCTION fn_triagem_retificacao_mesmo_utente();

COMMIT;
