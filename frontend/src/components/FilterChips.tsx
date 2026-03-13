import type { FilterState } from './FilterBar'

interface FilterChipsProps {
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
}

const SURFACES = [
  { value: 'all', label: 'All venues' },
  { value: 'hard', label: 'Hard court' },
  { value: 'grass', label: 'Grass' },
  { value: 'clay', label: 'Clay' },
  { value: 'synthetic', label: 'Synthetic' },
  { value: 'artificial', label: 'Artificial' },
]
const INDOOR = [
  { value: 'all', label: 'Indoor & Outdoor' },
  { value: 'indoor', label: 'Indoor only' },
  { value: 'outdoor', label: 'Outdoor only' },
]

export function FilterChips({ filters, onFiltersChange }: FilterChipsProps) {
  const setSurface = (surface: string) => onFiltersChange({ ...filters, surface })
  const setIndoor = (indoorOutdoor: string) => onFiltersChange({ ...filters, indoorOutdoor })

  return (
    <div className="flex flex-wrap gap-2 px-4 sm:px-6 max-w-[900px] mx-auto pt-4">
      {SURFACES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setSurface(value)}
          className={`px-3.5 py-1.5 rounded-[20px] text-[11px] font-medium border transition-colors ${
            filters.surface === value
              ? 'bg-g50 border-g200 text-g800'
              : 'bg-white border-[#ddd8ce] text-bark-lt hover:bg-g50 hover:border-g200 hover:text-g800'
          }`}
        >
          {label}
        </button>
      ))}
      {INDOOR.slice(1).map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setIndoor(value)}
          className={`px-3.5 py-1.5 rounded-[20px] text-[11px] font-medium border transition-colors ${
            filters.indoorOutdoor === value
              ? 'bg-g50 border-g200 text-g800'
              : 'bg-white border-[#ddd8ce] text-bark-lt hover:bg-g50 hover:border-g200 hover:text-g800'
          }`}
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onFiltersChange({ surface: 'all', location: '', indoorOutdoor: 'all' })}
        className="px-3.5 py-1.5 rounded-[20px] text-[11px] font-medium border border-[#ddd8ce] text-bark-lt hover:bg-g50"
      >
        Clear
      </button>
    </div>
  )
}
