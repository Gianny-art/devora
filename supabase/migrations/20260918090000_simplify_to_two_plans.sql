-- Simplify pricing to two plans: free and premium (premium now includes
-- everything, including what used to be premium_plus).

update public.profiles set plan = 'premium' where plan = 'premium_plus';

alter table public.payments drop constraint if exists payments_tier_check;
alter table public.payments add constraint payments_tier_check check (tier in ('premium'));
