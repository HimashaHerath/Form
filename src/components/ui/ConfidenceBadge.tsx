import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ConfidenceBadgeProps {
  tdeeSource: 'formula' | 'blended' | 'adaptive' | null
}

export function ConfidenceBadge({ tdeeSource }: ConfidenceBadgeProps) {
  if (tdeeSource === 'formula') {
    return (
      <Badge variant="outline" className={cn('border-[#F59E0B]/50 text-[#F59E0B] text-xs')}>
        Formula estimate
      </Badge>
    )
  }
  if (tdeeSource === 'blended') {
    return (
      <Badge variant="outline" className={cn('border-[#8B8BA7]/50 text-[#8B8BA7] text-xs')}>
        Calibrating
      </Badge>
    )
  }
  if (tdeeSource === 'adaptive') {
    return (
      <Badge variant="outline" className={cn('border-[#22C55E]/50 text-[#22C55E] text-xs')}>
        From your data
      </Badge>
    )
  }
  return null
}
