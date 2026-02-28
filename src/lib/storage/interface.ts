import type { UserSettings, DayLog, BodyLog } from '../types'

export interface DataStore {
  getSettings(): Promise<UserSettings | null>
  saveSettings(s: UserSettings): Promise<void>
  getLogs(from?: string, to?: string): Promise<DayLog[]>
  saveLog(log: DayLog): Promise<void>
  deleteLog(date: string): Promise<void>
  getBodyLogs(): Promise<BodyLog[]>
  saveBodyLog(log: BodyLog): Promise<void>
  exportAll(): Promise<string>
  importAll(json: string): Promise<void>
  clearAll(): Promise<void>
}
