-- Persist city/district/email so saved scans and leads carry the same
-- location/contact detail as a live scan result.

alter table public.scan_businesses add column if not exists city text;
alter table public.scan_businesses add column if not exists district text;
alter table public.scan_businesses add column if not exists email text;

alter table public.leads add column if not exists business_city text;
alter table public.leads add column if not exists business_district text;
alter table public.leads add column if not exists business_email text;
