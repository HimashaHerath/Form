'use client'
import { useFluxStore } from '@/lib/store'
import { useTdee } from '@/hooks/useTdee'
import { StatCard } from '@/components/layout/StatCard'
import { GoalProgressBar } from '@/components/progress/GoalProgressBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, parseISO, subDays } from 'date-fns'
import { Download, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { ProgressSkeleton } from '@/components/skeletons/ProgressSkeleton'

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

export default function HistoryPage() {
  const { settings, logs, exportData, hydrated } = useFluxStore()
  const { weekSummaries, currentWeight, goalDate } = useTdee()

  if (!hydrated) return <ProgressSkeleton />

  const handleExport = async () => {
    const json = await exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `form-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported!')
  }

  const reversed = [...weekSummaries].reverse()
  const streak = calcStreak(logs)
  const totalLoggedDays = logs.filter((l) => l.weight !== undefined && l.calories !== undefined).length

  // Avg deficit across all weeks
  const avgDeficit = weekSummaries.length > 0
    ? weekSummaries.reduce((sum, w) => sum + (w.smoothedTDEE > 0 && w.avgCalories > 0 ? w.smoothedTDEE - w.avgCalories : 0), 0) / weekSummaries.filter(w => w.smoothedTDEE > 0 && w.avgCalories > 0).length
    : null

  // Fastest week (most weight lost)
  const fastestWeek = weekSummaries.length > 0
    ? weekSummaries.reduce((best, w) => Math.abs(w.weightDelta) > Math.abs(best.weightDelta) ? w : best, weekSummaries[0])
    : null

  // Sparkline data per week (TDEE trend)
  const tdeeSparkline = weekSummaries.map((w) => ({ tdee: w.smoothedTDEE }))

  return (
    <div className="p-4 md:p-6 lg:px-12 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progress</h1>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Goal Progress Bar */}
      {settings && currentWeight && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#8B8BA7] uppercase tracking-wide">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalProgressBar
              startWeight={settings.startWeight}
              currentWeight={currentWeight}
              goalWeight={settings.goalWeight}
              units={settings.units}
              goalDate={goalDate}
            />
          </CardContent>
        </Card>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Logged"
          value={`${totalLoggedDays}`}
          sub="complete days"
        />
        <StatCard
          label="Avg Deficit"
          value={avgDeficit != null && !isNaN(avgDeficit) ? `${Math.round(avgDeficit)}` : '—'}
          sub="kcal/day"
        />
        <StatCard
          label="Fastest Week"
          value={fastestWeek && fastestWeek.weightDelta !== 0 ? `${Math.abs(fastestWeek.weightDelta).toFixed(1)} ${settings?.units}` : '—'}
          sub={fastestWeek ? format(parseISO(fastestWeek.weekStart), 'MMM d') : undefined}
        />
        <StatCard
          label="Streak"
          value={`${streak}`}
          sub="consecutive days"
        />
      </div>

      {/* TDEE History Table */}
      {reversed.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-1">
            <p className="text-[#8B8BA7]">Come back after 2 weeks of logging — trends take time to emerge.</p>
            <p className="text-sm text-[#4A4A62]">
              Log at least 2 complete days in a week to see weekly summaries.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#8B8BA7] uppercase tracking-wide">TDEE History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2A38]">
                    <th className="text-left text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium">Week</th>
                    <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium">Avg Weight</th>
                    <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium">Avg Cals</th>
                    <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium">TDEE</th>
                    <th className="text-center text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium w-[60px]">Trend</th>
                    <th className="text-center text-xs uppercase tracking-wide text-[#8B8BA7] px-4 py-3 font-medium hidden lg:table-cell w-[100px]">Sparkline</th>
                  </tr>
                </thead>
                <tbody>
                  {reversed.map((week, idx) => {
                    const prevWeek = idx < reversed.length - 1 ? reversed[idx + 1] : null
                    const tdeeUp = prevWeek && week.smoothedTDEE > prevWeek.smoothedTDEE
                    const tdeeDown = prevWeek && week.smoothedTDEE < prevWeek.smoothedTDEE
                    // Sparkline data: last 4 weeks ending at this week
                    const weekIdx = weekSummaries.indexOf(weekSummaries.find(w => w.weekStart === week.weekStart)!)
                    const sparkData = weekSummaries.slice(Math.max(0, weekIdx - 3), weekIdx + 1).map(w => ({ v: w.smoothedTDEE }))

                    return (
                      <tr key={week.weekStart} className="border-b border-[#2A2A38]/50 last:border-0 hover:bg-[#1A1A24]/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm font-medium text-[#F0F0F8]">
                              {format(parseISO(week.weekStart), 'MMM d')}
                            </span>
                            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-4 border-[#2A2A38] text-[#8B8BA7]">
                              {week.loggedDays}/7
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-data tabular-nums text-sm text-[#F0F0F8]">
                          {week.avgWeight ? `${week.avgWeight.toFixed(1)}` : '—'}
                          <span className="text-[#4A4A62] ml-1 text-xs">{settings?.units}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-data tabular-nums text-sm text-[#F0F0F8]">
                          {week.avgCalories ? Math.round(week.avgCalories).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-data tabular-nums text-sm text-[#4F8EF7] font-medium">
                          {week.smoothedTDEE ? Math.round(week.smoothedTDEE).toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tdeeUp && <TrendingUp className="h-4 w-4 text-[#22C55E] mx-auto" />}
                          {tdeeDown && <TrendingDown className="h-4 w-4 text-[#EF4444] mx-auto" />}
                          {!tdeeUp && !tdeeDown && <span className="text-[#4A4A62]">—</span>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {sparkData.length >= 2 ? (
                            <ResponsiveContainer width="100%" height={24}>
                              <LineChart data={sparkData}>
                                <Line type="monotone" dataKey="v" stroke="#4F8EF7" strokeWidth={1.5} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <span className="text-[#4A4A62] text-xs block text-center">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
