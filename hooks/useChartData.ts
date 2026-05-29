'use client'

import { useQuery } from '@tanstack/react-query'

export interface TrendPoint {
  log_date: string
  mood_score: number | null
  energy_score: number | null
  pain_score: number | null
  sleep_hours: number | null
}

async function fetchTrend(days: number): Promise<TrendPoint[]> {
  const res = await fetch(`/api/charts/trend?days=${days}`)
  if (!res.ok) throw new Error('trend fetch failed')
  const json = await res.json() as { data: TrendPoint[] }
  return json.data ?? []
}

export function useChartData(days = 30) {
  return useQuery({
    queryKey: ['chart-trend', days],
    queryFn: () => fetchTrend(days),
    staleTime: 1000 * 60 * 5,
  })
}
