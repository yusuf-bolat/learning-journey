-- Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run.
create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  done jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

-- Each signed-in user can read and write only their own row.
create policy "own row select" on public.progress for select using (auth.uid() = user_id);
create policy "own row insert" on public.progress for insert with check (auth.uid() = user_id);
create policy "own row update" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
