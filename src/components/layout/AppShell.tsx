'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { MobileTopBar } from './MobileTopBar'
import { FAB } from './FAB'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useFluxStore } from '@/lib/store'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/log': 'Log',
  '/history': 'Progress',
  '/body': 'Measurements',
  '/settings': 'Settings',
  '/onboarding': 'Setup',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const user = useFluxStore((s) => s.user)
  const isAuthPage = pathname.startsWith('/auth')
  const isOnboarding = pathname.startsWith('/onboarding')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const authEnabled = supabaseUrl.startsWith('http')
  const hideShell = authEnabled && !user

  if (isAuthPage || isOnboarding || hideShell) {
    return <>{children}</>
  }

  const pageTitle = PAGE_TITLES[pathname] ?? 'FORM'

  return (
    <>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[#2A2A38] bg-[#0D0D16]">
          <Navbar />
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-56">
          {/* Mobile top bar */}
          <div className="lg:hidden">
            <MobileTopBar title={pageTitle} onMenuClick={() => setMobileNavOpen(true)} />
          </div>
          {children}
        </main>
      </div>

      <FAB />

      {/* Mobile nav sheet */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[260px] bg-[#0D0D16] border-[#2A2A38] p-0">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <Navbar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
