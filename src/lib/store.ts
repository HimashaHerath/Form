import { create } from 'zustand'
import type { UserSettings, DayLog, BodyLog } from './types'
import type { DataStore } from './storage/interface'
import type { User } from '@supabase/supabase-js'

let _db: DataStore | null = null

interface FluxStore {
  settings: UserSettings | null
  logs: DayLog[]
  bodyLogs: BodyLog[]
  hydrated: boolean
  user: User | null

  setUser: (user: User | null) => void
  init: (db: DataStore) => Promise<void>
  saveSettings: (s: UserSettings) => Promise<void>
  saveLog: (log: DayLog) => Promise<void>
  deleteLog: (date: string) => Promise<void>
  saveBodyLog: (log: BodyLog) => Promise<void>
  exportData: () => Promise<string>
  importData: (json: string) => Promise<void>
  clearAll: () => Promise<void>
  signOut: () => Promise<void>
}

export const useFluxStore = create<FluxStore>((set, get) => ({
  settings: null,
  logs: [],
  bodyLogs: [],
  hydrated: false,
  user: null,

  setUser: (user) => set({ user }),

  init: async (db) => {
    _db = db
    const [settings, logs, bodyLogs] = await Promise.all([
      db.getSettings(),
      db.getLogs(),
      db.getBodyLogs(),
    ])
    set({ settings, logs, bodyLogs, hydrated: true })
  },

  // Optimistic: update state immediately, persist in background
  saveSettings: async (s) => {
    set({ settings: s })
    await _db!.saveSettings(s)
  },

  // Optimistic: splice log into state immediately, then persist
  saveLog: async (log) => {
    set((state) => {
      const logs = [...state.logs]
      const idx = logs.findIndex((l) => l.date === log.date)
      if (idx >= 0) logs[idx] = log
      else logs.push(log)
      logs.sort((a, b) => a.date.localeCompare(b.date))
      return { logs }
    })
    await _db!.saveLog(log)
  },

  // Optimistic: remove from state immediately, then persist
  deleteLog: async (date) => {
    set((state) => ({ logs: state.logs.filter((l) => l.date !== date) }))
    await _db!.deleteLog(date)
  },

  // Optimistic: splice body log into state immediately, then persist
  saveBodyLog: async (log) => {
    set((state) => {
      const bodyLogs = [...state.bodyLogs]
      const idx = bodyLogs.findIndex((l) => l.date === log.date)
      if (idx >= 0) bodyLogs[idx] = log
      else bodyLogs.push(log)
      return { bodyLogs }
    })
    await _db!.saveBodyLog(log)
  },

  exportData: () => _db!.exportAll(),

  importData: async (json) => {
    await _db!.importAll(json)
    await get().init(_db!)
  },

  clearAll: async () => {
    await _db!.clearAll()
    set({ settings: null, logs: [], bodyLogs: [], hydrated: false })
  },

  signOut: async () => {
    const { createClient } = await import('./supabase/client')
    await createClient().auth.signOut()
    _db = null
    set({ settings: null, logs: [], bodyLogs: [], hydrated: false, user: null })
  },
}))
