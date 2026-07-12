insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'slips',
    'slips',
    false,
    3000000,
    array['image/jpeg', 'image/png', 'image/heic', 'image/heif']
  ),
  (
    'site-config',
    'site-config',
    false,
    3000000,
    array['image/jpeg', 'image/png', 'application/json']
  )
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.get_booking_dashboard_analytics()
returns jsonb
language sql
security definer
set search_path = ''
as $$
  with summary as (
    select
      count(*)::bigint as total_bookings,
      coalesce(sum(total_price) filter (
        where status in ('paid', 'confirmed', 'completed')
      ), 0)::bigint as total_revenue,
      count(*) filter (where status = 'pending')::bigint as pending,
      count(*) filter (where status = 'paid')::bigint as paid,
      count(*) filter (where status = 'confirmed')::bigint as confirmed,
      count(*) filter (where status = 'completed')::bigint as completed,
      count(*) filter (where status = 'cancelled')::bigint as cancelled,
      count(*) filter (
        where booking_date = (clock_timestamp() at time zone 'Asia/Bangkok')::date
      )::bigint as today,
      count(*) filter (
        where date_trunc('month', booking_date::timestamp) =
          date_trunc('month', clock_timestamp() at time zone 'Asia/Bangkok')
      )::bigint as this_month
    from public.bookings
  ), daily as (
    select
      booking_date,
      coalesce(sum(total_price) filter (
        where status in ('paid', 'confirmed', 'completed')
      ), 0)::bigint as revenue
    from public.bookings
    group by booking_date
    order by booking_date
  )
  select jsonb_build_object(
    'totalRevenue', summary.total_revenue,
    'totalBookings', summary.total_bookings,
    'pending', summary.pending,
    'paid', summary.paid,
    'confirmed', summary.confirmed,
    'completed', summary.completed,
    'cancelled', summary.cancelled,
    'today', summary.today,
    'thisMonth', summary.this_month,
    'chartData', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('date', daily.booking_date, 'revenue', daily.revenue)
          order by daily.booking_date
        )
        from daily
      ),
      '[]'::jsonb
    )
  )
  from summary;
$$;

revoke all on function public.get_booking_dashboard_analytics() from public;
grant execute on function public.get_booking_dashboard_analytics() to service_role;
