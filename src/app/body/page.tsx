'use client'
import { useFluxStore } from '@/lib/store'
import { BodyLogForm } from '@/components/forms/BodyLogForm'
import { BfChart } from '@/components/charts/BfChart'
import { BodyHistoryTable } from '@/components/body/BodyHistoryTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BodySkeleton } from '@/components/skeletons/BodySkeleton'

export default function BodyPage() {
  const { bodyLogs, hydrated } = useFluxStore()

  if (!hydrated) return <BodySkeleton />

  const chartData = [...bodyLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({ date: l.date, bfPercent: l.bfPercent }))

  const latestBf = chartData.filter((d) => d.bfPercent != null).at(-1)

  return (
    <div className="p-4 md:p-6 lg:px-12 max-w-[1200px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Measurements</h1>
        {latestBf?.bfPercent != null && (
          <Badge variant="outline" className="border-[#4F8EF7]/50 text-[#4F8EF7]">
            {latestBf.bfPercent.toFixed(1)}% BF
          </Badge>
        )}
      </div>

      {/* Two-column desktop layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Body Log Form */}
        <div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8B8BA7]">
                Today&apos;s measurement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BodyLogForm />
            </CardContent>
          </Card>
        </div>

        {/* Right: History + Chart */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8B8BA7]">BF% History</CardTitle>
            </CardHeader>
            <CardContent className="p-0 px-2">
              <BodyHistoryTable bodyLogs={bodyLogs} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#8B8BA7]">Body fat trend</CardTitle>
            </CardHeader>
            <CardContent>
              <BfChart data={chartData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
