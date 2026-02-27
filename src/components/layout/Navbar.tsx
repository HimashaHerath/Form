'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PenLine, TrendingUp, Ruler, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFluxStore } from '@/lib/store'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/log', label: 'Log', icon: PenLine },
  { href: '/history', label: 'Progress', icon: TrendingUp },
  { href: '/body', label: 'Measurements', icon: Ruler },
]

export function Navbar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const signOut = useFluxStore((s) => s.signOut)

  return (
    <nav className="flex flex-col h-full p-4 gap-1">
      <div className="mb-6 px-2">
        <h1 className="text-xl font-display tracking-tight text-[#F0F0F8]">
          FORM<span className="text-[#4F8EF7]">.</span>
        </h1>
        <p className="text-xs text-[#8B8BA7]">TDEE Tracker</p>
      </div>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === href
              ? 'bg-[#4F8EF7]/10 text-[#4F8EF7]'
              : 'text-[#8B8BA7] hover:text-[#F0F0F8] hover:bg-[#1A1A24]'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      <div className="mt-auto flex flex-col gap-1">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-[#4F8EF7]/10 text-[#4F8EF7]'
              : 'text-[#8B8BA7] hover:text-[#F0F0F8] hover:bg-[#1A1A24]'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-[#8B8BA7] hover:text-[#F0F0F8] hover:bg-[#1A1A24] w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </nav>
  )
}
