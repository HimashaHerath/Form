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
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => format(parseISO(d), 'M/d')}
          tick={{ fontSize: 11, fill: '#8B8BA7', fontFamily: 'var(--font-mono)' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#8B8BA7', fontFamily: 'var(--font-mono)' }}
          unit="%"
          domain={['auto', 'auto']}
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#111118',
            border: '1px solid #2A2A38',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={(d) => format(parseISO(d as string), 'MMM d, yyyy')}
          formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}%` : '—', 'Body Fat']}
        />
        <Line
          type="monotone"
          dataKey="bfPercent"
          stroke="#4F8EF7"
          strokeWidth={2}
          dot={{ r: 3, fill: '#4F8EF7' }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
