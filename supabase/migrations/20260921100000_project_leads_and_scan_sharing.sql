-- Project members must be able to read the full detail of a lead shared
-- into a project they belong to (previously only the lead owner could
-- select from public.leads, so teammates saw name/category only).
create policy "Project members can view shared leads"
on public.leads
for select
to authenticated
using (
  exists (
    select 1 from public.project_businesses pb
    where pb.lead_id = leads.id
      and public.is_project_member(auth.uid(), pb.project_id)
  )
);

-- Scan sharing: an owner can generate a link to a scan with either
-- read-only ("view") or fully-usable ("full") access. The row itself
-- carries no business data — the shared-scan edge function reads the
-- underlying scan/scan_businesses with the service role once the token
-- is validated, so no public policy on scans/scan_businesses is needed.
create table public.scan_shares (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  access text not null default 'view' check (access in ('view', 'full')),
  token text not null unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now()
);
alter table public.scan_shares enable row level security;

create policy "Owners manage their scan shares"
on public.scan_shares
for all
to authenticated
using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
  and exists (select 1 from public.scans s where s.id = scan_id and s.user_id = auth.uid())
);

create index if not exists scan_shares_token_idx on public.scan_shares (token);
