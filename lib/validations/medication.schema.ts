import { z } from 'zod'

export const CreateMedicationSchema = z.object({
  name: z.string().min(1, '약물명을 입력하세요').max(100),
  dosage: z.string().max(50).optional(),
  frequency: z.string().max(50).optional(),
})

export const UpdateMedicationSchema = CreateMedicationSchema.partial().extend({
  is_active: z.boolean().optional(),
})

export type CreateMedicationInput = z.infer<typeof CreateMedicationSchema>
export type UpdateMedicationInput = z.infer<typeof UpdateMedicationSchema>
