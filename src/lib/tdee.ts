import { startOfISOWeek, format, parseISO } from 'date-fns'
import type { Units, Sex, DayLog, UserSettings, WeekSummary } from './types'

const CAL_PER_LB = 3500
const CAL_PER_KG = 7700

/**
 * Estimate TDEE from a single week of data.
 * rawTDEE = avgCals + (-weightDelta / 7) * calPerUnit
 * weightDelta: positive = gained, negative = lost
 */
export function calcRawTDEE(avgCals: number, weightDeltaPerWeek: number, units: Units): number {
  const calPerUnit = units === 'lbs' ? CAL_PER_LB : CAL_PER_KG
  return avgCals + (-weightDeltaPerWeek / 7) * calPerUnit
}

export function calcSmoothedTDEE(rawTDEEs: number[], window: number): number {
  const recent = rawTDEEs.slice(-window)
  return recent.reduce((sum, v) => sum + v, 0) / recent.length
}

export function calcGoalDate(
  currentWeight: number,
  goalWeight: number,
  tdee: number,
  intake: number,
  units: Units
): Date {
  const calPerUnit = units === 'lbs' ? CAL_PER_LB : CAL_PER_KG
  const dailyDeficit = tdee - intake
  const weightToLose = currentWeight - goalWeight
  const daysToGoal = (weightToLose * calPerUnit) / dailyDeficit
  return new Date(Date.now() + Math.abs(daysToGoal) * 24 * 60 * 60 * 1000)
}

/**
 * US Navy Body Fat Formula
 * Male:   %BF = 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
 * Female: %BF = 495 / (1.29579 - 0.35004 * log10(waist + hips - neck) + 0.22100 * log10(height)) - 450
 * All measurements in cm.
 */
export function calcNavyBF(
  neck: number,
  waist: number,
  height: number,
  sex: Sex,
  hips?: number
): number {
  if (sex === 'male') {
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450
  } else {
    if (!hips) throw new Error('hips required for female Navy BF calculation')
    return 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.221 * Math.log10(height)) - 450
  }
}

/**
 * Mifflin-St Jeor formula for estimated TDEE.
 * Returns null if required fields are missing.
 */
export function calcEstimatedTDEE(settings: UserSettings): number | null {
  const { sex, height, age, activityMultiplier, startWeight, units } = settings
  if (!sex || !height || !age || !activityMultiplier) return null

  const weightKg = units === 'lbs' ? startWeight / 2.205 : startWeight
  const bmr = sex === 'male'
    ? 10 * weightKg + 6.25 * height - 5 * age + 5
    : 10 * weightKg + 6.25 * height - 5 * age - 161

  return Math.round(bmr * activityMultiplier)
}

/**
 * Blend estimated TDEE with adaptive TDEE based on weeks of data.
 * Weeks 0-2: 100% formula, Weeks 2-8: linear blend, Weeks 8+: 100% adaptive.
 */
export function getEffectiveTDEE(
  adaptiveTDEE: number | null,
  estimatedTDEE: number | null,
  weeksOfData: number
): number | null {
  if (!estimatedTDEE && !adaptiveTDEE) return null
  if (!estimatedTDEE) return adaptiveTDEE
  if (!adaptiveTDEE || weeksOfData < 2) return estimatedTDEE
  if (weeksOfData >= 8) return adaptiveTDEE

  const weight = (weeksOfData - 2) / 6 // 0 at week 2, 1 at week 8
  return Math.round(estimatedTDEE * (1 - weight) + adaptiveTDEE * weight)
}

export function buildWeekSummaries(logs: DayLog[], settings: UserSettings): WeekSummary[] {
  if (logs.length === 0) return []

  const byWeek = new Map<string, DayLog[]>()
  for (const log of logs) {
    const weekStart = format(startOfISOWeek(parseISO(log.date)), 'yyyy-MM-dd')
    if (!byWeek.has(weekStart)) byWeek.set(weekStart, [])
    byWeek.get(weekStart)!.push(log)
  }

  const sortedWeeks = Array.from(byWeek.keys()).sort()
  const rawTDEEs: number[] = []

  return sortedWeeks.map((weekStart) => {
    const days = byWeek.get(weekStart)!.sort((a, b) => a.date.localeCompare(b.date))

    const weightDays = days.filter((d) => d.weight !== undefined)
    const calDays = days.filter((d) => d.calories !== undefined)
    const completeDays = days.filter((d) => d.weight !== undefined && d.calories !== undefined)

    const avgWeight = weightDays.length
      ? weightDays.reduce((s, d) => s + d.weight!, 0) / weightDays.length
      : 0

    const avgCalories = calDays.length
      ? calDays.reduce((s, d) => s + d.calories!, 0) / calDays.length
      : 0

    const startWeight = weightDays[0]?.weight ?? 0
    const endWeight = weightDays[weightDays.length - 1]?.weight ?? 0
    const weightDelta = endWeight - startWeight

    const rawTDEE =
      completeDays.length >= 2 ? calcRawTDEE(avgCalories, weightDelta, settings.units) : 0

    rawTDEEs.push(rawTDEE)
    const smoothedTDEE =
      rawTDEE > 0 ? calcSmoothedTDEE(rawTDEEs.filter(Boolean), settings.tdeeWindow) : 0
    const recommendedIntake = smoothedTDEE > 0 ? smoothedTDEE + settings.targetDeficit : 0

    return {
      weekStart,
      days,
      loggedDays: completeDays.length,
      avgCalories,
      avgWeight,
      startWeight,
      endWeight,
      weightDelta,
      rawTDEE,
      smoothedTDEE,
      recommendedIntake,
    }
  })
}
