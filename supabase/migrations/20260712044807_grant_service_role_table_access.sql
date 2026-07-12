-- New Supabase projects no longer auto-expose SQL-created tables. Grant only
-- the CRUD privileges used by server-side application clients. RLS remains
-- enabled as defense in depth; the service role is never exposed publicly.
grant select, insert, update, delete on table
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
to service_role;
