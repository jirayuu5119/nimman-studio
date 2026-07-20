-- Trigger execution does not require callers to invoke the trigger function
-- directly. Keep it available only to its owner (postgres).
revoke all on function public.set_updated_at()
  from public, anon, authenticated, service_role;

-- pg_net is not used by application functions, views, materialized views, or
-- scheduled jobs. Removing the unused extension also removes it from public.
drop extension if exists pg_net;
