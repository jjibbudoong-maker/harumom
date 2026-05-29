// Supabase 타입 — 스키마 적용 후 아래 명령으로 자동 생성하세요:
// npx supabase gen types typescript --project-id vxyscqwwvbmwkbhgimmj > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nickname: string | null
          birth_year: number | null
          gender: string | null
          onboarding_done: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          nickname?: string | null
          birth_year?: number | null
          gender?: string | null
          onboarding_done?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string | null
          birth_year?: number | null
          gender?: string | null
          onboarding_done?: boolean
          updated_at?: string
        }
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          time_bucket: 'morning' | 'midday' | 'evening' | 'night' | null
          mood_score: number | null
          energy_score: number | null
          pain_score: number | null
          sleep_hours: number | null
          actual_time: string | null
          edited_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          time_bucket?: 'morning' | 'midday' | 'evening' | 'night' | null
          mood_score?: number | null
          energy_score?: number | null
          pain_score?: number | null
          sleep_hours?: number | null
          actual_time?: string | null
        }
        Update: {
          time_bucket?: 'morning' | 'midday' | 'evening' | 'night' | null
          mood_score?: number | null
          energy_score?: number | null
          pain_score?: number | null
          sleep_hours?: number | null
          edited_at?: string | null
        }
      }
      symptoms: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string | null
          color: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: string | null
          color?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          category?: string | null
          color?: string | null
          is_active?: boolean
        }
      }
      symptom_logs: {
        Row: {
          id: string
          user_id: string
          symptom_id: string
          log_date: string
          severity: number | null
          note: string | null
        }
        Insert: {
          id?: string
          user_id: string
          symptom_id: string
          log_date: string
          severity?: number | null
          note?: string | null
        }
        Update: {
          severity?: number | null
          note?: string | null
        }
      }
      medications: {
        Row: {
          id: string
          user_id: string
          name: string
          dosage: string | null
          frequency: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          dosage?: string | null
          frequency?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          dosage?: string | null
          frequency?: string | null
          is_active?: boolean
        }
      }
      medication_logs: {
        Row: {
          id: string
          user_id: string
          medication_id: string
          log_date: string
          taken_at: string | null
          skipped: boolean
          note: string | null
        }
        Insert: {
          id?: string
          user_id: string
          medication_id: string
          log_date: string
          taken_at?: string | null
          skipped?: boolean
          note?: string | null
        }
        Update: {
          taken_at?: string | null
          skipped?: boolean
          note?: string | null
        }
      }
      water_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          amount_ml: number
          logged_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          amount_ml: number
          logged_at?: string
        }
        Update: {
          amount_ml?: number
        }
      }
      ai_insights: {
        Row: {
          id: string
          user_id: string
          insight_type: string
          correlation_r: number | null
          insight_text: string
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          insight_type: string
          correlation_r?: number | null
          insight_text: string
          generated_at?: string
        }
        Update: {
          insight_text?: string
          generated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
