import { createClient } from '../supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DataStore } from './interface'
import type { UserSettings, DayLog, BodyLog } from '../types'

type SupabaseErrorLike = {
  code?: string
  details?: string
  hint?: string
  message?: string
  status?: number
}

function toErrorPart(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return null
}

function readErrorField(error: object, key: keyof SupabaseErrorLike): string | null {
  return toErrorPart(Reflect.get(error, key))
}

function formatSupabaseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name || 'Unknown Error'
  }

  if (error && typeof error === 'object') {
    const e = error as object
    const message = readErrorField(e, 'message')
    const code = readErrorField(e, 'code')
    const details = readErrorField(e, 'details')
    const hint = readErrorField(e, 'hint')
    const status = readErrorField(e, 'status')
    const parts = [
      message,
      code ? `code=${code}` : null,
      details ? `details=${details}` : null,
      hint ? `hint=${hint}` : null,
      status ? `status=${status}` : null,
    ].filter(Boolean)

    if (parts.length > 0) return parts.join(' | ')

    const ownProps = Object.getOwnPropertyNames(e)
    if (ownProps.length > 0) {
      return ownProps
        .map((prop) => `${prop}=${String(Reflect.get(e, prop))}`)
        .join(' | ')
    }

    const name = (e as { constructor?: { name?: string } }).constructor?.name
    return name ? `Unknown ${name} error` : 'Unknown object error'
  }

  return String(error)
}

function reportSupabaseError(
  context: string,
  error: unknown,
  level: 'warn' | 'error' = 'error'
): void {
  const message = `[SupabaseDataStore] ${context}: ${formatSupabaseError(error)}`
  const shouldWarn = level === 'warn' || process.env.NODE_ENV !== 'production'
  if (shouldWarn) {
    console.warn(message)
    return
  }
  console.error(message)
}

export class SupabaseDataStore implements DataStore {
  private userId: string
  private client: SupabaseClient

  constructor(userId: string, client?: SupabaseClient) {
    this.userId = userId
    this.client = client ?? createClient()
  }

  private get db() {
    return this.client
  }

  async getSettings(): Promise<UserSettings | null> {
    try {
      const { data, error } = await this.db
        .from('settings')
        .select('*')
        .eq('user_id', this.userId)
        .limit(1)

      if (error) {
        reportSupabaseError('getSettings error', error, 'warn')
        return null
      }

      const row = data?.[0]
      if (!row) return null

      return {
        startDate: row.start_date,
        startWeight: row.start_weight,
        goalWeight: row.goal_weight,
        units: row.units,
        tdeeWindow: row.tdee_window,
        targetDeficit: row.target_deficit,
        sex: row.sex ?? undefined,
        height: row.height ?? undefined,
        age: row.age ?? undefined,
        activityMultiplier: row.activity_multiplier ?? undefined,
      }
    } catch (error) {
      reportSupabaseError('getSettings request failed', error, 'warn')
      return null
    }
  }

  async saveSettings(s: UserSettings): Promise<void> {
    const { error } = await this.db.from('settings').upsert({
      user_id: this.userId,
      start_date: s.startDate,
      start_weight: s.startWeight,
      goal_weight: s.goalWeight,
      units: s.units,
      tdee_window: s.tdeeWindow,
      target_deficit: s.targetDeficit,
      sex: s.sex ?? null,
      height: s.height ?? null,
      age: s.age ?? null,
      activity_multiplier: s.activityMultiplier ?? null,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      reportSupabaseError('saveSettings error', error)
    }
  }

  async getLogs(from?: string, to?: string): Promise<DayLog[]> {
    try {
      let query = this.db
        .from('day_logs')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: true })

      if (from) query = query.gte('date', from)
      if (to) query = query.lte('date', to)

      const { data, error } = await query
      if (error) {
        reportSupabaseError('getLogs error', error, 'warn')
        return []
      }

      return (data ?? []).map((d) => ({
        date: d.date,
        weight: d.weight ?? undefined,
        calories: d.calories ?? undefined,
      }))
    } catch (error) {
      reportSupabaseError('getLogs request failed', error, 'warn')
      return []
    }
  }

  async saveLog(log: DayLog): Promise<void> {
    const { error } = await this.db.from('day_logs').upsert(
      {
        user_id: this.userId,
        date: log.date,
        weight: log.weight ?? null,
        calories: log.calories ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    )
    if (error) reportSupabaseError('saveLog error', error)
  }

  async deleteLog(date: string): Promise<void> {
    const { error } = await this.db
      .from('day_logs')
      .delete()
      .eq('user_id', this.userId)
      .eq('date', date)
    if (error) reportSupabaseError('deleteLog error', error)
  }

  async getBodyLogs(): Promise<BodyLog[]> {
    try {
      const { data, error } = await this.db
        .from('body_logs')
        .select('*')
        .eq('user_id', this.userId)
        .order('date', { ascending: true })

      if (error) {
        reportSupabaseError('getBodyLogs error', error, 'warn')
        return []
      }

      return (data ?? []).map((d) => ({
        date: d.date,
        weight: d.weight,
        neck: d.neck ?? undefined,
        waist: d.waist ?? undefined,
        hips: d.hips ?? undefined,
        bfPercent: d.bf_percent ?? undefined,
      }))
    } catch (error) {
      reportSupabaseError('getBodyLogs request failed', error, 'warn')
      return []
    }
  }

  async saveBodyLog(log: BodyLog): Promise<void> {
    const { error } = await this.db.from('body_logs').upsert(
      {
        user_id: this.userId,
        date: log.date,
        weight: log.weight,
        neck: log.neck ?? null,
        waist: log.waist ?? null,
        hips: log.hips ?? null,
        bf_percent: log.bfPercent ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date' }
    )
    if (error) reportSupabaseError('saveBodyLog error', error)
  }

  async exportAll(): Promise<string> {
    const [settings, logs, bodyLogs] = await Promise.all([
      this.getSettings(),
      this.getLogs(),
      this.getBodyLogs(),
    ])
    return JSON.stringify({ settings, logs, bodyLogs })
  }

  async importAll(json: string): Promise<void> {
    const data = JSON.parse(json)
    if (data.settings) await this.saveSettings(data.settings)
    if (data.logs) {
      for (const log of data.logs) await this.saveLog(log)
    }
    if (data.bodyLogs) {
      for (const log of data.bodyLogs) await this.saveBodyLog(log)
    }
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      this.db.from('settings').delete().eq('user_id', this.userId),
      this.db.from('day_logs').delete().eq('user_id', this.userId),
      this.db.from('body_logs').delete().eq('user_id', this.userId),
    ])
  }
}
