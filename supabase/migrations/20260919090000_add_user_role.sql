-- Real role system: admin access is no longer a hardcoded email list. Only the
-- owner account starts as admin; every other admin grant goes through the
-- admin panel from here on.

alter table public.profiles add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

update public.profiles set role = 'admin' where lower(email) = 'giannyfoapa@gmail.com';
