'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const FREQ_OPTIONS = [
  { label: '매일 1회', value: '매일', suggestTimes: ['08:00'] },
  { label: '아침·저녁 2회', value: '아침저녁', suggestTimes: ['08:00', '19:00'] },
  { label: '하루 3회', value: '하루3회', suggestTimes: ['08:00', '13:00', '19:00'] },
  { label: '취침 전', value: '취침전', suggestTimes: ['22:00'] },
  { label: '필요시', value: '필요시', suggestTimes: [] },
]

const ALARM_TIMES = [
  { label: '아침', value: '08:00', emoji: '🌅' },
  { label: '점심', value: '13:00', emoji: '☀️' },
  { label: '저녁', value: '19:00', emoji: '🌇' },
  { label: '취침 전', value: '22:00', emoji: '🌙' },
]

type Medication = { id: string; name: string; dosage: string | null; frequency: string; is_active: boolean }

export default function MedicationsSettingsPage() {
  const router   = useRouter()
  const supabase = createBrowserSupabaseClient()
  const [meds,    setMeds]    = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [adding,  setAdding]  = useState(false)
  const [form,    setForm]    = useState({ name: '', dosage: '', frequency: '매일' })
  const [alarmTimes, setAlarmTimes] = useState<string[]>(['08:00'])

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('medications').select('*').eq('user_id', user.id).order('created_at')
      setMeds(data ?? [])
      setLoading(false)
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function selectFreq(value: string) {
    const opt = FREQ_OPTIONS.find(f => f.value === value)
    setForm(f => ({ ...f, frequency: value }))
    if (opt) setAlarmTimes(opt.suggestTimes)
  }

  function toggleAlarm(time: string) {
    setAlarmTimes(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    )
  }

  async function toggle(id: string, active: boolean) {
    await supabase.from('medications').update({ is_active: !active }).eq('id', id)
    setMeds(prev => prev.map(m => m.id === id ? { ...m, is_active: !active } : m))
  }

  async function deleteMed(id: string) {
    await supabase.from('medications').delete().eq('id', id)
    setMeds(prev => prev.filter(m => m.id !== id))
  }

  async function addMed() {
    if (!form.name.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('medications').insert({
      user_id: user.id, name: form.name.trim(),
      dosage: form.dosage.trim() || null, frequency: form.frequency, is_active: true,
    }).select().single()

    if (data) {
      setMeds(prev => [...prev, data])
      // 알림 시간 push_subscriptions에 병합 저장
      if (alarmTimes.length > 0) {
        const { data: sub } = await supabase
          .from('push_subscriptions').select('med_times, endpoint, p256dh, auth_key')
          .eq('user_id', user.id).single()
        if (sub?.endpoint) {
          const merged = Array.from(new Set([...(sub.med_times ?? []), ...alarmTimes]))
          await supabase.from('push_subscriptions')
            .update({ med_times: merged }).eq('user_id', user.id)
        }
      }
      setForm({ name: '', dosage: '', frequency: '매일' })
      setAlarmTimes(['08:00'])
      setAdding(false)
    }
  }

  const freqLabel = (val: string) => FREQ_OPTIONS.find(f => f.value === val)?.label ?? val

  return (
    <div className="min-h-screen pb-24 bg-ap-surface">
      <div className="bg-ap-navy px-5 pt-10 pb-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-white/70 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">약물 관리</h1>
          <p className="text-white/60 text-xs mt-0.5">복용 중인 약물을 설정하세요</p>
        </div>
        <button onClick={() => setAdding(true)} className="ml-auto text-white/70 hover:text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center pt-20 text-ap-muted">불러오는 중...</div>
      ) : (
        <div className="px-5 pt-5 space-y-3">

          {/* 약물 추가 폼 */}
          {adding && (
            <div className="bg-white rounded-2xl p-4 border border-ap-teal space-y-4">
              <p className="text-sm font-bold text-ap-text">💊 약물 추가</p>

              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="약물 이름 (예: 타이레놀)"
                className="w-full px-4 py-3 border border-ap-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ap-teal"/>

              <input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))}
                placeholder="용량 (예: 500mg, 선택사항)"
                className="w-full px-4 py-3 border border-ap-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ap-teal"/>

              {/* 복용 빈도 */}
              <div>
                <p className="text-xs font-semibold text-ap-muted mb-2">복용 빈도</p>
                <div className="flex flex-wrap gap-2">
                  {FREQ_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => selectFreq(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        form.frequency === opt.value
                          ? 'bg-ap-teal text-white border-ap-teal'
                          : 'bg-white text-ap-muted border-ap-border'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 복약 알림 시간 */}
              {form.frequency !== '필요시' && (
                <div>
                  <p className="text-xs font-semibold text-ap-muted mb-2">🔔 복약 알림 시간 (중복 선택 가능)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALARM_TIMES.map(({ label, value, emoji }) => (
                      <button key={value} onClick={() => toggleAlarm(value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          alarmTimes.includes(value)
                            ? 'border-ap-teal bg-ap-teal-lt text-ap-teal'
                            : 'border-ap-border bg-white text-ap-muted'
                        }`}>
                        <span>{emoji}</span>
                        <span>{label}</span>
                        <span className="text-ap-muted/70 ml-auto">{value}</span>
                        {alarmTimes.includes(value) && <span className="text-ap-teal">✓</span>}
                      </button>
                    ))}
                  </div>
                  {alarmTimes.length === 0 && (
                    <p className="text-xs text-ap-muted mt-1.5">알림 없음 — 선택하지 않으면 알림을 보내지 않아요</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setAdding(false); setAlarmTimes(['08:00']) }}
                  className="flex-1 py-3 border border-ap-border rounded-xl text-sm text-ap-muted font-semibold">취소</button>
                <button onClick={addMed} disabled={!form.name.trim()}
                  className="flex-1 py-3 bg-ap-teal text-white rounded-xl text-sm font-semibold disabled:opacity-40">저장</button>
              </div>
            </div>
          )}

          {/* 약물 목록 */}
          {meds.length === 0 && !adding ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">💊</div>
              <p className="text-ap-muted text-sm">등록된 약물이 없습니다</p>
              <button onClick={() => setAdding(true)}
                className="mt-4 px-6 py-2.5 bg-ap-teal text-white rounded-xl text-sm font-semibold">
                + 약물 추가하기
              </button>
            </div>
          ) : meds.map(m => (
            <div key={m.id} className="bg-white rounded-2xl px-4 py-3.5 border border-ap-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(m.id, m.is_active)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    m.is_active ? 'bg-ap-teal border-ap-teal' : 'border-ap-border'
                  }`}>
                  {m.is_active && <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                </button>
                <div>
                  <p className={`text-sm font-semibold ${m.is_active ? 'text-ap-text' : 'text-ap-muted line-through'}`}>
                    {m.name}{m.dosage && <span className="font-normal text-ap-muted"> · {m.dosage}</span>}
                  </p>
                  <p className="text-xs text-ap-muted mt-0.5">{freqLabel(m.frequency)} 복용</p>
                </div>
              </div>
              <button onClick={() => deleteMed(m.id)} className="text-ap-muted hover:text-ap-red p-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
