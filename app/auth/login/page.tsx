'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'

const C = {
  mint:       '#4CAF96',
  mintDeep:   '#36967E',
  mintPale:   '#E6F4EF',
  mintWash:   '#F3FAF7',
  mintLight:  '#A5DDCB',
  ink:        '#1E2A27',
  inkSoft:    '#55635F',
  inkFaint:   '#8E9A96',
  line:       '#E8EDEB',
  lineStrong: '#D9E1DE',
  surface:    '#FFFFFF',
  bg:         '#F5F8F7',
  bgHero:     '#F1F8F5',
  red:        '#B91C1C',
  redLt:      '#FEF2F2',
}

function Harumon({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="20 55 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hbg" cx="38%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#58BCA4"/>
          <stop offset="100%" stopColor="#36967E"/>
        </radialGradient>
      </defs>
      <ellipse cx="62"  cy="72" rx="22" ry="28" fill="#4CAF96"/>
      <ellipse cx="62"  cy="74" rx="12" ry="17" fill="#36967E"/>
      <ellipse cx="178" cy="72" rx="22" ry="28" fill="#4CAF96"/>
      <ellipse cx="178" cy="74" rx="12" ry="17" fill="#36967E"/>
      <ellipse cx="120" cy="195" rx="82" ry="78" fill="url(#hbg)"/>
      <circle  cx="120" cy="118" r="68" fill="url(#hbg)"/>
      <ellipse cx="98"  cy="110" rx="17" ry="19" fill="white"/>
      <ellipse cx="142" cy="110" rx="17" ry="19" fill="white"/>
      <circle  cx="101" cy="113" r="11" fill="#1E2A27"/>
      <circle  cx="145" cy="113" r="11" fill="#1E2A27"/>
      <circle  cx="97"  cy="108" r="4.5" fill="white" opacity="0.95"/>
      <circle  cx="141" cy="108" r="4.5" fill="white" opacity="0.95"/>
      <ellipse cx="82"  cy="132" rx="15" ry="9" fill="#EF9A9A" opacity="0.3"/>
      <ellipse cx="158" cy="132" rx="15" ry="9" fill="#EF9A9A" opacity="0.3"/>
      <path d="M 105 142 Q 120 156 135 142" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <polyline points="72,208 84,208 90,190 96,226 102,196 108,208 116,208 122,200 128,216 134,208 148,208"
        stroke="rgba(255,255,255,0.7)" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <ellipse cx="44"  cy="188" rx="20" ry="13" fill="#4CAF96" transform="rotate(-30,44,188)"/>
      <circle  cx="32"  cy="200" r="10" fill="#4CAF96"/>
      <ellipse cx="196" cy="188" rx="20" ry="13" fill="#4CAF96" transform="rotate(30,196,188)"/>
      <circle  cx="208" cy="200" r="10" fill="#4CAF96"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const supabase = createBrowserSupabaseClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('이메일 또는 비밀번호가 올바르지 않습니다.'); setLoading(false); return }
    router.push('/dashboard'); router.refresh()
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', height: 54, padding: '0 16px',
    background: C.surface, borderRadius: 16,
    border: `1.5px solid ${C.lineStrong}`,
    fontSize: 16, color: C.ink, fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  }

  const canSubmit = email.length > 0 && password.length > 0

  return (
    <div style={{
      minHeight: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(180deg, ${C.bgHero} 0%, ${C.bg} 35%)`,
      padding: '60px 24px 32px',
    }}>
      {/* 히어로 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', paddingBottom: 24 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 24,
          background: 'linear-gradient(145deg, #58BCA4 0%, #4CAF96 48%, #36967E 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 28px rgba(54,150,126,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
          marginBottom: 18,
        }}>
          <Harumon size={64} />
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: -0.6, color: C.ink }}>하루몸</h1>
        <p style={{ margin: '10px 0 0', fontSize: 15, fontWeight: 500, color: C.inkSoft, lineHeight: 1.6, maxWidth: 240 }}>
          매일의 컨디션을 기록하고<br/>나만의 건강 패턴을 발견하세요
      </p>
      </div>

      {/* 이메일 로그인 폼 */}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="이메일 주소" autoComplete="email" required style={fieldStyle} />
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="비밀번호" autoComplete="current-password" required style={fieldStyle} />

        {error && (
          <div style={{ background: C.redLt, border: '1px solid #FECACA', borderRadius: 12, padding: '10px 14px' }}>
            <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading || !canSubmit} style={{
          width: '100%', height: 54, borderRadius: 16, cursor: loading || !canSubmit ? 'default' : 'pointer',
          fontSize: 16, fontWeight: 700, fontFamily: 'inherit', border: 'none',
          background: loading || !canSubmit ? C.lineStrong : C.mint,
          color: loading || !canSubmit ? C.inkFaint : 'white',
          boxShadow: canSubmit && !loading ? '0 6px 16px rgba(54,150,126,0.28)' : 'none',
          transition: 'all .15s',
          marginTop: 4,
        }}>
          {loading ? '로그인 중...' : '로그인하기'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14.5, color: C.inkSoft }}>
        계정이 없으신가요?{' '}
        <Link href="/auth/signup" style={{ color: C.mintDeep, fontWeight: 700 }}>회원가입</Link>
      </div>
    </div>
  )
}
