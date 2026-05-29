import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import QueryProvider from '@/components/layout/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#4CAF96',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: '하루몸 — 나의 건강 일기',
  description: '매일의 컨디션을 기록하고 건강 패턴을 발견하세요',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '하루몸',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <QueryProvider>
          <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
            {children}
          </div>
        </QueryProvider>
        <p className="text-center text-xs text-gray-400 py-2 max-w-md mx-auto">
          이 앱은 의료기기가 아니며, 의학적 진단이나 처방을 제공하지 않습니다.
        </p>
      </body>
    </html>
  )
}
