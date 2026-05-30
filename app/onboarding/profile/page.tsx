'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const CONDITION_OPTIONS = [
  { id: 'fibromyalgia', label: '섬유근육통' },
  { id: 'chronic_fatigue', label: '만성피로증후군' },
  { id: 'lupus', label: '루푸스' },
  { id: 'rheumatoid', label: '류마티스 관절염' },
  { id: 'diabetes', label: '당뇨' },
  { id: 'hypertension', label: '고혈압' },
  { id: 'depression', label: '우울/불안' },
  { id: 'ibs', label: '과민성대장증후군' },
  { id: 'other', label: '기타 만성질환' },
]

export default function OnboardingProfilePage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [nickname, setNickname] = useState('')
  const [conditions, setConditions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // 기존 프로필 불러와서 미리채우기
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('nickname, primary_conditions')
        .eq('id', user.id)
        .single()
      if (data?.nickname) setNickname(data.nickname)
      if (data?.primary_conditions?.length) setConditions(data.primary_conditions)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleCondition(id: string) {
    setConditions(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  async function handleNext() {
    if (!nickname.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    await supabase.from('profiles').upsert({
      id: user.id,
      nickname: nickname.trim(),
      primary_conditions: conditions,
    })
    setLoading(false)
    router.push('/onboarding/symptoms')
  }

  const inputCls = 'w-full px-4 py-3 border border-ap-border rounded-xl bg-white text-ap-text focus:outline-none focus:ring-2 focus:ring-ap-blue text-sm'

  return (
    <div className="min-h-screen bg-ap-surface">
      <div className="bg-ap-navy px-6 pt-12 pb-6">
        <div className="flex gap-1.5 mb-5">
          <div className="flex-1 h-1 bg-ap-teal rounded-full" />
          <div className="flex-1 h-1 bg-white/20 rounded-full" />
          <div className="flex-1 h-1 bg-white/20 rounded-full" />
        </div>
        <h2 className="text-xl font-bold text-white">프로필 설정</h2>
        <p className="text-white/60 text-xs mt-1">1 / 3 단계 — 나에 대해 알려주세요</p>
      </div>

      <div className="px-6 py-6 space-y-5">
        <div>
          <label className="ap-label block mb-1.5">닉네임 *</label>
          <input type="text" value={nickname}
            onChange={e => setNickname(e.target.value)}
            onInput={e => setNickname((e.target as HTMLInputElement).value)}
            maxLength={20} placeholder="예: 건강한홍길동" className={inputCls} />
        </div>
        <div>
          <label className="ap-label block mb-3">관리 중인 질환 (선택, 복수)</label>
          <div className="flex flex-wrap gap-2">
            {CONDITION_OPTIONS.map(c => (
              <button key={c.id} type="button" onClick={() => toggleCondition(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  conditions.includes(c.id)
                    ? 'bg-ap-blue text-white border-ap-blue'
                    : 'bg-white text-ap-muted border-ap-border'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pb-10">
        <button onClick={handleNext} disabled={!nickname.trim() || loading}
          className="w-full bg-ap-blue text-white py-3.5 rounded-xl font-semibold disabled:opacity-40 text-sm">
          {loading ? '저장 중...' : '다음 단계'}
        </button>
      </div>
    </div>
  )
}
