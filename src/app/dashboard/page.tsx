'use client'
import { useFluxStore } from '@/lib/store'
import { useTdee } from '@/hooks/useTdee'
import { StatCard } from '@/components/layout/StatCard'
import { WeightChart } from '@/components/charts/WeightChart'
import { DailyLogForm } from '@/components/forms/DailyLogForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, parseISO, subDays } from 'date-fns'
import { useState } from 'react'

function calcStreak(logs: { date: string; weight?: number; calories?: number }[]): number {
  let streak = 0
  let checkDate = format(new Date(), 'yyyy-MM-dd')
  const logDates = new Set(
    logs
      .filter((l) => l.weight !== undefined && l.calories !== undefined)
      .map((l) => l.date)
  )
  while (logDates.has(checkDate)) {
    streak++
    checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd')
  }
  return streak
}

export default function DashboardPage() {
  const { settings, logs, hydrated } = useFluxStore()
  const { currentTDEE, recommendedIntake, goalDate, currentWeight, weightChartData } = useTdee()
  const [editingToday, setEditingToday] = useState(false)

  if (!hydrated) return null

  const streak = calcStreak(logs)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayLog = logs.find((l) => l.date === todayStr)
  const todayComplete = todayLog?.weight !== undefined && todayLog?.calories !== undefined

  const fmt = (n: number | null) =>
    n !== null ? Math.round(n).toLocaleString() : '—'

  const fmtWeight = (w: number | null) =>
    w !== null ? `${w.toFixed(1)} ${settings?.units}` : '—'

  const fmtDate = (d: Date | null) =>
    d ? format(d, 'MMM d, yyyy') : '—'

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-400">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        {streak > 0 && (
          <Badge variant="outline" className="border-amber-400 text-amber-400 gap-1">
            🔥 {streak} day{streak !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Smoothed TDEE"
          value={currentTDEE ? `${fmt(currentTDEE)} kcal` : '—'}
          sub="Estimated burn rate"
          highlight
        />
        <StatCard
          label="Recommended"
          value={recommendedIntake ? `${fmt(recommendedIntake)} kcal` : '—'}
          sub={
            settings
              ? `TDEE ${settings.targetDeficit > 0 ? '+' : ''}${settings.targetDeficit} kcal`
              : undefined
          }
        />
        <StatCard
          label="Current Weight"
          value={fmtWeight(currentWeight)}
          sub="7-day average"
        />
        <StatCard
          label="Goal Date"
          value={fmtDate(goalDate)}
          sub={settings ? `Goal: ${fmtWeight(settings.goalWeight)}` : undefined}
        />
      </div>

      {/* Weight chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Weight — last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightChart data={weightChartData} units={settings?.units ?? 'lbs'} />
        </CardContent>
      </Card>

      {/* Today's log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Today&apos;s log</CardTitle>
        </CardHeader>
        <CardContent>
          {todayComplete && !editingToday ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400 text-base">✓</span>
                <span className="text-zinc-300">
                  {todayLog.weight} {settings?.units} · {todayLog.calories?.toLocaleString()} kcal
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-zinc-100"
                onClick={() => setEditingToday(true)}
              >
                Edit
              </Button>
            </div>
          ) : (
            <DailyLogForm compact onSaved={() => setEditingToday(false)} />
          )}
        </CardContent>
      </Card>

      {/* First-time empty state */}
      {!currentTDEE && logs.length < 7 && (
        <Card className="border-zinc-700 bg-zinc-900/50">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-zinc-400">
              Log at least <span className="text-zinc-200">2 complete days</span> in a week to see your TDEE estimate.
            </p>
            <p className="text-xs text-zinc-500 mt-1">Complete = both weight and calories logged.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
