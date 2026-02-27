'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WeightChartProps {
  data: { date: string; weight: number | null; movingAvg: number | null; tdee?: number | null }[]
  units: 'lbs' | 'kg'
  showTabs?: boolean
}

export function WeightChart({ data, units, showTabs }: WeightChartProps) {
  const [range, setRange] = useState<'week' | 'month' | 'all'>('month')
  const hasData = data.some((d) => d.weight !== null)
  const hasTdee = data.some((d) => d.tdee != null)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-[#8B8BA7] text-sm">
        No weight data yet — start logging daily!
      </div>
    )
  }

  const filteredData = range === 'week' ? data.slice(-7) : range === 'month' ? data.slice(-30) : data

  return (
    <div>
      {showTabs && (
        <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)} className="mb-4">
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={filteredData} margin={{ top: 5, right: hasTdee ? 10 : 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), 'M/d')}
            tick={{ fontSize: 11, fill: '#8B8BA7', fontFamily: 'var(--font-mono)' }}
            interval={range === 'week' ? 0 : 6}
          />
          <YAxis
            yAxisId="weight"
            tick={{ fontSize: 11, fill: '#8B8BA7', fontFamily: 'var(--font-mono)' }}
            domain={['auto', 'auto']}
            width={45}
          />
          {hasTdee && (
            <YAxis
              yAxisId="tdee"
              orientation="right"
              tick={{ fontSize: 11, fill: '#8B8BA7', fontFamily: 'var(--font-mono)' }}
              domain={['auto', 'auto']}
              width={50}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#111118',
              border: '1px solid #2A2A38',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
            labelFormatter={(d) => format(parseISO(d as string), 'MMM d')}
            formatter={(value, name) => {
              const v = value as number | null
              return [
                v != null ? `${name === 'tdee' ? Math.round(v).toLocaleString() + ' kcal' : v + ' ' + units}` : '—',
                name === 'weight' ? 'Weight' : name === 'movingAvg' ? '7-day avg' : 'TDEE',
              ]
            }}
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weight"
            stroke="#4A4A62"
            strokeWidth={1}
            dot={{ r: 2, fill: '#4A4A62' }}
            connectNulls={false}
            name="weight"
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="movingAvg"
            stroke="#F0F0F8"
            strokeWidth={2}
            dot={false}
            connectNulls
            name="movingAvg"
          />
          {hasTdee && (
            <Line
              yAxisId="tdee"
              type="monotone"
              dataKey="tdee"
              stroke="#4F8EF7"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              connectNulls
              name="tdee"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
