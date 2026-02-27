'use client'
import { useState, useRef } from 'react'
import { useFluxStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Download, Upload, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const { settings, saveSettings, exportData, importData, clearAll, hydrated } = useFluxStore()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  if (!hydrated) return null
  if (!settings) {
    router.replace('/onboarding')
    return null
  }

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flux-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        importData(ev.target!.result as string)
        toast.success('Data imported successfully!')
      } catch {
        toast.error('Invalid file format')
      }
    }
    reader.readAsText(file)
    // Reset file input
    e.target.value = ''
  }

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 5000)
      return
    }
    clearAll()
    router.push('/onboarding')
  }

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Preferences */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>TDEE averaging window</Label>
            <Select
              value={String(settings.tdeeWindow)}
              onValueChange={(v) => {
                saveSettings({ ...settings, tdeeWindow: Number(v) })
                toast.success('Saved')
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 weeks — reacts faster</SelectItem>
                <SelectItem value="4">4 weeks — balanced</SelectItem>
                <SelectItem value="8">8 weeks — most stable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Daily calorie target</Label>
            <Select
              value={String(settings.targetDeficit)}
              onValueChange={(v) => {
                saveSettings({ ...settings, targetDeficit: Number(v) })
                toast.success('Saved')
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-750">−750 kcal/day (aggressive loss)</SelectItem>
                <SelectItem value="-500">−500 kcal/day (moderate loss)</SelectItem>
                <SelectItem value="-250">−250 kcal/day (slow loss)</SelectItem>
                <SelectItem value="0">0 kcal/day (maintain)</SelectItem>
                <SelectItem value="250">+250 kcal/day (lean bulk)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="goal-weight">
              Goal weight ({settings.units})
            </Label>
            <Input
              id="goal-weight"
              type="number"
              step="0.1"
              defaultValue={settings.goalWeight}
              onBlur={(e) => {
                const val = Number(e.target.value)
                if (val > 0) {
                  saveSettings({ ...settings, goalWeight: val })
                  toast.success('Saved')
                }
              }}
              className="mt-1"
            />
          </div>

          <Separator className="bg-zinc-800" />

          <div>
            <Label>Units</Label>
            <p className="text-xs text-zinc-500 mt-0.5 mb-2">
              Currently: <span className="text-zinc-300">{settings.units}</span>
            </p>
            <div className="flex gap-2">
              {(['lbs', 'kg'] as const).map((u) => (
                <Button
                  key={u}
                  size="sm"
                  variant={settings.units === u ? 'default' : 'outline'}
                  className={
                    settings.units === u
                      ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                      : ''
                  }
                  onClick={() => {
                    saveSettings({ ...settings, units: u })
                    toast.success('Units updated')
                  }}
                >
                  {u}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="w-full gap-2 justify-start"
          >
            <Download className="h-4 w-4" />
            Export all data as JSON
          </Button>

          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full gap-2 justify-start"
          >
            <Upload className="h-4 w-4" />
            Import from JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />

          <Separator className="bg-zinc-800" />

          <Button
            variant="destructive"
            onClick={handleClear}
            className="w-full gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {confirmClear ? '⚠ Tap again to confirm — all data will be lost' : 'Reset all data'}
          </Button>
        </CardContent>
      </Card>

      {/* App info */}
      <Card className="border-zinc-800">
        <CardContent className="py-3 px-4">
          <p className="text-xs text-zinc-500">
            <span className="text-amber-400 font-medium">Flux</span> — TDEE Tracker
          </p>
          <p className="text-xs text-zinc-600 mt-0.5">
            Data stored locally in your browser. Export regularly to back up.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
