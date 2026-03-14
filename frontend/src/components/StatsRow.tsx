interface StatsRowProps {
  venueCount: number
  suburbCount?: number
  courtCount?: number
}

export function StatsRow({ venueCount, suburbCount = 0, courtCount = 0 }: StatsRowProps) {
  const suburbs = suburbCount || new Set().size
  const courts = courtCount || venueCount * 6
  return (
    <div className="w-full flex border-y border-[var(--border)] py-4">
      <div className="flex-1 text-center min-w-0">
        <div className="font-lora text-2xl font-semibold text-g600">{venueCount}</div>
        <div className="text-[10px] text-bark-lt uppercase tracking-wider mt-0.5">Venues</div>
      </div>
      <div className="flex-1 text-center border-x border-[var(--border)] min-w-0">
        <div className="font-lora text-2xl font-semibold text-g600">{suburbs ?? '—'}</div>
        <div className="text-[10px] text-bark-lt uppercase tracking-wider mt-0.5">Suburbs</div>
      </div>
      <div className="flex-1 text-center min-w-0">
        <div className="font-lora text-2xl font-semibold text-g600">{courts}+</div>
        <div className="text-[10px] text-bark-lt uppercase tracking-wider mt-0.5">Courts</div>
      </div>
    </div>
  )
}
