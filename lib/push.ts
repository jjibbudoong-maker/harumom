// Web Push 구독 관리 유틸리티

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

/** Service Worker 등록 (이미 등록된 경우 기존 것 반환) */
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (err) {
    console.error('[Push] SW 등록 실패:', err);
    return null;
  }
}

/** Push 구독 생성 또는 기존 구독 반환 */
export async function subscribePush(): Promise<PushSubscription | null> {
  const registration = await registerSW();
  if (!registration) return null;

  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  try {
    return await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY,
    });
  } catch (err) {
    console.error('[Push] 구독 실패:', err);
    return null;
  }
}

/** 구독을 서버에 저장 */
export async function saveSubscription(
  subscription: PushSubscription,
  settings: { remind_time: string; med_times: string[] }
): Promise<boolean> {
  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, settings }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** 알림 권한 요청 */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

/** 현재 구독 해제 */
export async function unsubscribePush(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  return sub.unsubscribe();
}
