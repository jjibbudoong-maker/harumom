-- =====================================================
-- 아프니 Migration v1.1 — MVP 코드 정합성 패치
-- 실행 순서: 02_schema.sql 먼저 → 이 파일 실행
-- =====================================================

-- 1. daily_logs — MVP 코드에서 사용하는 컬럼 추가
ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS memo           TEXT,
  ADD COLUMN IF NOT EXISTS water_ml       SMALLINT CHECK (water_ml >= 0 AND water_ml <= 10000),
  ADD COLUMN IF NOT EXISTS exercise_min   SMALLINT CHECK (exercise_min >= 0 AND exercise_min <= 1440),
  ADD COLUMN IF NOT EXISTS taken_medications UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS symptom_ids    UUID[] DEFAULT '{}';

-- 2. profiles — birth_year, conditions 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_year  SMALLINT CHECK (birth_year BETWEEN 1920 AND 2010),
  ADD COLUMN IF NOT EXISTS conditions  TEXT[] DEFAULT '{}';

-- 3. ai_insights — insight_type CHECK 제약 제거 (pair key 방식으로 사용)
ALTER TABLE public.ai_insights
  DROP CONSTRAINT IF EXISTS ai_insights_insight_type_check;

-- correlation_r 컬럼 추가 (기존 correlation_coef 대체)
ALTER TABLE public.ai_insights
  ADD COLUMN IF NOT EXISTS correlation_r NUMERIC(5,4);

-- user_id + insight_type 유니크 제약 추가 (upsert용)
ALTER TABLE public.ai_insights
  DROP CONSTRAINT IF EXISTS ai_insights_user_type_unique;

ALTER TABLE public.ai_insights
  ADD CONSTRAINT ai_insights_user_type_unique
  UNIQUE (user_id, insight_type);

-- 4. profiles RLS — INSERT 정책 추가 (회원가입 시 직접 insert 필요)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles: 본인 데이터 생성'
  ) THEN
    CREATE POLICY "profiles: 본인 데이터 생성"
      ON public.profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END$$;

-- 5. 완료 확인 (실행 후 아래 결과로 검증)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'daily_logs'
ORDER BY ordinal_position;
