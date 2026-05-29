import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (Asia/Seoul 기준)
export function getTodayKST(): string {
  return new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '-').replace('.', '')
}

// 날짜를 한국어 형식으로 표시
export function formatDateKo(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00+09:00')
  return date.toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

// 점수에 따른 이모지 반환
export function scoreToEmoji(score: number, type: 'mood' | 'energy' | 'pain'): string {
  if (type === 'pain') {
    if (score <= 2) return '😊'
    if (score <= 4) return '😐'
    if (score <= 6) return '😣'
    if (score <= 8) return '😖'
    return '😭'
  }
  if (score <= 2) return '😞'
  if (score <= 4) return '😐'
  if (score <= 6) return '🙂'
  if (score <= 8) return '😊'
  return '😄'
}
