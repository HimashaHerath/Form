'use client'
import { useFluxStore } from '@/lib/store'
import { useTdee } from '@/hooks/useTdee'
import { StatCard } from '@/components/layout/StatCard'
import { WeightChart } from '@/components/charts/WeightChart'
import { DailyLogForm } from '@/components/forms/DailyLogForm'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, parseISO, subDays, startOfWeek, addDays } from 'date-fns'
import { useState } from 'react'
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeleton'

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
  const { currentTDEE, recommendedIntake, goalDate, currentWeight, weightChartData, weekSummaries, tdeeSource } = useTdee()
  const [editingToday, setEditingToday] = useState(false)

  if (!hydrated) return <DashboardSkeleton />

  const streak = calcStreak(logs)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayLog = logs.find((l) => l.date === todayStr)
  const todayComplete = todayLog?.weight !== undefined && todayLog?.calories !== undefined
  const weeksOfData = weekSummaries.length

  const fmt = (n: number | null) =>
    n !== null ? Math.round(n).toLocaleString() : '—'

  const fmtWeight = (w: number | null) =>
    w !== null ? `${w.toFixed(1)} ${settings?.units}` : '—'

  const fmtDate = (d: Date | null) =>
    d ? format(d, 'MMM d, yyyy') : '—'

  // Weight delta from last week
  const weightDelta = (() => {
    if (weekSummaries.length < 2) return null
    const latest = weekSummaries.at(-1)
    const prev = weekSummaries.at(-2)
    if (!latest?.avgWeight || !prev?.avgWeight) return null
    const diff = latest.avgWeight - prev.avgWeight
    return {
      value: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${settings?.units}`,
      positive: settings?.goalWeight != null ? diff < 0 === (settings.goalWeight < (settings?.startWeight ?? 0)) : diff < 0,
    }
  })()

  // Week table data
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = format(addDays(weekStart, i), 'yyyy-MM-dd')
    const log = logs.find((l) => l.date === date)
    return { date, day: format(addDays(weekStart, i), 'EEE'), weight: log?.weight, calories: log?.calories }
  })
  const savedDaysThisWeek = weekDays.filter((d) => d.weight !== undefined || d.calories !== undefined).length

  // TDEE chart data with weekly TDEE values
  const chartDataWithTdee = weightChartData.map((d) => {
    const ws = weekSummaries.find((w) => {
      const wStart = parseISO(w.weekStart)
      const wEnd = addDays(wStart, 6)
      const date = parseISO(d.date)
      return date >= wStart && date <= wEnd
    })
    return { ...d, tdee: ws?.smoothedTDEE || null }
  })

  return (
    <div className="p-4 md:p-6 lg:px-12 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[#8B8BA7]">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        {streak > 0 && (
          <Badge variant="outline" className="border-[#4F8EF7] text-[#4F8EF7] gap-1">
            🔥 {streak} day{streak !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Zone 1: Hero Stats — 4x1 row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Current TDEE"
          value={currentTDEE ? `${fmt(currentTDEE)}` : '—'}
          sub={tdeeSource === 'formula' ? 'kcal/day (estimated)' : tdeeSource === 'blended' ? 'kcal/day (calibrating)' : 'kcal/day'}
          highlight
          tooltip="Your estimated daily calorie burn based on logged weight and intake data"
        />
        <StatCard
          label="Eat Today"
          value={recommendedIntake ? `${fmt(recommendedIntake)}` : '—'}
          sub={
            settings
              ? `TDEE ${settings.targetDeficit > 0 ? '+' : ''}${settings.targetDeficit} kcal`
              : undefined
          }
          primary
        />
        <StatCard
          label="Current Weight"
          value={fmtWeight(currentWeight)}
          sub="7-day average"
          delta={weightDelta}
        />
        <StatCard
          label="Goal Date"
          value={goalDate ? format(goalDate, 'MMM d') : '—'}
          sub={settings ? `Goal: ${fmtWeight(settings.goalWeight)}` : undefined}
        />
      </div>

      {/* Confidence badge */}
      {tdeeSource && (
        <div className="flex items-center gap-2">
          <ConfidenceBadge tdeeSource={tdeeSource} />
          <span className="text-xs text-[#8B8BA7]">{weeksOfData} week{weeksOfData !== 1 ? 's' : ''} of data</span>
        </div>
      )}

      {/* Zone 2: Quick Log — Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Log form */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-[#8B8BA7]">Today&apos;s log</CardTitle>
                <Badge variant="outline" className="border-[#2A2A38] text-[#8B8BA7] text-xs">
                  {format(new Date(), 'MMM d')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {todayComplete && !editingToday ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#22C55E] text-base">✓</span>
                    <span className="text-[#F0F0F8] font-data">
                      {todayLog.weight} {settings?.units} · {todayLog.calories?.toLocaleString()} kcal
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#8B8BA7] hover:text-[#F0F0F8]"
                    onClick={() => setEditingToday(true)}
                  >
                    Edit
                  </Button>
                </div>
              ) : (
                <DailyLogForm onSaved={() => setEditingToday(false)} />
              )}
              {savedDaysThisWeek > 0 && (
                <p className="text-xs text-[#4A4A62] mt-3">
                  Saved {savedDaysThisWeek} day{savedDaysThisWeek !== 1 ? 's' : ''} this week
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: This Week mini table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8B8BA7]">This week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {weekDays.map((d) => {
                  const isFuture = d.date > todayStr
                  const isToday = d.date === todayStr
                  return (
                    <div
                      key={d.date}
                      className={`flex items-center justify-between py-1.5 text-xs ${
                        isToday ? 'text-[#F0F0F8]' : isFuture ? 'text-[#2A2A38]' : 'text-[#8B8BA7]'
                      }`}
                    >
                      <span className="w-8 font-medium">{d.day}</span>
                      <span className="font-data tabular-nums">
                        {d.weight != null ? `${d.weight}` : '—'}
                      </span>
                      <span className="font-data tabular-nums">
                        {d.calories != null ? `${d.calories.toLocaleString()}` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Zone 3: Trend Chart — Full Width */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[#8B8BA7] uppercase tracking-wide">
            Weight & TDEE Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeightChart data={chartDataWithTdee} units={settings?.units ?? 'lbs'} showTabs />
        </CardContent>
      </Card>

      {/* Empty State */}
      {!currentTDEE && logs.length < 7 && (
        <Card className="border-[#2A2A38] bg-[#111118]/50">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-[#8B8BA7]">
              Log your first week to see TDEE appear here.
            </p>
            <p className="text-xs text-[#4A4A62] mt-1">
              The more you log, the more accurate it gets.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
