import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CreateLogSchema } from '@/lib/validations/log.schema'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } }, { status: 401 })
  }

  const body = await req.json()
  const parsed = CreateLogSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .insert({ ...parsed.data, user_id: session.user.id })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ data: null, error: { code: 'DUPLICATE_DATE', message: '해당 날짜 기록이 이미 존재합니다.' } }, { status: 409 })
    }
    return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 })
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
