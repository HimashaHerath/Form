import type { UserSettings, DayLog, BodyLog } from '../types'

export interface DataStore {
  getSettings(): UserSettings | null
  saveSettings(s: UserSettings): void
  getLogs(from?: string, to?: string): DayLog[]
  saveLog(log: DayLog): void
  deleteLog(date: string): void
  getBodyLogs(): BodyLog[]
  saveBodyLog(log: BodyLog): void
  exportAll(): string
  importAll(json: string): void
  clearAll(): void
}
