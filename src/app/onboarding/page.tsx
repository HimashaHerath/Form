'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFluxStore } from '@/lib/store'
import type { UserSettings, Units } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const TOTAL_STEPS = 5

const ACTIVITY_OPTIONS = [
  { multiplier: 1.2, label: 'Sedentary', sub: 'Desk job, little movement' },
  { multiplier: 1.375, label: 'Lightly active', sub: 'Light exercise 1–3 days/week' },
  { multiplier: 1.55, label: 'Moderately active', sub: 'Moderate exercise 3–5 days/week' },
  { multiplier: 1.725, label: 'Very active', sub: 'Hard exercise 6–7 days/week' },
  { multiplier: 1.9, label: 'Extremely active', sub: 'Athlete / physical job + training' },
]

const DEFICIT_OPTIONS = [
  { value: -750, label: 'Aggressive loss', sub: '~1.5 lb/week' },
  { value: -500, label: 'Moderate loss', sub: '~1 lb/week (recommended)' },
  { value: -250, label: 'Slow loss', sub: '~0.5 lb/week' },
  { value: 0, label: 'Maintain', sub: 'Hold current weight' },
  { value: 250, label: 'Lean bulk', sub: '~0.5 lb/week gain' },
]

const WINDOW_OPTIONS = [
  { value: 2, label: '2 weeks', sub: 'Reacts faster to changes' },
  { value: 4, label: '4 weeks', sub: 'Balanced (recommended)' },
  { value: 8, label: '8 weeks', sub: 'Very stable, slow to adapt' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const saveSettings = useFluxStore((s) => s.saveSettings)

  const [step, setStep] = useState(1)
  const [units, setUnits] = useState<Units>('lbs')
  const [currentWeight, setCurrentWeight] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [sex, setSex] = useState<'male' | 'female' | undefined>(undefined)
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [activityMultiplier, setActivityMultiplier] = useState<number | undefined>(undefined)
  const [tdeeWindow, setTdeeWindow] = useState(4)
  const [targetDeficit, setTargetDeficit] = useState(-500)

  const canProceed = () => {
    if (step === 2) {
      return (
        currentWeight !== '' &&
        goalWeight !== '' &&
        !isNaN(Number(currentWeight)) &&
        !isNaN(Number(goalWeight)) &&
        Number(currentWeight) > 0 &&
        Number(goalWeight) > 0
      )
    }
    if (step === 3) {
      return age !== '' && !isNaN(Number(age)) && Number(age) > 0 && activityMultiplier !== undefined
    }
    return true
  }

  const handleFinish = () => {
    const settings: UserSettings = {
      startDate: format(new Date(), 'yyyy-MM-dd'),
      startWeight: Number(currentWeight),
      goalWeight: Number(goalWeight),
      units,
      tdeeWindow,
      targetDeficit,
      sex: sex ?? undefined,
      height: height ? Number(height) : undefined,
      age: age ? Number(age) : undefined,
      activityMultiplier,
    }
    saveSettings(settings)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-zinc-400">Step {step} of {TOTAL_STEPS}</span>
          <span className="text-lg font-bold text-[#4F8EF7]">FORM</span>
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />
      </div>

      {step === 1 && (
        <div className="w-full space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Choose your units</h2>
            <p className="text-sm text-zinc-400 mt-1">You can change this later in settings</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['lbs', 'kg'] as Units[]).map((u) => (
              <Card
                key={u}
                onClick={() => setUnits(u)}
                className={cn(
                  'cursor-pointer transition-all',
                  units === u
                    ? 'border-[#4F8EF7] bg-[#4F8EF7]/10'
                    : 'border-zinc-700 hover:border-zinc-500'
                )}
              >
                <CardContent className="flex flex-col items-center py-8">
                  <span className="text-3xl font-bold">{u}</span>
                  <span className="text-sm text-zinc-400 mt-1">
                    {u === 'lbs' ? 'Imperial' : 'Metric'}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="w-full space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Your weight &amp; goal</h2>
            <p className="text-sm text-zinc-400 mt-1">We use this to calculate your goal date</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="current-weight">Current weight ({units})</Label>
              <Input
                id="current-weight"
                type="number"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder={units === 'lbs' ? '180' : '82'}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="goal-weight">Goal weight ({units})</Label>
              <Input
                id="goal-weight"
                type="number"
                step="0.1"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
                placeholder={units === 'lbs' ? '165' : '75'}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Sex <span className="text-zinc-500">(optional — for BF% calculation)</span></Label>
              <div className="flex gap-2 mt-1">
                {(['male', 'female'] as const).map((s) => (
                  <Button
                    key={s}
                    variant={sex === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSex(sex === s ? undefined : s)}
                    className={cn(sex === s && 'bg-[#4F8EF7] text-white hover:bg-[#4F8EF7]/90')}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            {sex && (
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="w-full space-y-4">
          <div>
            <h2 className="text-2xl font-bold">About you</h2>
            <p className="text-sm text-zinc-400 mt-1">Used to estimate your starting calorie target</p>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Activity level</Label>
              <div className="space-y-2 mt-2">
                {ACTIVITY_OPTIONS.map((opt) => (
                  <Card
                    key={opt.multiplier}
                    onClick={() => setActivityMultiplier(opt.multiplier)}
                    className={cn(
                      'cursor-pointer transition-all',
                      activityMultiplier === opt.multiplier
                        ? 'border-[#4F8EF7] bg-[#4F8EF7]/10'
                        : 'border-zinc-700 hover:border-zinc-500'
                    )}
                  >
                    <CardContent className="flex items-center justify-between py-4 px-4">
                      <div>
                        <p className="font-medium">{opt.label}</p>
                        <p className="text-sm text-zinc-400">{opt.sub}</p>
                      </div>
                      {activityMultiplier === opt.multiplier && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4F8EF7] flex-shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="w-full space-y-4">
          <div>
            <h2 className="text-2xl font-bold">TDEE averaging window</h2>
            <p className="text-sm text-zinc-400 mt-1">
              How many weeks to average your calorie burn over. Longer windows are more stable but slower to reflect changes.
            </p>
          </div>
          <div className="space-y-2">
            {WINDOW_OPTIONS.map((opt) => (
              <Card
                key={opt.value}
                onClick={() => setTdeeWindow(opt.value)}
                className={cn(
                  'cursor-pointer transition-all',
                  tdeeWindow === opt.value
                    ? 'border-[#4F8EF7] bg-[#4F8EF7]/10'
                    : 'border-zinc-700 hover:border-zinc-500'
                )}
              >
                <CardContent className="flex items-center justify-between py-4 px-4">
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-sm text-zinc-400">{opt.sub}</p>
                  </div>
                  {tdeeWindow === opt.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4F8EF7] flex-shrink-0" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="w-full space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Your goal rate</h2>
            <p className="text-sm text-zinc-400 mt-1">
              How aggressively do you want to hit your target weight?
            </p>
          </div>
          <div className="space-y-2">
            {DEFICIT_OPTIONS.map((opt) => (
              <Card
                key={opt.value}
                onClick={() => setTargetDeficit(opt.value)}
                className={cn(
                  'cursor-pointer transition-all',
                  targetDeficit === opt.value
                    ? 'border-[#4F8EF7] bg-[#4F8EF7]/10'
                    : 'border-zinc-700 hover:border-zinc-500'
                )}
              >
                <CardContent className="flex items-center justify-between py-4 px-4">
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-sm text-zinc-400">{opt.sub}</p>
                  </div>
                  {targetDeficit === opt.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#4F8EF7] flex-shrink-0" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="w-full flex gap-3 mt-8">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="flex-1"
          >
            Back
          </Button>
        )}
        {step < TOTAL_STEPS ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex-1 bg-[#4F8EF7] text-white hover:bg-[#4F8EF7]/90 disabled:opacity-50"
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            className="flex-1 bg-[#4F8EF7] text-white hover:bg-[#4F8EF7]/90"
          >
            Get started
          </Button>
        )}
      </div>
    </div>
  )
}
