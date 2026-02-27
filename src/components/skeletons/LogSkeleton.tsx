import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function LogSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:px-12 max-w-[1200px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-[#2A2A38]">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-[#2A2A38]/50 last:border-0">
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
