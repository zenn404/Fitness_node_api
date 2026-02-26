-- Adds gender to users and isolates nutrition logs by user.

alter table if exists public.users
add column if not exists gender text check (gender in ('male', 'female', 'other'));

alter table if exists public.daily_logs
add column if not exists user_id uuid references public.users(id) on delete cascade;

-- Backfill existing logs to a default user if possible (optional manual step):
-- update public.daily_logs set user_id = '<some-user-uuid>' where user_id is null;

-- Enforce not-null only after backfill is complete.
-- alter table public.daily_logs alter column user_id set not null;

create index if not exists idx_daily_logs_user_date on public.daily_logs(user_id, log_date);
