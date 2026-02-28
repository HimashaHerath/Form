import type { UserSettings, DayLog, BodyLog } from '../types'
import type { DataStore } from './interface'

const KEYS = {
  settings: 'flux:settings',
  logs: 'flux:logs',
  body: 'flux:body',
} as const

export class LocalDataStore implements DataStore {
  async getSettings(): Promise<UserSettings | null> {
    const raw = localStorage.getItem(KEYS.settings)
    return raw ? JSON.parse(raw) : null
  }

  async saveSettings(s: UserSettings): Promise<void> {
    localStorage.setItem(KEYS.settings, JSON.stringify(s))
  }

  async getLogs(from?: string, to?: string): Promise<DayLog[]> {
    const raw = localStorage.getItem(KEYS.logs)
    let logs: DayLog[] = raw ? JSON.parse(raw) : []
    if (from) logs = logs.filter((l) => l.date >= from)
    if (to) logs = logs.filter((l) => l.date <= to)
    return logs.sort((a, b) => a.date.localeCompare(b.date))
  }

  async saveLog(log: DayLog): Promise<void> {
    const raw = localStorage.getItem(KEYS.logs)
    const logs: DayLog[] = raw ? JSON.parse(raw) : []
    const idx = logs.findIndex((l) => l.date === log.date)
    if (idx >= 0) logs[idx] = log
    else logs.push(log)
    localStorage.setItem(KEYS.logs, JSON.stringify(logs))
  }

  async deleteLog(date: string): Promise<void> {
    const raw = localStorage.getItem(KEYS.logs)
    const logs: DayLog[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(KEYS.logs, JSON.stringify(logs.filter((l) => l.date !== date)))
  }

  async getBodyLogs(): Promise<BodyLog[]> {
    const raw = localStorage.getItem(KEYS.body)
    return raw ? JSON.parse(raw) : []
  }

  async saveBodyLog(log: BodyLog): Promise<void> {
    const logs = await this.getBodyLogs()
    const idx = logs.findIndex((l) => l.date === log.date)
    if (idx >= 0) logs[idx] = log
    else logs.push(log)
    localStorage.setItem(KEYS.body, JSON.stringify(logs))
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
    if (data.logs) localStorage.setItem(KEYS.logs, JSON.stringify(data.logs))
    if (data.bodyLogs) localStorage.setItem(KEYS.body, JSON.stringify(data.bodyLogs))
  }

  async clearAll(): Promise<void> {
    localStorage.removeItem(KEYS.settings)
    localStorage.removeItem(KEYS.logs)
    localStorage.removeItem(KEYS.body)
  }
}
