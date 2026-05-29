import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UpdateLogSchema } from '@/lib/validations/log.schema'

export async function GET(_req: NextRequest, { params }: { params: { date: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: '인증 필요' } }, { status: 401 })

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('log_date', params.date)
    .single()

  if (error?.code === 'PGRST116') return NextResponse.json({ data: null, error: null }, { status: 404 })
  if (error) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 })

  return NextResponse.json({ data, error: null })
}

export async function PATCH(req: NextRequest, { params }: { params: { date: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: '인증 필요' } }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateLogSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ data: null, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 })

  const { data, error } = await supabase
    .from('daily_logs')
    .update({ ...parsed.data, edited_at: new Date().toISOString() })
    .eq('user_id', session.user.id)
    .eq('log_date', params.date)
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 })
  return NextResponse.json({ data, error: null })
}
