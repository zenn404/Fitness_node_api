-- Adds missing user profile columns and daily logs table/columns.
-- Safe to run multiple times.

alter table if exists public.users
add column if not exists gender text check (gender in ('male', 'female', 'other'));

alter table if exists public.users
add column if not exists age integer;

alter table if exists public.users
add column if not exists weight decimal(5,2);

alter table if exists public.users
add column if not exists height decimal(5,2);

alter table if exists public.users
add column if not exists goals text;

create table if not exists public.daily_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  sugar numeric,
  fiber numeric,
  serving_size numeric,
  log_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table if exists public.daily_logs
add column if not exists user_id uuid references public.users(id) on delete cascade;

-- Backfill existing logs to a default user if possible (optional manual step):
-- update public.daily_logs set user_id = '<some-user-uuid>' where user_id is null;

-- Enforce not-null only after backfill is complete.
-- alter table public.daily_logs alter column user_id set not null;

create index if not exists idx_daily_logs_user_date on public.daily_logs(user_id, log_date);
