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
    or p_booking_date > date '2100-12-31'
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
    or p_booking_date > date '2100-12-31' then
    raise exception using errcode = '22023', message = 'INVALID_BOOKING_INPUT';
  end if;

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

create or replace function public.reset_booking_day_atomic(
  p_booking_date date,
  p_actor_user_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted_count integer := 0;
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
    or p_booking_date > date '2100-12-31' then
    raise exception using errcode = '22023', message = 'INVALID_BOOKING_INPUT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text || ':morning', 0));
  perform pg_advisory_xact_lock(hashtextextended(p_booking_date::text || ':afternoon', 0));

  delete from public.blocked_slots
  where booking_date = p_booking_date;

  get diagnostics v_deleted_count = row_count;

  insert into public.audit_logs (
    resource_type,
    action,
    actor_user_id,
    metadata
  ) values (
    'blocked_day',
    'reset_booking_day',
    p_actor_user_id,
    jsonb_build_object(
      'booking_date', p_booking_date,
      'deleted_count', v_deleted_count
    )
  );

  return v_deleted_count;
end;
$$;

revoke all on function public.block_booking_slot_atomic(date, text, uuid) from public;
revoke all on function public.block_booking_slot_atomic(date, text, uuid) from anon, authenticated;
revoke all on function public.block_booking_day_atomic(date, uuid) from public;
revoke all on function public.block_booking_day_atomic(date, uuid) from anon, authenticated;
revoke all on function public.reset_booking_day_atomic(date, uuid) from public;
revoke all on function public.reset_booking_day_atomic(date, uuid) from anon, authenticated;

grant execute on function public.block_booking_slot_atomic(date, text, uuid) to service_role;
grant execute on function public.block_booking_day_atomic(date, uuid) to service_role;
grant execute on function public.reset_booking_day_atomic(date, uuid) to service_role;

