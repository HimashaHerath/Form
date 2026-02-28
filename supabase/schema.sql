-- Flux Tracker schema for Supabase
-- Run this in Supabase SQL Editor for the project used by NEXT_PUBLIC_SUPABASE_URL

create table if not exists public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  start_date date not null,
  start_weight numeric not null,
  goal_weight numeric not null,
  units text not null check (units in ('lbs', 'kg')),
  tdee_window integer not null check (tdee_window in (2, 4, 8)),
  target_deficit integer not null,
  sex text null check (sex in ('male', 'female')),
  height numeric null,
  age integer null,
  activity_multiplier numeric null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.day_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric null,
  calories integer null check (calories is null or calories >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, date)
);

create table if not exists public.body_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight numeric not null,
  neck numeric null,
  waist numeric null,
  hips numeric null,
  bf_percent numeric null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, date)
);

create index if not exists day_logs_user_date_idx on public.day_logs (user_id, date);
create index if not exists body_logs_user_date_idx on public.body_logs (user_id, date);

alter table public.settings enable row level security;
alter table public.day_logs enable row level security;
alter table public.body_logs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'settings' and policyname = 'settings_all_own'
  ) then
    create policy settings_all_own
      on public.settings
      for all
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'day_logs' and policyname = 'day_logs_all_own'
  ) then
    create policy day_logs_all_own
      on public.day_logs
      for all
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'body_logs' and policyname = 'body_logs_all_own'
  ) then
    create policy body_logs_all_own
      on public.body_logs
      for all
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end
$$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.settings to authenticated;
grant select, insert, update, delete on table public.day_logs to authenticated;
grant select, insert, update, delete on table public.body_logs to authenticated;
