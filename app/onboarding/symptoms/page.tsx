'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const PRESET_SYMPTOMS = [
  '두통', '관절통', '근육통', '피로감', '수면장애',
  '소화불량', '복통', '메스꺼움', '어지러움', '호흡곤란',
  '집중력 저하', '기억력 저하', '우울감', '불안감', '두근거림',
]

export default function OnboardingSymptomsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [loading, setLoading] = useState(false)

  function toggle(name: string) {
    setSelected(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name])
  }

  function addCustom() {
    const trimmed = custom.trim()
    if (trimmed && !selected.includes(trimmed)) { setSelected(prev => [...prev, trimmed]); setCustom('') }
  }

  async function handleNext() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    if (selected.length > 0) {
      await supabase.from('symptoms').insert(selected.map(name => ({ user_id: user.id, name, is_active: true })))
    }
    setLoading(false)
    router.push('/onboarding/medications')
  }

  return (
    <div className="min-h-screen bg-ap-surface">
      <div className="bg-ap-navy px-6 pt-12 pb-6">
        <div className="flex gap-1.5 mb-5">
          <div className="flex-1 h-1 bg-ap-teal rounded-full" />
          <div className="flex-1 h-1 bg-ap-teal rounded-full" />
          <div className="flex-1 h-1 bg-white/20 rounded-full" />
        </div>
        <h2 className="text-xl font-bold text-white">증상 등록</h2>
        <p className="text-white/60 text-xs mt-1">2 / 3 단계 — 주로 겪는 증상을 선택해주세요</p>
      </div>

      <div className="px-6 py-6">
        <div className="flex flex-wrap gap-2 mb-5">
          {PRESET_SYMPTOMS.map(s => (
            <button key={s} type="button" onClick={() => toggle(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                selected.includes(s)
                  ? 'bg-ap-blue text-white border-ap-blue'
                  : 'bg-white text-ap-muted border-ap-border'
              }`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-5">
          <input type="text" value={custom} onChange={e => setCustom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="다른 증상 직접 입력"
            className="flex-1 px-4 py-2.5 border border-ap-border rounded-xl bg-white text-ap-text focus:outline-none focus:ring-2 focus:ring-ap-blue text-sm" />
          <button type="button" onClick={addCustom}
            className="px-4 py-2.5 bg-ap-teal-lt text-ap-teal rounded-xl font-semibold text-sm border border-ap-teal/30">
            추가
          </button>
        </div>

        {selected.length > 0 && (
          <div className="bg-ap-blue-lt border border-ap-blue/20 rounded-xl p-4 mb-5">
            <p className="ap-label mb-2">선택된 증상 {selected.length}개</p>
            <div className="flex flex-wrap gap-1.5">
              {selected.map(s => (
                <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs text-ap-text border border-ap-border">
                  {s}
                  <button onClick={() => toggle(s)} className="text-ap-muted hover:text-ap-red ml-0.5">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={() => router.push('/onboarding/profile')}
            className="flex-1 py-3.5 border border-ap-border rounded-xl font-semibold text-ap-muted text-sm bg-white">
            이전
          </button>
          <button onClick={handleNext} disabled={loading}
            className="flex-1 bg-ap-blue text-white py-3.5 rounded-xl font-semibold disabled:opacity-40 text-sm">
            {loading ? '저장 중...' : selected.length === 0 ? '건너뛰기' : '다음 단계'}
          </button>
        </div>
      </div>
    </div>
  )
}
