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

  // Optimistic: update state immediately, rollback on failure
  saveSettings: async (s) => {
    const prev = get().settings
    set({ settings: s })
    try {
      await _db!.saveSettings(s)
    } catch (e) {
      set({ settings: prev })
      throw e
    }
  },

  // Optimistic: splice log into state immediately, rollback on failure
  saveLog: async (log) => {
    const prev = get().logs
    set((state) => {
      const logs = [...state.logs]
      const idx = logs.findIndex((l) => l.date === log.date)
      if (idx >= 0) logs[idx] = log
      else logs.push(log)
      logs.sort((a, b) => a.date.localeCompare(b.date))
      return { logs }
    })
    try {
      await _db!.saveLog(log)
    } catch (e) {
      set({ logs: prev })
      throw e
    }
  },

  // Optimistic: remove from state immediately, rollback on failure
  deleteLog: async (date) => {
    const prev = get().logs
    set((state) => ({ logs: state.logs.filter((l) => l.date !== date) }))
    try {
      await _db!.deleteLog(date)
    } catch (e) {
      set({ logs: prev })
      throw e
    }
  },

  // Optimistic: splice body log into state immediately, rollback on failure
  saveBodyLog: async (log) => {
    const prev = get().bodyLogs
    set((state) => {
      const bodyLogs = [...state.bodyLogs]
      const idx = bodyLogs.findIndex((l) => l.date === log.date)
      if (idx >= 0) bodyLogs[idx] = log
      else bodyLogs.push(log)
      return { bodyLogs }
    })
    try {
      await _db!.saveBodyLog(log)
    } catch (e) {
      set({ bodyLogs: prev })
      throw e
    }
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
