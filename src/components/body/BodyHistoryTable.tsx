'use client'
import { format, parseISO } from 'date-fns'
import type { BodyLog } from '@/lib/types'

interface BodyHistoryTableProps {
  bodyLogs: BodyLog[]
}

export function BodyHistoryTable({ bodyLogs }: BodyHistoryTableProps) {
  const sorted = [...bodyLogs].sort((a, b) => b.date.localeCompare(a.date))

  if (sorted.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[#8B8BA7] text-sm">
        No measurements recorded yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#2A2A38]">
            <th className="text-left text-xs uppercase tracking-wide text-[#8B8BA7] px-3 py-2 font-medium">Date</th>
            <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-3 py-2 font-medium">Waist</th>
            <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-3 py-2 font-medium">Neck</th>
            <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-3 py-2 font-medium">Hip</th>
            <th className="text-right text-xs uppercase tracking-wide text-[#8B8BA7] px-3 py-2 font-medium">BF%</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((log) => (
            <tr key={log.date} className="border-b border-[#2A2A38]/50 last:border-0">
              <td className="px-3 py-2 text-sm text-[#F0F0F8]">
                {format(parseISO(log.date), 'MMM d')}
              </td>
              <td className="px-3 py-2 text-right text-sm font-data tabular-nums text-[#F0F0F8]">
                {log.waist != null ? `${log.waist}` : <span className="text-[#2A2A38]">—</span>}
              </td>
              <td className="px-3 py-2 text-right text-sm font-data tabular-nums text-[#F0F0F8]">
                {log.neck != null ? `${log.neck}` : <span className="text-[#2A2A38]">—</span>}
              </td>
              <td className="px-3 py-2 text-right text-sm font-data tabular-nums text-[#F0F0F8]">
                {log.hips != null ? `${log.hips}` : <span className="text-[#2A2A38]">—</span>}
              </td>
              <td className="px-3 py-2 text-right text-sm font-data tabular-nums text-[#4F8EF7] font-medium">
                {log.bfPercent != null ? `${log.bfPercent.toFixed(1)}%` : <span className="text-[#2A2A38]">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
