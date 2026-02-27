'use client'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, isSameWeek } from 'date-fns'

interface WeekSelectorProps {
  weekStart: Date
  onWeekChange: (weekStart: Date) => void
}

export function WeekSelector({ weekStart, onWeekChange }: WeekSelectorProps) {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const isCurrentWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1 })

  const label = `${format(weekStart, 'MMM d')}–${format(weekEnd, 'd')}`

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onWeekChange(subWeeks(weekStart, 1))}
        className="text-[#8B8BA7] hover:text-[#F0F0F8]"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium text-[#F0F0F8] min-w-[120px] text-center font-data">
        {label}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onWeekChange(addWeeks(weekStart, 1))}
        disabled={isCurrentWeek}
        className="text-[#8B8BA7] hover:text-[#F0F0F8]"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isCurrentWeek && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onWeekChange(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          className="text-[#4F8EF7] hover:text-[#4F8EF7]/80 text-xs ml-1"
        >
          Jump to today
        </Button>
      )}
    </div>
  )
}
