'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const supabase = createBrowserSupabaseClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return }
    setLoading(true)
    setError(null)
    const { data, error: signupError } = await supabase.auth.signUp({
      email, password, options: { data: { nickname } },
    })
    if (signupError) { setError(signupError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, nickname, onboarding_done: false })
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="flex flex-col min-h-screen bg-ap-surface">
        <div className="bg-green-700 px-6 pt-16 pb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ap-mint rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">하루몸</h1>
              <p className="text-xs text-blue-200 mt-0.5">매일의 컨디션을 기록하세요</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 bg-ap-mint-lt rounded-2xl flex items-center justify-center mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00695C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ap-text mb-2">이메일을 확인해주세요</h2>
          <p className="text-ap-muted text-sm leading-relaxed mb-8">{email}으로<br />인증 메일을 발송했습니다.</p>
          <button onClick={() => router.push('/auth/login')}
            className="bg-ap-mint text-white px-8 py-3 rounded-xl font-semibold text-sm">
            로그인하러 가기
          </button>
        </div>
      </div>
    )
  }

  const inputCls = 'w-full px-4 py-3 border border-ap-border rounded-xl bg-white text-ap-text focus:outline-none focus:ring-2 focus:ring-ap-mint text-sm'

  return (
    <div className="flex flex-col min-h-screen bg-ap-surface">
      <div className="bg-green-700 px-6 pt-16 pb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-ap-mint rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">하루몸 시작하기</h1>
            <p className="text-xs text-blue-200 mt-0.5">매일의 컨디션을 기록하세요</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8">
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="ap-label block mb-1.5">닉네임</label>
            <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
              required maxLength={20} placeholder="예: 건강한홍길동" className={inputCls} />
          </div>
          <div>
            <label className="ap-label block mb-1.5">이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="example@email.com" className={inputCls} />
          </div>
          <div>
            <label className="ap-label block mb-1.5">비밀번호 (8자 이상)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={8} placeholder="••••••••" className={inputCls} />
          </div>

          {error && (
            <div className="bg-ap-red-lt border border-red-200 rounded-lg px-4 py-2.5">
              <p className="text-ap-red text-sm">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-ap-mint text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 mt-2 text-sm">
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="mt-8 text-sm text-ap-muted text-center">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-ap-mint-deep font-semibold">로그인</Link>
        </p>
      </div>
    </div>
  )
}
