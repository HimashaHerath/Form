'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFluxStore } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import { SupabaseDataStore } from '@/lib/storage/supabase'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { init, setUser } = useFluxStore()
  const router = useRouter()

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    if (!supabaseUrl.startsWith('http')) return

    const supabase = createClient()

    // Initialize with the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        init(new SupabaseDataStore(session.user.id, supabase)).catch((err) => {
          console.error('[StoreProvider] init failed:', err)
        })
      } else {
        console.warn('[StoreProvider] No active session found')
      }
    }).catch((err) => {
      console.error('[StoreProvider] getSession failed:', err)
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
        router.push('/auth')
      }
    })

    return () => subscription.unsubscribe()
  }, [init, setUser, router])

  return <>{children}</>
}
