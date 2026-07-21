-- Выполни это один раз в Supabase: Project -> SQL Editor -> New query -> вставить и Run

create table if not exists jobs (
  id bigint generated always as identity primary key,
  source text not null,
  source_id text not null,
  title text not null,
  company text,
  url text not null,
  description text,
  location text,
  category text,
  salary_min numeric,
  salary_max numeric,
  salary_text text,
  salary_currency text,
  industry_match boolean default false,
  timezone_match boolean default false,
  salary_ok boolean,
  score numeric default 0,
  published_at timestamptz,
  first_seen_at timestamptz not null default now(),
  is_new boolean default true,
  unique (source, source_id)
);

create index if not exists jobs_score_idx on jobs (score desc);
create index if not exists jobs_first_seen_idx on jobs (first_seen_at desc);

-- Включаем Row Level Security и разрешаем анонимное ЧТЕНИЕ (без ключа),
-- запись остаётся закрытой для анонимов — писать сможет только скрипт
-- сбора (через service_role ключ, который никогда не попадает в браузер).
alter table jobs enable row level security;

create policy "Public read access"
  on jobs for select
  using (true);
