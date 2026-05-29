'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { requestPermission, subscribePush, saveSubscription, unsubscribePush } from '@/lib/push'

const MED_TIME_OPTIONS = [
  { label: '아침', value: '08:00', emoji: '🌅' },
  { label: '점심', value: '12:00', emoji: '☀️' },
  { label: '저녁', value: '19:00', emoji: '🌇' },
  { label: '취침 전', value: '22:00', emoji: '🌙' },
]

/** HH:MM → 오늘 해당 시각까지 남은 ms (지났으면 내일) */
function msUntil(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  const now = new Date()
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target.getTime() - now.getTime()
}

export default function NotificationsPage() {
  const router = useRouter()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [medTimes, setMedTimes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/sw.js').then(async (reg) => {
        if (!reg) return
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(!!sub)
      })
    }
    // 저장된 복약 시간 복원
    const saved = localStorage.getItem('harumom_med_times')
    if (saved) setMedTimes(JSON.parse(saved))
    return () => { timersRef.current.forEach(clearTimeout) }
  }, [])

  /** 브라우저 알림으로 복약 스케줄 등록 */
  function scheduleMedAlerts(times: string[]) {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (Notification.permission !== 'granted') return
    times.forEach((t) => {
      const label = MED_TIME_OPTIONS.find((o) => o.value === t)?.label ?? t
      const delay = msUntil(t)
      const timer = setTimeout(() => {
        new Notification('💊 복약 시간', {
          body: `${label} 약 드실 시간이에요! 하루몸에서 기록해보세요.`,
          icon: '/icons/icon-192x192.png',
          tag: `med-${t}`,
        })
      }, delay)
      timersRef.current.push(timer)
    })
  }

  async function handleToggle() {
    if (subscribed) {
      await unsubscribePush()
      setSubscribed(false)
    } else {
      const perm = await requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return alert('알림 권한이 필요해요. 브라우저 설정에서 허용해주세요.')
      const sub = await subscribePush()
      if (!sub) return alert('알림 구독에 실패했어요. 다시 시도해주세요.')
      setSubscribed(true)
      await saveSubscription(sub, { remind_time: '21:00', med_times: medTimes })
    }
  }

  async function handleSave() {
    setSaving(true)
    localStorage.setItem('harumom_med_times', JSON.stringify(medTimes))

    if (!subscribed) {
      const perm = await requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setSaving(false)
        return alert('알림 권한이 필요해요.')
      }
      const sub = await subscribePush()
      if (sub) {
        setSubscribed(true)
        await saveSubscription(sub, { remind_time: '21:00', med_times: medTimes })
      }
    } else {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) await saveSubscription(sub, { remind_time: '21:00', med_times: medTimes })
      }
    }

    scheduleMedAlerts(medTimes)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleMedTime(val: string) {
    setMedTimes((prev) => prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val])
  }

  return (
    <div className="min-h-screen pb-24 bg-ap-surface">
      <div style={{ background: '#4CAF96' }} className="px-5 pt-10 pb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/80 text-2xl leading-none">‹</button>
        <div>
          <h1 className="text-xl font-bold text-white">알림 설정</h1>
          <p className="text-white/70 text-xs mt-0.5">기록 리마인더 & 복약 알림</p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* 푸시 알림 토글 */}
        <div className="bg-white rounded-2xl p-5 border border-ap-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ap-text">🔔 매일 저녁 기록 알림</p>
              <p className="text-xs text-ap-muted mt-1">
                {subscribed ? '매일 21:00에 기록 리마인더를 보내드려요' : '켜면 매일 21시에 알림을 보내드려요'}
              </p>
            </div>
            <button
              onClick={handleToggle}
              style={{ background: subscribed ? '#4CAF96' : '#CBD5E1' }}
              className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${subscribed ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* 복약 알림 */}
        <div className="bg-white rounded-2xl p-5 border border-ap-border">
          <p className="font-semibold text-ap-text mb-0.5">💊 복약 알림</p>
          <p className="text-xs text-ap-muted mb-3">앱이 열려있는 동안 해당 시간에 알림을 드려요</p>
          <div className="grid grid-cols-2 gap-2">
            {MED_TIME_OPTIONS.map(({ label, value, emoji }) => {
              const selected = medTimes.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleMedTime(value)}
                  style={selected ? { borderColor: '#4CAF96', background: '#F3FAF7' } : {}}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    selected ? 'text-ap-mint-deep' : 'border-ap-border bg-white text-ap-muted'
                  }`}
                >
                  <span>{emoji}</span>
                  <div className="text-left">
                    <div>{label}</div>
                    <div className="text-xs opacity-70">{value}</div>
                  </div>
                  {selected && <span className="ml-auto" style={{ color: '#4CAF96' }}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-ap-mint-wash rounded-2xl px-5 py-4 border" style={{ borderColor: '#A5DDCB' }}>
          <p className="text-xs text-ap-muted leading-relaxed">
            <span className="font-semibold" style={{ color: '#36967E' }}>📱 PWA로 설치하면</span> 앱이 닫혀있어도<br />
            저녁 기록 알림을 받을 수 있어요.<br />
            복약 알림은 앱이 열려있을 때 작동합니다.
          </p>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ backgroundColor: saving ? '#90A4AE' : '#4CAF96' }}
          className="w-full py-4 rounded-2xl text-white font-bold text-base"
        >
          {saving ? '저장 중...' : saved ? '✅ 저장 완료!' : '알림 설정 저장'}
        </button>
      </div>
    </div>
  )
}
