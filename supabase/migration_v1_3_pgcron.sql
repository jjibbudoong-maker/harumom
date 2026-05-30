-- ═══════════════════════════════════════════════
-- 하루몸 복약 알림 — Supabase pg_cron + pg_net
-- Supabase 대시보드 SQL Editor에서 실행
-- ═══════════════════════════════════════════════

-- 1. 확장 활성화 (Supabase Free 플랜 포함)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. cron 작업 등록 (KST = UTC+9)
--    아침  08:00 KST = 23:00 UTC (전날)
--    점심  13:00 KST = 04:00 UTC
--    저녁  19:00 KST = 10:00 UTC
--    취침전 22:00 KST = 13:00 UTC

SELECT cron.schedule(
  'harumom-med-morning',
  '0 23 * * *',  -- 매일 23:00 UTC = 08:00 KST
  $$
  SELECT net.http_post(
    url     := 'https://apeuni.vercel.app/api/cron/med-notifications?time=08:00',
    headers := jsonb_build_object('x-cron-secret', 'harumom_cron_2026',
                                   'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'harumom-med-lunch',
  '0 4 * * *',   -- 매일 04:00 UTC = 13:00 KST
  $$
  SELECT net.http_post(
    url     := 'https://apeuni.vercel.app/api/cron/med-notifications?time=13:00',
    headers := jsonb_build_object('x-cron-secret', 'harumom_cron_2026',
                                   'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'harumom-med-evening',
  '0 10 * * *',  -- 매일 10:00 UTC = 19:00 KST
  $$
  SELECT net.http_post(
    url     := 'https://apeuni.vercel.app/api/cron/med-notifications?time=19:00',
    headers := jsonb_build_object('x-cron-secret', 'harumom_cron_2026',
                                   'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'harumom-med-bedtime',
  '0 13 * * *',  -- 매일 13:00 UTC = 22:00 KST
  $$
  SELECT net.http_post(
    url     := 'https://apeuni.vercel.app/api/cron/med-notifications?time=22:00',
    headers := jsonb_build_object('x-cron-secret', 'harumom_cron_2026',
                                   'Content-Type', 'application/json'),
    body    := '{}'::jsonb
  );
  $$
);

-- 3. 등록 확인
SELECT jobname, schedule, command FROM cron.job WHERE jobname LIKE 'harumom%';
