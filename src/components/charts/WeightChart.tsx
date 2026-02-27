'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'

interface WeightChartProps {
  data: { date: string; weight: number | null; movingAvg: number | null }[]
  units: 'lbs' | 'kg'
}

export function WeightChart({ data, units }: WeightChartProps) {
  const hasData = data.some((d) => d.weight !== null)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        No weight data yet — start logging daily!
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => format(parseISO(d), 'M/d')}
          tick={{ fontSize: 11, fill: '#71717a' }}
          interval={6}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#71717a' }}
          domain={['auto', 'auto']}
          width={45}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(d) => format(parseISO(d as string), 'MMM d')}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: string | undefined) => [
            value != null ? `${value} ${units}` : '—',
            name === 'weight' ? 'Weight' : '7-day avg',
          ]}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#52525b"
          strokeWidth={1}
          dot={{ r: 2, fill: '#52525b' }}
          connectNulls={false}
          name="weight"
        />
        <Line
          type="monotone"
          dataKey="movingAvg"
          stroke="#fbbf24"
          strokeWidth={2}
          dot={false}
          connectNulls
          name="movingAvg"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
