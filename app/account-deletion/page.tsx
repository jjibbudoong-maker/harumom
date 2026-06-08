export const dynamic = 'force-dynamic'

export const metadata = {
  title: '하루몸 계정 및 데이터 삭제 안내',
  description: '하루몸 계정과 건강 데이터 삭제를 요청하는 방법을 안내합니다.',
}

export default function AccountDeletionPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px', fontFamily: 'sans-serif', color: '#1E2A27', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#36967E', marginBottom: 8 }}>하루몸 계정 및 데이터 삭제</h1>
      <p style={{ color: '#8E9A96', fontSize: 14, marginBottom: 32 }}>개발자: 임지네 · 앱: 하루몸 (com.harumom.app)</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>방법 1. 앱에서 직접 삭제 (즉시)</h2>
        <p>하루몸 앱에 로그인한 상태에서 아래 경로로 계정과 모든 데이터를 즉시 삭제할 수 있습니다.</p>
        <ul style={{ paddingLeft: 20, marginTop: 12 }}>
          <li>하단 탭 <strong>설정</strong> 이동</li>
          <li>맨 아래 <strong>&ldquo;계정 및 데이터 영구 삭제&rdquo;</strong> 선택</li>
          <li>확인 시 계정과 모든 건강 기록이 즉시 영구 삭제됩니다.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>방법 2. 이메일로 요청 (앱 미설치 시)</h2>
        <p>앱을 설치하지 않았거나 로그인할 수 없는 경우, 아래 이메일로 삭제를 요청하실 수 있습니다.</p>
        <ul style={{ paddingLeft: 20, marginTop: 12 }}>
          <li>받는 사람: <strong><a href="mailto:seungbin@yimjine.com" style={{ color: '#36967E' }}>seungbin@yimjine.com</a></strong></li>
          <li>제목: <strong>[하루몸] 계정 삭제 요청</strong></li>
          <li>본문: 가입에 사용한 이메일 주소를 적어 주세요.</li>
          <li>처리: 본인 확인 후 영업일 기준 7일 이내 삭제 처리됩니다.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>삭제되는 데이터</h2>
        <ul style={{ paddingLeft: 20, marginTop: 12 }}>
          <li>계정 정보: 이메일 주소, 닉네임, 프로필</li>
          <li>건강 기록 전체: 기분·에너지·통증·수면 점수, 증상, 복용 약물, 메모</li>
          <li>알림 구독 정보(기기 토큰)</li>
        </ul>
        <p style={{ marginTop: 12 }}>위 데이터는 삭제 요청 시 <strong>즉시 영구 삭제</strong>되며 복구할 수 없습니다. 단, 관련 법령에 따라 보관이 요구되는 감사 로그는 최대 2년간 분리 보관 후 파기됩니다.</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #4CAF96', paddingBottom: 8, marginBottom: 16 }}>참고</h2>
        <p>개인정보 처리에 관한 자세한 내용은 <a href="/privacy" style={{ color: '#36967E' }}>개인정보처리방침</a>을 확인하세요.</p>
        <p style={{ marginTop: 8, color: '#8E9A96', fontSize: 13 }}>하루몸은 의료기기가 아니며, 의학적 진단·처방을 제공하지 않습니다.</p>
      </section>
    </div>
  )
}
