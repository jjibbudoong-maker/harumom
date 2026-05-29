import { z } from 'zod'

export const CreateLogSchema = z.object({
  log_date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다'),
  time_bucket:        z.enum(['morning', 'midday', 'evening', 'night']).optional(),
  mood_score:         z.number().int().min(1).max(10).optional(),
  energy_score:       z.number().int().min(1).max(10).optional(),
  pain_score:         z.number().int().min(0).max(10).optional(),
  sleep_hours:        z.number().min(0).max(24).optional(),
  water_ml:           z.number().int().min(0).max(10000).optional(),
  exercise_min:       z.number().int().min(0).max(1440).optional(),
  memo:               z.string().max(500).optional(),
  taken_medications:  z.array(z.string().uuid()).optional(),
  symptom_ids:        z.array(z.string().uuid()).optional(),
})

export const UpdateLogSchema = CreateLogSchema.partial().omit({ log_date: true })

export type CreateLogInput = z.infer<typeof CreateLogSchema>
export type UpdateLogInput = z.infer<typeof UpdateLogSchema>
