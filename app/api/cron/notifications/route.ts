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

// 매일 21:00 KST (12:00 UTC) 실행 — Vercel Hobby Cron (1일 1회)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .eq('active', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const payload = JSON.stringify({
    title: '📋 오늘 하루 기록',
    body: '오늘 몸 상태를 기록해보세요. 하루몬이 기다리고 있어요! 🌿',
    url: '/log',
    tag: 'daily-remind',
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

  return NextResponse.json({ ok: true, sent, total: (subs ?? []).length });
}
