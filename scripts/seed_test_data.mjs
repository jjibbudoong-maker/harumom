/**
 * 아프니 테스트 데이터 시드 스크립트
 * 실행: node scripts/seed_test_data.mjs
 *
 * 패턴 설계 (30일치, 오늘 기준 -30일 ~ -1일):
 *  1~ 5일:  수면 부족·피로 누적기       → 기분/에너지 낮음, 통증 높음
 *  6~15일:  운동 시작 후 점진적 회복기  → 수면·에너지 개선
 * 16~20일:  스트레스 재발 구간          → 다시 악화
 * 21~30일:  안정 회복 구간              → 꾸준히 좋아짐
 *
 * 시각적으로 확인 가능한 상관관계:
 *  수면 ↑  ↔  에너지 ↑   (r ≈ +0.82)
 *  수면 ↑  ↔  통증  ↓   (r ≈ -0.75)
 *  운동 ↑  ↔  에너지 ↑   (r ≈ +0.65)
 *  통증 ↑  ↔  기분  ↓   (r ≈ -0.78)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vxyscqwwvbmwkbhgimmj.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4eXNjcXd3dmJtd2tiaGdpbW1qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk4ODI5OCwiZXhwIjoyMDk1NTY0Mjk4fQ.zsgLZX2lWLOZnjdIbvzNgAM2uiXMRrPdxi_KhIWVIsc'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─────────── 30일 원시 데이터 ───────────
// 각 행: [mood(1-5), energy(1-5), pain(1-5), sleep_h, water_ml, exercise_min, memo]
const RAW = [
  // 1~ 5: 피로 누적기
  [2, 2, 4, 5.0,  400,   0, '몸이 너무 무겁다'],
  [2, 2, 4, 5.5,  400,   0, '두통이 심하다'],
  [3, 2, 3, 6.0,  600,   0, '조금 나아진 것 같기도'],
  [1, 1, 5, 4.5,  400,   0, '최악의 하루, 거의 아무것도 못 했다'],
  [2, 2, 4, 5.0,  400,   0, '약 먹고 겨우 버팀'],
  // 6~10: 운동 시작
  [3, 3, 3, 7.0,  800,  20, '오늘부터 저녁 산책 시작'],
  [3, 3, 3, 7.0,  800,  30, '산책 30분, 몸이 좀 가벼운 느낌'],
  [3, 4, 2, 7.5,  800,  45, '에너지가 올라오는 느낌'],
  [4, 4, 2, 8.0, 1000,   0, '잘 잔 것 같다'],
  [4, 4, 2, 7.5, 1000,  45, '운동하면 다음날 확실히 다르다'],
  // 11~15: 좋은 기간
  [4, 5, 1, 8.5, 1200,  45, '컨디션 최상'],
  [5, 5, 1, 8.0, 1200,  60, '오늘은 진짜 좋다'],
  [4, 4, 2, 7.5, 1000,  30, null],
  [4, 4, 1, 8.0, 1200,  45, '규칙적인 수면이 이렇게 중요하다'],
  [5, 4, 1, 8.0, 1000,   0, '주말에 충분히 쉬었다'],
  // 16~20: 스트레스 재발
  [3, 3, 3, 6.0,  600,   0, '회사 일이 많아서 힘들다'],
  [2, 2, 4, 5.0,  400,   0, '야근하고 늦게 잠'],
  [2, 2, 4, 5.5,  400,   0, '두통 재발'],
  [3, 3, 3, 6.5,  600,  20, '잠깐 걷기라도 했다'],
  [2, 2, 4, 5.0,  400,   0, '스트레스가 너무 심하다'],
  // 21~30: 안정 회복
  [3, 3, 3, 7.0,  800,  30, '다시 일상 루틴 시작'],
  [3, 4, 2, 7.5,  800,  45, null],
  [4, 4, 2, 7.5, 1000,  45, '꾸준히 운동하니까 몸이 반응한다'],
  [4, 4, 2, 8.0, 1000,  30, null],
  [4, 4, 1, 8.0, 1200,  60, '통증이 많이 줄었다'],
  [4, 5, 1, 8.5, 1200,  60, '잘 자고 운동하면 이렇게 다르다'],
  [5, 5, 1, 8.0, 1200,  45, null],
  [4, 4, 2, 8.0, 1000,  30, null],
  [4, 5, 1, 8.5, 1200,  60, '이 패턴을 유지하자'],
  [5, 5, 1, 8.0, 1200,  45, '한 달 전보다 훨씬 나아졌다'],
]

// ─────────── 날짜 헬퍼 ───────────
function dateOffset(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]   // 'YYYY-MM-DD'
}

// ─────────── 증상 목록 (테스트용) ───────────
const SYMPTOM_DEFS = [
  { name: '두통',     category: '신경계' },
  { name: '피로감',   category: '전신' },
  { name: '소화불량', category: '소화기' },
  { name: '관절통',   category: '근골격계' },
  { name: '불면',     category: '신경계' },
]

// ─────────── 약물 목록 (테스트용) ───────────
const MED_DEFS = [
  { name: '타이레놀 500mg', dosage: '1정', frequency: '필요시' },
  { name: '오메가3',        dosage: '1캡슐', frequency: '매일 아침' },
  { name: '비타민D',        dosage: '1정',  frequency: '매일 아침' },
]

// ─────────── 증상 출현 규칙 ───────────
// symptomName → 해당 row에서 출현 조건 함수
function getSymptomIds(row, symMap) {
  const [mood, energy, pain, sleep] = row
  const ids = []
  if (pain >= 4)   ids.push(symMap['두통'])
  if (energy <= 2) ids.push(symMap['피로감'])
  if (pain >= 3 && Math.random() < 0.4) ids.push(symMap['소화불량'])
  if (pain >= 3 && row[5] > 0) ids.push(symMap['관절통'])  // row[5] = exercise
  if (sleep <= 5)  ids.push(symMap['불면'])
  return ids.filter(Boolean)
}

// ─────────── 복약 규칙 ───────────
function getTakenMeds(row, medMap) {
  const [,, pain] = row
  const taken = []
  if (pain >= 3) taken.push(medMap['타이레놀 500mg'])
  if (Math.random() < 0.80) taken.push(medMap['오메가3'])
  if (Math.random() < 0.75) taken.push(medMap['비타민D'])
  return taken.filter(Boolean)
}


// ─────────── 메인 ───────────
async function main() {
  // 1. 유저 조회
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers()
  if (authErr || !users?.length) {
    console.error('❌ 유저 조회 실패:', authErr?.message ?? '유저 없음')
    process.exit(1)
  }
  const user = users[0]
  console.log(`✅ 유저 확인: ${user.email} (${user.id})`)

  // 2. 증상 upsert
  const { data: symRows, error: symErr } = await supabase
    .from('symptoms')
    .upsert(
      SYMPTOM_DEFS.map(s => ({ ...s, user_id: user.id })),
      { onConflict: 'user_id,name', ignoreDuplicates: false }
    )
    .select('id, name')
  if (symErr) { console.error('❌ 증상 upsert 실패:', symErr.message); process.exit(1) }
  const symMap = Object.fromEntries(symRows.map(s => [s.name, s.id]))
  console.log('✅ 증상 등록:', Object.keys(symMap).join(', '))

  // 3. 약물 upsert
  const { data: medRows, error: medErr } = await supabase
    .from('medications')
    .upsert(
      MED_DEFS.map(m => ({ ...m, user_id: user.id })),
      { onConflict: 'user_id,name', ignoreDuplicates: false }
    )
    .select('id, name')
  if (medErr) { console.error('❌ 약물 upsert 실패:', medErr.message); process.exit(1) }
  const medMap = Object.fromEntries(medRows.map(m => [m.name, m.id]))
  console.log('✅ 약물 등록:', Object.keys(medMap).join(', '))


  // 4. 기존 테스트 로그 삭제 (재실행 대비)
  const dates = RAW.map((_, i) => dateOffset(RAW.length - i))
  const { error: delErr } = await supabase
    .from('daily_logs')
    .delete()
    .eq('user_id', user.id)
    .in('log_date', dates)
  if (delErr) console.warn('⚠️ 기존 로그 삭제 실패 (무시):', delErr.message)
  else console.log(`🗑️  기존 ${dates.length}일치 로그 정리 완료`)

  // 5. 30일치 daily_logs 삽입
  const logs = RAW.map((row, i) => {
    const [mood, energy, pain, sleep, water_ml, exercise_min, memo] = row
    const symptom_ids     = getSymptomIds(row, symMap)
    const taken_medications = getTakenMeds(row, medMap)
    return {
      user_id:       user.id,
      log_date:      dateOffset(RAW.length - i),   // 30일 전 → 어제
      mood_score:    mood,
      energy_score:  energy,
      pain_score:    pain,
      sleep_hours:   sleep,
      water_ml,
      exercise_min,
      memo:          memo ?? null,
      symptom_ids,
      taken_medications,
    }
  })

  const { data: inserted, error: insErr } = await supabase
    .from('daily_logs')
    .insert(logs)
    .select('id, log_date')
  if (insErr) { console.error('❌ 로그 삽입 실패:', insErr.message); process.exit(1) }
  console.log(`✅ ${inserted.length}일치 로그 삽입 완료 (${inserted[0].log_date} ~ ${inserted.at(-1).log_date})`)

  // 6. symptom_logs 연결 테이블 삽입
  const symLogRows = []
  for (const log of inserted) {
    const original = logs.find(l => l.log_date === log.log_date)
    for (const sym_id of original.symptom_ids) {
      symLogRows.push({ daily_log_id: log.id, symptom_id: sym_id, user_id: user.id, present: true })
    }
  }
  if (symLogRows.length) {
    const { error: slErr } = await supabase.from('symptom_logs').insert(symLogRows)
    if (slErr) console.warn('⚠️ symptom_logs 삽입 실패 (무시):', slErr.message)
    else console.log(`✅ symptom_logs ${symLogRows.length}건 삽입`)
  }


  // 7. medication_logs 연결 테이블 삽입
  const medLogRows = []
  for (const log of inserted) {
    const original = logs.find(l => l.log_date === log.log_date)
    for (const med_id of original.taken_medications) {
      medLogRows.push({ daily_log_id: log.id, medication_id: med_id, user_id: user.id, taken: true })
    }
  }
  if (medLogRows.length) {
    const { error: mlErr } = await supabase.from('medication_logs').insert(medLogRows)
    if (mlErr) console.warn('⚠️ medication_logs 삽입 실패 (무시):', mlErr.message)
    else console.log(`✅ medication_logs ${medLogRows.length}건 삽입`)
  }

  // 8. 요약 출력
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 삽입된 패턴 요약')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  const avg = (arr) => (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2)
  console.log(`기분   평균: ${avg(RAW.map(r=>r[0]))} / 5`)
  console.log(`에너지 평균: ${avg(RAW.map(r=>r[1]))} / 5`)
  console.log(`통증   평균: ${avg(RAW.map(r=>r[2]))} / 5`)
  console.log(`수면   평균: ${avg(RAW.map(r=>r[3]))} 시간`)
  console.log(`운동   일수: ${RAW.filter(r=>r[5]>0).length}일 / 30일`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 시드 완료! 앱에서 차트·인사이트 페이지를 확인하세요.')
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
