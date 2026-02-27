'use client'
import { Button } from '@/components/ui/button'

interface SegmentedControlProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({ value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="flex bg-[#1A1A24] rounded-lg p-0.5 gap-0.5">
      {options.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant="ghost"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-md text-xs font-medium transition-all ${
            value === opt.value
              ? 'bg-[#4F8EF7] text-white hover:bg-[#4F8EF7]/90 shadow-sm'
              : 'text-[#8B8BA7] hover:text-[#F0F0F8] hover:bg-transparent'
          }`}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}
