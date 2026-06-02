'use client'

export const dynamic = 'force-dynamic'

import { useInsights, useGenerateInsights } from '@/hooks/useInsights'

// 상관계수 → 임상 색상 클래스
const CORRELATION_STYLE: Record<string, { card: string; badge: string; label: string }> = {
  strong_positive:   { card: 'border-l-ap-teal bg-ap-teal-lt',   badge: 'bg-ap-teal text-white',     label: '강한 양의 상관' },
  moderate_positive: { card: 'border-l-ap-blue bg-ap-blue-lt',   badge: 'bg-ap-blue text-white',     label: '중등도 양의 상관' },
  weak:              { card: 'border-l-ap-border bg-white',       badge: 'bg-gray-100 text-ap-muted', label: '약한 상관' },
  moderate_negative: { card: 'border-l-ap-amber bg-ap-amber-lt', badge: 'bg-ap-amber text-white',    label: '중등도 음의 상관' },
  strong_negative:   { card: 'border-l-ap-red bg-ap-red-lt',     badge: 'bg-ap-red text-white',      label: '강한 음의 상관' },
}

function getCorrelationKey(r: number): string {
  const abs = Math.abs(r)
  if (abs >= 0.7) return r > 0 ? 'strong_positive' : 'strong_negative'
  if (abs >= 0.4) return r > 0 ? 'moderate_positive' : 'moderate_negative'
  return 'weak'
}

export default function InsightsPage() {
  const { data: insights, isLoading, error } = useInsights()
  const { mutate: generate, isPending } = useGenerateInsights()

  return (
    <div className="min-h-screen pb-24 bg-ap-surface">
      <div className="bg-ap-navy px-5 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">상관관계 인사이트</h1>
            <p className="text-white/60 text-xs mt-1">건강 데이터 패턴 분석</p>
          </div>
          <button onClick={() => generate()} disabled={isPending}
            className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 border border-white/20">
            {isPending ? '분석 중...' : '새로 분석'}
          </button>
        </div>
      </div>

      <div className="px-5 pt-5">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-ap-muted text-sm">인사이트 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-ap-red text-sm">불러오기 실패. 다시 시도해주세요.</p>
          </div>
        ) : !insights || insights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-ap-border">
            <div className="w-14 h-14 bg-ap-blue-lt rounded-2xl flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35M11 8v3M11 14h.01" />
              </svg>
            </div>
            <p className="text-ap-text font-semibold mb-1">아직 분석할 데이터가 부족합니다</p>
            <p className="text-ap-muted text-xs mb-4 leading-relaxed">
              14일 이상 꾸준히 기록하면<br />수면·기분·통증 간의 숨은 패턴을 발견할 수 있어요
            </p>
            <div className="flex gap-2 text-xs text-ap-muted mb-5">
              {['기분', '에너지', '통증', '수면'].map(item => (
                <span key={item} className="px-2.5 py-1 bg-ap-blue-lt text-ap-blue rounded-lg font-medium">{item}</span>
              ))}
            </div>
            <button onClick={() => generate()} disabled={isPending}
              className="bg-ap-blue text-white px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40">
              {isPending ? '분석 중...' : '지금 분석 시도하기'}
            </button>
            <p className="text-xs text-ap-muted mt-2">데이터가 적으면 결과가 제한될 수 있어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map(ins => {
              const key = getCorrelationKey(ins.correlation)
              const style = CORRELATION_STYLE[key] ?? CORRELATION_STYLE.weak
              return (
                <div key={ins.id} className={`rounded-2xl p-4 border-l-4 ${style.card} border border-ap-border/50`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-white rounded-md text-ap-text font-medium border border-ap-border">
                        {ins.factor_a}
                      </span>
                      <span className="text-ap-muted text-xs">↔</span>
                      <span className="text-xs px-2 py-0.5 bg-white rounded-md text-ap-text font-medium border border-ap-border">
                        {ins.factor_b}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${style.badge}`}>
                        {style.label}
                      </span>
                      <span className="text-xs text-ap-muted font-mono">r={ins.correlation.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-ap-text leading-relaxed">{ins.message}</p>
                </div>
              )
            })}

            <p className="text-center text-xs text-ap-muted py-3">
              상관관계는 인과관계가 아닙니다. 의료적 결정은 전문의와 상담하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
