'use client'
import { useState } from 'react'
import { useFluxStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface DailyLogFormProps {
  date?: string
  compact?: boolean
  onSaved?: () => void
}

export function DailyLogForm({ date, compact, onSaved }: DailyLogFormProps) {
  const today = date ?? format(new Date(), 'yyyy-MM-dd')
  const { logs, saveLog, settings } = useFluxStore()
  const existing = logs.find((l) => l.date === today)

  const [weight, setWeight] = useState(existing?.weight?.toString() ?? '')
  const [calories, setCalories] = useState(existing?.calories?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!weight && !calories) {
      setError('Enter at least weight or calories')
      return
    }
    if (weight && (isNaN(Number(weight)) || Number(weight) <= 0)) {
      setError('Weight must be a positive number')
      return
    }
    if (calories && (isNaN(Number(calories)) || Number(calories) < 0)) {
      setError('Calories must be a valid number')
      return
    }
    setError('')
    setSaving(true)
    try {
      await saveLog({
        date: today,
        weight: weight ? Number(weight) : undefined,
        calories: calories ? Number(calories) : undefined,
      })
      toast.success('Logged. Keep it up.')
      onSaved?.()
    } catch {
      toast.error('Failed to save — please try again')
    } finally {
      setSaving(false)
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder={`Weight (${settings?.units ?? 'lbs'})`}
              value={weight}
              onChange={(e) => { setWeight(e.target.value); setError('') }}
              className="bg-[#1A1A24] border-[#2A2A38] focus:border-[#4F8EF7]"
            />
          </div>
          <div className="flex-1">
            <Input
              type="number"
              min="0"
              placeholder="Calories"
              value={calories}
              onChange={(e) => { setCalories(e.target.value); setError('') }}
              className="bg-[#1A1A24] border-[#2A2A38] focus:border-[#4F8EF7]"
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#4F8EF7] text-white hover:bg-[#4F8EF7]/90 shrink-0"
          >
            {saving ? 'Saving...' : 'Log'}
          </Button>
        </div>
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="log-weight">Weight ({settings?.units ?? 'lbs'})</Label>
        <Input
          id="log-weight"
          type="number"
          step="0.1"
          min="0"
          value={weight}
          onChange={(e) => { setWeight(e.target.value); setError('') }}
          placeholder="178.5"
          className="mt-1 bg-[#1A1A24] border-[#2A2A38] focus:border-[#4F8EF7]"
        />
      </div>
      <div>
        <Label htmlFor="log-calories">Calories</Label>
        <Input
          id="log-calories"
          type="number"
          min="0"
          value={calories}
          onChange={(e) => { setCalories(e.target.value); setError('') }}
          placeholder="2000"
          className="mt-1 bg-[#1A1A24] border-[#2A2A38] focus:border-[#4F8EF7]"
        />
      </div>
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#4F8EF7] text-white hover:bg-[#4F8EF7]/90"
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
