'use client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface BfChartProps {
  data: { date: string; bfPercent?: number | null }[]
}

export function BfChart({ data }: BfChartProps) {
  const hasData = data.some((d) => d.bfPercent != null)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        No body composition data yet.
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
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#71717a' }}
          unit="%"
          domain={['auto', 'auto']}
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(d) => format(parseISO(d as string), 'MMM d, yyyy')}
          formatter={(value: number) => [`${value.toFixed(1)}%`, 'Body Fat']}
        />
        <Line
          type="monotone"
          dataKey="bfPercent"
          stroke="#fbbf24"
          strokeWidth={2}
          dot={{ r: 3, fill: '#fbbf24' }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
