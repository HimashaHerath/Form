import { describe, it, expect } from 'vitest'
import { calcRawTDEE, calcSmoothedTDEE, calcGoalDate, calcNavyBF, buildWeekSummaries } from '../tdee'
import type { DayLog, UserSettings } from '../types'

describe('calcRawTDEE', () => {
  it('returns TDEE when weight is stable', () => {
    const result = calcRawTDEE(2000, 0, 'lbs')
    expect(result).toBe(2000)
  })

  it('returns higher TDEE when weight is lost', () => {
    // rawTDEE = 2000 + (1/7) * 3500 = 2500
    const result = calcRawTDEE(2000, -1, 'lbs')
    expect(result).toBeCloseTo(2500, 0)
  })

  it('returns lower TDEE when weight is gained', () => {
    // rawTDEE = 2000 + (-1/7) * 3500 = 1500
    const result = calcRawTDEE(2000, 1, 'lbs')
    expect(result).toBeCloseTo(1500, 0)
  })

  it('uses kg constant for metric units', () => {
    // rawTDEE = 2000 + (1/7) * 7700 = 3100
    const result = calcRawTDEE(2000, -1, 'kg')
    expect(result).toBeCloseTo(3100, 0)
  })
})

describe('calcSmoothedTDEE', () => {
  it('returns the single value when only one week available', () => {
    expect(calcSmoothedTDEE([2000], 4)).toBe(2000)
  })

  it('averages over all weeks when fewer than window', () => {
    expect(calcSmoothedTDEE([2000, 2200], 4)).toBe(2100)
  })

  it('averages only last N weeks when more than window', () => {
    expect(calcSmoothedTDEE([2000, 2200, 2400, 2600], 2)).toBe(2500)
  })
})

describe('calcGoalDate', () => {
  it('returns a date in the future when losing weight', () => {
    const now = new Date()
    const result = calcGoalDate(180, 170, 2500, 2000, 'lbs')
    expect(result.getTime()).toBeGreaterThan(now.getTime())
  })

  it('calculates ~70 days to lose 10 lbs at 500 kcal/day deficit', () => {
    const now = new Date()
    const result = calcGoalDate(180, 170, 2500, 2000, 'lbs')
    const daysDiff = (result.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    expect(daysDiff).toBeCloseTo(70, 0)
  })
})

describe('calcNavyBF', () => {
  it('calculates male BF% using Navy formula', () => {
    const result = calcNavyBF(37, 85, 177, 'male')
    expect(result).toBeGreaterThan(15)
    expect(result).toBeLessThan(25)
  })

  it('calculates female BF% using Navy formula (requires hips)', () => {
    const result = calcNavyBF(33, 72, 165, 'female', 96)
    expect(result).toBeGreaterThan(20)
    expect(result).toBeLessThan(35)
  })
})

describe('buildWeekSummaries', () => {
  const settings: UserSettings = {
    startDate: '2026-01-05',
    startWeight: 180,
    goalWeight: 170,
    units: 'lbs',
    tdeeWindow: 2,
    targetDeficit: -500,
  }

  it('returns empty array for no logs', () => {
    expect(buildWeekSummaries([], settings)).toEqual([])
  })

  it('groups logs by week and computes averages', () => {
    const logs: DayLog[] = [
      { date: '2026-01-05', weight: 180, calories: 2000 },
      { date: '2026-01-06', weight: 179.5, calories: 1950 },
      { date: '2026-01-07', weight: 179, calories: 2100 },
    ]
    const summaries = buildWeekSummaries(logs, settings)
    expect(summaries).toHaveLength(1)
    expect(summaries[0].avgCalories).toBeCloseTo(2016.7, 0)
    expect(summaries[0].weightDelta).toBeCloseTo(-1, 0)
  })

  it('applies smoothing window across multiple weeks', () => {
    const logs: DayLog[] = [
      { date: '2026-01-05', weight: 180, calories: 2000 },
      { date: '2026-01-08', weight: 179, calories: 2000 },
      { date: '2026-01-12', weight: 179, calories: 2000 },
      { date: '2026-01-15', weight: 178, calories: 2000 },
    ]
    const summaries = buildWeekSummaries(logs, settings)
    expect(summaries).toHaveLength(2)
    expect(summaries[1].smoothedTDEE).toBeGreaterThan(0)
  })
})
