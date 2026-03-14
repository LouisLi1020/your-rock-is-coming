import type { FilterState } from './FilterBar'

interface FilterChipsProps {
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
}

const SURFACE_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'hard', label: 'Hard court' },
  { value: 'synthetic', label: 'Synthetic grass' },
]

export function FilterChips({ filters, onFiltersChange }: FilterChipsProps) {
  const setSurface = (surface: string) => onFiltersChange({ ...filters, surface })
  const setLights = () => onFiltersChange({ ...filters, lights: !filters.lights })
  const setParking = () => onFiltersChange({ ...filters, parking: !filters.parking })
  const setMinCourts = () => onFiltersChange({ ...filters, minCourts: filters.minCourts >= 4 ? 0 : 4 })

  const chipClass = (active: boolean) =>
    `px-3.5 py-2 rounded-full text-[12px] font-medium border transition-colors whitespace-nowrap ${
      active
        ? 'bg-g600 text-white border-g600'
        : 'bg-white border-[var(--border)] text-bark-lt hover:bg-g50 hover:border-g200 hover:text-bark'
    }`

  return (
    <div className="w-full py-3">
      <div className="flex flex-wrap items-center gap-2">
        {SURFACE_CHIPS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSurface(value)}
            className={chipClass(filters.surface === value)}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={setLights} className={chipClass(filters.lights)}>
          Lights
        </button>
        <button type="button" onClick={setParking} className={chipClass(filters.parking)}>
          Parking
        </button>
        <button type="button" onClick={setMinCourts} className={chipClass(filters.minCourts >= 4)}>
          4+ courts
        </button>
      </div>
    </div>
  )
}
