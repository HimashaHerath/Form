'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFluxStore } from '@/lib/store'

export default function HomePage() {
  const router = useRouter()
  const settings = useFluxStore((s) => s.settings)
  const hydrated = useFluxStore((s) => s.hydrated)

  useEffect(() => {
    if (!hydrated) return
    if (settings) {
      router.replace('/dashboard')
    } else {
      router.replace('/onboarding')
    }
  }, [settings, hydrated, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-amber-400 text-2xl font-bold animate-pulse">Flux</div>
    </div>
  )
}
