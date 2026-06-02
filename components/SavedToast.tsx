'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export default function SavedToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('saved') === '1') {
      setShow(true)
      // URL에서 ?saved=1 제거
      router.replace(pathname, { scroll: false })
      const t = setTimeout(() => setShow(false), 3000)
      return () => clearTimeout(t)
    }
  }, [searchParams, router, pathname])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
      background: '#4CAF96', color: 'white', borderRadius: 16,
      padding: '12px 24px', fontWeight: 700, fontSize: 14,
      boxShadow: '0 8px 24px rgba(76,175,150,0.4)',
      zIndex: 100, whiteSpace: 'nowrap',
      animation: 'slideUp 0.3s ease',
    }}>
      ✅ 오늘 기록이 저장됐어요!
    </div>
  )
}
