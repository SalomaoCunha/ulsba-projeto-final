-- 0002_extensoes_modelo_documentado.sql
-- Complementa o núcleo do modelo para 32 entidades e 252 atributos.
-- RF04/RF05/RF21/RF24/RF25/RF43/RF50, RNF11/RNF27.
-- Dependência: 0001_modelo_inicial.sql. Aplicar apenas uma vez, numa BD de desenvolvimento.
BEGIN;

-- Escala de disponibilidade efetiva; diferente de pertença à equipa e de tripulação.
-- O uso da escala como condição obrigatória de confirmação requer validação operacional.
CREATE TABLE escala_profissional (
    id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profissional_id integer NOT NULL REFERENCES profissional(id),
    equipa_id      integer NOT NULL REFERENCES equipa(id),
    inicio         timestamptz NOT NULL,
    fim            timestamptz NOT NULL,
    observacao     varchar(300),
    registada_por  integer NOT NULL REFERENCES utilizador(id),
    registada_em   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_escala_periodo CHECK (fim > inicio),
    CONSTRAINT ex_escala_profissional_sem_sobreposicao
        EXCLUDE USING gist (profissional_id WITH =, tstzrange(inicio, fim, '[)') WITH &&)
);
CREATE INDEX ix_escala_equipa ON escala_profissional(equipa_id, inicio);
COMMENT ON TABLE escala_profissional IS 'Períodos de serviço planeados por profissional e equipa. A utilização como pré-requisito de confirmação carece de validação.';

-- Polígonos de cobertura versionados; a existência/aprovação de limites oficiais
-- não é pressuposta e nenhum polígono fictício é semeado.
CREATE TABLE territorio_cobertura (
    id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome          varchar(120) NOT NULL,
    geom          geometry(MultiPolygon,4326) NOT NULL,
    origem        varchar(200) NOT NULL,
    aprovado      boolean NOT NULL DEFAULT false,
    valido_desde  date,
    registado_em  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_territorio_valido CHECK (ST_IsValid(geom) AND NOT ST_IsEmpty(geom))
);
CREATE INDEX ix_territorio_geom ON territorio_cobertura USING gist(geom);
COMMENT ON TABLE territorio_cobertura IS 'Limites geográficos de cobertura; apenas os registos aprovados e vigentes servem para validar localizações.';

-- Snapshot opcional da localização de cada paragem. O local atual pode ser corrigido
-- sem reescrever a coordenada utilizada para planear uma volta anterior.
ALTER TABLE paragem
    ADD COLUMN geom_planeada geography(Point,4326),
    ADD COLUMN coordenada_registada_em timestamptz,
    ADD CONSTRAINT ck_paragem_snapshot
        CHECK ((geom_planeada IS NULL) = (coordenada_registada_em IS NULL));
CREATE INDEX ix_paragem_geom_planeada ON paragem USING gist(geom_planeada);

CREATE FUNCTION fn_paragem_capturar_geometria() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_geom geography(Point,4326);
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT geom INTO v_geom FROM local WHERE id = NEW.local_id;
        NEW.geom_planeada := v_geom;
        NEW.coordenada_registada_em := CASE WHEN v_geom IS NULL THEN NULL ELSE now() END;
    ELSIF NEW.local_id IS DISTINCT FROM OLD.local_id THEN
        SELECT geom INTO v_geom FROM local WHERE id = NEW.local_id;
        NEW.geom_planeada := v_geom;
        NEW.coordenada_registada_em := CASE WHEN v_geom IS NULL THEN NULL ELSE now() END;
    ELSIF NEW.geom_planeada IS DISTINCT FROM OLD.geom_planeada THEN
        NEW.coordenada_registada_em := CASE WHEN NEW.geom_planeada IS NULL THEN NULL ELSE now() END;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_paragem_capturar_geometria
    BEFORE INSERT OR UPDATE OF local_id, geom_planeada ON paragem
    FOR EACH ROW EXECUTE FUNCTION fn_paragem_capturar_geometria();

-- Consulta espacial: NULL significa que ainda não há perímetro oficial aprovado
-- ou que o local não tem coordenadas. O resultado não é uma medição de distâncias
-- por estrada; essas requerem um motor de encaminhamento.
CREATE VIEW vw_local_cobertura AS
SELECT
    l.id AS local_id,
    CASE
        WHEN l.geom IS NULL THEN NULL::boolean
        WHEN NOT EXISTS(SELECT 1 FROM territorio_cobertura t WHERE t.aprovado
                AND (t.valido_desde IS NULL OR t.valido_desde <= CURRENT_DATE)) THEN NULL::boolean
        ELSE EXISTS(
            SELECT 1 FROM territorio_cobertura t
             WHERE t.aprovado
               AND (t.valido_desde IS NULL OR t.valido_desde <= CURRENT_DATE)
               AND ST_Covers(t.geom, l.geom::geometry)
        )
    END AS dentro_cobertura_aprovada
FROM local l;

COMMIT;
