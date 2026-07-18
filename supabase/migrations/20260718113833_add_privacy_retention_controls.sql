alter table public.bookings
  add column if not exists privacy_notice_version text,
  add column if not exists privacy_acknowledged_at timestamptz,
  add column if not exists data_anonymized_at timestamptz;

comment on column public.bookings.privacy_notice_version is
  'Version of the privacy notice shown before the booking was submitted.';
comment on column public.bookings.privacy_acknowledged_at is
  'Server-recorded timestamp when the current privacy notice was acknowledged.';
comment on column public.bookings.data_anonymized_at is
  'Timestamp when direct customer identifiers and payment-slip references were removed.';

create or replace function public.set_booking_privacy_acknowledgement()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.privacy_notice_version is not null
     and new.privacy_acknowledged_at is null then
    new.privacy_acknowledged_at = now();
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_privacy_acknowledgement_pair'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_privacy_acknowledgement_pair
      check (
        (privacy_notice_version is null and privacy_acknowledged_at is null)
        or
        (privacy_notice_version is not null and privacy_acknowledged_at is not null)
      );
  end if;
end;
$$;

drop trigger if exists bookings_set_privacy_acknowledgement on public.bookings;
create trigger bookings_set_privacy_acknowledgement
before insert on public.bookings
for each row execute function public.set_booking_privacy_acknowledgement();

create index if not exists bookings_retention_candidates_idx
on public.bookings (booking_date)
where status in ('completed', 'cancelled') and data_anonymized_at is null;

revoke all on function public.set_booking_privacy_acknowledgement()
  from public, anon, authenticated;

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
  if p_privacy_notice_version is distinct from '2026-07-18' then
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

revoke all on function public.create_booking_atomic(
  date, text, text, text, integer, integer, text, text, text, text, text, text,
  text, integer, integer, integer, text
) from public, anon, authenticated, service_role;

revoke all on function public.create_booking_atomic(
  date, text, text, text, integer, integer, text, text, text, text, text, text,
  text, integer, integer, integer, text, text
) from public, anon, authenticated;

grant execute on function public.create_booking_atomic(
  date, text, text, text, integer, integer, text, text, text, text, text, text,
  text, integer, integer, integer, text, text
) to service_role;
