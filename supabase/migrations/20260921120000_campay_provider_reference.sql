-- Store CamPay's own transaction reference (returned by POST /api/collect/)
-- so we can actively poll GET /api/transaction/{reference}/ as a fallback
-- when the merchant hasn't configured (or CamPay can't reach) the webhook.
alter table public.payments add column if not exists provider_reference text;
