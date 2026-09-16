-- Schedule daily-notifications to actually run once a day (the pg_cron/pg_net
-- extensions were enabled previously but no job was ever scheduled).

select cron.schedule(
  'devora-daily-notifications',
  '0 8 * * *', -- every day at 08:00 UTC
  $$
  select net.http_post(
    url := 'https://abifmrsvbhbzhwdubwvu.supabase.co/functions/v1/daily-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaWZtcnN2Ymhiemh3ZHVid3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzY1OTYsImV4cCI6MjEwMzMxMjU5Nn0.c-ukhaUldSqQGe9wtaoEtR4Df3kwvuLevQXpn0hTysw',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaWZtcnN2Ymhiemh3ZHVid3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MzY1OTYsImV4cCI6MjEwMzMxMjU5Nn0.c-ukhaUldSqQGe9wtaoEtR4Df3kwvuLevQXpn0hTysw'
    ),
    body := '{}'::jsonb
  );
  $$
);
