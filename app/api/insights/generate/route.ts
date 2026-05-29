import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { pearsonCorrelation } from '@/lib/analysis/pearson'
import { generateInsightCard } from '@/lib/analysis/insights-template'
import type { FactorKey } from '@/lib/analysis/insights-template'

type DailyLogFactor = 'sleep_hours' | 'mood_score' | 'energy_score' | 'pain_score'
type LogRow = Record<DailyLogFactor, number | null> & { log_date: string }

interface StoredInsight {
  id: string
  factor_a: string
  factor_b: string
  correlation: number
  message: string
  emoji: string
  title: string
  created_at: string
}

// GET — 저장된 인사이트 조회
export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ data: [], error: 'UNAUTHORIZED' }, { status: 401 })

  const { data: rows } = await supabase
    .from('ai_insights')
    .select('insight_type, insight_text, correlation_r, generated_at')
    .eq('user_id', session.user.id)
    .order('generated_at', { ascending: false })

  const insights: StoredInsight[] = (rows ?? []).map((row: Record<string, unknown>) => {
    const parts = (row.insight_type as string).split('_')
    // insight_text에 JSON으로 저장된 경우 파싱, 아니면 plain text 사용
    let parsed: Partial<StoredInsight> = {}
    try { parsed = JSON.parse(row.insight_text as string) } catch { /* plain text */ }

    return {
      id: row.insight_type as string,
      factor_a: parts[0] ?? '',
      factor_b: parts[1] ?? '',
      correlation: typeof row.correlation_r === 'number' ? row.correlation_r : 0,
      message: (parsed.message ?? row.insight_text) as string,
      emoji: parsed.emoji ?? '📊',
      title: parsed.title ?? '',
      created_at: row.generated_at as string,
    }
  })

  return NextResponse.json({ data: insights, error: null })
}

// POST — 새로 분석 및 저장
export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ data: [], error: 'UNAUTHORIZED' }, { status: 401 })

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: rawLogs } = await supabase
    .from('daily_logs')
    .select('log_date, mood_score, energy_score, pain_score, sleep_hours')
    .eq('user_id', session.user.id)
    .gte('log_date', since)
    .order('log_date')

  const logs = (rawLogs ?? []) as LogRow[]

  if (logs.length < 14) {
    return NextResponse.json({ data: [], error: null })
  }

  const PAIRS: [DailyLogFactor, DailyLogFactor][] = [
    ['sleep_hours', 'pain_score'],
    ['sleep_hours', 'energy_score'],
    ['sleep_hours', 'mood_score'],
    ['energy_score', 'mood_score'],
    ['pain_score', 'mood_score'],
  ]

  const cards = PAIRS.map(([a, b]) => {
    const validRows = logs.filter(l => l[a] != null && l[b] != null)
    if (validRows.length < 14) return null
    const xs = validRows.map(l => l[a] as number)
    const ys = validRows.map(l => l[b] as number)
    const r = pearsonCorrelation(xs, ys)
    if (isNaN(r)) return null
    const card = generateInsightCard({
      factorA: a as FactorKey, factorB: b as FactorKey, r,
      sampleCount: validRows.length,
      avgA: xs.reduce((s, v) => s + v, 0) / xs.length,
      avgB: ys.reduce((s, v) => s + v, 0) / ys.length,
    })
    if (!card) return null
    return { card, a, b, r }
  }).filter(Boolean)

  if (cards.length > 0) {
    const rows = cards.map(c => ({
      user_id: session.user.id,
      insight_type: c!.card.id,
      correlation_r: c!.r,
      insight_text: JSON.stringify({
        message: c!.card.body,
        emoji: c!.card.emoji,
        title: c!.card.title,
      }),
      generated_at: new Date().toISOString(),
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('ai_insights').upsert(rows as any, { onConflict: 'user_id,insight_type' })
  }

  const insights: StoredInsight[] = cards.map(c => ({
    id: c!.card.id,
    factor_a: c!.a,
    factor_b: c!.b,
    correlation: c!.r,
    message: c!.card.body,
    emoji: c!.card.emoji,
    title: c!.card.title,
    created_at: new Date().toISOString(),
  }))

  return NextResponse.json({ data: insights, error: null })
}
