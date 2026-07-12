create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  page text not null check (char_length(page) between 1 and 100),
  created_at timestamptz not null default now()
);

create index if not exists page_views_page_created_at_idx
  on public.page_views (page, created_at desc);

alter table public.page_views enable row level security;

revoke all on table public.page_views from anon, authenticated;
grant select, insert on table public.page_views to service_role;
grant usage, select on sequence public.page_views_id_seq to service_role;;
