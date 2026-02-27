'use client'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFluxStore } from '@/lib/store'

interface MobileTopBarProps {
  title: string
  onMenuClick: () => void
}

export function MobileTopBar({ title, onMenuClick }: MobileTopBarProps) {
  const user = useFluxStore((s) => s.user)
  const initial = user?.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-[#0A0A0F]/95 backdrop-blur-sm border-b border-[#2A2A38]">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-[#8B8BA7] hover:text-[#F0F0F8]">
        <Menu className="h-5 w-5" />
      </Button>
      <span className="text-sm font-medium text-[#F0F0F8]">{title}</span>
      <div className="w-8 h-8 rounded-full bg-[#1A1A24] border border-[#2A2A38] flex items-center justify-center">
        <span className="text-xs font-medium text-[#8B8BA7]">{initial}</span>
      </div>
    </header>
  )
}
