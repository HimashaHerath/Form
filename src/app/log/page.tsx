'use client'
import { useState, useCallback } from 'react'
import { useFluxStore } from '@/lib/store'
import { useTdee } from '@/hooks/useTdee'
import { DailyLogForm } from '@/components/forms/DailyLogForm'
import { WeekSelector } from '@/components/log/WeekSelector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { format, addDays, parseISO, startOfWeek } from 'date-fns'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export default function LogPage() {
  const { logs, settings, saveLog, deleteLog } = useFluxStore()
  const { weekSummaries } = useTdee()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState('')
  const [editCalories, setEditCalories] = useState('')

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const logMap = new Map(logs.map((l) => [l.date, l]))

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = format(addDays(weekStart, i), 'yyyy-MM-dd')
    const log = logMap.get(date)
    return {
      date,
      dayLabel: format(addDays(weekStart, i), 'EEE'),
      dateLabel: format(addDays(weekStart, i), 'MMM d'),
      weight: log?.weight,
      calories: log?.calories,
      isFuture: date > todayStr,
      isToday: date === todayStr,
    }
  })

  // Find week TDEE
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekSummary = weekSummaries.find((w) => w.weekStart === weekStartStr)

  const startEditing = useCallback((date: string) => {
    const log = logMap.get(date)
    setEditingDate(date)
    setEditWeight(log?.weight?.toString() ?? '')
    setEditCalories(log?.calories?.toString() ?? '')
  }, [logMap])

  const saveEditing = useCallback(() => {
    if (!editingDate) return
    if (!editWeight && !editCalories) {
      toast.error('Enter at least weight or calories')
      return
    }
    saveLog({
      date: editingDate,
      weight: editWeight ? Number(editWeight) : undefined,
      calories: editCalories ? Number(editCalories) : undefined,
    })
    toast.success('Saved')
    setEditingDate(null)
  }, [editingDate, editWeight, editCalories, saveLog])

  const cancelEditing = useCallback(() => {
    setEditingDate(null)
  }, [])

  return (
    <div className="p-4 md:p-6 lg:px-12 max-w-[1200px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Log</h1>
        <WeekSelector weekStart={weekStart} onWeekChange={setWeekStart} />
      </div>

      {/* Desktop: Table Layout */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2A38]">
                <th className="text-left text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium">Date</th>
                <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium">Weight ({settings?.units ?? 'lbs'})</th>
                <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium">Calories</th>
                <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium">Delta</th>
                <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {weekDays.map((d, i) => {
                const isEditing = editingDate === d.date
                const hasData = d.weight != null || d.calories != null
                const prevDay = i > 0 ? weekDays[i - 1] : null
                const delta = d.weight != null && prevDay?.weight != null
                  ? (d.weight - prevDay.weight).toFixed(1)
                  : null

                return (
                  <tr
                    key={d.date}
                    className={`border-b border-[#2A2A38]/50 last:border-0 ${
                      d.isToday ? 'bg-[#4F8EF7]/5' : d.isFuture ? 'opacity-30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#F0F0F8]">{d.dayLabel}</span>
                        <span className="text-xs text-[#8B8BA7]">{d.dateLabel}</span>
                        {d.isToday && (
                          <span className="text-[10px] bg-[#4F8EF7]/10 text-[#4F8EF7] px-1.5 py-0.5 rounded font-medium">
                            TODAY
                          </span>
                        )}
                      </div>
                    </td>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={editWeight}
                            onChange={(e) => setEditWeight(e.target.value)}
                            placeholder="Weight"
                            className="h-8 text-right font-data text-sm bg-[#1A1A24] border-[#2A2A38]"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            value={editCalories}
                            onChange={(e) => setEditCalories(e.target.value)}
                            placeholder="Calories"
                            className="h-8 text-right font-data text-sm bg-[#1A1A24] border-[#2A2A38]"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-[#4A4A62]">—</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-xs" onClick={saveEditing} className="text-[#22C55E] hover:text-[#22C55E]/80">
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-xs" onClick={cancelEditing} className="text-[#8B8BA7] hover:text-[#F0F0F8]">
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right text-sm font-data tabular-nums text-[#F0F0F8]">
                          {d.weight != null ? d.weight : <span className="text-[#2A2A38]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-data tabular-nums text-[#F0F0F8]">
                          {d.calories != null ? d.calories.toLocaleString() : <span className="text-[#2A2A38]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-data tabular-nums">
                          {delta != null ? (
                            <span className={Number(delta) > 0 ? 'text-[#EF4444]' : Number(delta) < 0 ? 'text-[#22C55E]' : 'text-[#8B8BA7]'}>
                              {Number(delta) > 0 ? '+' : ''}{delta}
                            </span>
                          ) : (
                            <span className="text-[#2A2A38]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {d.isFuture ? null : hasData ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => startEditing(d.date)}
                                className="text-[#8B8BA7] hover:text-[#F0F0F8]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => { deleteLog(d.date); toast.success('Deleted') }}
                                className="text-[#8B8BA7] hover:text-[#EF4444]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => startEditing(d.date)}
                              className="text-[#4F8EF7] hover:text-[#4F8EF7]/80"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {/* Week TDEE footer */}
          {weekSummary?.smoothedTDEE ? (
            <div className="px-4 py-3 border-t border-[#2A2A38] flex justify-end">
              <span className="text-xs text-[#8B8BA7]">Week TDEE: </span>
              <span className="text-xs font-data text-[#4F8EF7] ml-1">
                {Math.round(weekSummary.smoothedTDEE).toLocaleString()} kcal
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Mobile: Card Layout */}
      <div className="md:hidden space-y-2">
        {weekDays.map((d, i) => {
          const isEditing = editingDate === d.date
          const hasData = d.weight != null || d.calories != null
          const prevDay = i > 0 ? weekDays[i - 1] : null
          const delta = d.weight != null && prevDay?.weight != null
            ? (d.weight - prevDay.weight).toFixed(1)
            : null

          if (d.isFuture) return null

          return (
            <Card
              key={d.date}
              className={d.isToday ? 'border-[#4F8EF7]/30' : 'border-[#2A2A38]'}
            >
              <CardContent className="p-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{d.dayLabel} · {d.dateLabel}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={saveEditing} className="text-[#22C55E]">
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={cancelEditing} className="text-[#8B8BA7]">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={editWeight}
                        onChange={(e) => setEditWeight(e.target.value)}
                        placeholder={`Weight (${settings?.units ?? 'lbs'})`}
                        className="h-8 text-sm font-data bg-[#1A1A24] border-[#2A2A38]"
                      />
                      <Input
                        type="number"
                        value={editCalories}
                        onChange={(e) => setEditCalories(e.target.value)}
                        placeholder="Calories"
                        className="h-8 text-sm font-data bg-[#1A1A24] border-[#2A2A38]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#F0F0F8]">{d.dayLabel}</span>
                      <span className="text-xs text-[#8B8BA7]">{d.dateLabel}</span>
                      {d.isToday && (
                        <span className="text-[10px] bg-[#4F8EF7]/10 text-[#4F8EF7] px-1.5 py-0.5 rounded font-medium">
                          TODAY
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {hasData ? (
                        <>
                          <span className="text-xs font-data tabular-nums text-[#F0F0F8]">
                            {d.weight ?? '—'} · {d.calories?.toLocaleString() ?? '—'}
                          </span>
                          {delta != null && (
                            <span className={`text-xs font-data ${Number(delta) > 0 ? 'text-[#EF4444]' : Number(delta) < 0 ? 'text-[#22C55E]' : 'text-[#8B8BA7]'}`}>
                              {Number(delta) > 0 ? '+' : ''}{delta}
                            </span>
                          )}
                          <Button variant="ghost" size="icon-xs" onClick={() => startEditing(d.date)} className="text-[#8B8BA7]">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => startEditing(d.date)} className="text-[#4F8EF7] text-xs h-7">
                          <Plus className="h-3 w-3 mr-1" /> Log
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Week TDEE on mobile */}
        {weekSummary?.smoothedTDEE ? (
          <div className="flex justify-end pt-1">
            <span className="text-xs text-[#8B8BA7]">Week TDEE: </span>
            <span className="text-xs font-data text-[#4F8EF7] ml-1">
              {Math.round(weekSummary.smoothedTDEE).toLocaleString()} kcal
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
