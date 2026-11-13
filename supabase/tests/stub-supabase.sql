-- Simula o mínimo do Supabase para testar o schema.sql num Postgres puro.
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
create schema auth;
-- No Supabase, as extensões (btree_gist) moram no schema `extensions`.
create schema extensions;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);
-- `request.jwt.claim.sub` nos testes com psql; `request.jwt.claims` quando vem pelo PostgREST.
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub'
  )::uuid
$$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
-- O schema acrescenta `agendamentos` e `ocupacoes` à publicação do Realtime.
create publication supabase_realtime;
