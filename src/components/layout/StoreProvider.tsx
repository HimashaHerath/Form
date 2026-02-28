'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useFluxStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { SupabaseDataStore } from '@/lib/storage/supabase'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { init, setUser } = useFluxStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    if (!supabaseUrl.startsWith('http')) return

    const supabase = createClient()
    const isAuthRoute = pathname.startsWith('/auth')

    // Initialize with the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        init(new SupabaseDataStore(session.user.id, supabase)).catch((err) => {
          console.error('[StoreProvider] init failed:', err)
        })
      } else {
        setUser(null)
        if (!isAuthRoute) router.replace('/auth')
      }
    }).catch((err) => {
      console.error('[StoreProvider] getSession failed:', err)
      setUser(null)
      if (!isAuthRoute) router.replace('/auth')
    })

    // Keep auth state in sync
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        init(new SupabaseDataStore(session.user.id, supabase)).catch((err) => {
          console.error('[StoreProvider] init failed after sign-in:', err)
        })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        if (!isAuthRoute) router.replace('/auth')
      }
    })

    return () => subscription.unsubscribe()
  }, [init, pathname, setUser, router])

  return <>{children}</>
}
