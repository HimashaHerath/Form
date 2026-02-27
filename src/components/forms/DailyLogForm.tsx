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

  const handleSave = () => {
    if (!weight && !calories) {
      toast.error('Enter at least weight or calories')
      return
    }
    saveLog({
      date: today,
      weight: weight ? Number(weight) : undefined,
      calories: calories ? Number(calories) : undefined,
    })
    toast.success('Logged!')
    onSaved?.()
  }

  if (compact) {
    return (
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            type="number"
            step="0.1"
            placeholder={`Weight (${settings?.units ?? 'lbs'})`}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input
            type="number"
            placeholder="Calories"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </div>
        <Button
          onClick={handleSave}
          className="bg-amber-400 text-zinc-950 hover:bg-amber-300 shrink-0"
        >
          Log
        </Button>
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
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="178.5"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="log-calories">Calories</Label>
        <Input
          id="log-calories"
          type="number"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="2000"
          className="mt-1"
        />
      </div>
      <Button
        onClick={handleSave}
        className="w-full bg-amber-400 text-zinc-950 hover:bg-amber-300"
      >
        Save
      </Button>
    </div>
  )
}
