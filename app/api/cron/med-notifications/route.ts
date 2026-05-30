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

// Supabase pg_cron + pg_net이 각 복약 시간에 호출
// URL: /api/cron/med-notifications?time=08:00
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const time = req.nextUrl.searchParams.get('time') ?? '';
  if (!time.match(/^\d{2}:\d{2}$/)) {
    return NextResponse.json({ error: 'Invalid time param (HH:MM required)' }, { status: 400 });
  }

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('active', true)
    .contains('med_times', [time]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payload = JSON.stringify({
    title: '💊 복약 시간',
    body: `${time} 약 드실 시간이에요! 하루몸에서 기록해보세요.`,
    url: '/log',
    tag: `med-${time}`,
  });

  let sent = 0;
  for (const sub of subs ?? []) {
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

  return NextResponse.json({ ok: true, time, sent, total: (subs ?? []).length });
}
