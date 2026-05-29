'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { requestPermission, subscribePush, saveSubscription, unsubscribePush } from '@/lib/push'

const MED_TIME_OPTIONS = [
  { label: '아침', value: '08:00', emoji: '🌅' },
  { label: '점심', value: '12:00', emoji: '☀️' },
  { label: '저녁', value: '19:00', emoji: '🌇' },
  { label: '취침 전', value: '22:00', emoji: '🌙' },
]

export default function NotificationsPage() {
  const router = useRouter()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [remindTime, setRemindTime] = useState('21:00')
  const [medTimes, setMedTimes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
    // 기존 구독 여부 확인
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/sw.js').then(async (reg) => {
        if (!reg) return
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(!!sub)
      })
    }
  }, [])

  async function handleEnable() {
    const perm = await requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return alert('알림 권한이 필요해요. 브라우저 설정에서 허용해주세요.')
    const sub = await subscribePush()
    if (!sub) return alert('알림 구독에 실패했어요. 다시 시도해주세요.')
    setSubscribed(true)
    await saveSubscription(sub, { remind_time: remindTime, med_times: medTimes })
  }

  async function handleDisable() {
    await unsubscribePush()
    setSubscribed(false)
  }

  async function handleSave() {
    setSaving(true)
    if (!subscribed) {
      await handleEnable()
    } else {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) await saveSubscription(sub, { remind_time: remindTime, med_times: medTimes })
      }
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleMedTime(val: string) {
    setMedTimes((prev) => prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val])
  }

  return (
    <div className="min-h-screen pb-24 bg-ap-surface">
      {/* 헤더 */}
      <div className="bg-ap-mint px-5 pt-10 pb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/80 text-2xl leading-none">‹</button>
        <div>
          <h1 className="text-xl font-bold text-white">알림 설정</h1>
          <p className="text-white/70 text-xs mt-0.5">기록 리마인더 & 복약 알림</p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* 알림 상태 카드 */}
        <div className="bg-white rounded-2xl p-5 border border-ap-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-ap-text">🔔 푸시 알림</p>
              <p className="text-xs text-ap-muted mt-1">
                {subscribed ? '알림이 활성화되어 있어요' : '알림을 켜면 기록을 빠뜨리지 않아요'}
              </p>
            </div>
            <button
              onClick={subscribed ? handleDisable : handleEnable}
              className={`relative w-12 h-6 rounded-full transition-colors ${subscribed ? 'bg-ap-mint' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${subscribed ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* 기록 리마인더 시간 */}
        <div className="bg-white rounded-2xl p-5 border border-ap-border">
          <p className="font-semibold text-ap-text mb-1">📋 기록 리마인더</p>
          <p className="text-xs text-ap-muted mb-3">매일 이 시간에 기록 알림을 드려요</p>
          <input
            type="time"
            value={remindTime}
            onChange={(e) => setRemindTime(e.target.value)}
            className="w-full border border-ap-border rounded-xl px-4 py-3 text-ap-text text-sm focus:outline-none focus:ring-2 focus:ring-ap-mint"
          />
        </div>

        {/* 복약 알림 */}
        <div className="bg-white rounded-2xl p-5 border border-ap-border">
          <p className="font-semibold text-ap-text mb-1">💊 복약 알림</p>
          <p className="text-xs text-ap-muted mb-3">약 드실 시간에 알림을 보내드려요 (복수 선택 가능)</p>
          <div className="grid grid-cols-2 gap-2">
            {MED_TIME_OPTIONS.map(({ label, value, emoji }) => {
              const selected = medTimes.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleMedTime(value)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    selected ? 'border-ap-mint bg-ap-mint-wash text-ap-mint-deep' : 'border-ap-border bg-white text-ap-muted'
                  }`}
                >
                  <span>{emoji}</span>
                  <div className="text-left">
                    <div>{label}</div>
                    <div className="text-xs opacity-70">{value}</div>
                  </div>
                  {selected && <span className="ml-auto text-ap-mint">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ backgroundColor: '#4CAF96' }}
          className="w-full py-4 rounded-2xl text-white font-bold text-base"
        >
          {saving ? '저장 중...' : saved ? '✅ 저장됨!' : '알림 설정 저장'}
        </button>

        <p className="text-center text-xs text-ap-muted leading-relaxed">
          알림은 브라우저 권한이 허용된 기기에서만 작동해요.<br />
          PWA로 설치하면 앱처럼 알림을 받을 수 있어요.
        </p>
      </div>
    </div>
  )
}
