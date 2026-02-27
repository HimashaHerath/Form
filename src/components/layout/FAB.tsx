'use client'
import { Plus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

export function FAB() {
  const pathname = usePathname()
  const router = useRouter()

  // Hide on log page and desktop
  if (pathname === '/log') return null

  return (
    <button
      onClick={() => router.push('/log')}
      className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#4F8EF7] text-white shadow-lg shadow-[#4F8EF7]/25 flex items-center justify-center hover:bg-[#4F8EF7]/90 transition-colors active:scale-95"
      aria-label="Quick log"
    >
      <Plus className="h-6 w-6" />
    </button>
  )
}
