import { create } from 'zustand'
import type { UserSettings, DayLog, BodyLog } from './types'
import { LocalDataStore } from './storage/localStorage'

let _db: LocalDataStore | null = null
function getDb(): LocalDataStore {
  if (!_db) _db = new LocalDataStore()
  return _db
}

interface FluxStore {
  settings: UserSettings | null
  logs: DayLog[]
  bodyLogs: BodyLog[]
  hydrated: boolean
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
    const db = getDb()
    set({
      settings: db.getSettings(),
      logs: db.getLogs(),
      bodyLogs: db.getBodyLogs(),
      hydrated: true,
    })
  },

  saveSettings: (s) => {
    getDb().saveSettings(s)
    set({ settings: s })
  },

  saveLog: (log) => {
    const db = getDb()
    db.saveLog(log)
    set({ logs: db.getLogs() })
  },

  deleteLog: (date) => {
    getDb().deleteLog(date)
    set((state) => ({ logs: state.logs.filter((l) => l.date !== date) }))
  },

  saveBodyLog: (log) => {
    const db = getDb()
    db.saveBodyLog(log)
    set({ bodyLogs: db.getBodyLogs() })
  },

  exportData: () => getDb().exportAll(),

  importData: (json) => {
    getDb().importAll(json)
    get().init()
  },

  clearAll: () => {
    getDb().clearAll()
    set({ settings: null, logs: [], bodyLogs: [], hydrated: false })
  },
}))
