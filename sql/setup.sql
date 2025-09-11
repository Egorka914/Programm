-- SQL скрипт для создания таблиц и триггера в Supabase.
drop table if exists public.tasks cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text default 'user',
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "users can select themselves" on public.profiles for select using (auth.uid() = id);
create policy "users can insert themselves" on public.profiles for insert with check (auth.uid() = id);
create policy "users can update themselves" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create table public.tasks (
  id bigserial primary key,
  title text,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text default 'новая',
  price numeric,
  created_at timestamp with time zone default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
