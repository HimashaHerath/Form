'use client'
import { create } from 'zustand'
import type { UserSettings, DayLog, BodyLog } from './types'
import { LocalDataStore } from './storage/localStorage'

const db = new LocalDataStore()

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
    const raw = localStorage.getItem('flux:logs')
    const logs: DayLog[] = raw ? JSON.parse(raw) : []
    set({ logs: logs.sort((a, b) => a.date.localeCompare(b.date)) })
  },

  deleteLog: (date) => {
    db.deleteLog(date)
    set((state) => ({ logs: state.logs.filter((l) => l.date !== date) }))
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
    set({ settings: null, logs: [], bodyLogs: [], hydrated: false })
  },
}))
