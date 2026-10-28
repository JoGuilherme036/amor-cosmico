-- =====================================================================
-- Amor Cósmico — banco de dados (Supabase / Postgres)
--
-- Como usar: em scripts/, rode `npm run encrypt -- --senha "..."`. Ele gera
-- supabase/schema.local.sql com o hash do token já preenchido (esse arquivo
-- NÃO vai para o GitHub). Cole-o no Supabase → SQL Editor → Run.
--
-- Segurança: as tabelas ficam FECHADAS para a chave pública (anon).
-- O site só fala com o banco por funções que recebem o "token da sala"
-- (derivado da senha do casal no navegador) e conferem o SHA-256 dele.
-- Quem não tem a senha não lê nem escreve nada.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- tabelas ----------
create table if not exists public.vows (
  id          bigint generated always as identity primary key,
  author      text not null check (char_length(author) between 1 and 40),
  text        text not null check (char_length(text) between 1 and 400),
  created_at  timestamptz not null default now()
);
create table if not exists public.capsule (
  id          bigint generated always as identity primary key,
  author      text not null check (char_length(author) between 1 and 40),
  text        text not null check (char_length(text) between 1 and 500),
  created_at  timestamptz not null default now()
);
create table if not exists public.hearts (
  id          bigint generated always as identity primary key,
  media_id    text not null check (char_length(media_id) between 1 and 64),
  created_at  timestamptz not null default now()
);
create index if not exists hearts_media_idx on public.hearts (media_id);

-- RLS ligado e SEM políticas = ninguém acessa direto pela API
alter table public.vows    enable row level security;
alter table public.capsule enable row level security;
alter table public.hearts  enable row level security;
revoke all on public.vows, public.capsule, public.hearts from anon, authenticated;

-- ---------- porteiro ----------
create or replace function public.ac_ok(p_token text) returns boolean
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex') = '__ROOM_TOKEN_SHA256__'
$$;
create or replace function public.ac_guard(p_token text) returns void
language plpgsql set search_path = public as $$
begin
  if not public.ac_ok(p_token) then raise exception 'acesso negado' using errcode = '42501'; end if;
end $$;

-- ---------- mural de promessas ----------
create or replace function public.vows_list(p_token text) returns setof public.vows
language plpgsql stable security definer set search_path = public as $$
begin perform public.ac_guard(p_token); return query select * from public.vows order by created_at desc limit 200; end $$;

create or replace function public.vows_add(p_token text, p_author text, p_text text) returns public.vows
language plpgsql security definer set search_path = public as $$
declare r public.vows;
begin perform public.ac_guard(p_token);
  insert into public.vows (author, text) values (left(trim(p_author), 40), left(trim(p_text), 400)) returning * into r; return r; end $$;

create or replace function public.vows_delete(p_token text, p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin perform public.ac_guard(p_token); delete from public.vows where id = p_id; end $$;

-- ---------- cápsula do tempo (lê só a partir de 15.08.2027; nunca apaga) ----------
create or replace function public.capsule_add(p_token text, p_author text, p_text text) returns void
language plpgsql security definer set search_path = public as $$
begin perform public.ac_guard(p_token); insert into public.capsule (author, text) values (left(trim(p_author), 40), left(trim(p_text), 500)); end $$;

create or replace function public.capsule_count(p_token text) returns integer
language plpgsql stable security definer set search_path = public as $$
begin perform public.ac_guard(p_token); return (select count(*)::int from public.capsule); end $$;

create or replace function public.capsule_list(p_token text) returns setof public.capsule
language plpgsql stable security definer set search_path = public as $$
begin perform public.ac_guard(p_token);
  if now() < timestamptz '2027-08-15 00:00:00-03' then raise exception 'a cápsula ainda está lacrada' using errcode = '42501'; end if;
  return query select * from public.capsule order by created_at; end $$;

-- ---------- curtidas ----------
create or replace function public.hearts_add(p_token text, p_media text) returns void
language plpgsql security definer set search_path = public as $$
begin perform public.ac_guard(p_token); insert into public.hearts (media_id) values (left(p_media, 64)); end $$;

create or replace function public.heart_counts(p_token text) returns table (media_id text, total bigint)
language plpgsql stable security definer set search_path = public as $$
begin perform public.ac_guard(p_token); return query select h.media_id, count(*) from public.hearts h group by h.media_id; end $$;

-- só as funções ficam expostas
revoke execute on all functions in schema public from public;
grant execute on function public.vows_list(text), public.vows_add(text, text, text), public.vows_delete(text, bigint),
  public.capsule_add(text, text, text), public.capsule_count(text), public.capsule_list(text),
  public.hearts_add(text, text), public.heart_counts(text) to anon;
