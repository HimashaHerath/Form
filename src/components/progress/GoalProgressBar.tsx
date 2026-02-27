'use client'
import { format } from 'date-fns'

interface GoalProgressBarProps {
  startWeight: number
  currentWeight: number
  goalWeight: number
  units: string
  goalDate: Date | null
}

export function GoalProgressBar({ startWeight, currentWeight, goalWeight, units, goalDate }: GoalProgressBarProps) {
  const totalToLose = Math.abs(startWeight - goalWeight)
  const lost = Math.abs(startWeight - currentWeight)
  const percentage = totalToLose > 0 ? Math.min(Math.max((lost / totalToLose) * 100, 0), 100) : 0
  const isGaining = goalWeight > startWeight
  const direction = isGaining ? 'gained' : 'lost'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[#8B8BA7]">
        <span>Start: {startWeight.toFixed(1)} {units}</span>
        <span className="text-[#F0F0F8] font-medium">
          {direction.charAt(0).toUpperCase() + direction.slice(1)} {lost.toFixed(1)} {units} of {totalToLose.toFixed(1)} {units} — {percentage.toFixed(0)}%
        </span>
        <span>Goal: {goalWeight.toFixed(1)} {units}</span>
      </div>
      <div className="relative h-3 bg-[#1A1A24] rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-[#4F8EF7] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
        {/* Current weight marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#F0F0F8] border-2 border-[#4F8EF7] shadow-md transition-all duration-500"
          style={{ left: `${percentage}%`, transform: `translateX(-50%) translateY(-50%)` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#4A4A62]">
          Current: <span className="text-[#F0F0F8] font-data">{currentWeight.toFixed(1)} {units}</span>
        </span>
        {goalDate && (
          <span className="text-[#4A4A62]">
            Est. completion: <span className="text-[#F0F0F8] font-data">{format(goalDate, 'MMM d, yyyy')}</span>
          </span>
        )}
      </div>
    </div>
  )
}
