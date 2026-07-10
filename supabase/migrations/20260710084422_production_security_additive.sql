-- Production security hardening, stage 1 (additive and backward compatible).
--
-- Rollback notes:
-- 1. Deploy the previous application before removing any table/function below.
-- 2. Keep bookings.slip_url and existing storage objects intact.
-- 3. The canonical active-slot index can be reverted to pending/confirmed only
--    after verifying that doing so will not reintroduce duplicate slots.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists admin_users_set_updated_at on public.admin_users;
create trigger admin_users_set_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

-- Production currently has one Auth user. Provision only when unambiguous so a
-- fresh/local database never grants admin access accidentally.
insert into public.admin_users (user_id, role, active)
select id, 'owner', true
from auth.users
where (select count(*) from auth.users) = 1
on conflict (user_id) do update
set active = true,
    updated_at = now();

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  instagram_url text,
  facebook_url text,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.bookings
add column if not exists slip_path text;
alter table public.bookings
add column if not exists start_time text;
alter table public.bookings
add column if not exists end_time text;
alter table public.bookings
add column if not exists deposit_amount integer;
alter table public.bookings
add column if not exists remaining_amount integer;

comment on column public.bookings.slip_url is
  'Legacy public URL retained temporarily for backward compatibility. Do not write new values.';
comment on column public.bookings.slip_path is
  'Private object path in the slips bucket. Signed URLs must never be persisted.';

create or replace function public.decode_url_path_component(p_input text)
returns text
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  v_bytes bytea := ''::bytea;
  v_index integer := 1;
  v_pair text;
  v_character text;
begin
  while v_index <= char_length(p_input) loop
    v_character := substr(p_input, v_index, 1);
    if v_character = '%' and v_index + 2 <= char_length(p_input) then
      v_pair := substr(p_input, v_index + 1, 2);
      if v_pair ~ '^[0-9A-Fa-f]{2}$' then
        v_bytes := v_bytes || decode(v_pair, 'hex');
        v_index := v_index + 3;
        continue;
      end if;
    end if;

    v_bytes := v_bytes || convert_to(v_character, 'UTF8');
    v_index := v_index + 1;
  end loop;

  return convert_from(v_bytes, 'UTF8');
exception
  when others then
    return p_input;
end;
$$;

update public.bookings
set slip_path = public.decode_url_path_component(
  split_part(slip_url, '/storage/v1/object/public/slips/', 2)
)
where slip_path is null
  and slip_url is not null
  and split_part(slip_url, '/storage/v1/object/public/slips/', 2) <> '';

do $$
begin
  if exists (
    select 1
    from public.bookings
    where slip_url is not null
      and btrim(slip_url) <> ''
      and (slip_path is null or btrim(slip_path) = '')
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'SLIP_PATH_BACKFILL_INCOMPLETE';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.slip_path is not null
      and not exists (
        select 1
        from storage.objects o
        where o.bucket_id = 'slips'
          and o.name = b.slip_path
      )
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'SLIP_OBJECT_BACKFILL_INCOMPLETE';
  end if;
end;
$$;

drop function if exists public.decode_url_path_component(text);

create table if not exists public.booking_daily_counters (
  counter_date date primary key,
  last_value integer not null default 0 check (last_value between 0 and 9999),
  updated_at timestamptz not null default now()
);

insert into public.booking_daily_counters (counter_date, last_value)
select
  to_date(substring(booking_no from 4 for 8), 'YYYYMMDD'),
  max(right(booking_no, 4)::integer)
from public.bookings
where booking_no ~ '^NF-[0-9]{8}-[0-9]{4}$'
group by substring(booking_no from 4 for 8)
on conflict (counter_date) do update
set last_value = greatest(
      public.booking_daily_counters.last_value,
      excluded.last_value
    ),
    updated_at = now();

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
create index if not exists audit_logs_actor_created_idx
on public.audit_logs (actor_user_id, created_at desc);

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

drop trigger if exists notification_outbox_set_updated_at on public.notification_outbox;
create trigger notification_outbox_set_updated_at
before update on public.notification_outbox
for each row execute function public.set_updated_at();

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

alter table public.bookings enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.page_views enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_hours_supported_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_hours_supported_check
      check (hours in (3, 4)) not valid;
    alter table public.bookings
      validate constraint bookings_hours_supported_check;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_graduates_supported_check'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_graduates_supported_check
      check (graduates between 1 and 5) not valid;
    alter table public.bookings
      validate constraint bookings_graduates_supported_check;
  end if;
end;
$$;

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
create unique index unique_occupying_booking_slot
on public.bookings (booking_date, period)
where status in ('pending', 'paid', 'confirmed', 'completed');

create or replace function public.consume_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_record public.api_rate_limits%rowtype;
begin
  if p_scope is null or p_scope = ''
    or p_key_hash !~ '^[a-f0-9]{64}$'
    or p_limit < 1
    or p_window_seconds < 1 then
    raise exception using errcode = '22023', message = 'INVALID_RATE_LIMIT_INPUT';
  end if;

  insert into public.api_rate_limits (
    scope,
    key_hash,
    request_count,
    window_started_at,
    expires_at
  )
  values (
    p_scope,
    p_key_hash,
    1,
    v_now,
    v_now + make_interval(secs => p_window_seconds)
  )
  on conflict (scope, key_hash) do update
  set request_count = case
        when public.api_rate_limits.expires_at <= v_now then 1
        else public.api_rate_limits.request_count + 1
      end,
      window_started_at = case
        when public.api_rate_limits.expires_at <= v_now then v_now
        else public.api_rate_limits.window_started_at
      end,
      expires_at = case
        when public.api_rate_limits.expires_at <= v_now
          then v_now + make_interval(secs => p_window_seconds)
        else public.api_rate_limits.expires_at
      end
  returning * into v_record;

  allowed := v_record.request_count <= p_limit;
  retry_after := case
    when allowed then 0
    else greatest(1, ceil(extract(epoch from (v_record.expires_at - v_now)))::integer)
  end;
  return next;
end;
$$;

create or replace function public.create_booking_atomic(
  p_booking_date date,
  p_period text,
  p_start_time text,
  p_end_time text,
  p_hours integer,
  p_graduates integer,
  p_fullname text,
  p_phone text,
  p_line text,
  p_facebook text,
  p_university text,
  p_faculty text,
  p_note text,
  p_total_price integer,
  p_deposit_amount integer,
  p_remaining_amount integer,
  p_slip_path text
)
returns table (
  booking_id uuid,
  booking_no text,
  outbox_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_counter_date date := (clock_timestamp() at time zone 'Asia/Bangkok')::date;
  v_counter integer;
  v_booking_id uuid;
  v_booking_no text;
  v_outbox_id uuid;
begin
  if p_booking_date < v_counter_date
    or p_booking_date > v_counter_date + 365
    or p_period not in ('morning', 'afternoon')
    or p_hours not in (3, 4)
    or p_graduates not between 1 and 5
    or p_fullname is null
    or char_length(p_fullname) not between 1 and 120
    or p_phone is null
    or p_phone !~ '^0[0-9]{9}$'
    or char_length(coalesce(p_line, '')) > 100
    or char_length(coalesce(p_facebook, '')) > 200
    or char_length(coalesce(p_university, '')) > 200
    or char_length(coalesce(p_faculty, '')) > 200
    or char_length(coalesce(p_note, '')) > 1000
    or p_slip_path is null
    or char_length(p_slip_path) not between 1 and 300
    or p_slip_path !~ '^[0-9]{4}/[0-9]{2}/[0-9a-f-]+\.(jpg|png|heic|heif)$'
  then
    raise exception using errcode = '22023', message = 'INVALID_BOOKING_INPUT';
  end if;

  if not exists (
    select 1
    from (values
      ('morning', 3, '07:00', '10:00'),
      ('morning', 3, '08:00', '11:00'),
      ('morning', 3, '09:00', '12:00'),
      ('morning', 4, '07:00', '11:00'),
      ('morning', 4, '08:00', '12:00'),
      ('afternoon', 3, '13:00', '16:00'),
      ('afternoon', 3, '14:00', '17:00'),
      ('afternoon', 3, '15:00', '18:00'),
      ('afternoon', 4, '13:00', '17:00'),
      ('afternoon', 4, '14:00', '18:00')
    ) as slots(period, hours, start_time, end_time)
    where slots.period = p_period
      and slots.hours = p_hours
      and slots.start_time = p_start_time
      and slots.end_time = p_end_time
  ) then
    raise exception using errcode = '22023', message = 'INVALID_BOOKING_INPUT';
  end if;

  if p_total_price <> case when p_hours = 3 then 4000 else 4500 end
       + (p_graduates - 1) * 1000
    or p_deposit_amount <> 1000
    or p_remaining_amount <> greatest(p_total_price - 1000, 0)
  then
    raise exception using errcode = '22023', message = 'INVALID_BOOKING_PRICE';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_booking_date::text || ':' || p_period, 0)
  );

  if exists (
    select 1 from public.blocked_slots
    where booking_date = p_booking_date and period = p_period
  ) or exists (
    select 1 from public.bookings
    where booking_date = p_booking_date
      and period = p_period
      and status in ('pending', 'paid', 'confirmed', 'completed')
  ) then
    raise exception using errcode = 'P0001', message = 'SLOT_UNAVAILABLE';
  end if;

  insert into public.booking_daily_counters (counter_date, last_value)
  values (v_counter_date, 0)
  on conflict (counter_date) do nothing;

  update public.booking_daily_counters
  set last_value = last_value + 1,
      updated_at = now()
  where counter_date = v_counter_date
  returning last_value into v_counter;

  if v_counter is null or v_counter > 9999 then
    raise exception using errcode = 'P0001', message = 'BOOKING_COUNTER_EXHAUSTED';
  end if;

  v_booking_no := format(
    'NF-%s-%s',
    to_char(v_counter_date, 'YYYYMMDD'),
    lpad(v_counter::text, 4, '0')
  );

  insert into public.bookings (
    booking_no,
    booking_date,
    period,
    start_time,
    end_time,
    hours,
    graduates,
    fullname,
    phone,
    line,
    facebook,
    university,
    faculty,
    note,
    total_price,
    deposit_amount,
    remaining_amount,
    slip_path,
    slip_url,
    status
  )
  values (
    v_booking_no,
    p_booking_date,
    p_period,
    p_start_time,
    p_end_time,
    p_hours,
    p_graduates,
    p_fullname,
    p_phone,
    p_line,
    p_facebook,
    p_university,
    p_faculty,
    p_note,
    p_total_price,
    p_deposit_amount,
    p_remaining_amount,
    p_slip_path,
    null,
    'pending'
  )
  returning id into v_booking_id;

  insert into public.notification_outbox (booking_id, event_type)
  values (v_booking_id, 'booking_created')
  returning id into v_outbox_id;

  booking_id := v_booking_id;
  booking_no := v_booking_no;
  outbox_id := v_outbox_id;
  return next;
end;
$$;

create or replace function public.update_booking_status_atomic(
  p_booking_id uuid,
  p_to_status text,
  p_actor_user_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from_status text;
begin
  if p_actor_user_id is null or not exists (
    select 1 from public.admin_users
    where user_id = p_actor_user_id
      and active = true
      and role in ('owner', 'admin')
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  select status into v_from_status
  from public.bookings
  where id = p_booking_id
  for update;

  if v_from_status is null then
    raise exception using errcode = 'P0002', message = 'BOOKING_NOT_FOUND';
  end if;

  if v_from_status = p_to_status then
    return v_from_status;
  end if;

  if not (
    (v_from_status in ('pending', 'paid') and p_to_status in ('confirmed', 'cancelled'))
    or (v_from_status = 'confirmed' and p_to_status in ('completed', 'cancelled'))
  ) then
    raise exception using errcode = 'P0001', message = 'INVALID_STATUS_TRANSITION';
  end if;

  update public.bookings
  set status = p_to_status,
      updated_at = now()
  where id = p_booking_id;

  insert into public.audit_logs (
    resource_type,
    resource_id,
    action,
    from_status,
    to_status,
    actor_user_id
  ) values (
    'booking',
    p_booking_id,
    'booking_status_changed',
    v_from_status,
    p_to_status,
    p_actor_user_id
  );

  return p_to_status;
end;
$$;

create or replace function public.block_booking_slot_atomic(
  p_booking_date date,
  p_period text,
  p_actor_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_blocked_id uuid;
begin
  if p_actor_user_id is null or not exists (
    select 1 from public.admin_users
    where user_id = p_actor_user_id
      and active = true
      and role in ('owner', 'admin')
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  if p_booking_date < (clock_timestamp() at time zone 'Asia/Bangkok')::date
    or p_booking_date > (clock_timestamp() at time zone 'Asia/Bangkok')::date + 365
    or p_period not in ('morning', 'afternoon') then
    raise exception using errcode = '22023', message = 'INVALID_BOOKING_INPUT';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_booking_date::text || ':' || p_period, 0)
  );

  if exists (
    select 1 from public.bookings
    where booking_date = p_booking_date
      and period = p_period
      and status in ('pending', 'paid', 'confirmed', 'completed')
  ) then
    raise exception using errcode = 'P0001', message = 'SLOT_OCCUPIED';
  end if;

  insert into public.blocked_slots (booking_date, period, reason)
  values (p_booking_date, p_period, 'Closed from admin calendar')
  on conflict (booking_date, period) do update
  set reason = excluded.reason
  returning id into v_blocked_id;

  insert into public.audit_logs (
    resource_type,
    resource_id,
    action,
    actor_user_id,
    metadata
  ) values (
    'blocked_slot',
    v_blocked_id,
    'block_slot',
    p_actor_user_id,
    jsonb_build_object('booking_date', p_booking_date, 'period', p_period)
  );

  return v_blocked_id;
end;
$$;

create or replace function public.block_booking_day_atomic(
  p_booking_date date,
  p_actor_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period text;
  v_count integer := 0;
begin
  if p_actor_user_id is null or not exists (
    select 1 from public.admin_users
    where user_id = p_actor_user_id
      and active = true
      and role in ('owner', 'admin')
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  if p_booking_date < (clock_timestamp() at time zone 'Asia/Bangkok')::date
    or p_booking_date > (clock_timestamp() at time zone 'Asia/Bangkok')::date + 365 then
    raise exception using errcode = '22023', message = 'INVALID_BOOKING_INPUT';
  end if;

  -- Lock in a stable order to avoid deadlocks with concurrent requests.
  perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text || ':morning', 0));
  perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text || ':afternoon', 0));

  foreach v_period in array array['morning', 'afternoon'] loop
    if not exists (
      select 1 from public.bookings
      where booking_date = p_booking_date
        and period = v_period
        and status in ('pending', 'paid', 'confirmed', 'completed')
    ) then
      insert into public.blocked_slots (booking_date, period, reason)
      values (p_booking_date, v_period, 'Closed full day from admin calendar')
      on conflict (booking_date, period) do nothing;

      if found then
        v_count := v_count + 1;
      end if;
    end if;
  end loop;

  insert into public.audit_logs (
    resource_type,
    action,
    actor_user_id,
    metadata
  ) values (
    'blocked_day',
    'block_full_day',
    p_actor_user_id,
    jsonb_build_object('booking_date', p_booking_date, 'blocked_count', v_count)
  );

  return v_count;
end;
$$;

create or replace function public.update_site_settings_atomic(
  p_instagram_url text,
  p_facebook_url text,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_user_id is null or not exists (
    select 1 from public.admin_users
    where user_id = p_actor_user_id
      and active = true
      and role in ('owner', 'admin')
  ) then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  if p_instagram_url is not null and p_instagram_url !~ '^https://(www\.)?instagram\.com(/|$)' then
    raise exception using errcode = '22023', message = 'INVALID_SITE_URL';
  end if;
  if p_facebook_url is not null and p_facebook_url !~ '^https://(www\.)?(m\.)?facebook\.com(/|$)' then
    raise exception using errcode = '22023', message = 'INVALID_SITE_URL';
  end if;

  insert into public.site_settings (id, instagram_url, facebook_url, updated_at)
  values (1, p_instagram_url, p_facebook_url, now())
  on conflict (id) do update
  set instagram_url = excluded.instagram_url,
      facebook_url = excluded.facebook_url,
      updated_at = now();

  insert into public.audit_logs (
    resource_type,
    action,
    actor_user_id
  ) values (
    'site_settings',
    'portfolio_links_updated',
    p_actor_user_id
  );
end;
$$;

create or replace function public.record_page_visit(
  p_page text,
  p_visitor_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_page is null or char_length(p_page) not between 1 and 100
    or p_visitor_hash !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_VISITOR_INPUT';
  end if;

  insert into public.page_visitors (
    page,
    visitor_hash,
    first_seen_at,
    last_seen_at,
    view_count
  ) values (
    p_page,
    p_visitor_hash,
    now(),
    now(),
    1
  )
  on conflict (page, visitor_hash) do update
  set last_seen_at = now(),
      view_count = public.page_visitors.view_count + 1;
end;
$$;

create or replace function public.claim_notification_outbox(p_limit integer default 10)
returns table (
  id uuid,
  booking_id uuid,
  event_type text,
  attempts integer
)
language sql
security definer
set search_path = ''
as $$
  with reset_stale as (
    update public.notification_outbox
    set status = 'failed',
        last_error = 'PROCESSING_TIMEOUT',
        next_attempt_at = now()
    where status = 'processing'
      and updated_at < now() - interval '15 minutes'
    returning id
  ), candidates as (
    select o.id
    from public.notification_outbox o
    where o.status in ('pending', 'failed')
      and o.next_attempt_at <= now()
      and o.attempts < 8
    order by o.next_attempt_at, o.created_at
    limit greatest(1, least(p_limit, 50))
    for update skip locked
  )
  update public.notification_outbox o
  set status = 'processing',
      attempts = o.attempts + 1,
      updated_at = now()
  from candidates c
  where o.id = c.id
  returning o.id, o.booking_id, o.event_type, o.attempts;
$$;

create or replace function public.cleanup_expired_security_records()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rate_limits integer;
  v_sessions integer;
  v_visitors integer;
  v_outbox integer;
begin
  delete from public.api_rate_limits where expires_at < now() - interval '1 day';
  get diagnostics v_rate_limits = row_count;

  delete from public.booking_access_sessions where expires_at < now() - interval '1 day';
  get diagnostics v_sessions = row_count;

  delete from public.page_visitors where last_seen_at < now() - interval '90 days';
  get diagnostics v_visitors = row_count;

  delete from public.notification_outbox
  where status = 'sent' and sent_at < now() - interval '30 days';
  get diagnostics v_outbox = row_count;

  return jsonb_build_object(
    'rate_limits', v_rate_limits,
    'sessions', v_sessions,
    'visitors', v_visitors,
    'outbox', v_outbox
  );
end;
$$;

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.booking_daily_counters enable row level security;
alter table public.booking_access_sessions enable row level security;
alter table public.api_rate_limits enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.page_visitors enable row level security;

revoke all on table
  public.admin_users,
  public.site_settings,
  public.booking_daily_counters,
  public.booking_access_sessions,
  public.api_rate_limits,
  public.audit_logs,
  public.notification_outbox,
  public.page_visitors
from anon, authenticated;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
revoke all on function public.create_booking_atomic(date, text, text, text, integer, integer, text, text, text, text, text, text, text, integer, integer, integer, text) from public;
revoke all on function public.update_booking_status_atomic(uuid, text, uuid) from public;
revoke all on function public.block_booking_slot_atomic(date, text, uuid) from public;
revoke all on function public.block_booking_day_atomic(date, uuid) from public;
revoke all on function public.update_site_settings_atomic(text, text, uuid) from public;
revoke all on function public.record_page_visit(text, text) from public;
revoke all on function public.claim_notification_outbox(integer) from public;
revoke all on function public.cleanup_expired_security_records() from public;

grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.create_booking_atomic(date, text, text, text, integer, integer, text, text, text, text, text, text, text, integer, integer, integer, text) to service_role;
grant execute on function public.update_booking_status_atomic(uuid, text, uuid) to service_role;
grant execute on function public.block_booking_slot_atomic(date, text, uuid) to service_role;
grant execute on function public.block_booking_day_atomic(date, uuid) to service_role;
grant execute on function public.update_site_settings_atomic(text, text, uuid) to service_role;
grant execute on function public.record_page_visit(text, text) to service_role;
grant execute on function public.claim_notification_outbox(integer) to service_role;
grant execute on function public.cleanup_expired_security_records() to service_role;
