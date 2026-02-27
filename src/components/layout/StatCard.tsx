import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

export function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <Card className={cn(highlight && 'border-amber-400/50')}>
      <CardContent className="p-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wide">{label}</p>
        <p className={cn('text-2xl font-bold mt-1 tabular-nums', highlight ? 'text-amber-400' : 'text-zinc-50')}>
          {value}
        </p>
        {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
