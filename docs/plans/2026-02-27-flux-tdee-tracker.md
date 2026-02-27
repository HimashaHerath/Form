# Flux TDEE Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-featured TDEE tracking web app (named "Flux") from scratch in Next.js 14, replacing a manual Excel spreadsheet with a mobile-first UI that calculates adaptive TDEE from real weight + calorie data.

**Architecture:** localStorage-first with a swappable `DataStore` interface (Supabase-ready later). Pure TypeScript functions for all TDEE math. Zustand for global state, shadcn/ui + Recharts for UI.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Recharts, date-fns, Vitest + @testing-library/react

---

## Task 1: Bootstrap Next.js Project

**Files:**
- Create: `package.json` (auto-generated)
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

**Step 1: Initialize Next.js**

Run from `/Users/himasha/Desktop/macro_cal`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```
Answer prompts: accept all defaults.

**Step 2: Verify it boots**
```bash
npm run dev
```
Expected: Server starts on http://localhost:3000, default Next.js page visible.

**Step 3: Install additional dependencies**
```bash
npm install zustand recharts date-fns
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Step 4: Initialize shadcn**
```bash
npx shadcn@latest init
```
When prompted:
- Style: **Default**
- Base color: **Zinc**
- CSS variables: **Yes**

**Step 5: Add shadcn components**
```bash
npx shadcn@latest add button card input label select tabs progress badge separator sheet sonner
```

**Step 6: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

**Step 7: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 8: Verify test setup**
```bash
npm run test:run
```
Expected: "No test files found" (that's fine, setup works).

**Step 9: Initialize git**
```bash
git init && git add . && git commit -m "chore: bootstrap Next.js project with shadcn and Vitest"
```

---

## Task 2: Core Types

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Write the types file**

Create `src/lib/types.ts`:
```typescript
export type Units = 'lbs' | 'kg'
export type Sex = 'male' | 'female'

export interface UserSettings {
  startDate: string           // ISO date YYYY-MM-DD
  startWeight: number         // in user's unit
  goalWeight: number          // in user's unit
  units: Units
  tdeeWindow: number          // weeks for TDEE smoothing (2, 4, or 8)
  targetDeficit: number       // kcal/day below TDEE (negative = surplus)
  sex?: Sex                   // optional, for Navy BF% formula
  height?: number             // cm, optional, for Navy BF% formula
}

export interface DayLog {
  date: string                // YYYY-MM-DD (primary key)
  weight?: number             // in user's unit
  calories?: number           // kcal
}

export interface BodyLog {
  date: string                // YYYY-MM-DD
  weight: number              // in user's unit
  neck?: number               // cm
  waist?: number              // cm
  hips?: number               // cm (used for women in Navy formula)
  bfPercent?: number          // calculated or manual override
}

export interface WeekSummary {
  weekStart: string           // YYYY-MM-DD (Monday of the week)
  days: DayLog[]              // all day logs in this week
  loggedDays: number          // days with both weight AND calories
  avgCalories: number         // mean of logged calorie days
  avgWeight: number           // mean of logged weight days
  startWeight: number         // first logged weight of week
  endWeight: number           // last logged weight of week
  weightDelta: number         // endWeight - startWeight (lbs or kg)
  rawTDEE: number             // single-week TDEE estimate
  smoothedTDEE: number        // rolling average over tdeeWindow weeks
  recommendedIntake: number   // smoothedTDEE + targetDeficit (negative deficit)
}
```

**Step 2: Commit**
```bash
git add src/lib/types.ts
git commit -m "feat: add core TypeScript types"
```

---

## Task 3: TDEE Math Functions (TDD)

**Files:**
- Create: `src/lib/tdee.ts`
- Create: `src/lib/__tests__/tdee.test.ts`

### 3a: rawTDEE formula

**Step 1: Write the failing test**

Create `src/lib/__tests__/tdee.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { calcRawTDEE } from '../tdee'

describe('calcRawTDEE', () => {
  it('returns TDEE when weight is stable', () => {
    // If you ate 2000 cals/day and weight didn't change, TDEE = 2000
    const result = calcRawTDEE(2000, 0, 'lbs')
    expect(result).toBe(2000)
  })

  it('returns higher TDEE when weight is lost', () => {
    // Ate 2000/day, lost 1 lb in a week → burned more than ate
    // rawTDEE = 2000 + (1/7) * 3500 = 2000 + 500 = 2500
    const result = calcRawTDEE(2000, -1, 'lbs')
    expect(result).toBeCloseTo(2500, 0)
  })

  it('returns lower TDEE when weight is gained', () => {
    // Ate 2000/day, gained 1 lb → burned less than ate
    // rawTDEE = 2000 + (-1/7) * 3500 = 2000 - 500 = 1500
    const result = calcRawTDEE(2000, 1, 'lbs')
    expect(result).toBeCloseTo(1500, 0)
  })

  it('uses kg constant for metric units', () => {
    // Ate 2000/day, lost 1 kg in a week
    // rawTDEE = 2000 + (1/7) * 7700 = 2000 + 1100 = 3100
    const result = calcRawTDEE(2000, -1, 'kg')
    expect(result).toBeCloseTo(3100, 0)
  })
})
```

**Step 2: Run test to verify it fails**
```bash
npm run test:run -- src/lib/__tests__/tdee.test.ts
```
Expected: FAIL — "Cannot find module '../tdee'"

**Step 3: Implement calcRawTDEE**

Create `src/lib/tdee.ts`:
```typescript
import { Units, Sex, DayLog, UserSettings, WeekSummary } from './types'

const CAL_PER_LB = 3500
const CAL_PER_KG = 7700

/**
 * Estimate TDEE from a single week of data.
 * Formula: rawTDEE = avgCals + (-weightDelta / 7) * calPerUnit
 * weightDelta: lbs or kg gained in the week (positive = gained, negative = lost)
 */
export function calcRawTDEE(avgCals: number, weightDeltaPerWeek: number, units: Units): number {
  const calPerUnit = units === 'lbs' ? CAL_PER_LB : CAL_PER_KG
  return avgCals + (-weightDeltaPerWeek / 7) * calPerUnit
}
```

**Step 4: Run test to verify it passes**
```bash
npm run test:run -- src/lib/__tests__/tdee.test.ts
```
Expected: PASS (4 tests)

### 3b: smoothedTDEE

**Step 5: Add smoothedTDEE tests**

Append to `src/lib/__tests__/tdee.test.ts`:
```typescript
import { calcRawTDEE, calcSmoothedTDEE } from '../tdee'

describe('calcSmoothedTDEE', () => {
  it('returns the single value when only one week available', () => {
    expect(calcSmoothedTDEE([2000], 4)).toBe(2000)
  })

  it('averages over all weeks when fewer than window', () => {
    expect(calcSmoothedTDEE([2000, 2200], 4)).toBe(2100)
  })

  it('averages only last N weeks when more than window', () => {
    // window=2, last 2 are 2400, 2600 → average 2500
    expect(calcSmoothedTDEE([2000, 2200, 2400, 2600], 2)).toBe(2500)
  })
})
```

**Step 6: Run to verify fails**
```bash
npm run test:run -- src/lib/__tests__/tdee.test.ts
```
Expected: FAIL — "calcSmoothedTDEE is not a function"

**Step 7: Implement calcSmoothedTDEE**

Add to `src/lib/tdee.ts`:
```typescript
export function calcSmoothedTDEE(rawTDEEs: number[], window: number): number {
  const recent = rawTDEEs.slice(-window)
  return recent.reduce((sum, v) => sum + v, 0) / recent.length
}
```

**Step 8: Run to verify passes**
```bash
npm run test:run -- src/lib/__tests__/tdee.test.ts
```
Expected: PASS (7 tests)

### 3c: calcGoalDate

**Step 9: Add goal date tests**

Append to `src/lib/__tests__/tdee.test.ts`:
```typescript
import { calcRawTDEE, calcSmoothedTDEE, calcGoalDate } from '../tdee'

describe('calcGoalDate', () => {
  it('returns a date in the future when losing weight', () => {
    const now = new Date()
    // Burning 500 kcal/day more than eating → lose 1 lb/week
    const result = calcGoalDate(180, 170, 2500, 2000, 'lbs')
    expect(result.getTime()).toBeGreaterThan(now.getTime())
  })

  it('calculates ~70 days to lose 10 lbs at 500 kcal/day deficit', () => {
    // 10 lbs * 3500 kcal/lb = 35000 kcal / 500 kcal/day = 70 days
    const now = new Date()
    const result = calcGoalDate(180, 170, 2500, 2000, 'lbs')
    const daysDiff = (result.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    expect(daysDiff).toBeCloseTo(70, 0)
  })
})
```

**Step 10: Run to verify fails**
```bash
npm run test:run -- src/lib/__tests__/tdee.test.ts
```
Expected: FAIL — "calcGoalDate is not a function"

**Step 11: Implement calcGoalDate**

Add to `src/lib/tdee.ts`:
```typescript
export function calcGoalDate(
  currentWeight: number,
  goalWeight: number,
  tdee: number,
  intake: number,
  units: Units
): Date {
  const calPerUnit = units === 'lbs' ? CAL_PER_LB : CAL_PER_KG
  const dailyDeficit = tdee - intake  // positive = deficit, negative = surplus
  const weightToLose = currentWeight - goalWeight  // positive = losing, negative = gaining
  const daysToGoal = (weightToLose * calPerUnit) / dailyDeficit
  return new Date(Date.now() + Math.abs(daysToGoal) * 24 * 60 * 60 * 1000)
}
```

**Step 12: Run to verify passes**
```bash
npm run test:run -- src/lib/__tests__/tdee.test.ts
```
Expected: PASS (9 tests)

### 3d: Navy BF% formula

**Step 13: Add Navy BF tests**

Append to `src/lib/__tests__/tdee.test.ts`:
```typescript
import { calcRawTDEE, calcSmoothedTDEE, calcGoalDate, calcNavyBF } from '../tdee'

describe('calcNavyBF', () => {
  it('calculates male BF% using Navy formula', () => {
    // Known values: height=177cm, neck=37cm, waist=85cm → ~18% BF
    const result = calcNavyBF(37, 85, 177, 'male')
    expect(result).toBeGreaterThan(15)
    expect(result).toBeLessThan(25)
  })

  it('calculates female BF% using Navy formula (requires hips)', () => {
    // Known values: height=165cm, neck=33cm, waist=72cm, hips=96cm
    const result = calcNavyBF(33, 72, 165, 'female', 96)
    expect(result).toBeGreaterThan(20)
    expect(result).toBeLessThan(35)
  })
})
```

**Step 14: Implement calcNavyBF**

Add to `src/lib/tdee.ts`:
```typescript
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
```

**Step 15: Run all tests**
```bash
npm run test:run -- src/lib/__tests__/tdee.test.ts
```
Expected: PASS (11 tests)

### 3e: buildWeekSummaries

**Step 16: Add buildWeekSummaries tests**

Append to `src/lib/__tests__/tdee.test.ts`:
```typescript
import { ..., buildWeekSummaries } from '../tdee'

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
      // Week 1: Jan 5–11
      { date: '2026-01-05', weight: 180, calories: 2000 },
      { date: '2026-01-08', weight: 179, calories: 2000 },
      // Week 2: Jan 12–18
      { date: '2026-01-12', weight: 179, calories: 2000 },
      { date: '2026-01-15', weight: 178, calories: 2000 },
    ]
    const summaries = buildWeekSummaries(logs, settings)
    expect(summaries).toHaveLength(2)
    // Both weeks have same raw TDEE, smoothed should equal raw
    expect(summaries[1].smoothedTDEE).toBeCloseTo(summaries[1].rawTDEE, 0)
  })
})
```

**Step 17: Implement buildWeekSummaries**

Add to `src/lib/tdee.ts` (add `import { startOfISOWeek, format, parseISO } from 'date-fns'` at top):
```typescript
import { startOfISOWeek, format, parseISO } from 'date-fns'
import { Units, Sex, DayLog, UserSettings, WeekSummary } from './types'

export function buildWeekSummaries(logs: DayLog[], settings: UserSettings): WeekSummary[] {
  if (logs.length === 0) return []

  // Group logs by ISO week start (Monday)
  const byWeek = new Map<string, DayLog[]>()
  for (const log of logs) {
    const weekStart = format(startOfISOWeek(parseISO(log.date)), 'yyyy-MM-dd')
    if (!byWeek.has(weekStart)) byWeek.set(weekStart, [])
    byWeek.get(weekStart)!.push(log)
  }

  const sortedWeeks = Array.from(byWeek.keys()).sort()
  const rawTDEEs: number[] = []

  const summaries: WeekSummary[] = sortedWeeks.map((weekStart) => {
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

    const rawTDEE = completeDays.length >= 2
      ? calcRawTDEE(avgCalories, weightDelta, settings.units)
      : 0

    rawTDEEs.push(rawTDEE)
    const smoothedTDEE = rawTDEE > 0 ? calcSmoothedTDEE(rawTDEEs.filter(Boolean), settings.tdeeWindow) : 0
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

  return summaries
}
```

**Step 18: Run all TDEE tests**
```bash
npm run test:run -- src/lib/__tests__/tdee.test.ts
```
Expected: PASS (all tests)

**Step 19: Commit**
```bash
git add src/lib/tdee.ts src/lib/__tests__/tdee.test.ts
git commit -m "feat: add TDEE math functions with full test coverage"
```

---

## Task 4: Storage Layer (TDD)

**Files:**
- Create: `src/lib/storage/interface.ts`
- Create: `src/lib/storage/localStorage.ts`
- Create: `src/lib/__tests__/localStorage.test.ts`

**Step 1: Write the interface**

Create `src/lib/storage/interface.ts`:
```typescript
import { UserSettings, DayLog, BodyLog } from '../types'

export interface DataStore {
  getSettings(): UserSettings | null
  saveSettings(s: UserSettings): void
  getLogs(from?: string, to?: string): DayLog[]
  saveLog(log: DayLog): void
  deleteLog(date: string): void
  getBodyLogs(): BodyLog[]
  saveBodyLog(log: BodyLog): void
  exportAll(): string          // returns JSON string of all data
  importAll(json: string): void
  clearAll(): void
}
```

**Step 2: Write failing tests**

Create `src/lib/__tests__/localStorage.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { LocalDataStore } from '../storage/localStorage'

describe('LocalDataStore', () => {
  let store: LocalDataStore

  beforeEach(() => {
    localStorage.clear()
    store = new LocalDataStore()
  })

  describe('settings', () => {
    it('returns null when no settings saved', () => {
      expect(store.getSettings()).toBeNull()
    })

    it('saves and retrieves settings', () => {
      const settings = {
        startDate: '2026-01-01',
        startWeight: 180,
        goalWeight: 170,
        units: 'lbs' as const,
        tdeeWindow: 4,
        targetDeficit: -500,
      }
      store.saveSettings(settings)
      expect(store.getSettings()).toEqual(settings)
    })
  })

  describe('logs', () => {
    it('returns empty array when no logs', () => {
      expect(store.getLogs()).toEqual([])
    })

    it('saves and retrieves a log', () => {
      const log = { date: '2026-01-15', weight: 178.5, calories: 2000 }
      store.saveLog(log)
      expect(store.getLogs()).toContainEqual(log)
    })

    it('upserts log for same date', () => {
      store.saveLog({ date: '2026-01-15', weight: 178, calories: 2000 })
      store.saveLog({ date: '2026-01-15', weight: 179, calories: 2100 })
      const logs = store.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].weight).toBe(179)
    })

    it('deletes a log by date', () => {
      store.saveLog({ date: '2026-01-15', weight: 178, calories: 2000 })
      store.deleteLog('2026-01-15')
      expect(store.getLogs()).toHaveLength(0)
    })

    it('filters logs by date range', () => {
      store.saveLog({ date: '2026-01-10', weight: 180, calories: 2000 })
      store.saveLog({ date: '2026-01-15', weight: 179, calories: 1950 })
      store.saveLog({ date: '2026-01-20', weight: 178, calories: 2100 })
      const filtered = store.getLogs('2026-01-12', '2026-01-18')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].date).toBe('2026-01-15')
    })
  })

  describe('export/import', () => {
    it('round-trips all data through export/import', () => {
      const settings = { startDate: '2026-01-01', startWeight: 180, goalWeight: 170, units: 'lbs' as const, tdeeWindow: 4, targetDeficit: -500 }
      store.saveSettings(settings)
      store.saveLog({ date: '2026-01-15', weight: 178, calories: 2000 })

      const json = store.exportAll()
      localStorage.clear()
      const store2 = new LocalDataStore()
      store2.importAll(json)

      expect(store2.getSettings()).toEqual(settings)
      expect(store2.getLogs()).toHaveLength(1)
    })
  })
})
```

**Step 3: Run to verify fails**
```bash
npm run test:run -- src/lib/__tests__/localStorage.test.ts
```
Expected: FAIL — "Cannot find module '../storage/localStorage'"

**Step 4: Implement LocalDataStore**

Create `src/lib/storage/localStorage.ts`:
```typescript
import { UserSettings, DayLog, BodyLog } from '../types'
import { DataStore } from './interface'

const KEYS = {
  settings: 'flux:settings',
  logs: 'flux:logs',
  body: 'flux:body',
} as const

export class LocalDataStore implements DataStore {
  getSettings(): UserSettings | null {
    const raw = localStorage.getItem(KEYS.settings)
    return raw ? JSON.parse(raw) : null
  }

  saveSettings(s: UserSettings): void {
    localStorage.setItem(KEYS.settings, JSON.stringify(s))
  }

  getLogs(from?: string, to?: string): DayLog[] {
    const raw = localStorage.getItem(KEYS.logs)
    let logs: DayLog[] = raw ? JSON.parse(raw) : []
    if (from) logs = logs.filter((l) => l.date >= from)
    if (to) logs = logs.filter((l) => l.date <= to)
    return logs.sort((a, b) => a.date.localeCompare(b.date))
  }

  saveLog(log: DayLog): void {
    const logs = this.getLogs()
    const idx = logs.findIndex((l) => l.date === log.date)
    if (idx >= 0) logs[idx] = log
    else logs.push(log)
    localStorage.setItem(KEYS.logs, JSON.stringify(logs))
  }

  deleteLog(date: string): void {
    const logs = this.getLogs().filter((l) => l.date !== date)
    localStorage.setItem(KEYS.logs, JSON.stringify(logs))
  }

  getBodyLogs(): BodyLog[] {
    const raw = localStorage.getItem(KEYS.body)
    return raw ? JSON.parse(raw) : []
  }

  saveBodyLog(log: BodyLog): void {
    const logs = this.getBodyLogs()
    const idx = logs.findIndex((l) => l.date === log.date)
    if (idx >= 0) logs[idx] = log
    else logs.push(log)
    localStorage.setItem(KEYS.body, JSON.stringify(logs))
  }

  exportAll(): string {
    return JSON.stringify({
      settings: this.getSettings(),
      logs: this.getLogs(),
      bodyLogs: this.getBodyLogs(),
    })
  }

  importAll(json: string): void {
    const data = JSON.parse(json)
    if (data.settings) this.saveSettings(data.settings)
    if (data.logs) localStorage.setItem(KEYS.logs, JSON.stringify(data.logs))
    if (data.bodyLogs) localStorage.setItem(KEYS.body, JSON.stringify(data.bodyLogs))
  }

  clearAll(): void {
    localStorage.removeItem(KEYS.settings)
    localStorage.removeItem(KEYS.logs)
    localStorage.removeItem(KEYS.body)
  }
}
```

**Step 5: Run to verify passes**
```bash
npm run test:run -- src/lib/__tests__/localStorage.test.ts
```
Expected: PASS (all tests)

**Step 6: Commit**
```bash
git add src/lib/storage/ src/lib/__tests__/localStorage.test.ts
git commit -m "feat: add DataStore interface and localStorage implementation"
```

---

## Task 5: Zustand Store + useTdee Hook

**Files:**
- Create: `src/lib/store.ts`
- Create: `src/hooks/useTdee.ts`

**Step 1: Create the Zustand store**

Create `src/lib/store.ts`:
```typescript
'use client'
import { create } from 'zustand'
import { UserSettings, DayLog, BodyLog } from './types'
import { LocalDataStore } from './storage/localStorage'

const db = new LocalDataStore()

interface FluxStore {
  settings: UserSettings | null
  logs: DayLog[]
  bodyLogs: BodyLog[]
  hydrated: boolean
  // Actions
  init: () => void
  saveSettings: (s: UserSettings) => void
  saveLog: (log: DayLog) => void
  deleteLog: (date: string) => void
  saveBodyLog: (log: BodyLog) => void
  exportData: () => string
  importData: (json: string) => void
  clearAll: () => void
}

export const useFluxStore = create<FluxStore>((set, get) => ({
  settings: null,
  logs: [],
  bodyLogs: [],
  hydrated: false,

  init: () => {
    set({
      settings: db.getSettings(),
      logs: db.getLogs(),
      bodyLogs: db.getBodyLogs(),
      hydrated: true,
    })
  },

  saveSettings: (s) => {
    db.saveSettings(s)
    set({ settings: s })
  },

  saveLog: (log) => {
    db.saveLog(log)
    set({ logs: db.getLogs() })
  },

  deleteLog: (date) => {
    db.deleteLog(date)
    set({ logs: db.getLogs() })
  },

  saveBodyLog: (log) => {
    db.saveBodyLog(log)
    set({ bodyLogs: db.getBodyLogs() })
  },

  exportData: () => db.exportAll(),

  importData: (json) => {
    db.importAll(json)
    get().init()
  },

  clearAll: () => {
    db.clearAll()
    set({ settings: null, logs: [], bodyLogs: [] })
  },
}))
```

**Step 2: Create the useTdee hook**

Create `src/hooks/useTdee.ts`:
```typescript
'use client'
import { useMemo } from 'react'
import { useFluxStore } from '@/lib/store'
import { buildWeekSummaries, calcGoalDate } from '@/lib/tdee'
import { format, subDays, parseISO } from 'date-fns'
import { DayLog } from '@/lib/types'

export function useTdee() {
  const { settings, logs } = useFluxStore()

  return useMemo(() => {
    if (!settings || logs.length === 0) {
      return {
        weekSummaries: [],
        currentTDEE: null,
        recommendedIntake: null,
        goalDate: null,
        currentWeight: null,
        weightChartData: [],
      }
    }

    const weekSummaries = buildWeekSummaries(logs, settings)
    const latestWeek = weekSummaries.filter((w) => w.smoothedTDEE > 0).at(-1)
    const currentTDEE = latestWeek?.smoothedTDEE ?? null
    const recommendedIntake = latestWeek?.recommendedIntake ?? null

    // Current weight: 7-day average of most recent weight entries
    const recentLogs = logs.filter((l) => l.weight !== undefined).slice(-7)
    const currentWeight = recentLogs.length
      ? recentLogs.reduce((s, l) => s + l.weight!, 0) / recentLogs.length
      : null

    const goalDate =
      currentWeight && currentTDEE && recommendedIntake
        ? calcGoalDate(currentWeight, settings.goalWeight, currentTDEE, recommendedIntake, settings.units)
        : null

    // Weight chart data: last 30 days
    const today = new Date()
    const thirtyDaysAgo = subDays(today, 30)
    const logMap = new Map(logs.map((l) => [l.date, l]))

    const weightChartData: { date: string; weight: number | null; movingAvg: number | null }[] = []
    for (let i = 30; i >= 0; i--) {
      const date = format(subDays(today, i), 'yyyy-MM-dd')
      const log = logMap.get(date)
      weightChartData.push({ date, weight: log?.weight ?? null, movingAvg: null })
    }

    // 7-day moving average
    for (let i = 6; i < weightChartData.length; i++) {
      const window = weightChartData.slice(i - 6, i + 1).filter((d) => d.weight !== null)
      if (window.length >= 3) {
        const avg = window.reduce((s, d) => s + d.weight!, 0) / window.length
        weightChartData[i].movingAvg = Math.round(avg * 10) / 10
      }
    }

    return { weekSummaries, currentTDEE, recommendedIntake, goalDate, currentWeight, weightChartData }
  }, [settings, logs])
}
```

**Step 3: Commit**
```bash
git add src/lib/store.ts src/hooks/useTdee.ts
git commit -m "feat: add Zustand store and useTdee derived hook"
```

---

## Task 6: Root Layout + Navigation

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Update root layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { StoreProvider } from '@/components/layout/StoreProvider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Flux',
  description: 'Track your metabolic rate from real data',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 min-h-screen`}>
        <StoreProvider>
          <div className="flex min-h-screen">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r border-zinc-800">
              <Navbar />
            </aside>
            {/* Main content */}
            <main className="flex-1 md:ml-56 pb-20 md:pb-0">
              {children}
            </main>
          </div>
          {/* Mobile bottom nav */}
          <div className="fixed bottom-0 left-0 right-0 md:hidden border-t border-zinc-800 bg-zinc-950">
            <Navbar mobile />
          </div>
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  )
}
```

**Step 2: Create StoreProvider** (needed to init Zustand on mount)

Create `src/components/layout/StoreProvider.tsx`:
```tsx
'use client'
import { useEffect } from 'react'
import { useFluxStore } from '@/lib/store'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const init = useFluxStore((s) => s.init)
  useEffect(() => { init() }, [init])
  return <>{children}</>
}
```

**Step 3: Create Navbar**

Create `src/components/layout/Navbar.tsx`:
```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PenLine, History, PersonStanding, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/log', label: 'Log', icon: PenLine },
  { href: '/history', label: 'History', icon: History },
  { href: '/body', label: 'Body', icon: PersonStanding },
]

export function Navbar({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()

  if (mobile) {
    return (
      <nav className="flex justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors',
              pathname === href ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-100'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <nav className="flex flex-col h-full p-4 gap-1">
      <div className="mb-6 px-2">
        <h1 className="text-xl font-bold text-amber-400">Flux</h1>
        <p className="text-xs text-zinc-500">TDEE Tracker</p>
      </div>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === href
              ? 'bg-amber-400/10 text-amber-400'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      <div className="mt-auto">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-amber-400/10 text-amber-400'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </nav>
  )
}
```

**Step 4: Update root page (redirect logic)**

Replace `src/app/page.tsx`:
```tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFluxStore } from '@/lib/store'

export default function HomePage() {
  const router = useRouter()
  const { settings, hydrated } = useFluxStore()

  useEffect(() => {
    if (!hydrated) return
    if (settings) {
      router.replace('/dashboard')
    } else {
      router.replace('/onboarding')
    }
  }, [settings, hydrated, router])

  return null
}
```

**Step 5: Install lucide-react** (icons)
```bash
npm install lucide-react
```

**Step 6: Verify dev server runs**
```bash
npm run dev
```
Expected: No TypeScript errors, app loads and redirects to /onboarding (blank page for now).

**Step 7: Commit**
```bash
git add src/app/layout.tsx src/app/page.tsx src/components/layout/
git commit -m "feat: add root layout, navbar, and redirect logic"
```

---

## Task 7: Onboarding Flow

**Files:**
- Create: `src/app/onboarding/page.tsx`

**Step 1: Create onboarding page**

Create `src/app/onboarding/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFluxStore } from '@/lib/store'
import { UserSettings, Units } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const TOTAL_STEPS = 4

const DEFICIT_OPTIONS = [
  { value: -750, label: 'Aggressive loss', sub: '~1.5 lb/week' },
  { value: -500, label: 'Moderate loss', sub: '~1 lb/week' },
  { value: -250, label: 'Slow loss', sub: '~0.5 lb/week' },
  { value: 0, label: 'Maintain', sub: 'Hold current weight' },
  { value: 250, label: 'Lean bulk', sub: '~0.5 lb/week gain' },
]

const WINDOW_OPTIONS = [
  { value: 2, label: '2 weeks', sub: 'Reacts faster to changes' },
  { value: 4, label: '4 weeks', sub: 'Balanced (recommended)' },
  { value: 8, label: '8 weeks', sub: 'Very stable, slow to update' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const saveSettings = useFluxStore((s) => s.saveSettings)

  const [step, setStep] = useState(1)
  const [units, setUnits] = useState<Units>('lbs')
  const [currentWeight, setCurrentWeight] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | undefined>(undefined)
  const [height, setHeight] = useState('')
  const [tdeeWindow, setTdeeWindow] = useState(4)
  const [targetDeficit, setTargetDeficit] = useState(-500)

  const canProceed = () => {
    if (step === 2) {
      return currentWeight !== '' && goalWeight !== '' &&
        !isNaN(Number(currentWeight)) && !isNaN(Number(goalWeight))
    }
    return true
  }

  const handleFinish = () => {
    const settings: UserSettings = {
      startDate: format(new Date(), 'yyyy-MM-dd'),
      startWeight: Number(currentWeight),
      goalWeight: Number(goalWeight),
      units,
      tdeeWindow,
      targetDeficit,
      sex: sex ?? undefined,
      height: height ? Number(height) : undefined,
    }
    saveSettings(settings)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-zinc-400">Step {step} of {TOTAL_STEPS}</span>
          <span className="text-sm font-medium text-amber-400">Flux</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1" />
      </div>

      {step === 1 && (
        <div className="w-full space-y-4">
          <h2 className="text-2xl font-bold">Choose your units</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['lbs', 'kg'] as Units[]).map((u) => (
              <Card
                key={u}
                onClick={() => setUnits(u)}
                className={cn(
                  'cursor-pointer transition-all',
                  units === u ? 'border-amber-400 bg-amber-400/10' : 'border-zinc-700 hover:border-zinc-500'
                )}
              >
                <CardContent className="flex flex-col items-center py-6">
                  <span className="text-2xl font-bold">{u}</span>
                  <span className="text-sm text-zinc-400">{u === 'lbs' ? 'Imperial' : 'Metric'}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="w-full space-y-4">
          <h2 className="text-2xl font-bold">Your weight & goal</h2>
          <div className="space-y-3">
            <div>
              <Label>Current weight ({units})</Label>
              <Input
                type="number"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder={units === 'lbs' ? '180' : '82'}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Goal weight ({units})</Label>
              <Input
                type="number"
                step="0.1"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                placeholder={units === 'lbs' ? '165' : '75'}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Sex (optional, for BF% calculation)</Label>
              <div className="flex gap-2 mt-1">
                {(['male', 'female'] as const).map((s) => (
                  <Button
                    key={s}
                    variant={sex === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSex(sex === s ? undefined : s)}
                    className={sex === s ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300' : ''}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            {sex && (
              <div>
                <Label>Height (cm, for BF% calculation)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="w-full space-y-4">
          <h2 className="text-2xl font-bold">TDEE averaging window</h2>
          <p className="text-sm text-zinc-400">
            How many weeks of data to average your TDEE over. Longer = more stable but slower to adapt.
          </p>
          <div className="space-y-2">
            {WINDOW_OPTIONS.map((opt) => (
              <Card
                key={opt.value}
                onClick={() => setTdeeWindow(opt.value)}
                className={cn(
                  'cursor-pointer transition-all',
                  tdeeWindow === opt.value ? 'border-amber-400 bg-amber-400/10' : 'border-zinc-700 hover:border-zinc-500'
                )}
              >
                <CardContent className="flex items-center justify-between py-4 px-4">
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-sm text-zinc-400">{opt.sub}</p>
                  </div>
                  {tdeeWindow === opt.value && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="w-full space-y-4">
          <h2 className="text-2xl font-bold">Your goal</h2>
          <p className="text-sm text-zinc-400">How fast do you want to reach your goal weight?</p>
          <div className="space-y-2">
            {DEFICIT_OPTIONS.map((opt) => (
              <Card
                key={opt.value}
                onClick={() => setTargetDeficit(opt.value)}
                className={cn(
                  'cursor-pointer transition-all',
                  targetDeficit === opt.value ? 'border-amber-400 bg-amber-400/10' : 'border-zinc-700 hover:border-zinc-500'
                )}
              >
                <CardContent className="flex items-center justify-between py-4 px-4">
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-sm text-zinc-400">{opt.sub}</p>
                  </div>
                  {targetDeficit === opt.value && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="w-full flex gap-3 mt-8">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            Back
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1 bg-amber-400 text-zinc-950 hover:bg-amber-300 disabled:opacity-50"
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            className="flex-1 bg-amber-400 text-zinc-950 hover:bg-amber-300"
          >
            Get started
          </Button>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Verify in browser**

Run `npm run dev`, navigate to http://localhost:3000 — should redirect to /onboarding.
Walk through all 4 steps, click "Get started" → should land on /dashboard (blank page).

**Step 3: Commit**
```bash
git add src/app/onboarding/
git commit -m "feat: add 4-step onboarding wizard"
```

---

## Task 8: Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/layout/StatCard.tsx`
- Create: `src/components/charts/WeightChart.tsx`
- Create: `src/components/forms/DailyLogForm.tsx`

**Step 1: Create StatCard component**

Create `src/components/layout/StatCard.tsx`:
```tsx
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}

export function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? 'border-amber-400/50' : ''}>
      <CardContent className="p-4">
        <p className="text-xs text-zinc-400 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-amber-400' : 'text-zinc-50'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}
```

**Step 2: Create WeightChart**

Create `src/components/charts/WeightChart.tsx`:
```tsx
'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'

interface WeightChartProps {
  data: { date: string; weight: number | null; movingAvg: number | null }[]
  units: 'lbs' | 'kg'
}

export function WeightChart({ data, units }: WeightChartProps) {
  const hasData = data.some((d) => d.weight !== null)
  if (!hasData) return (
    <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
      No weight data yet. Start logging daily!
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => format(parseISO(d), 'M/d')}
          tick={{ fontSize: 11, fill: '#71717a' }}
          interval={6}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#71717a' }}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
          labelFormatter={(d) => format(parseISO(d as string), 'MMM d')}
          formatter={(value: number | null, name: string) => [
            value !== null ? `${value} ${units}` : '—',
            name === 'weight' ? 'Weight' : '7-day avg',
          ]}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#71717a"
          strokeWidth={1}
          dot={{ r: 2, fill: '#71717a' }}
          connectNulls={false}
          name="weight"
        />
        <Line
          type="monotone"
          dataKey="movingAvg"
          stroke="#fbbf24"
          strokeWidth={2}
          dot={false}
          connectNulls={true}
          name="movingAvg"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Step 3: Create DailyLogForm**

Create `src/components/forms/DailyLogForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useFluxStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface DailyLogFormProps {
  date?: string    // YYYY-MM-DD, defaults to today
  compact?: boolean
  onSaved?: () => void
}

export function DailyLogForm({ date, compact, onSaved }: DailyLogFormProps) {
  const today = date ?? format(new Date(), 'yyyy-MM-dd')
  const { logs, saveLog, settings } = useFluxStore()
  const existing = logs.find((l) => l.date === today)

  const [weight, setWeight] = useState(existing?.weight?.toString() ?? '')
  const [calories, setCalories] = useState(existing?.calories?.toString() ?? '')

  const handleSave = () => {
    if (!weight && !calories) return
    saveLog({
      date: today,
      weight: weight ? Number(weight) : undefined,
      calories: calories ? Number(calories) : undefined,
    })
    toast.success('Logged!')
    onSaved?.()
  }

  return (
    <div className={compact ? 'flex gap-2 items-end' : 'space-y-3'}>
      <div className={compact ? 'flex-1' : ''}>
        {!compact && <Label>Weight ({settings?.units ?? 'lbs'})</Label>}
        <Input
          type="number"
          step="0.1"
          placeholder={compact ? `Weight (${settings?.units})` : '178.5'}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className={compact ? '' : 'mt-1'}
        />
      </div>
      <div className={compact ? 'flex-1' : ''}>
        {!compact && <Label>Calories</Label>}
        <Input
          type="number"
          placeholder="Calories"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          className={compact ? '' : 'mt-1'}
        />
      </div>
      <Button
        onClick={handleSave}
        className="bg-amber-400 text-zinc-950 hover:bg-amber-300"
        size={compact ? 'default' : 'default'}
      >
        Log
      </Button>
    </div>
  )
}
```

**Step 4: Create Dashboard page**

Create `src/app/dashboard/page.tsx`:
```tsx
'use client'
import { useFluxStore } from '@/lib/store'
import { useTdee } from '@/hooks/useTdee'
import { StatCard } from '@/components/layout/StatCard'
import { WeightChart } from '@/components/charts/WeightChart'
import { DailyLogForm } from '@/components/forms/DailyLogForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, parseISO, differenceInDays, subDays } from 'date-fns'

function calcStreak(logs: { date: string; weight?: number; calories?: number }[]): number {
  const today = format(new Date(), 'yyyy-MM-dd')
  let streak = 0
  let checkDate = today
  const logDates = new Set(
    logs.filter((l) => l.weight !== undefined && l.calories !== undefined).map((l) => l.date)
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

  if (!hydrated) return null

  const streak = calcStreak(logs)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayLogged = logs.some((l) => l.date === todayStr && l.weight !== undefined && l.calories !== undefined)

  const formatWeight = (w: number | null) =>
    w !== null ? `${w.toFixed(1)} ${settings?.units}` : '—'

  const formatDate = (d: Date | null) =>
    d ? format(d, 'MMM d, yyyy') : '—'

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-400">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        {streak > 0 && (
          <Badge variant="outline" className="border-amber-400 text-amber-400">
            🔥 {streak} day streak
          </Badge>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Smoothed TDEE"
          value={currentTDEE ? `${Math.round(currentTDEE).toLocaleString()} kcal` : '—'}
          sub="Your estimated burn rate"
          highlight
        />
        <StatCard
          label="Recommended"
          value={recommendedIntake ? `${Math.round(recommendedIntake).toLocaleString()} kcal` : '—'}
          sub={settings ? `TDEE ${settings.targetDeficit > 0 ? '+' : ''}${settings.targetDeficit}` : undefined}
        />
        <StatCard
          label="Current Weight"
          value={formatWeight(currentWeight)}
          sub="7-day average"
        />
        <StatCard
          label="Goal Date"
          value={formatDate(goalDate)}
          sub={`Goal: ${settings ? formatWeight(settings.goalWeight) : '—'}`}
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
          <CardTitle className="text-sm font-medium text-zinc-400">Today's log</CardTitle>
        </CardHeader>
        <CardContent>
          {todayLogged ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400">✓</span>
              <span className="text-zinc-300">Logged today</span>
              <span className="text-zinc-500 ml-auto">
                {logs.find((l) => l.date === todayStr)?.weight} {settings?.units} · {logs.find((l) => l.date === todayStr)?.calories} kcal
              </span>
            </div>
          ) : (
            <DailyLogForm compact />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 5: Verify in browser**

Navigate to http://localhost:3000 — after onboarding, should see dashboard with stat cards and empty chart.

**Step 6: Commit**
```bash
git add src/app/dashboard/ src/components/
git commit -m "feat: add dashboard with stats, weight chart, and quick-log"
```

---

## Task 9: Log Page

**Files:**
- Create: `src/app/log/page.tsx`

**Step 1: Create log page**

Create `src/app/log/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useFluxStore } from '@/lib/store'
import { DailyLogForm } from '@/components/forms/DailyLogForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, subDays, addDays, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function LogPage() {
  const { logs, settings } = useFluxStore()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const parsed = parseISO(selectedDate)
  const weekStart = startOfWeek(parsed, { weekStartsOn: 1 }) // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))

  const logMap = new Map(logs.map((l) => [l.date, l]))

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd')
  const isFuture = selectedDate > format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Log</h1>
        {!isToday && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}>
            Today
          </Button>
        )}
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(format(subDays(parsed, 1), 'yyyy-MM-dd'))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="flex-1 text-center font-medium">
          {isToday ? 'Today' : format(parsed, 'EEEE, MMM d')}
        </span>
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
        <CardContent className="pt-4">
          {isFuture ? (
            <p className="text-sm text-zinc-400 text-center py-4">Can't log future dates</p>
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
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day, i) => {
              const date = weekDays[i]
              const log = logMap.get(date)
              const isSelected = date === selectedDate
              const hasWeight = log?.weight !== undefined
              const hasCals = log?.calories !== undefined
              const isComplete = hasWeight && hasCals

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg text-xs transition-colors',
                    isSelected ? 'bg-amber-400/10 text-amber-400' : 'hover:bg-zinc-800'
                  )}
                >
                  <span className="text-zinc-500 mb-1">{day}</span>
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    isComplete ? 'bg-amber-400' :
                    hasWeight || hasCals ? 'bg-zinc-500' :
                    'bg-zinc-700'
                  )} />
                </button>
              )
            })}
          </div>
          <div className="flex gap-3 mt-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Complete</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" /> Partial</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-700 inline-block" /> Empty</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/app/log/
git commit -m "feat: add log page with date navigation and week overview"
```

---

## Task 10: History Page

**Files:**
- Create: `src/app/history/page.tsx`

**Step 1: Create history page**

Create `src/app/history/page.tsx`:
```tsx
'use client'
import { useFluxStore } from '@/lib/store'
import { useTdee } from '@/hooks/useTdee'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400">No history yet.</p>
            <p className="text-sm text-zinc-500 mt-1">Log at least a few days to see weekly summaries.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 px-4 text-xs text-zinc-500 uppercase tracking-wide">
            <span>Week</span>
            <span className="text-right">Avg wt</span>
            <span className="text-right">TDEE</span>
            <span className="text-right">Target</span>
          </div>

          {reversed.map((week) => (
            <Card key={week.weekStart}>
              <CardContent className="p-0">
                {/* Summary row */}
                <div className="grid grid-cols-4 gap-2 p-4 items-center">
                  <div>
                    <p className="text-sm font-medium">
                      {format(parseISO(week.weekStart), 'MMM d')}
                    </p>
                    <p className="text-xs text-zinc-500">{week.loggedDays}/7 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{week.avgWeight ? `${week.avgWeight.toFixed(1)}` : '—'}</p>
                    <p className="text-xs text-zinc-500">{settings?.units}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-amber-400">
                      {week.smoothedTDEE ? Math.round(week.smoothedTDEE).toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      raw: {week.rawTDEE ? Math.round(week.rawTDEE).toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {week.recommendedIntake ? Math.round(week.recommendedIntake).toLocaleString() : '—'}
                    </p>
                    <p className="text-xs text-zinc-500">kcal/day</p>
                  </div>
                </div>

                {/* Day detail rows */}
                {week.days.length > 0 && (
                  <div className="border-t border-zinc-800 px-4 py-2 space-y-1">
                    {week.days.map((day) => (
                      <div key={day.date} className="flex justify-between text-xs text-zinc-500">
                        <span>{format(parseISO(day.date), 'EEE M/d')}</span>
                        <span className="flex gap-4">
                          <span>{day.weight ? `${day.weight} ${settings?.units}` : '—'}</span>
                          <span>{day.calories ? `${day.calories.toLocaleString()} kcal` : '—'}</span>
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
```

**Step 2: Commit**
```bash
git add src/app/history/
git commit -m "feat: add history page with weekly summaries and JSON export"
```

---

## Task 11: Body Page

**Files:**
- Create: `src/app/body/page.tsx`
- Create: `src/components/charts/BfChart.tsx`
- Create: `src/components/forms/BodyLogForm.tsx`

**Step 1: Create BfChart**

Create `src/components/charts/BfChart.tsx`:
```tsx
'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'

interface BfChartProps {
  data: { date: string; bfPercent: number | null | undefined }[]
}

export function BfChart({ data }: BfChartProps) {
  const hasData = data.some((d) => d.bfPercent != null)
  if (!hasData) return (
    <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
      No body composition data yet.
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => format(parseISO(d), 'M/d')}
          tick={{ fontSize: 11, fill: '#71717a' }}
        />
        <YAxis tick={{ fontSize: 11, fill: '#71717a' }} unit="%" domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
          labelFormatter={(d) => format(parseISO(d as string), 'MMM d')}
          formatter={(v: number) => [`${v.toFixed(1)}%`, 'Body Fat']}
        />
        <Line type="monotone" dataKey="bfPercent" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3, fill: '#fbbf24' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

**Step 2: Create BodyLogForm**

Create `src/components/forms/BodyLogForm.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useFluxStore } from '@/lib/store'
import { calcNavyBF } from '@/lib/tdee'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function BodyLogForm() {
  const { settings, logs, saveBodyLog } = useFluxStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayWeight = logs.find((l) => l.date === today)?.weight

  const [weight, setWeight] = useState(todayWeight?.toString() ?? '')
  const [neck, setNeck] = useState('')
  const [waist, setWaist] = useState('')
  const [hips, setHips] = useState('')
  const [manualBf, setManualBf] = useState('')

  const canCalcNavy = neck && waist && settings?.height && settings?.sex
  let calculatedBf: number | undefined
  if (canCalcNavy) {
    try {
      calculatedBf = calcNavyBF(
        Number(neck),
        Number(waist),
        settings!.height!,
        settings!.sex!,
        settings?.sex === 'female' ? Number(hips) : undefined
      )
    } catch {}
  }

  const handleSave = () => {
    if (!weight) { toast.error('Weight is required'); return }
    saveBodyLog({
      date: today,
      weight: Number(weight),
      neck: neck ? Number(neck) : undefined,
      waist: waist ? Number(waist) : undefined,
      hips: hips ? Number(hips) : undefined,
      bfPercent: calculatedBf ?? (manualBf ? Number(manualBf) : undefined),
    })
    toast.success('Body measurement saved!')
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Weight ({settings?.units})</Label>
        <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Neck (cm)</Label>
          <Input type="number" step="0.1" value={neck} onChange={(e) => setNeck(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Waist (cm)</Label>
          <Input type="number" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} className="mt-1" />
        </div>
        {settings?.sex === 'female' && (
          <div>
            <Label>Hips (cm)</Label>
            <Input type="number" step="0.1" value={hips} onChange={(e) => setHips(e.target.value)} className="mt-1" />
          </div>
        )}
      </div>
      {calculatedBf !== undefined ? (
        <div className="p-3 rounded-lg bg-amber-400/10 border border-amber-400/30">
          <p className="text-sm text-zinc-400">Calculated BF% (Navy method)</p>
          <p className="text-2xl font-bold text-amber-400">{calculatedBf.toFixed(1)}%</p>
        </div>
      ) : (
        <div>
          <Label>BF% (manual, if no measurements)</Label>
          <Input
            type="number"
            step="0.1"
            value={manualBf}
            onChange={(e) => setManualBf(e.target.value)}
            placeholder="e.g. 18.5"
            className="mt-1"
          />
        </div>
      )}
      <Button onClick={handleSave} className="w-full bg-amber-400 text-zinc-950 hover:bg-amber-300">
        Save measurement
      </Button>
    </div>
  )
}
```

**Step 3: Create Body page**

Create `src/app/body/page.tsx`:
```tsx
'use client'
import { useFluxStore } from '@/lib/store'
import { BodyLogForm } from '@/components/forms/BodyLogForm'
import { BfChart } from '@/components/charts/BfChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function BodyPage() {
  const { bodyLogs } = useFluxStore()

  const chartData = bodyLogs
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({ date: l.date, bfPercent: l.bfPercent }))

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Body</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Today's measurement</CardTitle>
        </CardHeader>
        <CardContent>
          <BodyLogForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Body fat trend</CardTitle>
        </CardHeader>
        <CardContent>
          <BfChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 4: Commit**
```bash
git add src/app/body/ src/components/charts/ src/components/forms/BodyLogForm.tsx
git commit -m "feat: add body page with BF% tracking and Navy method calculator"
```

---

## Task 12: Settings Page

**Files:**
- Create: `src/app/settings/page.tsx`

**Step 1: Create settings page**

Create `src/app/settings/page.tsx`:
```tsx
'use client'
import { useState, useRef } from 'react'
import { useFluxStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Download, Upload, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const { settings, saveSettings, exportData, importData, clearAll } = useFluxStore()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  if (!settings) return null

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flux-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        importData(ev.target!.result as string)
        toast.success('Data imported!')
      } catch {
        toast.error('Invalid file format')
      }
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return }
    clearAll()
    router.push('/onboarding')
  }

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>TDEE averaging window</Label>
            <Select
              value={String(settings.tdeeWindow)}
              onValueChange={(v) => saveSettings({ ...settings, tdeeWindow: Number(v) })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 weeks</SelectItem>
                <SelectItem value="4">4 weeks</SelectItem>
                <SelectItem value="8">8 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Daily target ({settings.targetDeficit > 0 ? '+' : ''}{settings.targetDeficit} kcal)</Label>
            <Select
              value={String(settings.targetDeficit)}
              onValueChange={(v) => saveSettings({ ...settings, targetDeficit: Number(v) })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-750">−750 kcal (aggressive loss)</SelectItem>
                <SelectItem value="-500">−500 kcal (moderate loss)</SelectItem>
                <SelectItem value="-250">−250 kcal (slow loss)</SelectItem>
                <SelectItem value="0">0 kcal (maintain)</SelectItem>
                <SelectItem value="250">+250 kcal (lean bulk)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Goal weight ({settings.units})</Label>
            <Input
              type="number"
              step="0.1"
              defaultValue={settings.goalWeight}
              onBlur={(e) => saveSettings({ ...settings, goalWeight: Number(e.target.value) })}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={handleExport} className="w-full gap-2">
            <Download className="h-4 w-4" /> Export JSON
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full gap-2">
            <Upload className="h-4 w-4" /> Import JSON
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button
            variant="destructive"
            onClick={handleClear}
            className="w-full gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {confirmClear ? 'Tap again to confirm reset' : 'Reset all data'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 2: Commit**
```bash
git add src/app/settings/
git commit -m "feat: add settings page with preferences, export, import, and reset"
```

---

## Task 13: Final Polish

**Step 1: Add empty states to dashboard for new users**

In `src/app/dashboard/page.tsx`, if `!settings` after hydration, show a message pointing to onboarding.

**Step 2: Verify all routes work end-to-end**
- Complete onboarding flow → dashboard
- Log today's weight + calories
- Check history page shows the week
- Check body page, enter measurements
- Settings page: change window, export, import

**Step 3: Run all unit tests one final time**
```bash
npm run test:run
```
Expected: All tests pass.

**Step 4: Run build to check for TypeScript errors**
```bash
npm run build
```
Expected: No errors. If any type errors, fix them.

**Step 5: Final commit**
```bash
git add -A
git commit -m "feat: complete Flux TDEE tracker MVP"
```

---

## Verification Checklist

- [ ] `npm run dev` starts on port 3000 without errors
- [ ] `/` redirects to `/onboarding` on first visit, `/dashboard` if settings exist
- [ ] Completing all 4 onboarding steps saves settings and redirects to dashboard
- [ ] Logging weight + calories on `/log` updates dashboard stats
- [ ] TDEE appears on dashboard after 2+ days of complete logs in a week
- [ ] `/history` table shows correct rawTDEE and smoothedTDEE (verify against manual calc)
- [ ] BF% calculates via Navy formula on `/body` when neck + waist (+ hips for female) provided
- [ ] Export JSON → clear all → import JSON round-trips all data
- [ ] Bottom nav visible on mobile (<768px), sidebar on desktop
- [ ] Dark zinc/amber theme renders correctly
- [ ] `npm run test:run` — all tests pass
- [ ] `npm run build` — no TypeScript errors
