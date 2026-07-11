-- ============================================
-- Nimman Foto Booking System
-- Production Schema v2
-- ============================================

create extension if not exists "pgcrypto";

create table if not exists public.bookings (

    id uuid primary key default gen_random_uuid(),

    booking_no text not null unique,

    fullname text not null,
    phone text not null,

    line text,
    facebook text,

    university text,
    faculty text,

    booking_date date not null,

    period text not null
        check (period in ('morning','afternoon')),

    hours integer not null
        check (hours in (3,4)),

    graduates integer not null default 1,

    total_price integer not null default 0,

    note text,

    slip_url text,

    status text not null default 'pending'
        check (status in (
            'draft',
            'pending',
            'paid',
            'confirmed',
            'completed',
            'cancelled'
        )),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()

);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as
$$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists bookings_updated_at on public.bookings;

create trigger bookings_updated_at
before update
on public.bookings
for each row
execute function public.update_updated_at_column();

create index if not exists idx_booking_date
on public.bookings (booking_date);

create index if not exists idx_status
on public.bookings (status);

create table if not exists public.blocked_slots (
    id uuid primary key default gen_random_uuid(),
    booking_date date not null,
    period text not null check (period in ('morning', 'afternoon')),
    reason text,
    created_at timestamptz not null default now(),
    unique (booking_date, period)
);

create index if not exists idx_blocked_slots_booking_date
on public.blocked_slots (booking_date);

create table if not exists public.site_settings (
    id integer primary key default 1
        check (id = 1),
    instagram_url text,
    facebook_url text,
    promptpay_number text default '8302376723',
    promptpay_qr_path text,
    updated_at timestamptz not null default now()
);

insert into public.site_settings (id, instagram_url, facebook_url)
values (1, null, null)
on conflict (id) do nothing;

create table if not exists public.page_views (
    id uuid primary key default gen_random_uuid(),
    page text not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_page_views_page_created_at
on public.page_views (page, created_at desc);

alter table public.blocked_slots
enable row level security;

alter table public.bookings
enable row level security;

alter table public.site_settings
enable row level security;

alter table public.page_views
enable row level security;

-- Public booking operations are server-only. The service role is used by the
-- API routes and is not subject to these table grants.

alter table public.bookings
  add column if not exists start_time text,
  add column if not exists end_time text,
  add column if not exists deposit_amount integer,
  add column if not exists remaining_amount integer,
  add column if not exists slip_path text;

comment on column public.bookings.slip_url is
  'Legacy public URL retained temporarily for backward compatibility. Do not write new values.';
comment on column public.bookings.slip_path is
  'Private object path in the slips bucket. Signed URLs must never be persisted.';

create table if not exists public.admin_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null default 'admin' check (role in ('owner', 'admin')),
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.booking_daily_counters (
    counter_date date primary key,
    last_value integer not null default 0 check (last_value between 0 and 9999),
    updated_at timestamptz not null default now()
);

create table if not exists public.booking_access_sessions (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid not null references public.bookings(id) on delete cascade,
    token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
    expires_at timestamptz not null,
    revoked_at timestamptz,
    created_at timestamptz not null default now(),
    last_used_at timestamptz
);

create index if not exists booking_access_sessions_booking_id_idx
on public.booking_access_sessions (booking_id, expires_at desc);

create index if not exists booking_access_sessions_expiry_idx
on public.booking_access_sessions (expires_at)
where revoked_at is null;

create table if not exists public.api_rate_limits (
    scope text not null,
    key_hash text not null check (char_length(key_hash) = 64),
    request_count integer not null default 0,
    window_started_at timestamptz not null default now(),
    expires_at timestamptz not null,
    primary key (scope, key_hash)
);

create index if not exists api_rate_limits_expiry_idx
on public.api_rate_limits (expires_at);

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    resource_type text not null,
    resource_id uuid,
    action text not null,
    from_status text,
    to_status text,
    actor_user_id uuid references auth.users(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists audit_logs_resource_created_idx
on public.audit_logs (resource_type, resource_id, created_at desc);

create table if not exists public.notification_outbox (
    id uuid primary key default gen_random_uuid(),
    booking_id uuid not null references public.bookings(id) on delete cascade,
    event_type text not null check (event_type = 'booking_created'),
    status text not null default 'pending'
      check (status in ('pending', 'processing', 'sent', 'failed')),
    attempts integer not null default 0 check (attempts >= 0),
    next_attempt_at timestamptz not null default now(),
    sent_at timestamptz,
    last_error text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (booking_id, event_type)
);

create index if not exists notification_outbox_retry_idx
on public.notification_outbox (status, next_attempt_at)
where status in ('pending', 'failed', 'processing');

create table if not exists public.page_visitors (
    page text not null check (char_length(page) between 1 and 100),
    visitor_hash text not null check (char_length(visitor_hash) = 64),
    first_seen_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    view_count bigint not null default 1 check (view_count > 0),
    primary key (page, visitor_hash)
);

create index if not exists page_visitors_last_seen_idx
on public.page_visitors (page, last_seen_at desc);

do $$
begin
  if exists (
    select 1
    from public.bookings
    where status in ('pending', 'paid', 'confirmed', 'completed')
    group by booking_date, period
    having count(*) > 1
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'ACTIVE_SLOT_DUPLICATES_EXIST';
  end if;
end;
$$;

drop index if exists public.unique_active_booking_slot;
create unique index if not exists unique_occupying_booking_slot
on public.bookings (booking_date, period)
where status in ('pending', 'paid', 'confirmed', 'completed');

alter table public.admin_users enable row level security;
alter table public.booking_daily_counters enable row level security;
alter table public.booking_access_sessions enable row level security;
alter table public.api_rate_limits enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.page_visitors enable row level security;

drop policy if exists "Public Read Slip" on storage.objects;
drop policy if exists "Public Upload Slip" on storage.objects;
update storage.buckets set public = false where id in ('slips', 'payment-slips');

revoke all on table
  public.bookings,
  public.blocked_slots,
  public.site_settings,
  public.page_views,
  public.admin_users,
  public.booking_daily_counters,
  public.booking_access_sessions,
  public.api_rate_limits,
  public.audit_logs,
  public.notification_outbox,
  public.page_visitors
from anon, authenticated;

comment on table public.page_views is
  'Legacy request-count analytics. New writes use page_visitors.';
