import { z } from 'zod'

export const CreateSymptomSchema = z.object({
  name: z.string().min(1, '증상명을 입력하세요').max(50),
  category: z.string().max(30).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export const UpdateSymptomSchema = CreateSymptomSchema.partial().extend({
  is_active: z.boolean().optional(),
})

export type CreateSymptomInput = z.infer<typeof CreateSymptomSchema>
export type UpdateSymptomInput = z.infer<typeof UpdateSymptomSchema>
