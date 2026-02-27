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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Download, Upload, Trash2, LogOut } from 'lucide-react'

export default function SettingsPage() {
  const { settings, saveSettings, exportData, importData, clearAll, signOut, hydrated } = useFluxStore()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!hydrated) return null
  if (!settings) {
    router.replace('/onboarding')
    return null
  }

  const handleExport = async () => {
    const json = await exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `form-export-${format(new Date(), 'yyyy-MM-dd')}.json`
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
    e.target.value = ''
  }

  const handleClear = () => {
    clearAll()
    router.push('/onboarding')
  }

  return (
    <div className="p-4 md:p-6 lg:px-12 max-w-[1200px] mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Two-column desktop layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Personal settings */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8B8BA7]">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Units */}
              <div>
                <Label className="text-xs text-[#8B8BA7]">Weight unit</Label>
                <div className="mt-1.5">
                  <SegmentedControl
                    value={settings.units}
                    options={[
                      { value: 'lbs' as const, label: 'lb' },
                      { value: 'kg' as const, label: 'kg' },
                    ]}
                    onChange={(v) => {
                      saveSettings({ ...settings, units: v as 'lbs' | 'kg' })
                      toast.success('Units updated')
                    }}
                  />
                </div>
              </div>

              <Separator className="bg-[#2A2A38]" />

              {/* Goal weight */}
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

              {/* TDEE window */}
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

              {/* Deficit */}
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
            </CardContent>
          </Card>
        </div>

        {/* Right column: Body settings + Danger Zone + Account */}
        <div className="space-y-5">
          {/* Body settings */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8B8BA7]">Body settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sex */}
              <div>
                <Label className="text-xs text-[#8B8BA7]">Gender</Label>
                <div className="mt-1.5">
                  <SegmentedControl
                    value={settings.sex ?? ''}
                    options={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                    ]}
                    onChange={(v) => {
                      saveSettings({ ...settings, sex: v as 'male' | 'female' })
                      toast.success('Saved')
                    }}
                  />
                </div>
              </div>

              {/* Height */}
              {settings.sex && (
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    defaultValue={settings.height ?? ''}
                    onBlur={(e) => {
                      const val = Number(e.target.value)
                      if (val > 0) {
                        saveSettings({ ...settings, height: val })
                        toast.success('Saved')
                      }
                    }}
                    placeholder="175"
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data management */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8B8BA7]">Data</CardTitle>
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

              <Separator className="bg-[#2A2A38]" />

              {/* Delete with dialog confirmation */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash2 className="h-4 w-4" />
                    Reset all data
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#111118] border-[#2A2A38]">
                  <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription className="text-[#8B8BA7]">
                      This will permanently delete all your logs, settings, and body measurements. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleClear}>
                      Delete everything
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Account */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8B8BA7]">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut()
                }}
                className="w-full gap-2 justify-start"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </CardContent>
          </Card>

          {/* App info */}
          <Card className="border-[#2A2A38]">
            <CardContent className="py-3 px-4">
              <p className="text-xs text-[#4A4A62]">
                <span className="text-[#4F8EF7] font-medium">FORM</span> — TDEE Tracker
              </p>
              <p className="text-xs text-[#4A4A62] mt-0.5">
                Data synced to your account via Supabase.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
