'use client'
import { useFluxStore } from '@/lib/store'
import { BodyLogForm } from '@/components/forms/BodyLogForm'
import { BfChart } from '@/components/charts/BfChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function BodyPage() {
  const { bodyLogs } = useFluxStore()

  const chartData = [...bodyLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({ date: l.date, bfPercent: l.bfPercent }))

  const latestBf = chartData.filter((d) => d.bfPercent != null).at(-1)

  return (
    <div className="p-4 md:p-6 max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Body</h1>
        {latestBf?.bfPercent != null && (
          <Badge variant="outline" className="border-amber-400/50 text-amber-400">
            {latestBf.bfPercent.toFixed(1)}% BF
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            Today&apos;s measurement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BodyLogForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Body fat trend</CardTitle>
        </CardHeader>
        <CardContent>
          <BfChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  )
}
