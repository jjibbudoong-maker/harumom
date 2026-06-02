import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function DELETE() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 모든 사용자 데이터 삭제 (CASCADE로 자동 삭제되지만 명시적으로)
  await supabaseAdmin.from('push_subscriptions').delete().eq('user_id', user.id);
  await supabaseAdmin.from('profiles').delete().eq('id', user.id);

  // Auth 사용자 삭제 (service role 필요)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
