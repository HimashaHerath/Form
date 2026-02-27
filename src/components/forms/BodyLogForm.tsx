'use client'
import { useState } from 'react'
import { useFluxStore } from '@/lib/store'
import { calcNavyBF } from '@/lib/tdee'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function BodyLogForm() {
  const { settings, logs, saveBodyLog } = useFluxStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayWeight = logs.find((l) => l.date === today)?.weight

  const [weight, setWeight] = useState(todayWeight?.toString() ?? '')
  const [neck, setNeck] = useState('')
  const [waist, setWaist] = useState('')
  const [hips, setHips] = useState('')
  const [manualBf, setManualBf] = useState('')

  const canCalcNavy =
    neck && waist && settings?.height && settings?.sex &&
    (settings.sex === 'male' || (settings.sex === 'female' && hips))

  let calculatedBf: number | undefined
  if (canCalcNavy) {
    try {
      calculatedBf = calcNavyBF(
        Number(neck),
        Number(waist),
        settings!.height!,
        settings!.sex!,
        settings?.sex === 'female' ? Number(hips) : undefined
      )
      if (isNaN(calculatedBf) || calculatedBf <= 0 || calculatedBf >= 100) {
        calculatedBf = undefined
      }
    } catch {
      calculatedBf = undefined
    }
  }

  const handleSave = () => {
    if (!weight) {
      toast.error('Weight is required')
      return
    }
    saveBodyLog({
      date: today,
      weight: Number(weight),
      neck: neck ? Number(neck) : undefined,
      waist: waist ? Number(waist) : undefined,
      hips: hips ? Number(hips) : undefined,
      bfPercent: calculatedBf ?? (manualBf ? Number(manualBf) : undefined),
    })
    toast.success('Body measurement saved!')
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="body-weight">Weight ({settings?.units ?? 'lbs'})</Label>
        <Input
          id="body-weight"
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="mt-1"
          placeholder="178.5"
        />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-300">Measurements (cm) — optional</p>
        <p className="text-xs text-zinc-500">Used to calculate body fat % via the Navy formula</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="neck">Neck</Label>
          <Input
            id="neck"
            type="number"
            step="0.1"
            value={neck}
            onChange={(e) => setNeck(e.target.value)}
            placeholder="37"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="waist">Waist</Label>
          <Input
            id="waist"
            type="number"
            step="0.1"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            placeholder="85"
            className="mt-1"
          />
        </div>
        {settings?.sex === 'female' && (
          <div className="col-span-2">
            <Label htmlFor="hips">Hips</Label>
            <Input
              id="hips"
              type="number"
              step="0.1"
              value={hips}
              onChange={(e) => setHips(e.target.value)}
              placeholder="96"
              className="mt-1"
            />
          </div>
        )}
      </div>

      {!settings?.sex && (
        <p className="text-xs text-zinc-500">
          Set your sex in{' '}
          <a href="/settings" className="text-[#4F8EF7] hover:underline">
            Settings
          </a>{' '}
          to enable Navy BF% calculation.
        </p>
      )}

      {/* BF% Preview — always visible */}
      <Card className="border-[#4F8EF7]/30 bg-[#4F8EF7]/5">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-[#8B8BA7]">Calculated BF% (Navy method)</p>
          <p className="text-2xl font-data font-bold text-[#4F8EF7]">
            {calculatedBf !== undefined ? `${calculatedBf.toFixed(1)}%` : '—'}
          </p>
          {calculatedBf === undefined && settings?.sex && (
            <p className="text-xs text-[#4A4A62] mt-1">Fill in measurements above to calculate</p>
          )}
        </CardContent>
      </Card>

      {calculatedBf === undefined && (
        <div>
          <Label htmlFor="manual-bf">BF% (manual entry)</Label>
          <Input
            id="manual-bf"
            type="number"
            step="0.1"
            value={manualBf}
            onChange={(e) => setManualBf(e.target.value)}
            placeholder="e.g. 18.5"
            className="mt-1"
          />
        </div>
      )}

      <Button
        onClick={handleSave}
        className="w-full bg-[#4F8EF7] text-white hover:bg-[#4F8EF7]/90"
      >
        Save measurement
      </Button>
    </div>
  )
}
