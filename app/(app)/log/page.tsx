'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { getTodayKST } from '@/lib/utils'

interface Symptom   { id: string; name: string }
interface Medication { id: string; name: string }

// ────────────── 색상 ──────────────
const C = {
  navy: '#0D2B45', blue: '#1565C0', teal: '#00695C', red: '#C62828',
  blueLt: '#E3F2FD', tealLt: '#E0F2F1', redLt: '#FFEBEE',
  surface: '#F5F7FA', border: '#CBD5E1', muted: '#64748B', text: '#1A202C',
}

// ────────────── 점수 설정 ──────────────
const SCORE_CFG = {
  mood: {
    title: '기분 지수',
    hint: '오늘 기분이 어떠세요?',
    direction: '낮을수록 우울 — 높을수록 좋음',
    emojis:  ['😞','😔','😐','🙂','😊'],
    labels:  ['매우 우울','우울함','보통','기분 좋음','매우 좋음'],
    color: C.blue, bgColor: C.blueLt,
  },
  energy: {
    title: '에너지 수준',
    hint: '몸에 활력이 느껴지나요?',
    direction: '낮을수록 피로 — 높을수록 활력',
    emojis:  ['😴','😪','😐','⚡','💪'],
    labels:  ['기진맥진','피로함','보통','활력 있음','최상의 활력'],
    color: C.teal, bgColor: C.tealLt,
  },
  pain: {
    title: '통증 강도',
    hint: '현재 느껴지는 통증은?',
    direction: '낮을수록 통증 없음 — 높을수록 심함',
    emojis:  ['✅','🟡','🟠','🔴','🚨'],
    labels:  ['통증 없음','가벼운 통증','중등도 통증','심한 통증','극심한 통증'],
    color: C.red, bgColor: C.redLt,
  },
}

// ────────────── 수면 퀵셀렉트 ──────────────
const SLEEP_PRESETS = [4, 5, 6, 7, 8, 9, 10]

// ────────────── 수분 (잔 단위) ──────────────
const WATER_CUPS = [
  { label: '0잔', ml: 0 },
  { label: '2잔', ml: 400 },
  { label: '4잔', ml: 800 },
  { label: '6잔', ml: 1200 },
  { label: '8잔+', ml: 1600 },
]

// ────────────── 신체 활동 레벨 ──────────────
const EXERCISE_LEVELS = [
  { label: '없음',     min: 0,  emoji: '🛋️', hint: '오늘은 쉬는 날' },
  { label: '가벼운',   min: 20, emoji: '🚶', hint: '걷기·스트레칭' },
  { label: '보통',     min: 45, emoji: '🏃', hint: '30~60분 걷기' },
  { label: '격한 운동', min: 90, emoji: '🏋️', hint: '달리기·수영 등' },
]

// ────────────── ScoreSlider 컴포넌트 ──────────────
function ScoreSlider({
  type, value, onChange,
}: {
  type: 'mood' | 'energy' | 'pain'; value: number; onChange: (v: number) => void
}) {
  const cfg = SCORE_CFG[type]
  const idx = value - 1

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
      {/* 타이틀 */}
      <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: '0 0 2px' }}>{cfg.title}</p>
      <p style={{ fontSize: 11, color: C.muted, margin: '0 0 12px' }}>{cfg.hint}</p>

      {/* 이모지 5버튼 (주요 입력) */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {cfg.emojis.map((emoji, i) => (
          <button key={i} onClick={() => onChange(i + 1)} style={{
            flex: 1, aspectRatio: '1', borderRadius: 12, fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: i === idx ? `2px solid ${cfg.color}` : `1px solid ${C.border}`,
            background: i === idx ? cfg.bgColor : 'white',
            transform: i === idx ? 'scale(1.12)' : 'scale(1)',
            opacity: i === idx ? 1 : 0.45,
            transition: 'all 0.15s',
            cursor: 'pointer',
          }}>
            {emoji}
          </button>
        ))}
      </div>

      {/* 끝 레이블 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: C.muted }}>{cfg.emojis[0]} {cfg.labels[0]}</span>
        <span style={{ fontSize: 10, color: C.muted }}>{cfg.emojis[4]} {cfg.labels[4]}</span>
      </div>

      {/* 슬라이더 (세밀 조정) */}
      <input type="range" min={1} max={5} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: cfg.color }} />

      {/* 현재 상태 */}
      <div style={{ marginTop: 8, padding: '6px 12px', borderRadius: 8, background: cfg.bgColor, textAlign: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>
          {value}점 · {cfg.labels[idx]}
        </span>
      </div>
    </div>
  )
}

// ────────────── 수면 시간 ──────────────
function SleepPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = parseFloat(value)
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
      <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: '0 0 4px' }}>수면 시간</p>
      <p style={{ fontSize: 11, color: C.muted, margin: '0 0 12px' }}>어젯밤 몇 시간 주무셨나요?</p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {SLEEP_PRESETS.map(h => (
          <button key={h} onClick={() => onChange(String(h))} style={{
            padding: '6px 0', minWidth: 40, borderRadius: 10, fontSize: 13, fontWeight: 600,
            border: parsed === h ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
            background: parsed === h ? C.blueLt : 'white',
            color: parsed === h ? C.blue : C.muted,
            cursor: 'pointer', flex: '0 0 auto',
          }}>
            {h}h
          </button>
        ))}
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
          placeholder="직접" min={0} max={24} step={0.5}
          style={{
            width: 56, padding: '6px 8px', border: `1px solid ${C.border}`,
            borderRadius: 10, fontSize: 13, textAlign: 'center', color: C.text,
            outline: 'none', background: 'white',
          }} />
      </div>
      {value && <p style={{ fontSize: 11, color: C.muted, textAlign: 'right' }}>수면 {value} 시간</p>}
    </div>
  )
}

// ────────────── 수분 섭취 ──────────────
function WaterPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const mlVal = parseInt(value) || 0
  const matched = WATER_CUPS.find(p => p.ml === mlVal)
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: '0 0 2px' }}>수분 섭취</p>
          <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>오늘 물을 얼마나 마셨나요?</p>
        </div>
        <span style={{ fontSize: 11, color: C.muted, background: C.surface, padding: '3px 8px', borderRadius: 6 }}>
          1잔 ≈ 200ml
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {WATER_CUPS.map(p => (
          <button key={p.ml} onClick={() => onChange(String(p.ml))} style={{
            flex: 1, padding: '10px 4px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            border: mlVal === p.ml ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
            background: mlVal === p.ml ? C.tealLt : 'white',
            color: mlVal === p.ml ? C.teal : C.muted,
            cursor: 'pointer',
          }}>
            {p.label}
          </button>
        ))}
      </div>
      {matched && (
        <p style={{ fontSize: 11, color: C.teal, marginTop: 8, textAlign: 'center', fontWeight: 600 }}>
          약 {mlVal >= 1000 ? `${(mlVal/1000).toFixed(1)}L` : `${mlVal}ml`} 섭취
        </p>
      )}
    </div>
  )
}

// ────────────── 신체 활동 ──────────────
function ExercisePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const minVal = parseInt(value) || 0
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
      <p style={{ fontWeight: 700, fontSize: 14, color: C.text, margin: '0 0 2px' }}>신체 활동</p>
      <p style={{ fontSize: 11, color: C.muted, margin: '0 0 12px' }}>
        걷기·스트레칭·달리기 등 신체를 움직인 활동을 선택하세요
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {EXERCISE_LEVELS.map(l => (
          <button key={l.min} onClick={() => onChange(String(l.min))} style={{
            padding: '12px 8px', borderRadius: 12, textAlign: 'center',
            border: minVal === l.min ? `2px solid ${C.blue}` : `1px solid ${C.border}`,
            background: minVal === l.min ? C.blueLt : 'white',
            cursor: 'pointer',
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{l.emoji}</div>
            <p style={{ fontSize: 12, fontWeight: 700, color: minVal === l.min ? C.blue : C.text, margin: '0 0 2px' }}>
              {l.label}
            </p>
            <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{l.hint}</p>
          </button>
        ))}
      </div>
    </div>
  )
}


// ────────────── LogPage (메인) ──────────────
export default function LogPage() {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()
  const today = getTodayKST()

  const [mood,   setMood]   = useState(3)
  const [energy, setEnergy] = useState(3)
  const [pain,   setPain]   = useState(1)
  const [sleep,  setSleep]  = useState('7')
  const [water,  setWater]  = useState('800')
  const [exercise, setExercise] = useState('0')
  const [memo,   setMemo]   = useState('')
  const [takenMeds,      setTakenMeds]      = useState<string[]>([])
  const [activeSymptoms, setActiveSymptoms] = useState<string[]>([])
  const [symptoms,    setSymptoms]    = useState<Symptom[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [existing, setExisting] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }

      const [symRes, medRes, logRes] = await Promise.all([
        supabase.from('symptoms').select('id, name').eq('user_id', user.id),
        supabase.from('medications').select('id, name').eq('user_id', user.id),
        supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).maybeSingle(),
      ])
      if (symRes.data) setSymptoms(symRes.data)
      if (medRes.data) setMedications(medRes.data)
      if (logRes.data) {
        const l = logRes.data
        setExisting(l.id)
        setMood(l.mood_score ?? 3)
        setEnergy(l.energy_score ?? 3)
        setPain(l.pain_score ?? 1)
        setSleep(String(l.sleep_hours ?? 7))
        setWater(String(l.water_ml ?? 800))
        setExercise(String(l.exercise_min ?? 0))
        setMemo(l.memo ?? '')
        setTakenMeds(l.taken_medications ?? [])
        setActiveSymptoms(l.symptom_ids ?? [])
      }
      setLoading(false)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleItem = (id: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id])

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const payload = {
      user_id: user.id, log_date: today,
      mood_score: mood, energy_score: energy, pain_score: pain,
      sleep_hours: parseFloat(sleep) || null,
      water_ml: parseInt(water) || 0,
      exercise_min: parseInt(exercise) || 0,
      memo: memo.trim() || null,
      taken_medications: takenMeds,
      symptom_ids: activeSymptoms,
    }
    if (existing) {
      await supabase.from('daily_logs').update(payload).eq('id', existing)
    } else {
      const { data } = await supabase.from('daily_logs').insert(payload).select('id').single()
      if (data) setExisting(data.id)
    }
    setSaving(false)
    router.push('/?saved=1')
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', background: C.surface }}>
      <p style={{ color: C.muted }}>불러오는 중...</p>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background: C.surface, paddingBottom: 100 }}>

      {/* ── 헤더 ── */}
      <div style={{ background: C.navy, padding:'56px 20px 24px',
        position:'sticky', top:0, zIndex:10 }}>
        <button onClick={() => router.back()} style={{
          background:'none', border:'none', color:'rgba(255,255,255,0.65)',
          fontSize:13, cursor:'pointer', marginBottom:8, padding:0 }}>
          ← 뒤로
        </button>
        <h1 style={{ color:'white', fontSize:22, fontWeight:800, margin:'0 0 4px' }}>
          오늘의 기록
        </h1>
        <p style={{ color:'rgba(255,255,255,0.55)', fontSize:12, margin:0 }}>{today}</p>
      </div>

      <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', gap:12 }}>

        {/* ── 점수 3종 ── */}
        <ScoreSlider type="mood"   value={mood}   onChange={setMood} />
        <ScoreSlider type="energy" value={energy} onChange={setEnergy} />
        <ScoreSlider type="pain"   value={pain}   onChange={setPain} />

        {/* ── 수면·수분·운동 ── */}
        <SleepPicker    value={sleep}    onChange={setSleep} />
        <WaterPicker    value={water}    onChange={setWater} />
        <ExercisePicker value={exercise} onChange={setExercise} />

        {/* ── 복약 확인 ── */}
        <div style={{ background:'white', borderRadius:16, padding:16, border:`1px solid ${C.border}` }}>
          <p style={{ fontWeight:700, fontSize:14, color:C.text, margin:'0 0 2px' }}>💊 복약 확인</p>
          <p style={{ fontSize:11, color:C.muted, margin:'0 0 12px' }}>오늘 복용한 약을 선택하세요</p>
          {medications.length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {medications.map(m => (
                <button key={m.id}
                  onClick={() => toggleItem(m.id, takenMeds, setTakenMeds)}
                  style={{
                    display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                    borderRadius:10, textAlign:'left', cursor:'pointer',
                    border: takenMeds.includes(m.id) ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                    background: takenMeds.includes(m.id) ? C.tealLt : 'white',
                  }}>
                  <span style={{ fontSize:18 }}>{takenMeds.includes(m.id) ? '✅' : '⬜'}</span>
                  <span style={{ fontSize:13, fontWeight:600,
                    color: takenMeds.includes(m.id) ? C.teal : C.text }}>{m.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <p style={{ fontSize:12, color:C.muted, marginBottom:10 }}>등록된 약물이 없어요</p>
              <button onClick={() => router.push('/settings/medications')}
                style={{ fontSize:12, fontWeight:700, color:C.teal, background:C.tealLt,
                  border:`1px solid ${C.teal}`, borderRadius:8, padding:'6px 16px', cursor:'pointer' }}>
                + 약물 등록하러 가기
              </button>
            </div>
          )}
        </div>

        {/* ── 오늘의 증상 ── */}
        <div style={{ background:'white', borderRadius:16, padding:16, border:`1px solid ${C.border}` }}>
          <p style={{ fontWeight:700, fontSize:14, color:C.text, margin:'0 0 2px' }}>🩺 오늘의 증상</p>
          <p style={{ fontSize:11, color:C.muted, margin:'0 0 12px' }}>
            지금 느껴지는 증상을 선택하세요 (없으면 패스)
          </p>
          {symptoms.length > 0 ? (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {symptoms.map(s => (
                <button key={s.id}
                  onClick={() => toggleItem(s.id, activeSymptoms, setActiveSymptoms)}
                  style={{
                    padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:600,
                    cursor:'pointer',
                    border: activeSymptoms.includes(s.id) ? `2px solid ${C.red}` : `1px solid ${C.border}`,
                    background: activeSymptoms.includes(s.id) ? C.redLt : 'white',
                    color: activeSymptoms.includes(s.id) ? C.red : C.muted,
                  }}>
                  {s.name}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:'8px 0' }}>
              <p style={{ fontSize:12, color:C.muted, marginBottom:10 }}>추적할 증상이 없어요</p>
              <button onClick={() => router.push('/settings/symptoms')}
                style={{ fontSize:12, fontWeight:700, color:C.red, background:C.redLt,
                  border:`1px solid ${C.red}`, borderRadius:8, padding:'6px 16px', cursor:'pointer' }}>
                + 증상 등록하러 가기
              </button>
            </div>
          )}
        </div>

        {/* ── 메모 ── */}
        <div style={{ background:'white', borderRadius:16, padding:16, border:`1px solid ${C.border}` }}>
          <p style={{ fontWeight:700, fontSize:14, color:C.text, margin:'0 0 2px' }}>메모</p>
          <p style={{ fontSize:11, color:C.muted, margin:'0 0 10px' }}>오늘 특이사항이 있으면 적어두세요</p>
          <textarea value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="오늘 날씨가 좋았다, 외출했다가 피곤했다..."
            rows={3} style={{
              width:'100%', padding:'10px 12px', border:`1px solid ${C.border}`,
              borderRadius:10, fontSize:13, color:C.text, lineHeight:1.6,
              resize:'none', outline:'none', fontFamily:'inherit', boxSizing:'border-box',
            }} />
        </div>

        {/* ── 저장 버튼 ── */}
        <button onClick={handleSave} disabled={saving} style={{
          width:'100%', padding:'16px', borderRadius:14,
          background: saving ? '#90A4AE' : C.blue,
          color:'white', fontWeight:800, fontSize:16,
          border:'none', cursor: saving ? 'not-allowed' : 'pointer',
          letterSpacing:'-0.3px', marginTop:4,
        }}>
          {saving ? '저장 중...' : existing ? '기록 수정 완료' : '오늘 기록 저장'}
        </button>

      </div>
    </div>
  )
}
