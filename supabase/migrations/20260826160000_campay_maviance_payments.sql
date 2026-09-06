-- Replace Stripe subscription billing with CamPay / Maviance mobile money payments.

alter table public.profiles add column if not exists plan_expires_at timestamptz;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('campay', 'maviance')),
  tier text not null check (tier in ('premium', 'premium_plus')),
  amount_xaf integer not null,
  phone text,
  external_reference text not null unique,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.payments enable row level security;

create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can create their own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);
