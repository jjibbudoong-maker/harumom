'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { requestPermission, subscribePush, saveSubscription, unsubscribePush } from '@/lib/push'

const MED_TIME_OPTIONS = [
  { label: '아침', value: '08:00', emoji: '🌅' },
  { label: '점심', value: '13:00', emoji: '☀️' },
  { label: '저녁', value: '19:00', emoji: '🌇' },
  { label: '취침 전', value: '22:00', emoji: '🌙' },
]

function msUntil(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  const now = new Date()
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return target.getTime() - now.getTime()
}

/** 브라우저/OS 감지 */
function getDeviceGuide(): { title: string; steps: string[] } {
  const ua = navigator.userAgent
  const isIOS = /iPhone|iPad|iPod/.test(ua)
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
  const isAndroid = /Android/.test(ua)

  if (isIOS || isSafari) {
    return {
      title: 'iPhone / Safari 알림 허용 방법',
      steps: [
        '홈 화면에서 "설정" 앱 열기',
        '"앱" 또는 "Safari" 탭',
        '"알림" → 하루몸(또는 Safari) 선택',
        '"알림 허용" 켜기',
        '앱으로 돌아와서 다시 시도',
      ],
    }
  }
  if (isAndroid) {
    return {
      title: 'Android Chrome 알림 허용 방법',
      steps: [
        '주소창 왼쪽 🔒 아이콘 탭',
        '"권한" 또는 "사이트 설정" 탭',
        '"알림" → "허용"으로 변경',
        '페이지 새로고침 후 다시 시도',
      ],
    }
  }
  return {
    title: 'PC Chrome 알림 허용 방법',
    steps: [
      '주소창 왼쪽 🔒 아이콘 클릭',
      '"이 사이트의 권한" → 알림 "허용"으로 변경',
      '또는 Chrome 설정 → 개인정보 및 보안 → 사이트 설정 → 알림에서 허용',
      '페이지 새로고침 후 다시 시도',
    ],
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [medTimes, setMedTimes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = Notification.permission
      setPermission(perm)
      if (perm === 'denied') setShowGuide(true)
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/').then(async (reg) => {
        if (!reg) return
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(!!sub)
      })
    }
    const saved = localStorage.getItem('harumom_med_times')
    if (saved) setMedTimes(JSON.parse(saved))
    return () => { timersRef.current.forEach(clearTimeout) }
  }, [])

  function scheduleMedAlerts(times: string[]) {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (Notification.permission !== 'granted') return
    times.forEach((t) => {
      const label = MED_TIME_OPTIONS.find((o) => o.value === t)?.label ?? t
      const delay = msUntil(t)
      const timer = setTimeout(() => {
        new Notification('💊 복약 시간', {
          body: `${label} 약 드실 시간이에요!`,
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
      await handleSave()
    }
  }

  async function handleSave() {
    setSaving(true)
    localStorage.setItem('harumom_med_times', JSON.stringify(medTimes))

    // 실제 SW 구독 확인
    let sub: PushSubscription | null = null
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('/')
      if (reg) sub = await reg.pushManager.getSubscription()
    }

    if (!sub) {
      const perm = await requestPermission()
      setPermission(perm)
      if (perm === 'denied') {
        setShowGuide(true)
        setSaving(false)
        return
      }
      if (perm !== 'granted') { setSaving(false); return }
      sub = await subscribePush()
      if (sub) setSubscribed(true)
    }

    if (sub) {
      await saveSubscription(sub, { remind_time: '21:00', med_times: medTimes })
      scheduleMedAlerts(medTimes)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleMedTime(val: string) {
    setMedTimes(prev => prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val])
  }

  const guide = typeof window !== 'undefined' && 'Notification' in window ? getDeviceGuide() : null

  return (
    <div className="min-h-screen pb-24 bg-ap-surface">
      {/* 헤더 */}
      <div style={{ background: '#4CAF96' }} className="px-5 pt-10 pb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/80 text-2xl leading-none">‹</button>
        <div>
          <h1 className="text-xl font-bold text-white">알림 설정</h1>
          <p className="text-white/70 text-xs mt-0.5">기록 리마인더 & 복약 알림</p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4">

        {/* ── 권한 차단 안내 ── */}
        {showGuide && guide && (
          <div className="bg-white rounded-2xl p-5 border-2 border-ap-amber">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">🚫</span>
              <div>
                <p className="font-bold text-ap-text text-sm">알림 권한이 차단되어 있어요</p>
                <p className="text-xs text-ap-muted mt-0.5">아래 방법으로 직접 허용해주세요</p>
              </div>
            </div>
            <p className="text-xs font-bold text-ap-amber mb-2">{guide.title}</p>
            <ol className="space-y-1.5">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-ap-text">
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: '#E65100' }}>{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <button onClick={() => window.location.reload()}
              style={{ background: '#E65100' }}
              className="mt-4 w-full py-3 rounded-xl text-white text-sm font-bold">
              설정 완료 후 새로고침
            </button>
          </div>
        )}

        {/* 푸시 알림 토글 */}
        {!showGuide && (
          <div className="bg-white rounded-2xl p-5 border border-ap-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ap-text">🔔 매일 저녁 기록 알림</p>
                <p className="text-xs text-ap-muted mt-1">
                  {subscribed ? '매일 21:00에 기록 리마인더를 보내드려요' : '켜면 매일 21시에 알림을 보내드려요'}
                </p>
              </div>
              <button onClick={handleToggle}
                style={{ background: subscribed ? '#4CAF96' : '#CBD5E1' }}
                className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0">
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${subscribed ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {/* 복약 알림 */}
        <div className="bg-white rounded-2xl p-5 border border-ap-border">
          <p className="font-semibold text-ap-text mb-0.5">💊 복약 알림</p>
          <p className="text-xs text-ap-muted mb-3">선택한 시간에 앱 꺼져도 알림을 드려요</p>
          <div className="grid grid-cols-2 gap-2">
            {MED_TIME_OPTIONS.map(({ label, value, emoji }) => {
              const selected = medTimes.includes(value)
              return (
                <button key={value} onClick={() => toggleMedTime(value)}
                  style={selected ? { borderColor: '#4CAF96', background: '#F3FAF7' } : {}}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    selected ? 'text-ap-mint-deep' : 'border-ap-border bg-white text-ap-muted'
                  }`}>
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

        {/* 저장 버튼 */}
        {!showGuide && (
          <button onClick={handleSave} disabled={saving}
            style={{ backgroundColor: saving ? '#90A4AE' : '#4CAF96' }}
            className="w-full py-4 rounded-2xl text-white font-bold text-base">
            {saving ? '저장 중...' : saved ? '✅ 저장 완료!' : '알림 설정 저장'}
          </button>
        )}

        <p className="text-center text-xs text-ap-muted">
          알림은 브라우저 권한이 허용된 기기에서 작동해요.
        </p>
      </div>
    </div>
  )
}
