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
