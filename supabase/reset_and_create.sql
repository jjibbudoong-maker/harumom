-- =====================================================
-- 아프니 — 완전 초기화 + 스키마 생성 (한 번에 실행)
-- =====================================================

-- 1. 기존 객체 전부 삭제
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP VIEW IF EXISTS public.v_user_trend_summary CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.water_logs CASCADE;
DROP TABLE IF EXISTS public.ai_insights CASCADE;
DROP TABLE IF EXISTS public.medication_logs CASCADE;
DROP TABLE IF EXISTS public.medications CASCADE;
DROP TABLE IF EXISTS public.symptom_logs CASCADE;
DROP TABLE IF EXISTS public.symptoms CASCADE;
DROP TABLE IF EXISTS public.daily_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. PROFILES
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname        TEXT,
  onboarding_done BOOLEAN NOT NULL DEFAULT FALSE,
  primary_conditions TEXT[],
  birth_year      SMALLINT CHECK (birth_year BETWEEN 1920 AND 2010),
  conditions      TEXT[] DEFAULT '{}',
  timezone        TEXT NOT NULL DEFAULT 'Asia/Seoul',
  locale          TEXT NOT NULL DEFAULT 'ko',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DAILY_LOGS
CREATE TABLE public.daily_logs (
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
  taken_medications UUID[] DEFAULT '{}',
  symptom_ids     UUID[] DEFAULT '{}',
  actual_time     TIMESTAMPTZ,
  edited_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_logs_user_date_unique UNIQUE (user_id, log_date)
);
CREATE INDEX idx_daily_logs_user_date ON public.daily_logs (user_id, log_date DESC);

-- 5. SYMPTOMS
CREATE TABLE public.symptoms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  category   TEXT,
  color      TEXT,
  sort_order SMALLINT DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT symptoms_user_name_unique UNIQUE (user_id, name)
);
CREATE INDEX idx_symptoms_user_active ON public.symptoms (user_id, is_active);
CREATE INDEX idx_symptoms_category ON public.symptoms (category) WHERE is_active = TRUE;

-- 6. SYMPTOM_LOGS
CREATE TABLE public.symptom_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  symptom_id   UUID NOT NULL REFERENCES public.symptoms(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  severity     SMALLINT CHECK (severity BETWEEN 1 AND 5),
  present      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT symptom_logs_daily_symptom_unique UNIQUE (daily_log_id, symptom_id)
);
CREATE INDEX idx_symptom_logs_daily_log ON public.symptom_logs (daily_log_id);
CREATE INDEX idx_symptom_logs_user_id ON public.symptom_logs (user_id);

-- 7. MEDICATIONS
CREATE TABLE public.medications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  dosage     TEXT,
  frequency  TEXT,
  drug_code  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT medications_user_name_unique UNIQUE (user_id, name)
);
CREATE INDEX idx_medications_user_active ON public.medications (user_id, is_active);

-- 8. MEDICATION_LOGS
CREATE TABLE public.medication_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id  UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  taken         BOOLEAN NOT NULL DEFAULT FALSE,
  time_taken    TIME,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT medication_logs_daily_med_unique UNIQUE (daily_log_id, medication_id)
);
CREATE INDEX idx_medication_logs_daily_log ON public.medication_logs (daily_log_id);
CREATE INDEX idx_medication_logs_user ON public.medication_logs (user_id);

-- 9. AI_INSIGHTS
CREATE TABLE public.ai_insights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_type     TEXT NOT NULL DEFAULT 'correlation',
  insight_text     TEXT NOT NULL,
  factor_a         TEXT,
  factor_b         TEXT,
  correlation_coef NUMERIC(4,3),
  correlation_r    NUMERIC(4,3),
  data_range_start DATE,
  data_range_end   DATE,
  sample_size      SMALLINT,
  confidence_score NUMERIC(4,3),
  is_dismissed     BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_insights_user_factors_unique UNIQUE (user_id, factor_a, factor_b)
);
CREATE INDEX idx_ai_insights_user ON public.ai_insights (user_id, created_at DESC);
CREATE INDEX idx_ai_insights_type ON public.ai_insights (user_id, insight_type);

-- 10. WATER_LOGS
CREATE TABLE public.water_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date   DATE NOT NULL,
  amount_ml  SMALLINT NOT NULL CHECK (amount_ml > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT water_logs_user_date_unique UNIQUE (user_id, log_date)
);

-- 11. AUDIT_LOGS
CREATE TABLE public.audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. updated_at 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. 신규 회원 자동 프로필 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. 분석 뷰
CREATE OR REPLACE VIEW public.v_user_trend_summary AS
SELECT dl.user_id, dl.log_date, dl.mood_score, dl.energy_score, dl.pain_score,
  dl.sleep_hours, dl.time_bucket,
  COUNT(DISTINCT sl.symptom_id) AS active_symptom_count,
  ROUND(AVG(sl.severity), 2) AS avg_symptom_severity,
  COUNT(DISTINCT CASE WHEN ml.taken = TRUE THEN ml.medication_id END) AS medications_taken_count
FROM public.daily_logs dl
LEFT JOIN public.symptom_logs sl ON sl.daily_log_id = dl.id AND sl.present = TRUE
LEFT JOIN public.medication_logs ml ON ml.daily_log_id = dl.id
GROUP BY dl.user_id, dl.log_date, dl.mood_score, dl.energy_score, dl.pain_score, dl.sleep_hours, dl.time_bucket;

-- 15. RLS 활성화 및 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_logs_select" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_logs_insert" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_logs_update" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_logs_delete" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "symptoms_all" ON public.symptoms FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "symptom_logs_all" ON public.symptom_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medications_all" ON public.medications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medication_logs_all" ON public.medication_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_insights_all" ON public.ai_insights FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "water_logs_all" ON public.water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_admin_only" ON public.audit_logs FOR ALL USING (FALSE);

-- =====================================================
-- 완료! 모든 테이블/인덱스/트리거/RLS 생성됨
-- =====================================================
