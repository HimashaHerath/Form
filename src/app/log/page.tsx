'use client'
import { useState } from 'react'
import { useFluxStore } from '@/lib/store'
import { DailyLogForm } from '@/components/forms/DailyLogForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, subDays, addDays, parseISO, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function LogPage() {
  const { logs } = useFluxStore()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const parsed = parseISO(selectedDate)
  const weekStart = startOfWeek(parsed, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), 'yyyy-MM-dd')
  )

  const logMap = new Map(logs.map((l) => [l.date, l]))
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const isToday = selectedDate === todayStr
  const isFuture = selectedDate > todayStr

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Log</h1>
        {!isToday && (
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-400 hover:text-amber-300"
            onClick={() => setSelectedDate(todayStr)}
          >
            Today
          </Button>
        )}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedDate(format(subDays(parsed, 1), 'yyyy-MM-dd'))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <p className="font-medium">
            {isToday ? 'Today' : format(parsed, 'EEEE')}
          </p>
          <p className="text-sm text-zinc-400">{format(parsed, 'MMMM d, yyyy')}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedDate(format(addDays(parsed, 1), 'yyyy-MM-dd'))}
          disabled={isToday}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Log form */}
      <Card>
        <CardContent className="pt-5">
          {isFuture ? (
            <p className="text-sm text-zinc-400 text-center py-4">
              Can&apos;t log future dates
            </p>
          ) : (
            <DailyLogForm date={selectedDate} />
          )}
        </CardContent>
      </Card>

      {/* Week overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">This week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-7 gap-1">
            {DAY_LABELS.map((day, i) => {
              const date = weekDays[i]
              const log = logMap.get(date)
              const isSelected = date === selectedDate
              const hasWeight = log?.weight !== undefined
              const hasCals = log?.calories !== undefined
              const isComplete = hasWeight && hasCals
              const isFutureDay = date > todayStr

              return (
                <button
                  key={day}
                  onClick={() => !isFutureDay && setSelectedDate(date)}
                  disabled={isFutureDay}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg text-xs transition-colors',
                    isSelected
                      ? 'bg-amber-400/10 text-amber-400'
                      : isFutureDay
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:bg-zinc-800 text-zinc-300'
                  )}
                >
                  <span className="text-zinc-500 mb-1.5">{day}</span>
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isComplete
                        ? 'bg-amber-400'
                        : hasWeight || hasCals
                        ? 'bg-zinc-500'
                        : 'bg-zinc-700'
                    )}
                  />
                </button>
              )
            })}
          </div>
          <div className="flex gap-4 text-xs text-zinc-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Complete
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
              Partial
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-700 inline-block" />
              Empty
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
