-- =============================================================
-- 아프니 (Apeuni) — Supabase PostgreSQL Schema
-- Version: 1.0.0 / 2026-05-29
-- Extensions: TimescaleDB (optional), uuid-ossp, pgcrypto
-- =============================================================

-- ─────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- TimescaleDB는 Supabase Pro 이상에서 활성화 가능.
-- MVP에서는 일반 PostgreSQL 인덱스로 시작, 이후 hypertable 전환.
-- CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ─────────────────────────────────────────
-- 1. PROFILES (auth.users 확장)
-- auth.users는 Supabase가 관리 → 직접 수정 불가
-- profiles 테이블로 사용자 앱 데이터 분리
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname        TEXT,
  onboarding_done BOOLEAN NOT NULL DEFAULT FALSE,
  primary_conditions TEXT[],
  timezone        TEXT NOT NULL DEFAULT 'Asia/Seoul',
  locale          TEXT NOT NULL DEFAULT 'ko',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS '사용자 앱 프로필 (auth.users 1:1 확장)';
COMMENT ON COLUMN public.profiles.primary_conditions IS '주요 만성질환 코드 배열 — 온보딩 시 선택';

-- ─────────────────────────────────────────
-- 2. DAILY_LOGS (핵심 일일 기록 테이블)
-- 사용자당 날짜당 1개 레코드 (UNIQUE 제약)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date        DATE NOT NULL,
  time_bucket     TEXT CHECK (time_bucket IN ('morning', 'midday', 'evening', 'night')),
  mood_score      SMALLINT CHECK (mood_score BETWEEN 1 AND 10),
  energy_score    SMALLINT CHECK (energy_score BETWEEN 1 AND 10),
  pain_score      SMALLINT CHECK (pain_score BETWEEN 1 AND 10),
  sleep_hours     NUMERIC(4,2) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  note            TEXT,
  memo            TEXT,
  water_ml        INTEGER CHECK (water_ml >= 0 AND water_ml <= 10000),
  exercise_min    INTEGER CHECK (exercise_min >= 0 AND exercise_min <= 1440),
  taken_medications UUID[],
  symptom_ids     UUID[],
  actual_time     TIMESTAMPTZ,
  edited_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_logs_user_date_unique UNIQUE (user_id, log_date)
);

COMMENT ON TABLE public.daily_logs IS '일일 기본 지표 기록 (기분·에너지·통증·수면)';
COMMENT ON COLUMN public.daily_logs.time_bucket IS '아침/점심/저녁/야간 — 4개 시간대 인과분석용';
COMMENT ON COLUMN public.daily_logs.actual_time IS '실제 증상 시각 (소급입력 지원)';
COMMENT ON COLUMN public.daily_logs.edited_at IS '소급 수정 시각 — actual_time ≠ created_at인 경우 기록';

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs (user_id, log_date DESC);

-- ─────────────────────────────────────────
-- 3. SYMPTOMS (증상 목록 — 사용자 정의)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.symptoms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  category    TEXT,
  color       TEXT,
  sort_order  SMALLINT DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT symptoms_user_name_unique UNIQUE (user_id, name)
);

COMMENT ON TABLE public.symptoms IS '사용자 정의 증상 목록';
COMMENT ON COLUMN public.symptoms.category IS '두통/소화기/관절/피부/정신건강/기타';
COMMENT ON COLUMN public.symptoms.color IS '차트 시계열 표시용 hex 색상';

CREATE INDEX IF NOT EXISTS idx_symptoms_user_active ON public.symptoms (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_symptoms_category ON public.symptoms (category) WHERE is_active = TRUE;

-- ─────────────────────────────────────────
-- 4. SYMPTOM_LOGS (증상 발현 기록)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.symptom_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  symptom_id   UUID NOT NULL REFERENCES public.symptoms(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  severity     SMALLINT CHECK (severity BETWEEN 1 AND 5),
  present      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT symptom_logs_daily_symptom_unique UNIQUE (daily_log_id, symptom_id)
);

COMMENT ON TABLE public.symptom_logs IS '증상 일별 발현 기록';
COMMENT ON COLUMN public.symptom_logs.severity IS '1(아주약) ~ 5(아주강) — null이면 발현 여부만 기록';

CREATE INDEX IF NOT EXISTS idx_symptom_logs_daily_log ON public.symptom_logs (daily_log_id);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_id ON public.symptom_logs (user_id);

-- ─────────────────────────────────────────
-- 5. MEDICATIONS (약물 목록 — 사용자 정의)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  dosage         TEXT,
  frequency      TEXT,
  drug_code      TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order     SMALLINT DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT medications_user_name_unique UNIQUE (user_id, name)
);

COMMENT ON TABLE public.medications IS '사용자 등록 약물 목록';
COMMENT ON COLUMN public.medications.drug_code IS '식약처 e약은요 품목코드 — Phase 2 DUR 연동용';

CREATE INDEX IF NOT EXISTS idx_medications_user_active ON public.medications (user_id, is_active);

-- ─────────────────────────────────────────
-- 6. MEDICATION_LOGS (약물 복용 기록)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id   UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  medication_id  UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  taken          BOOLEAN NOT NULL DEFAULT FALSE,
  time_taken     TIME,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT medication_logs_daily_med_unique UNIQUE (daily_log_id, medication_id)
);

COMMENT ON TABLE public.medication_logs IS '약물 일별 복용 기록';

CREATE INDEX IF NOT EXISTS idx_medication_logs_daily_log ON public.medication_logs (daily_log_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user ON public.medication_logs (user_id);

-- ─────────────────────────────────────────
-- 7. AI_INSIGHTS (AI 상관분석 결과)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_type      TEXT NOT NULL DEFAULT 'correlation',
  insight_text      TEXT NOT NULL,
  factor_a          TEXT,
  factor_b          TEXT,
  correlation_coef  NUMERIC(4,3),
  correlation_r     NUMERIC(4,3),
  data_range_start  DATE,
  data_range_end    DATE,
  sample_size       SMALLINT,
  confidence_score  NUMERIC(4,3),
  is_dismissed      BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_insights_user_factors_unique UNIQUE (user_id, factor_a, factor_b)
);

COMMENT ON TABLE public.ai_insights IS 'GPT-4o-mini 생성 상관분석 인사이트';
COMMENT ON COLUMN public.ai_insights.correlation_coef IS 'Pearson r — |r|>0.5 : 강상관, 0.3~0.5 : 중상관';
COMMENT ON COLUMN public.ai_insights.sample_size IS '최소 14개 이상일 때 인사이트 생성 권장';

CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON public.ai_insights (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON public.ai_insights (user_id, insight_type);

-- ─────────────────────────────────────────
-- 8. WATER_LOGS (수분 섭취 기록 — Phase 1+)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.water_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date     DATE NOT NULL,
  amount_ml    SMALLINT NOT NULL CHECK (amount_ml > 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT water_logs_user_date_unique UNIQUE (user_id, log_date)
);

COMMENT ON TABLE public.water_logs IS '일별 수분 섭취량 (ml 저장, oz 표시 토글 가능)';

-- ─────────────────────────────────────────
-- 9. 자동 updated_at 트리거
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────
-- 10. 신규 회원 자동 프로필 생성 트리거
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────
-- 11. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────

-- ── profiles ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: 본인 데이터만 조회"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: 본인 데이터만 수정"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: 본인 데이터만 생성"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── daily_logs ──
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_logs: 본인 데이터만 조회"
  ON public.daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_logs: 본인 데이터만 생성"
  ON public.daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_logs: 본인 데이터만 수정"
  ON public.daily_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_logs: 본인 데이터만 삭제"
  ON public.daily_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ── symptoms ──
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "symptoms: 본인 데이터만 조회"
  ON public.symptoms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "symptoms: 본인 데이터만 생성"
  ON public.symptoms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "symptoms: 본인 데이터만 수정"
  ON public.symptoms FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "symptoms: 본인 데이터만 삭제"
  ON public.symptoms FOR DELETE
  USING (auth.uid() = user_id);

-- ── symptom_logs ──
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "symptom_logs: 본인 데이터만 조회"
  ON public.symptom_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "symptom_logs: 본인 데이터만 생성"
  ON public.symptom_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "symptom_logs: 본인 데이터만 수정"
  ON public.symptom_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "symptom_logs: 본인 데이터만 삭제"
  ON public.symptom_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ── medications ──
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medications: 본인 데이터만 조회"
  ON public.medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "medications: 본인 데이터만 생성"
  ON public.medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medications: 본인 데이터만 수정"
  ON public.medications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medications: 본인 데이터만 삭제"
  ON public.medications FOR DELETE
  USING (auth.uid() = user_id);

-- ── medication_logs ──
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medication_logs: 본인 데이터만 조회"
  ON public.medication_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "medication_logs: 본인 데이터만 생성"
  ON public.medication_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medication_logs: 본인 데이터만 수정"
  ON public.medication_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "medication_logs: 본인 데이터만 삭제"
  ON public.medication_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ── ai_insights ──
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_insights: 본인 데이터만 조회"
  ON public.ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "ai_insights: 본인 데이터만 생성"
  ON public.ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_insights: 본인 데이터만 수정 (dismiss)"
  ON public.ai_insights FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── water_logs ──
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "water_logs: 본인 데이터만 접근"
  ON public.water_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- 12. 인사이트 생성용 분석 뷰 (Read-Only)
-- ─────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_user_trend_summary AS
SELECT
  dl.user_id,
  dl.log_date,
  dl.mood_score,
  dl.energy_score,
  dl.pain_score,
  dl.sleep_hours,
  dl.time_bucket,
  COUNT(DISTINCT sl.symptom_id) AS active_symptom_count,
  ROUND(AVG(sl.severity), 2)   AS avg_symptom_severity,
  COUNT(DISTINCT CASE WHEN ml.taken = TRUE THEN ml.medication_id END) AS medications_taken_count
FROM public.daily_logs dl
LEFT JOIN public.symptom_logs  sl ON sl.daily_log_id = dl.id AND sl.present = TRUE
LEFT JOIN public.medication_logs ml ON ml.daily_log_id = dl.id
GROUP BY
  dl.user_id, dl.log_date, dl.mood_score,
  dl.energy_score, dl.pain_score, dl.sleep_hours, dl.time_bucket;

COMMENT ON VIEW public.v_user_trend_summary IS 'AI 인사이트 생성용 일별 집계 뷰 (RLS 적용된 테이블 기반)';

-- ─────────────────────────────────────────
-- 13. PIPA 준수 — 감사 로그
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_logs IS 'PIPA 제34조 접근 감사 로그 — 2년 보관 의무';

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs: 관리자만 접근"
  ON public.audit_logs FOR ALL
  USING (FALSE);

-- ─────────────────────────────────────────
-- END OF SCHEMA
-- Supabase SQL Editor에서 전체 선택 후 실행
-- ─────────────────────────────────────────
