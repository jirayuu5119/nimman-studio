-- Trigger execution does not require callers to invoke the trigger function
-- directly. Keep it available only to its owner (postgres).
revoke all on function public.set_updated_at()
  from public, anon, authenticated, service_role;

-- pg_net is not used by application functions, views, materialized views, or
-- scheduled jobs. Removing the unused extension also removes it from public.
drop extension if exists pg_net;

-- Keep the database-side consent gate aligned with the notice presented by
-- the application. The function signature and privileges are unchanged.
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
  p_slip_path text,
  p_privacy_notice_version text
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
  v_result record;
begin
  if p_privacy_notice_version is distinct from '2026-07-20' then
    raise exception using errcode = '22023', message = 'INVALID_PRIVACY_NOTICE';
  end if;

  select * into strict v_result
  from public.create_booking_atomic(
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
    p_slip_path
  );

  update public.bookings
  set privacy_notice_version = p_privacy_notice_version,
      privacy_acknowledged_at = now()
  where id = v_result.booking_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'BOOKING_PRIVACY_UPDATE_FAILED';
  end if;

  booking_id := v_result.booking_id;
  booking_no := v_result.booking_no;
  outbox_id := v_result.outbox_id;
  return next;
end;
$$;
