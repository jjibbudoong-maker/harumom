-- ─────────────────────────────────────────
-- 하루몸 Push Subscriptions — v1.2
-- Supabase 대시보드 SQL Editor에서 실행
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint     TEXT NOT NULL,
  p256dh       TEXT NOT NULL,
  auth_key     TEXT NOT NULL,
  remind_time  TIME NOT NULL DEFAULT '21:00',
  med_times    TEXT[] NOT NULL DEFAULT '{}',
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT push_subscriptions_user_unique UNIQUE (user_id)
);

COMMENT ON TABLE public.push_subscriptions IS 'Web Push 구독 정보 — 사용자당 1개 (최신 기기 기준)';

-- RLS 활성화
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 본인만 읽기/쓰기 가능
CREATE POLICY "user_own_push" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
