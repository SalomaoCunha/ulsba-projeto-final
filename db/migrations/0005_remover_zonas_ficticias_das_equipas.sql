-- Remove designações territoriais fictícias das equipas de demonstração.
-- As localidades continuam disponíveis para os registos de locais e utentes.
BEGIN;

UPDATE equipa
SET designacao = NULL
WHERE designacao IN ('Beja e arredores', 'Cuba, Serpa e Vidigueira');

COMMIT;
