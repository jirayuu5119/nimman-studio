-- Production security hardening, stage 2.
-- Apply only after the compatible application deployment is READY and the
-- slip_path backfill checks in stage 1 have passed.
--
-- Rollback notes:
-- - The bucket can be made public again temporarily with an explicit, narrow
--   storage policy if emergency legacy access is required.
-- - Database data and the legacy slip_url column are intentionally preserved.
-- - Do not restore broad anon SELECT/INSERT policies on bookings; roll the app
--   forward instead.

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

update storage.buckets
set public = false
where id in ('slips', 'payment-slips');

drop policy if exists "Public Read Slip" on storage.objects;
drop policy if exists "Public Upload Slip" on storage.objects;

drop policy if exists "Public Insert Booking" on public.bookings;
drop policy if exists "Public Read Booking" on public.bookings;
drop policy if exists "Anyone can create booking" on public.bookings;
drop policy if exists "Anyone can read booking" on public.bookings;
drop policy if exists "Authenticated update booking" on public.bookings;
drop policy if exists "Authenticated delete booking" on public.bookings;

revoke all on table
  public.bookings,
  public.blocked_slots,
  public.page_views,
  public.site_settings,
  public.admin_users,
  public.booking_daily_counters,
  public.booking_access_sessions,
  public.api_rate_limits,
  public.audit_logs,
  public.notification_outbox,
  public.page_visitors
from anon, authenticated;

do $$
begin
  if to_regclass('public.blocked_dates') is not null then
    execute 'revoke all on table public.blocked_dates from anon, authenticated';
  end if;
end;
$$;

comment on table public.page_views is
  'Legacy request-count analytics. New writes use page_visitors.';

drop trigger if exists trg_notify_booking_telegram on public.bookings;
drop function if exists public.notify_booking_telegram();
