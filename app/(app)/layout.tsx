export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/BottomNav'
import { Suspense } from 'react'
import SavedToast from '@/components/SavedToast'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data } = await supabase
    .from('profiles')
    .select('onboarding_done')
    .eq('id', user.id)
    .single()

  const profile = data as { onboarding_done: boolean } | null

  if (!profile?.onboarding_done) redirect('/onboarding/profile')

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <main className="flex-1">{children}</main>
      <BottomNav />
      <Suspense><SavedToast /></Suspense>
    </div>
  )
}
