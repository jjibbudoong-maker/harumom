'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface InsightCard {
  id: string
  factor_a: string
  factor_b: string
  correlation: number
  message: string
  emoji: string
  title: string
  created_at: string
}

interface ApiResponse {
  data: InsightCard[]
  error: string | null
}

async function fetchInsights(): Promise<InsightCard[]> {
  const res = await fetch('/api/insights/generate')
  if (!res.ok) return []
  const json = await res.json() as ApiResponse
  return json.data ?? []
}

async function generateInsights(): Promise<InsightCard[]> {
  const res = await fetch('/api/insights/generate', { method: 'POST' })
  if (!res.ok) throw new Error('generate failed')
  const json = await res.json() as ApiResponse
  return json.data ?? []
}

export function useInsights() {
  return useQuery({
    queryKey: ['insights'],
    queryFn: fetchInsights,
    staleTime: 1000 * 60 * 30,
  })
}

export function useGenerateInsights() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: generateInsights,
    onSuccess: (data) => {
      qc.setQueryData(['insights'], data)
    },
  })
}
