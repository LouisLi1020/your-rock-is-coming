import { Search } from 'lucide-react'

export interface FilterState {
  location: string
  indoor?: boolean
  outdoor?: boolean
  hard?: boolean
  clay?: boolean
  synthetic_clay?: boolean
  grass?: boolean
  synthetic_grass?: boolean
  parking?: boolean
  lights?: boolean
  toilet?: boolean
  fourCourts?: boolean
  surface?: string
  minCourts?: number
}

interface FilterBarProps {
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const set = (patch: Partial<FilterState>) =>
    onFiltersChange({ ...filters, ...patch })

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search suburb..."
              value={filters.location}
              onChange={(e) => set({ location: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <select
            value={filters.surface}
            onChange={(e) => set({ surface: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="hard">Hard court</option>
            <option value="synthetic">Synthetic grass</option>
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={filters.lights} onChange={(e) => set({ lights: e.target.checked })} />
            <span className="text-sm">Lights</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={filters.parking} onChange={(e) => set({ parking: e.target.checked })} />
            <span className="text-sm">Parking</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={(filters.minCourts ?? 0) >= 4} onChange={(e) => set({ minCourts: e.target.checked ? 4 : 0 })} />
            <span className="text-sm">4+ courts</span>
          </label>
          <button
            type="button"
            onClick={() =>
              onFiltersChange({
                surface: 'all',
                location: '',
                lights: false,
                parking: false,
                minCourts: 0,
              })
            }
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  )
}
