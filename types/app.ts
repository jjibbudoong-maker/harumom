// 앱 전용 타입 정의

export interface DailyLogFormValues {
  log_date: string
  time_bucket: 'morning' | 'midday' | 'evening' | 'night'
  mood_score: number
  energy_score: number
  pain_score: number
  sleep_hours: number
  symptom_ids: string[]
  medication_ids: string[]
  water_ml: number
}

export interface ChartDataPoint {
  date: string
  mood_score: number | null
  energy_score: number | null
  pain_score: number | null
  sleep_hours: number | null
}

export interface InsightCard {
  id: string
  emoji: string
  title: string
  body: string
  strength: '강한 상관' | '중간 상관'
  direction: 'positive' | 'negative'
}

export interface SymptomWithLogs {
  id: string
  name: string
  category: string | null
  color: string | null
  is_active: boolean
  recentCount?: number
}

export interface MedicationWithLogs {
  id: string
  name: string
  dosage: string | null
  frequency: string | null
  is_active: boolean
  adherenceRate?: number
}

export type ApiResponse<T> = {
  data: T | null
  error: { code: string; message: string } | null
}
