'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useChartData } from '@/hooks/useChartData'

const DAY_OPTIONS = [7, 14, 30]

const LINE_CONFIG = [
  { key: 'mood_score',   label: '기분 지수',  color: '#1565C0' },
  { key: 'energy_score', label: '에너지',     color: '#00695C' },
  { key: 'pain_score',   label: '통증 수준',  color: '#C62828' },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function ChartsPage() {
  const [days, setDays] = useState(30)
  const [visible, setVisible] = useState<Record<string, boolean>>({
    mood_score: true, energy_score: true, pain_score: true,
  })
  const { data, isLoading } = useChartData(days)
  const chartData = (data ?? []).map(d => ({ ...d, date: formatDate(d.log_date) }))
  function toggle(key: string) { setVisible(prev => ({ ...prev, [key]: !prev[key] })) }

  return (
    <div className="min-h-screen pb-24 bg-ap-surface">
      {/* 헤더 */}
      <div className="bg-ap-navy px-5 pt-10 pb-6">
        <h1 className="text-xl font-bold text-white">트렌드 차트</h1>
        <p className="text-white/60 text-xs mt-1">기간별 건강 지표 변화</p>
      </div>

      <div className="px-5 pt-5">
        {/* 기간 선택 */}
        <div className="flex gap-2 mb-5">
          {DAY_OPTIONS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                days === d ? 'bg-ap-blue text-white border-ap-blue' : 'bg-white text-ap-muted border-ap-border'
              }`}>
              {d}일
            </button>
          ))}
        </div>

        {/* 항목 토글 */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {LINE_CONFIG.map(({ key, label, color }) => (
            <button key={key} onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                visible[key] ? 'text-white border-transparent' : 'bg-white text-ap-muted border-ap-border'
              }`}
              style={visible[key] ? { backgroundColor: color } : {}}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visible[key] ? 'rgba(255,255,255,0.7)' : color }} />
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-ap-muted text-sm">데이터 불러오는 중...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-2xl border border-ap-border">
            <p className="text-ap-text font-semibold text-sm mb-1">아직 기록이 없습니다</p>
            <p className="text-ap-muted text-xs">기록을 쌓으면 차트가 생성됩니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 border border-ap-border">
            <p className="ap-label mb-3">점수 추이 (1–10점)</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} interval="preserveStartEnd" />
                <YAxis domain={[1, 10]} ticks={[1,2,3,4,5,6,7,8,9,10]} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #CBD5E1' }} />
                {LINE_CONFIG.map(({ key, label, color }) =>
                  visible[key] ? (
                    <Line key={key} type="monotone" dataKey={key} name={label}
                      stroke={color} strokeWidth={2} dot={{ r: 3, fill: color }} connectNulls />
                  ) : null
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.some(d => d.sleep_hours != null) && (
          <div className="mt-4 bg-white rounded-2xl p-4 border border-ap-border">
            <p className="ap-label mb-3">수면 시간 (시간)</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #CBD5E1' }} />
                <Line type="monotone" dataKey="sleep_hours" name="수면(h)"
                  stroke="#1565C0" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
