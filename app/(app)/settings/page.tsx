'use client'

export const dynamic = 'force-dynamic'

import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const MENU_ITEMS = [
    {
      label: '프로필 수정', sub: '닉네임·출생연도·질환',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
      href: '/onboarding/profile',
    },
    {
      label: '증상 관리', sub: '추적 중인 증상 목록',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12h6M9 16h6M9 8h6M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
        </svg>
      ),
      href: '/settings/symptoms',
    },
    {
      label: '약물 관리', sub: '복용 중인 약물 목록',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="6" /><path d="M12 6v12M8 10l2 2-2 2M16 10l-2 2 2 2" />
        </svg>
      ),
      href: '/settings/medications',
    },
  ]

  return (
    <div className="min-h-screen pb-24 bg-ap-surface">
      <div className="bg-ap-navy px-5 pt-10 pb-6">
        <h1 className="text-xl font-bold text-white">설정</h1>
        <p className="text-white/60 text-xs mt-1">프로필 및 앱 환경설정</p>
      </div>

      <div className="px-5 py-5 space-y-3">
        {MENU_ITEMS.map(({ label, sub, icon, href }) => (
          <button key={label} onClick={() => router.push(href)}
            className="w-full flex items-center justify-between bg-white rounded-2xl px-5 py-4 border border-ap-border text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-ap-blue-lt rounded-xl flex items-center justify-center text-ap-blue flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-ap-text">{label}</p>
                <p className="text-xs text-ap-muted mt-0.5">{sub}</p>
              </div>
            </div>
            <span className="text-ap-muted text-lg">›</span>
          </button>
        ))}
      </div>

      <div className="px-5 space-y-3">
        <div className="bg-white rounded-2xl px-5 py-4 border border-ap-border">
          <p className="ap-label mb-1">앱 정보</p>
          <p className="text-sm font-medium text-ap-text">하루몸 (Harumom) v0.1.0</p>
          <p className="text-xs text-ap-muted mt-1.5 leading-relaxed">
            이 앱은 의료기기가 아니며, 의학적 진단이나 처방을 제공하지 않습니다.
          </p>
        </div>
      </div>

      <div className="px-5 mt-5">
        <button onClick={handleLogout}
          className="w-full py-3.5 border border-ap-red/30 text-ap-red rounded-2xl font-semibold text-sm bg-ap-red-lt">
          로그아웃
        </button>
      </div>
    </div>
  )
}
