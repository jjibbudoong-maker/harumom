'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

interface MedEntry { name: string; dosage: string; frequency: string }
const FREQ_OPTIONS = ['매일', '아침저녁', '하루 3회', '필요시', '주 3회']

export default function OnboardingMedicationsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [meds, setMeds] = useState<MedEntry[]>([])
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('매일')
  const [loading, setLoading] = useState(false)

  function addMed() {
    const trimmed = name.trim()
    if (!trimmed) return
    setMeds(prev => [...prev, { name: trimmed, dosage: dosage.trim(), frequency }])
    setName(''); setDosage(''); setFrequency('매일')
  }
  function removeMed(i: number) { setMeds(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleFinish() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    if (meds.length > 0) {
      await supabase.from('medications').insert(
        meds.map(m => ({ user_id: user.id, name: m.name, dosage: m.dosage || null, frequency: m.frequency, is_active: true }))
      )
    }
    const { error: profileError } = await supabase
      .from('profiles').upsert({ id: user.id, onboarding_done: true }, { onConflict: 'id' })
    if (profileError) console.error('onboarding_done update failed:', profileError)
    setLoading(false)
    router.push('/dashboard')
  }

  const inputCls = 'w-full px-4 py-2.5 border border-ap-border rounded-xl bg-white text-ap-text focus:outline-none focus:ring-2 focus:ring-ap-blue text-sm'

  return (
    <div className="min-h-screen bg-ap-surface pb-10">
      <div className="bg-ap-navy px-6 pt-12 pb-6">
        <div className="flex gap-1.5 mb-5">
          <div className="flex-1 h-1 bg-ap-teal rounded-full" />
          <div className="flex-1 h-1 bg-ap-teal rounded-full" />
          <div className="flex-1 h-1 bg-ap-teal rounded-full" />
        </div>
        <h2 className="text-xl font-bold text-white">복용 약물 등록</h2>
        <p className="text-white/60 text-xs mt-1">3 / 3 단계 — 정기 복용 약이 있다면 추가하세요</p>
      </div>

      <div className="px-6 py-6">
        {/* 입력 폼 */}
        <div className="bg-white border border-ap-border rounded-2xl p-4 mb-5 space-y-3">
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="약 이름 (예: 아세트아미노펜)" className={inputCls} />
          <input type="text" value={dosage} onChange={e => setDosage(e.target.value)}
            placeholder="용량 (선택, 예: 500mg)" className={inputCls} />
          <div className="flex gap-1.5 flex-wrap">
            {FREQ_OPTIONS.map(f => (
              <button key={f} type="button" onClick={() => setFrequency(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  frequency === f ? 'bg-ap-blue text-white border-ap-blue' : 'bg-ap-surface text-ap-muted border-ap-border'
                }`}>
                {f}
              </button>
            ))}
          </div>
          <button type="button" onClick={addMed} disabled={!name.trim()}
            className="w-full py-2.5 bg-ap-teal-lt text-ap-teal rounded-xl text-sm font-semibold disabled:opacity-40 border border-ap-teal/30">
            + 추가
          </button>
        </div>

        {/* 목록 */}
        {meds.length > 0 && (
          <div className="space-y-2 mb-5">
            {meds.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-white border border-ap-border rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ap-text">{m.name}</p>
                  <p className="text-xs text-ap-muted">{[m.dosage, m.frequency].filter(Boolean).join(' · ')}</p>
                </div>
                <button onClick={() => removeMed(i)} className="text-ap-muted hover:text-ap-red text-xl leading-none">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.push('/onboarding/symptoms')}
            className="flex-1 py-3.5 border border-ap-border rounded-xl font-semibold text-ap-muted text-sm bg-white">
            이전
          </button>
          <button onClick={handleFinish} disabled={loading}
            className="flex-1 bg-ap-blue text-white py-3.5 rounded-xl font-semibold disabled:opacity-40 text-sm">
            {loading ? '완료 중...' : meds.length === 0 ? '건너뛰고 시작' : '시작하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
