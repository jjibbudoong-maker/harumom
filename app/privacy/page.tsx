export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'sans-serif', color: '#1E2A27', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#36967E', marginBottom: 8 }}>하루몸 개인정보처리방침</h1>
      <p style={{ color: '#8E9A96', fontSize: 14, marginBottom: 32 }}>시행일: 2026년 6월 1일</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>1. 수집하는 개인정보</h2>
        <p>하루몸(이하 &ldquo;서비스&rdquo;)은 아래 정보를 수집합니다.</p>
        <ul style={{ paddingLeft: 20, marginTop: 12 }}>
          <li><strong>계정 정보</strong>: 이메일 주소, 닉네임</li>
          <li><strong>건강 기록</strong>: 기분·에너지·통증·수면 점수, 증상, 복용 약물, 메모</li>
          <li><strong>기기 정보</strong>: 알림 구독 정보(Push endpoint), 기기 유형</li>
          <li><strong>선택 정보</strong>: 출생연도, 만성질환 유형</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>2. 정보 이용 목적</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>건강 기록 저장 및 트렌드 분석 제공</li>
          <li>AI 기반 건강 패턴 인사이트 생성</li>
          <li>기록 리마인더 및 복약 알림 발송</li>
          <li>서비스 품질 개선</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>3. 정보 보관 및 파기</h2>
        <p>회원 탈퇴 시 모든 개인정보 및 건강 기록을 즉시 삭제합니다. 감사 로그는 법적 의무에 따라 최대 2년 보관 후 파기합니다.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>4. 제3자 제공</h2>
        <p>수집된 개인정보는 원칙적으로 제3자에게 제공하지 않습니다. 다만 서비스 운영을 위해 아래 위탁사를 활용합니다.</p>
        <ul style={{ paddingLeft: 20, marginTop: 12 }}>
          <li><strong>Supabase Inc.</strong> — 데이터베이스 및 인증 (미국)</li>
          <li><strong>Vercel Inc.</strong> — 서버 호스팅 (미국)</li>
          <li><strong>OpenAI Inc.</strong> — AI 인사이트 생성 (미국)</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>5. 의료 정보 면책</h2>
        <p style={{ background: '#FFF3E0', padding: 16, borderRadius: 8, border: '1px solid #FFB74D' }}>
          <strong>⚠️ 하루몸은 의료기기가 아닙니다.</strong> 본 서비스에서 제공하는 어떠한 정보도 의학적 진단, 처방, 치료를 대체하지 않습니다. 건강 관련 결정은 반드시 전문 의료인과 상담하십시오.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>6. 이용자 권리</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>개인정보 열람, 수정, 삭제 요청 가능</li>
          <li>앱 내 설정 → 로그아웃 후 계정 삭제로 모든 데이터 즉시 파기</li>
          <li>알림 수신 거부: 설정 → 알림 설정에서 언제든 해제 가능</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>7. 문의</h2>
        <p>개인정보 관련 문의: <a href="mailto:seungbin@yimjine.com" style={{ color: '#4CAF96' }}>seungbin@yimjine.com</a></p>
      </section>

      <p style={{ fontSize: 12, color: '#8E9A96', borderTop: '1px solid #E8EDEB', paddingTop: 16 }}>
        본 방침은 2026년 6월 1일부터 시행됩니다. 변경 시 앱 내 공지 또는 이메일로 안내드립니다.
      </p>
    </div>
  )
}
