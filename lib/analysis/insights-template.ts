import type { InsightCard } from '@/types/app'

export type FactorKey = 'sleep_hours' | 'mood_score' | 'energy_score' | 'pain_score' | 'water_ml'

export interface CorrelationResult {
  factorA: FactorKey
  factorB: FactorKey
  r: number
  sampleCount: number
  avgA: number
  avgB: number
}

const FACTOR_LABELS: Record<FactorKey, string> = {
  sleep_hours: '수면 시간',
  mood_score: '기분',
  energy_score: '에너지',
  pain_score: '통증',
  water_ml: '수분 섭취',
}

export function generateInsightCard(result: CorrelationResult): InsightCard | null {
  const { factorA, factorB, r, sampleCount } = result
  const abs = Math.abs(r)
  if (abs < 0.3 || sampleCount < 14) return null

  const strength: InsightCard['strength'] = abs >= 0.5 ? '강한 상관' : '중간 상관'
  const direction: InsightCard['direction'] = r < 0 ? 'negative' : 'positive'
  const labelA = FACTOR_LABELS[factorA]
  const labelB = FACTOR_LABELS[factorB]

  const specific = getSpecificMessage(factorA, factorB, r, result)
  if (specific) {
    return { id: `${factorA}_${factorB}`, ...specific, strength, direction }
  }

  const body = r < 0
    ? `${labelA}이 높은 날일수록 ${labelB}이 낮아지는 경향이 ${sampleCount}일 데이터에서 관찰됩니다.`
    : `${labelA}이 높은 날일수록 ${labelB}도 높아지는 경향이 ${sampleCount}일 데이터에서 관찰됩니다.`

  return {
    id: `${factorA}_${factorB}`,
    emoji: r < 0 ? '📉' : '📈',
    title: `${labelA} ↔ ${labelB} 상관관계`,
    body,
    strength,
    direction,
  }
}

function getSpecificMessage(
  factorA: FactorKey,
  factorB: FactorKey,
  r: number,
  { avgA, sampleCount }: CorrelationResult
): Omit<InsightCard, 'id' | 'strength' | 'direction'> | null {
  const avg = avgA.toFixed(1)
  const pair = `${factorA}_${factorB}`

  const messages: Record<string, Omit<InsightCard, 'id' | 'strength' | 'direction'> | null> = {
    sleep_hours_pain_score: r < 0 ? {
      emoji: '😴',
      title: '수면이 길수록 통증이 낮아요',
      body: `평균 수면 ${avg}시간 기준으로, 이보다 짧게 잔 날 통증 점수가 높게 나타나는 경향이 있어요. 충분한 수면이 통증 관리에 도움이 될 수 있습니다.`,
    } : null,
    sleep_hours_energy_score: r > 0 ? {
      emoji: '⚡',
      title: '잘 잘수록 에너지가 올라가요',
      body: `수면 시간이 평균(${avg}시간)보다 긴 날, 에너지 점수도 함께 높아지는 패턴이 ${sampleCount}일 데이터에서 관찰됩니다.`,
    } : null,
    sleep_hours_mood_score: r > 0 ? {
      emoji: '☀️',
      title: '수면 충분하면 기분도 좋아요',
      body: `${sampleCount}일 데이터를 보면, 수면이 충분한 날 기분 점수가 평균보다 높게 기록됐어요.`,
    } : null,
    energy_score_mood_score: r > 0 ? {
      emoji: '🌟',
      title: '에너지가 높으면 기분도 밝아요',
      body: `에너지와 기분이 함께 움직이는 경향이 있어요. 에너지를 높여주는 활동이 기분 개선에도 도움이 될 수 있습니다.`,
    } : null,
    water_ml_energy_score: r > 0 ? {
      emoji: '💧',
      title: '수분 섭취가 에너지와 연관돼요',
      body: `물을 많이 마신 날 에너지 점수가 높은 경향이 관찰됩니다. 수분 보충에 신경 써보세요.`,
    } : null,
    pain_score_mood_score: r < 0 ? {
      emoji: '💊',
      title: '통증이 높으면 기분이 낮아져요',
      body: `통증이 심한 날 기분 점수가 낮게 기록되는 패턴이 보여요. 통증 관리가 기분 유지에 중요할 수 있습니다.`,
    } : null,
  }

  return messages[pair] ?? messages[`${factorB}_${factorA}`] ?? null
}
