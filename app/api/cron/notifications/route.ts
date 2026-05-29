import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:seungbin@yimjine.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nowUtc = new Date();
  const kstHour = (nowUtc.getUTCHours() + 9) % 24;
  const kstMin = nowUtc.getUTCMinutes();
  const currentTime = `${String(kstHour).padStart(2, '0')}:${String(kstMin).padStart(2, '0')}`;

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('active', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const targets = (subs ?? []).filter((s) => {
    const remindMatch = s.remind_time?.slice(0, 5) === currentTime;
    const medMatch = (s.med_times ?? []).some((t: string) => t.slice(0, 5) === currentTime);
    return remindMatch || medMatch;
  });

  let sent = 0;
  for (const sub of targets) {
    const isMed = (sub.med_times ?? []).some((t: string) => t.slice(0, 5) === currentTime);
    const payload = JSON.stringify(
      isMed
        ? { title: '💊 복약 시간', body: '지금 약 드실 시간이에요!', url: '/log', tag: 'med' }
        : { title: '📋 하루 기록', body: '오늘 몸 상태를 기록해보세요. 하루몬이 기다리고 있어요!', url: '/log', tag: 'remind' }
    );
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payload
      );
      sent++;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
        await supabaseAdmin.from('push_subscriptions').update({ active: false }).eq('id', sub.id);
      }
    }
  }
  return NextResponse.json({ ok: true, sent, total: targets.length });
}
