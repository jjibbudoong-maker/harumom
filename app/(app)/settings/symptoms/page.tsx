'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const PRESET = [
  '두통', '관절통', '근육통', '피로감', '수면장애',
  '소화불량', '복통', '메스꺼움', '어지러움', '호흡곤란',
  '집중력 저하', '기억력 저하', '우울감', '불안감', '두근거림',
]

type Symptom = { id: string; name: string; is_active: boolean }

export default function SymptomsSettingsPage() {
  const router   = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [custom,   setCustom]   = useState('')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('symptoms').select('*').eq('user_id', user.id).order('created_at')
      setSymptoms(data ?? [])
      setLoading(false)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(id: string, active: boolean) {
    await supabase.from('symptoms').update({ is_active: !active }).eq('id', id)
    setSymptoms(prev => prev.map(s => s.id === id ? { ...s, is_active: !active } : s))
  }

  async function addSymptom(name: string) {
    const trimmed = name.trim()
    if (!trimmed || symptoms.some(s => s.name === trimmed)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('symptoms').insert({ user_id: user.id, name: trimmed, is_active: true }).select().single()
    if (data) { setSymptoms(prev => [...prev, data]); setCustom('') }
  }

  async function deleteSymptom(id: string) {
    await supabase.from('symptoms').delete().eq('id', id)
    setSymptoms(prev => prev.filter(s => s.id !== id))
  }

  const activeNames = symptoms.map(s => s.name)

  return (
    <div className="min-h-screen pb-24 bg-ap-surface">
      {/* 헤더 */}
      <div className="bg-ap-navy px-5 pt-10 pb-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-white/70 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">증상 관리</h1>
          <p className="text-white/60 text-xs mt-0.5">추적할 증상을 설정하세요</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-20 text-ap-muted">불러오는 중...</div>
      ) : (
        <div className="px-5 pt-5 space-y-4">
          {/* 등록된 증상 */}
          {symptoms.length > 0 && (
            <div>
              <p className="ap-label mb-3">등록된 증상 ({symptoms.length}개)</p>
              <div className="space-y-2">
                {symptoms.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl px-4 py-3.5 border border-ap-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggle(s.id, s.is_active)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          s.is_active ? 'bg-ap-teal border-ap-teal' : 'border-ap-border'
                        }`}>
                        {s.is_active && <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                      </button>
                      <span className={`text-sm font-medium ${s.is_active ? 'text-ap-text' : 'text-ap-muted line-through'}`}>{s.name}</span>
                    </div>
                    <button onClick={() => deleteSymptom(s.id)} className="text-ap-muted hover:text-ap-red p-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 직접 추가 */}
          <div>
            <p className="ap-label mb-3">직접 추가</p>
            <div className="flex gap-2">
              <input value={custom} onChange={e => setCustom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSymptom(custom)}
                placeholder="증상명 입력"
                className="flex-1 px-4 py-3 border border-ap-border rounded-xl bg-white text-ap-text text-sm focus:outline-none focus:ring-2 focus:ring-ap-teal"/>
              <button onClick={() => addSymptom(custom)}
                className="px-4 py-3 bg-ap-teal text-white rounded-xl text-sm font-semibold">추가</button>
            </div>
          </div>

          {/* 자주 사용하는 증상 */}
          <div>
            <p className="ap-label mb-3">자주 사용하는 증상</p>
            <div className="flex flex-wrap gap-2">
              {PRESET.filter(p => !activeNames.includes(p)).map(name => (
                <button key={name} onClick={() => addSymptom(name)}
                  className="px-3 py-1.5 bg-white border border-ap-border rounded-full text-sm text-ap-text hover:border-ap-teal hover:text-ap-teal transition-colors">
                  + {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
