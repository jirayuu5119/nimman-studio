-- ============================================
-- Nimman Foto Booking System
-- Production Schema v2
-- ============================================

create extension if not exists "pgcrypto";

create table if not exists public.bookings (

    id uuid primary key default gen_random_uuid(),

    booking_no text not null unique,

    fullname text not null,
    phone text not null,

    line text,
    facebook text,

    university text,
    faculty text,

    booking_date date not null,

    period text not null
        check (period in ('morning','afternoon')),

    hours integer not null
        check (hours in (3,4)),

    graduates integer not null default 1,

    total_price integer not null default 0,

    note text,

    slip_url text,

    status text not null default 'pending'
        check (status in (
            'draft',
            'pending',
            'paid',
            'confirmed',
            'completed',
            'cancelled'
        )),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()

);

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as
$$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists bookings_updated_at on public.bookings;

create trigger bookings_updated_at
before update
on public.bookings
for each row
execute function public.update_updated_at_column();

create index if not exists idx_booking_date
on public.bookings (booking_date);

create index if not exists idx_status
on public.bookings (status);

alter table public.bookings
enable row level security;

create policy "Anyone can create booking"
on public.bookings
for insert
to anon, authenticated
with check (true);

create policy "Anyone can read booking"
on public.bookings
for select
to anon, authenticated
using (true);

create policy "Authenticated update booking"
on public.bookings
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated delete booking"
on public.bookings
for delete
to authenticated
using (true);