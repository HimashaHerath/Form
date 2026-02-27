'use client'
import { useFluxStore } from '@/lib/store'
import { useTdee } from '@/hooks/useTdee'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

export default function HistoryPage() {
  const { settings, exportData } = useFluxStore()
  const { weekSummaries } = useTdee()

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flux-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported!')
  }

  const reversed = [...weekSummaries].reverse()

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {reversed.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-1">
            <p className="text-zinc-400">No history yet.</p>
            <p className="text-sm text-zinc-500">
              Log at least 2 complete days in a week to see weekly summaries.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-4 gap-2 px-4 text-xs text-zinc-500 uppercase tracking-wide">
            <span>Week</span>
            <span className="text-right">Avg weight</span>
            <span className="text-right">TDEE</span>
            <span className="text-right">Target</span>
          </div>

          {reversed.map((week) => (
            <Card key={week.weekStart}>
              <CardContent className="p-0">
                {/* Week summary row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 items-center">
                  <div>
                    <p className="text-sm font-medium">
                      {format(parseISO(week.weekStart), 'MMM d')}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 h-4 border-zinc-600 text-zinc-400"
                      >
                        {week.loggedDays}/7 days
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right sm:text-right">
                    <p className="text-sm">
                      {week.avgWeight ? week.avgWeight.toFixed(1) : '—'}
                    </p>
                    <p className="text-xs text-zinc-500">{settings?.units}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm text-amber-400">
                      {week.smoothedTDEE ? Math.round(week.smoothedTDEE).toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      raw: {week.rawTDEE ? Math.round(week.rawTDEE).toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {week.recommendedIntake
                        ? Math.round(week.recommendedIntake).toLocaleString()
                        : '—'}
                    </p>
                    <p className="text-xs text-zinc-500">kcal/day</p>
                  </div>
                </div>

                {/* Day detail rows */}
                {week.days.length > 0 && (
                  <div className="border-t border-zinc-800 px-4 py-2 space-y-1">
                    {week.days.map((day) => (
                      <div
                        key={day.date}
                        className="flex justify-between text-xs text-zinc-500"
                      >
                        <span>{format(parseISO(day.date), 'EEE M/d')}</span>
                        <span className="flex gap-4">
                          <span>
                            {day.weight
                              ? `${day.weight} ${settings?.units}`
                              : <span className="text-zinc-700">—</span>}
                          </span>
                          <span>
                            {day.calories
                              ? `${day.calories.toLocaleString()} kcal`
                              : <span className="text-zinc-700">—</span>}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
