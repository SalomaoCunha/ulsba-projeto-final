CREATE TABLE IF NOT EXISTS viatura_bloqueio (
    id SERIAL PRIMARY KEY,
    viatura_id INTEGER NOT NULL REFERENCES viatura(id) ON DELETE CASCADE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('MANUTENCAO', 'INDISPONIBILIDADE')),
    motivo TEXT,
    criado_por INTEGER REFERENCES utilizador(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_viatura_bloqueio_datas CHECK (data_fim >= data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_viatura_bloqueio_viatura_datas
    ON viatura_bloqueio (viatura_id, data_inicio, data_fim);