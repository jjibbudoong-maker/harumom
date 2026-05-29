export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="w-20 h-20 bg-apeuni-soft rounded-3xl flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">🐻</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">페이지를 찾을 수 없어요</h1>
      <p className="text-gray-500 mb-8">요청하신 페이지가 존재하지 않습니다.</p>
      <Link
        href="/"
        className="bg-apeuni-mint text-white px-6 py-3 rounded-xl font-semibold"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
