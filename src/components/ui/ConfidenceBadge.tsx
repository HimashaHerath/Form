import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ConfidenceBadgeProps {
  weeksOfData: number
}

export function ConfidenceBadge({ weeksOfData }: ConfidenceBadgeProps) {
  if (weeksOfData < 4) {
    return (
      <Badge variant="outline" className={cn('border-[#F59E0B]/50 text-[#F59E0B] text-xs')}>
        Building...
      </Badge>
    )
  }
  if (weeksOfData < 8) {
    return (
      <Badge variant="outline" className={cn('border-[#8B8BA7]/50 text-[#8B8BA7] text-xs')}>
        Stabilizing
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className={cn('border-[#22C55E]/50 text-[#22C55E] text-xs')}>
      Reliable
    </Badge>
  )
}
