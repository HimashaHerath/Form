import { describe, it, expect, beforeEach } from 'vitest'
import { LocalDataStore } from '../storage/localStorage'

describe('LocalDataStore', () => {
  let store: LocalDataStore

  beforeEach(() => {
    localStorage.clear()
    store = new LocalDataStore()
  })

  describe('settings', () => {
    it('returns null when no settings saved', () => {
      expect(store.getSettings()).toBeNull()
    })

    it('saves and retrieves settings', () => {
      const settings = {
        startDate: '2026-01-01',
        startWeight: 180,
        goalWeight: 170,
        units: 'lbs' as const,
        tdeeWindow: 4,
        targetDeficit: -500,
      }
      store.saveSettings(settings)
      expect(store.getSettings()).toEqual(settings)
    })
  })

  describe('logs', () => {
    it('returns empty array when no logs', () => {
      expect(store.getLogs()).toEqual([])
    })

    it('saves and retrieves a log', () => {
      const log = { date: '2026-01-15', weight: 178.5, calories: 2000 }
      store.saveLog(log)
      expect(store.getLogs()).toContainEqual(log)
    })

    it('upserts log for same date', () => {
      store.saveLog({ date: '2026-01-15', weight: 178, calories: 2000 })
      store.saveLog({ date: '2026-01-15', weight: 179, calories: 2100 })
      const logs = store.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].weight).toBe(179)
    })

    it('deletes a log by date', () => {
      store.saveLog({ date: '2026-01-15', weight: 178, calories: 2000 })
      store.deleteLog('2026-01-15')
      expect(store.getLogs()).toHaveLength(0)
    })

    it('filters logs by date range', () => {
      store.saveLog({ date: '2026-01-10', weight: 180, calories: 2000 })
      store.saveLog({ date: '2026-01-15', weight: 179, calories: 1950 })
      store.saveLog({ date: '2026-01-20', weight: 178, calories: 2100 })
      const filtered = store.getLogs('2026-01-12', '2026-01-18')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].date).toBe('2026-01-15')
    })
  })

  describe('bodyLogs', () => {
    it('returns empty array when no body logs', () => {
      expect(store.getBodyLogs()).toEqual([])
    })

    it('saves and retrieves a body log', () => {
      const log = { date: '2026-01-15', weight: 178, bfPercent: 18.5 }
      store.saveBodyLog(log)
      expect(store.getBodyLogs()).toContainEqual(log)
    })
  })

  describe('export/import', () => {
    it('round-trips all data through export/import', () => {
      const settings = {
        startDate: '2026-01-01',
        startWeight: 180,
        goalWeight: 170,
        units: 'lbs' as const,
        tdeeWindow: 4,
        targetDeficit: -500,
      }
      store.saveSettings(settings)
      store.saveLog({ date: '2026-01-15', weight: 178, calories: 2000 })

      const json = store.exportAll()
      localStorage.clear()
      const store2 = new LocalDataStore()
      store2.importAll(json)

      expect(store2.getSettings()).toEqual(settings)
      expect(store2.getLogs()).toHaveLength(1)
    })
  })
})
