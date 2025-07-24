-- +migrate Up
CREATE TABLE IF NOT EXISTS public.config (
    key text PRIMARY KEY NOT NULL UNIQUE,
    value jsonb
);

-- +migrate Down
DROP TABLE IF EXISTS public.config;