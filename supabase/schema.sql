-- Code Bible — Supabase schema
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is idempotent.
--
-- Design:
--   * profiles   one row per user: the username people see
--   * user_data  one row per user: their whole app state as JSON
--   * Row-level security (RLS) means a signed-in person can only ever touch
--     THEIR OWN rows. The publishable key in the website is safe to expose
--     because of these policies.
--   * Only the "authenticated" role gets access. The "anon" role (signed-out
--     visitors) gets nothing. Grants are explicit because "Automatically
--     expose new tables" is turned off in this project.

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  username   text not null,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]{3,20}$')
);

-- Usernames are unique regardless of capitalisation (Bo_Jones == bo_jones).
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- --------------------------------------------------------------- user_data
create table if not exists public.user_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  -- Guard against abuse: one user can't store more than ~1 MB.
  constraint user_data_state_size check (pg_column_size(state) < 1000000)
);

-- updated_at is set by the server, never trusted from the browser.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_data_set_updated_at on public.user_data;
create trigger user_data_set_updated_at
  before insert or update on public.user_data
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------ row security
alter table public.profiles  enable row level security;
alter table public.user_data enable row level security;

drop policy if exists "profiles: read own"   on public.profiles;
drop policy if exists "profiles: insert own" on public.profiles;
drop policy if exists "profiles: update own" on public.profiles;
drop policy if exists "user_data: read own"   on public.user_data;
drop policy if exists "user_data: insert own" on public.user_data;
drop policy if exists "user_data: update own" on public.user_data;
drop policy if exists "user_data: delete own" on public.user_data;

create policy "profiles: read own"   on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "profiles: insert own" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "profiles: update own" on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "user_data: read own"   on public.user_data for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "user_data: insert own" on public.user_data for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "user_data: update own" on public.user_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "user_data: delete own" on public.user_data for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------------ grants
revoke all on public.profiles  from anon;
revoke all on public.user_data from anon;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles  to authenticated;
grant select, insert, update, delete on public.user_data to authenticated;

-- ------------------------------------------------- "delete my account" RPC
-- Lets a signed-in person delete their own login plus (via cascade) their
-- profile and data. Runs with elevated rights, but only ever touches the
-- caller's own id.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------- keep-alive ping
-- Supabase pauses FREE projects that see little database activity for a week.
-- A scheduled GitHub Action (.github/workflows/supabase-keepalive.yml) reads
-- this one-row table a few times a day. It holds nothing private; anyone may
-- read it, and nobody except the project owner can change it.
create table if not exists public.keepalive (
  id   int primary key default 1,
  note text not null default 'ok',
  constraint keepalive_single_row check (id = 1)
);
insert into public.keepalive (id) values (1) on conflict (id) do nothing;

alter table public.keepalive enable row level security;
drop policy if exists "keepalive: anyone can read" on public.keepalive;
create policy "keepalive: anyone can read" on public.keepalive
  for select to anon, authenticated using (true);

revoke all on public.keepalive from anon, authenticated;
grant select on public.keepalive to anon, authenticated;
