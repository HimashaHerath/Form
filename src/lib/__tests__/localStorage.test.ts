import { describe, it, expect, beforeEach } from 'vitest'
import { LocalDataStore } from '../storage/localStorage'

describe('LocalDataStore', () => {
  let store: LocalDataStore

  beforeEach(() => {
    localStorage.clear()
    store = new LocalDataStore()
  })

  describe('settings', () => {
    it('returns null when no settings saved', async () => {
      expect(await store.getSettings()).toBeNull()
    })

    it('saves and retrieves settings', async () => {
      const settings = {
        startDate: '2026-01-01',
        startWeight: 180,
        goalWeight: 170,
        units: 'lbs' as const,
        tdeeWindow: 4,
        targetDeficit: -500,
      }
      await store.saveSettings(settings)
      expect(await store.getSettings()).toEqual(settings)
    })
  })

  describe('logs', () => {
    it('returns empty array when no logs', async () => {
      expect(await store.getLogs()).toEqual([])
    })

    it('saves and retrieves a log', async () => {
      const log = { date: '2026-01-15', weight: 178.5, calories: 2000 }
      await store.saveLog(log)
      expect(await store.getLogs()).toContainEqual(log)
    })

    it('upserts log for same date', async () => {
      await store.saveLog({ date: '2026-01-15', weight: 178, calories: 2000 })
      await store.saveLog({ date: '2026-01-15', weight: 179, calories: 2100 })
      const logs = await store.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].weight).toBe(179)
    })

    it('deletes a log by date', async () => {
      await store.saveLog({ date: '2026-01-15', weight: 178, calories: 2000 })
      await store.deleteLog('2026-01-15')
      expect(await store.getLogs()).toHaveLength(0)
    })

    it('filters logs by date range', async () => {
      await store.saveLog({ date: '2026-01-10', weight: 180, calories: 2000 })
      await store.saveLog({ date: '2026-01-15', weight: 179, calories: 1950 })
      await store.saveLog({ date: '2026-01-20', weight: 178, calories: 2100 })
      const filtered = await store.getLogs('2026-01-12', '2026-01-18')
      expect(filtered).toHaveLength(1)
      expect(filtered[0].date).toBe('2026-01-15')
    })
  })

  describe('bodyLogs', () => {
    it('returns empty array when no body logs', async () => {
      expect(await store.getBodyLogs()).toEqual([])
    })

    it('saves and retrieves a body log', async () => {
      const log = { date: '2026-01-15', weight: 178, bfPercent: 18.5 }
      await store.saveBodyLog(log)
      expect(await store.getBodyLogs()).toContainEqual(log)
    })
  })

  describe('export/import', () => {
    it('round-trips all data through export/import', async () => {
      const settings = {
        startDate: '2026-01-01',
        startWeight: 180,
        goalWeight: 170,
        units: 'lbs' as const,
        tdeeWindow: 4,
        targetDeficit: -500,
      }
      await store.saveSettings(settings)
      await store.saveLog({ date: '2026-01-15', weight: 178, calories: 2000 })

      const json = await store.exportAll()
      localStorage.clear()
      const store2 = new LocalDataStore()
      await store2.importAll(json)

      expect(await store2.getSettings()).toEqual(settings)
      expect(await store2.getLogs()).toHaveLength(1)
    })
  })
})
