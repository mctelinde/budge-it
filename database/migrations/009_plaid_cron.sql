-- Migration 009: pg_cron daily Plaid sync
-- Schedules the plaid-sync-transactions Edge Function to run every day at 6am UTC.
--
-- Prerequisites:
--   1. The pg_cron and pg_net extensions must be enabled (available on Supabase Pro+).
--   2. The CRON_SECRET and the Edge Function URL must match what is deployed.
--
-- To enable extensions if not already done:
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- Project ref: xmkvrywwgtmiupgchlkq
-- CRON_SECRET is stored in .env.local and as a Supabase project secret.

-- Remove existing job if re-running
SELECT cron.unschedule('plaid-daily-sync') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'plaid-daily-sync'
);

SELECT cron.schedule(
  'plaid-daily-sync',
  '0 6 * * *',   -- 6:00 AM UTC every day
  $$
    SELECT net.http_post(
      url     := 'https://xmkvrywwgtmiupgchlkq.supabase.co/functions/v1/plaid-sync-transactions',
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'x-cron-secret', current_setting('app.cron_secret')
                 ),
      body    := '{}'::jsonb
    );
  $$
);
