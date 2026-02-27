import type { UserSettings, DayLog, BodyLog } from '../types'
import type { DataStore } from './interface'

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
    const raw = localStorage.getItem(KEYS.logs)
    const logs: DayLog[] = raw ? JSON.parse(raw) : []
    const idx = logs.findIndex((l) => l.date === log.date)
    if (idx >= 0) logs[idx] = log
    else logs.push(log)
    localStorage.setItem(KEYS.logs, JSON.stringify(logs))
  }

  deleteLog(date: string): void {
    const raw = localStorage.getItem(KEYS.logs)
    const logs: DayLog[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(KEYS.logs, JSON.stringify(logs.filter((l) => l.date !== date)))
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
