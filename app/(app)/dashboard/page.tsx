export const dynamic = 'force-dynamic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getTodayKST, formatDateKo } from '@/lib/utils'
import Link from 'next/link'

function ScorePill({
  label, score, type,
}: {
  label: string
  score: number | null
  type: 'mood' | 'energy' | 'pain'
}) {
  const COLOR = {
    mood:   { bar: 'bg-ap-blue',  text: 'text-ap-blue',  bg: 'bg-ap-blue-lt'  },
    energy: { bar: 'bg-ap-teal',  text: 'text-ap-teal',  bg: 'bg-ap-teal-lt'  },
    pain:   { bar: 'bg-ap-red',   text: 'text-ap-red',   bg: 'bg-ap-red-lt'   },
  }
  const c = COLOR[type]
  const pct = score != null ? (score / 10) * 100 : 0

  return (
    <div className={`rounded-xl p-4 ${c.bg}`}>
      <p className="ap-label mb-2">{label}</p>
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-3xl font-bold tabular-nums ${c.text}`}>
          {score ?? '—'}
        </span>
        {score != null && (
          <span className="text-ap-muted text-sm mb-0.5">/10</span>
        )}
      </div>
      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const today = getTodayKST()

  const [profileRes, todayLogRes, recentLogsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('daily_logs').select('*').eq('user_id', user!.id).eq('log_date', today).maybeSingle(),
    supabase.from('daily_logs')
      .select('log_date, mood_score, energy_score, pain_score')
      .eq('user_id', user!.id)
      .order('log_date', { ascending: false })
      .limit(7),
  ])

  const profile = profileRes.data
  const todayLog = todayLogRes.data
  const recentLogs = recentLogsRes.data ?? []
  const nickname = profile?.nickname ?? '환자'

  return (
    <div className="bg-ap-surface min-h-screen">

      {/* 헤더 */}
      <div className="bg-ap-navy px-5 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/50 text-xs tracking-widest uppercase mb-1">Daily Health Monitor</p>
            <h1 className="text-white text-xl font-bold">{nickname} 님</h1>
            <p className="text-white/60 text-sm mt-0.5">{formatDateKo(today)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white" opacity="0.7"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 pb-6 space-y-4">

        {/* 오늘 기록 */}
        {todayLog ? (
          <div className="ap-card overflow-hidden">
            <div className="px-4 py-3 border-b border-ap-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ap-teal inline-block"></span>
                <span className="ap-label">오늘의 바이탈</span>
              </div>
              <Link href={`/log`} className="text-ap-blue text-xs font-semibold">
                수정 →
              </Link>
            </div>
            <div className="p-4 grid grid-cols-3 gap-3">
              <ScorePill label="기분" score={todayLog.mood_score} type="mood" />
              <ScorePill label="에너지" score={todayLog.energy_score} type="energy" />
              <ScorePill label="통증" score={todayLog.pain_score} type="pain" />
            </div>
            {(todayLog.sleep_hours != null || todayLog.water_ml != null || todayLog.exercise_min != null) && (
              <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                {todayLog.sleep_hours != null && (
                  <div className="text-center bg-ap-surface rounded-lg py-2">
                    <p className="ap-label mb-1">수면</p>
                    <p className="font-bold text-ap-text tabular-nums">{todayLog.sleep_hours}<span className="text-xs text-ap-muted font-normal">h</span></p>
                  </div>
                )}
                {todayLog.water_ml != null && (
                  <div className="text-center bg-ap-surface rounded-lg py-2">
                    <p className="ap-label mb-1">수분</p>
                    <p className="font-bold text-ap-text tabular-nums">{todayLog.water_ml}<span className="text-xs text-ap-muted font-normal">ml</span></p>
                  </div>
                )}
                {todayLog.exercise_min != null && (
                  <div className="text-center bg-ap-surface rounded-lg py-2">
                    <p className="ap-label mb-1">활동</p>
                    <p className="font-bold text-ap-text tabular-nums">{todayLog.exercise_min}<span className="text-xs text-ap-muted font-normal">min</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <Link href="/log">
            <div className="ap-card border-l-4 border-l-ap-blue p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-ap-blue-lt flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="#1565C0"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ap-text">오늘 기록 미완료</p>
                <p className="text-ap-muted text-sm">탭하여 바이탈 기록 시작</p>
              </div>
              <span className="text-ap-blue text-lg">→</span>
            </div>
          </Link>
        )}

        {/* 최근 기록 테이블 */}
        {recentLogs.length > 0 && (
          <div className="ap-card overflow-hidden">
            <div className="px-4 py-3 border-b border-ap-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ap-blue inline-block"></span>
                <span className="ap-label">최근 기록</span>
              </div>
              <Link href="/charts" className="text-ap-blue text-xs font-semibold">
                차트 →
              </Link>
            </div>
            <div className="divide-y divide-ap-border">
              <div className="grid grid-cols-4 px-4 py-2 bg-ap-surface">
                <span className="ap-label">날짜</span>
                <span className="ap-label text-center">기분</span>
                <span className="ap-label text-center">에너지</span>
                <span className="ap-label text-center">통증</span>
              </div>
              {recentLogs.slice(0, 5).map((log) => (
                <Link key={log.log_date} href="/log">
                  <div className="grid grid-cols-4 px-4 py-3 hover:bg-ap-surface transition-colors">
                    <span className="text-sm text-ap-muted">
                      {new Date(log.log_date + 'T00:00:00+09:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={`text-center font-bold tabular-nums text-sm ${log.mood_score != null && log.mood_score >= 7 ? 'text-ap-blue' : log.mood_score != null && log.mood_score <= 3 ? 'text-ap-red' : 'text-ap-text'}`}>
                      {log.mood_score ?? '—'}
                    </span>
                    <span className={`text-center font-bold tabular-nums text-sm ${log.energy_score != null && log.energy_score >= 7 ? 'text-ap-teal' : log.energy_score != null && log.energy_score <= 3 ? 'text-ap-red' : 'text-ap-text'}`}>
                      {log.energy_score ?? '—'}
                    </span>
                    <span className={`text-center font-bold tabular-nums text-sm ${log.pain_score != null && log.pain_score >= 7 ? 'text-ap-red' : log.pain_score != null && log.pain_score <= 3 ? 'text-ap-teal' : 'text-ap-text'}`}>
                      {log.pain_score ?? '—'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 빠른 이동 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/charts">
            <div className="ap-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-ap-blue-lt flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1565C0">
                  <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ap-text">트렌드 차트</p>
                <p className="text-xs text-ap-muted">패턴 분석</p>
              </div>
            </div>
          </Link>
          <Link href="/insights">
            <div className="ap-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-ap-teal-lt flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#00695C">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ap-text">AI 인사이트</p>
                <p className="text-xs text-ap-muted">상관관계 분석</p>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  )
}
