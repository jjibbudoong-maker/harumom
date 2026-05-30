'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const C = {
  mint:      '#4CAF96',
  mintDeep:  '#36967E',
  mintPale:  '#E6F4EF',
  ink:       '#1E2A27',
  inkSoft:   '#55635F',
  inkFaint:  '#8E9A96',
  line:      '#E8EDEB',
  lineStrong:'#D9E1DE',
  surface:   '#FFFFFF',
  bg:        '#F5F8F7',
  red:       '#B91C1C',
  redLt:     '#FEF2F2',
}

export default function SignupPage() {
  const router   = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState(false)
  const supabase = createBrowserSupabaseClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) { setError('닉네임을 입력해주세요.'); return }
    if (!email.includes('@')) { setError('올바른 이메일을 입력해주세요.'); return }
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return }
    setLoading(true); setError(null)
    const { data, error: err } = await supabase.auth.signUp({
      email, password, options: { data: { nickname } },
    })
    if (err) { setError(err.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, nickname, onboarding_done: false })
      setDone(true)
    }
    setLoading(false)
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px',
    border: `1.5px solid ${C.lineStrong}`, borderRadius: 14,
    background: C.surface, color: C.ink,
    fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: C.mintDeep, padding: '64px 24px 32px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: 0 }}>하루몸</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>매일의 컨디션을 기록하세요</p>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: C.mintPale, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.mintDeep} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: C.ink, margin: '0 0 8px' }}>회원가입 완료!</h2>
          <p style={{ fontSize: 14, color: C.inkSoft, lineHeight: 1.6, margin: '0 0 32px' }}>
            {nickname}님, 환영합니다!<br/>지금 바로 로그인해보세요.
          </p>
          <button onClick={() => router.push('/auth/login')} style={{
            background: C.mint, color: 'white', border: 'none', borderRadius: 14,
            padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 6px 16px rgba(54,150,126,0.28)',
          }}>
            로그인하러 가기
          </button>
        </div>
      </div>
    )
  }

  const canSubmit = nickname.trim() && email.includes('@') && password.length >= 8

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>
      {/* 헤더 */}
      <div style={{ background: C.mintDeep, padding: '64px 24px 32px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: 0 }}>하루몸 시작하기</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>매일의 컨디션을 기록하세요</p>
      </div>

      {/* 폼 */}
      <div style={{ flex: 1, padding: '32px 24px' }}>
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 7 }}>닉네임</label>
            <input type="text" value={nickname}
              onChange={e => setNickname(e.target.value)}
              onInput={e => setNickname((e.target as HTMLInputElement).value)}
              maxLength={20} placeholder="예: 건강한홍길동" style={fieldStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 7 }}>이메일</label>
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              onInput={e => setEmail((e.target as HTMLInputElement).value)}
              placeholder="example@email.com" autoComplete="email" style={fieldStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.inkFaint, marginBottom: 7 }}>비밀번호 (8자 이상)</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onInput={e => setPassword((e.target as HTMLInputElement).value)}
              placeholder="••••••••" autoComplete="new-password" style={fieldStyle} />
          </div>

          {error && (
            <div style={{ background: C.redLt, border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px' }}>
              <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '15px 0', borderRadius: 16,
            background: loading ? C.lineStrong : C.mint,
            color: loading ? C.inkFaint : 'white',
            border: 'none', fontSize: 16, fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'inherit', marginTop: 4,
            boxShadow: loading ? 'none' : '0 6px 16px rgba(54,150,126,0.28)',
            transition: 'all .15s',
          }}>
            {loading ? '가입 중...' : '회원가입하기'}
          </button>
        </form>

        <p style={{ marginTop: 28, fontSize: 14, color: C.inkSoft, textAlign: 'center' }}>
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" style={{ color: C.mintDeep, fontWeight: 700 }}>로그인</Link>
        </p>
      </div>
    </div>
  )
}
