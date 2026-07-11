alter table public.site_settings
  add column if not exists promptpay_number text,
  add column if not exists promptpay_qr_path text;

update public.site_settings
set promptpay_number = '8302376723'
where id = 1 and promptpay_number is null;

alter table public.site_settings
  alter column promptpay_number set default '8302376723';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'site_settings_promptpay_number_check'
      and conrelid = 'public.site_settings'::regclass
  ) then
    alter table public.site_settings
      add constraint site_settings_promptpay_number_check
      check (promptpay_number is null or promptpay_number ~ '^[0-9]{10,15}$');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'site_settings_promptpay_qr_path_check'
      and conrelid = 'public.site_settings'::regclass
  ) then
    alter table public.site_settings
      add constraint site_settings_promptpay_qr_path_check
      check (
        promptpay_qr_path is null
        or promptpay_qr_path ~ '^payments/promptpay-[0-9a-f-]{36}\.(jpg|png)$'
      );
  end if;
end;
$$;

create or replace function public.update_payment_settings_atomic(
  p_promptpay_number text,
  p_promptpay_qr_path text,
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

  if p_promptpay_number is null
    or p_promptpay_number !~ '^[0-9]{10,15}$'
    or (
      p_promptpay_qr_path is not null
      and p_promptpay_qr_path !~ '^payments/promptpay-[0-9a-f-]{36}\.(jpg|png)$'
    )
  then
    raise exception using errcode = '22023', message = 'INVALID_PAYMENT_SETTINGS';
  end if;

  insert into public.site_settings (
    id,
    promptpay_number,
    promptpay_qr_path,
    updated_at
  ) values (
    1,
    p_promptpay_number,
    p_promptpay_qr_path,
    now()
  )
  on conflict (id) do update
  set promptpay_number = excluded.promptpay_number,
      promptpay_qr_path = excluded.promptpay_qr_path,
      updated_at = now();

  insert into public.audit_logs (
    resource_type,
    action,
    actor_user_id,
    metadata
  ) values (
    'site_settings',
    'payment_settings_updated',
    p_actor_user_id,
    jsonb_build_object('qr_updated', p_promptpay_qr_path is not null)
  );
end;
$$;

revoke all on function public.update_payment_settings_atomic(text, text, uuid)
from public;
grant execute on function public.update_payment_settings_atomic(text, text, uuid)
to service_role;
