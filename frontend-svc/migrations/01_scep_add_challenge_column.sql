-- +migrate Up
ALTER TABLE ONLY public.scep_servers ADD COLUMN challenge text NULL DEFAULT NULL;

-- +migrate Down
ALTER TABLE public.scep_servers DROP COLUMN challenge;