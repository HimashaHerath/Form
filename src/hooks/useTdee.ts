'use client'
import { useMemo } from 'react'
import { useFluxStore } from '@/lib/store'
import { buildWeekSummaries, calcGoalDate, calcEstimatedTDEE, getEffectiveTDEE } from '@/lib/tdee'
import { format, subDays, parseISO } from 'date-fns'

export function useTdee() {
  const { settings, logs } = useFluxStore()

  return useMemo(() => {
    if (!settings) {
      return {
        weekSummaries: [],
        currentTDEE: null,
        recommendedIntake: null,
        goalDate: null,
        currentWeight: null,
        weightChartData: [] as { date: string; weight: number | null; movingAvg: number | null }[],
        estimatedTDEE: null as number | null,
        tdeeSource: null as 'formula' | 'blended' | 'adaptive' | null,
      }
    }

    const weekSummaries = logs.length > 0 ? buildWeekSummaries(logs, settings) : []
    const validWeeks = weekSummaries.filter((w) => w.smoothedTDEE > 0)
    const latestWeek = validWeeks.at(-1)
    const adaptiveTDEE = latestWeek?.smoothedTDEE ?? null
    const estimatedTDEE = calcEstimatedTDEE(settings)
    const weeksOfData = validWeeks.length

    const effectiveTDEE = getEffectiveTDEE(adaptiveTDEE, estimatedTDEE, weeksOfData)
    const currentTDEE = effectiveTDEE

    // Determine TDEE source
    let tdeeSource: 'formula' | 'blended' | 'adaptive' | null = null
    if (effectiveTDEE !== null) {
      if (!adaptiveTDEE || weeksOfData < 2) {
        tdeeSource = estimatedTDEE ? 'formula' : null
      } else if (weeksOfData >= 8) {
        tdeeSource = 'adaptive'
      } else {
        tdeeSource = 'blended'
      }
    }

    const recommendedIntake = effectiveTDEE
      ? effectiveTDEE + settings.targetDeficit
      : null

    const recentWeightLogs = logs.filter((l) => l.weight !== undefined).slice(-7)
    const currentWeight = recentWeightLogs.length
      ? recentWeightLogs.reduce((s, l) => s + l.weight!, 0) / recentWeightLogs.length
      : null

    const goalDate =
      currentWeight && currentTDEE && recommendedIntake
        ? calcGoalDate(currentWeight, settings.goalWeight, currentTDEE, recommendedIntake, settings.units)
        : null

    const today = new Date()
    const logMap = new Map(logs.map((l) => [l.date, l]))

    const weightChartData: { date: string; weight: number | null; movingAvg: number | null }[] = []
    for (let i = 30; i >= 0; i--) {
      const date = format(subDays(today, i), 'yyyy-MM-dd')
      const log = logMap.get(date)
      weightChartData.push({ date, weight: log?.weight ?? null, movingAvg: null })
    }

    for (let i = 6; i < weightChartData.length; i++) {
      const window = weightChartData.slice(i - 6, i + 1).filter((d) => d.weight !== null)
      if (window.length >= 3) {
        const avg = window.reduce((s, d) => s + d.weight!, 0) / window.length
        weightChartData[i].movingAvg = Math.round(avg * 10) / 10
      }
    }

    return { weekSummaries, currentTDEE, recommendedIntake, goalDate, currentWeight, weightChartData, estimatedTDEE, tdeeSource }
  }, [settings, logs])
}
