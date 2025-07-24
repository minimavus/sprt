-- +migrate Up
ALTER TABLE ONLY public.users ADD COLUMN sidebar jsonb NULL DEFAULT '{}'::jsonb;

-- +migrate Down
ALTER TABLE public.users DROP COLUMN sidebar;