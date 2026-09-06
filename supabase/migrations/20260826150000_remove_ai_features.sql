-- Remove AI-generative features (audit, redesign mockups) — app now focuses on
-- business scanning + lead CRM only. See project plan "Devora — remise à niveau".

drop table if exists public.audits cascade;
drop table if exists public.generated_sites cascade;

alter table public.project_businesses drop column if exists shared_audit_id;
alter table public.project_businesses drop column if exists shared_site_id;
alter table public.leads drop column if exists website_score;
