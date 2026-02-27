'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PenLine, History, User, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/log', label: 'Log', icon: PenLine },
  { href: '/history', label: 'History', icon: History },
  { href: '/body', label: 'Body', icon: User },
]

export function Navbar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()

  if (mobile) {
    return (
      <nav className="flex justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors',
              pathname === href ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-100'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <nav className="flex flex-col h-full p-4 gap-1">
      <div className="mb-6 px-2">
        <h1 className="text-xl font-bold text-amber-400">Flux</h1>
        <p className="text-xs text-zinc-500">TDEE Tracker</p>
      </div>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === href
              ? 'bg-amber-400/10 text-amber-400'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      <div className="mt-auto">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-amber-400/10 text-amber-400'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </nav>
  )
}
