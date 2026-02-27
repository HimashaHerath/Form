'use client'
import { useEffect } from 'react'
import { useFluxStore } from '@/lib/store'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const init = useFluxStore((s) => s.init)
  useEffect(() => { init() }, [init])
  return <>{children}</>
}
