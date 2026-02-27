import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  primary?: boolean
  tooltip?: string
  delta?: { value: string; positive: boolean } | null
}

export function StatCard({ label, value, sub, highlight, primary, tooltip, delta }: StatCardProps) {
  return (
    <Card className={cn(
      'border-[#2A2A38]',
      primary && 'bg-[#4F8EF7] border-[#4F8EF7]',
      highlight && !primary && 'border-[#4F8EF7]/50',
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-1">
          <p className={cn(
            'text-xs uppercase tracking-wide',
            primary ? 'text-white/70' : 'text-[#8B8BA7]'
          )}>
            {label}
          </p>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className={cn('h-3 w-3', primary ? 'text-white/50' : 'text-[#4A4A62]')} />
              </TooltipTrigger>
              <TooltipContent className="bg-[#111118] border-[#2A2A38] text-[#F0F0F8]">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className={cn(
            'text-2xl font-data tabular-nums',
            primary ? 'text-white' : highlight ? 'text-[#4F8EF7]' : 'text-[#F0F0F8]'
          )}>
            {value}
          </p>
          {delta && (
            <span className={cn(
              'text-xs font-data font-medium',
              delta.positive ? 'text-[#22C55E]' : 'text-[#EF4444]'
            )}>
              {delta.value}
            </span>
          )}
        </div>
        {sub && (
          <p className={cn(
            'text-xs mt-1',
            primary ? 'text-white/60' : 'text-[#4A4A62]'
          )}>
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
