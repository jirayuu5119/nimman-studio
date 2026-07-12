-- Remove legacy role grants that can survive a revoke from PUBLIC alone.
-- All SECURITY DEFINER RPCs in this project are server-only and are called
-- through a Supabase service-role client after application-level validation.

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

revoke all on function public.consume_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
revoke all on function public.create_booking_atomic(date, text, text, text, integer, integer, text, text, text, text, text, text, text, integer, integer, integer, text)
  from public, anon, authenticated;
revoke all on function public.update_booking_status_atomic(uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.block_booking_slot_atomic(date, text, uuid)
  from public, anon, authenticated;
revoke all on function public.block_booking_day_atomic(date, uuid)
  from public, anon, authenticated;
revoke all on function public.update_site_settings_atomic(text, text, uuid)
  from public, anon, authenticated;
revoke all on function public.update_payment_settings_atomic(text, text, uuid)
  from public, anon, authenticated;
revoke all on function public.record_page_visit(text, text)
  from public, anon, authenticated;
revoke all on function public.claim_notification_outbox(integer)
  from public, anon, authenticated;
revoke all on function public.cleanup_expired_security_records()
  from public, anon, authenticated;
revoke all on function public.get_booking_dashboard_analytics()
  from public, anon, authenticated;

grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.create_booking_atomic(date, text, text, text, integer, integer, text, text, text, text, text, text, text, integer, integer, integer, text) to service_role;
grant execute on function public.update_booking_status_atomic(uuid, text, uuid) to service_role;
grant execute on function public.block_booking_slot_atomic(date, text, uuid) to service_role;
grant execute on function public.block_booking_day_atomic(date, uuid) to service_role;
grant execute on function public.update_site_settings_atomic(text, text, uuid) to service_role;
grant execute on function public.update_payment_settings_atomic(text, text, uuid) to service_role;
grant execute on function public.record_page_visit(text, text) to service_role;
grant execute on function public.claim_notification_outbox(integer) to service_role;
grant execute on function public.cleanup_expired_security_records() to service_role;
grant execute on function public.get_booking_dashboard_analytics() to service_role;

-- Keep one index for each identical definition so writes do not maintain duplicates.
drop index if exists public.idx_bookings_date;
drop index if exists public.idx_bookings_status;
drop index if exists public.page_views_page_created_at_idx;
