import { useState, useRef, useEffect } from 'react'
import type { FilterState } from './FilterBar'

interface FilterChipsProps {
  filters: FilterState
  onFiltersChange: (f: FilterState) => void
}

const FILTER_GROUPS: {
  title: string
  items: { key: keyof FilterState; label: string }[]
}[] = [
  {
    title: 'Court Environment',
    items: [
      { key: 'indoor', label: 'Indoor' },
      { key: 'outdoor', label: 'Outdoor' },
    ],
  },
  {
    title: 'Surface Type',
    items: [
      { key: 'hard', label: 'Hard Court' },
      { key: 'clay', label: 'Clay' },
      { key: 'synthetic_clay', label: 'Synthetic Clay' },
      { key: 'grass', label: 'Grass' },
      { key: 'synthetic_grass', label: 'Synthetic Grass' },
    ],
  },
  {
    title: 'Facilities',
    items: [
      { key: 'parking', label: 'Parking' },
      { key: 'lights', label: 'Night Lights' },
      { key: 'toilet', label: 'Toilet' },
      { key: 'fourCourts', label: '4+ Courts' },
    ],
  },
]

export function FilterChips({ filters, onFiltersChange }: FilterChipsProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openGroup) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openGroup])

  const toggle = (key: keyof FilterState) => {
    const value = filters[key]
    const next = typeof value === 'boolean' ? !value : true
    onFiltersChange({ ...filters, [key]: next })
  }

  const clearAll = () => {
    onFiltersChange({
      location: filters.location,
      indoor: false,
      outdoor: false,
      hard: false,
      clay: false,
      synthetic_clay: false,
      grass: false,
      synthetic_grass: false,
      parking: false,
      lights: false,
      toilet: false,
      fourCourts: false,
    })
  }

  const hasActive =
    filters.indoor ||
    filters.outdoor ||
    filters.hard ||
    filters.clay ||
    filters.synthetic_clay ||
    filters.grass ||
    filters.synthetic_grass ||
    filters.parking ||
    filters.lights ||
    filters.toilet ||
    filters.fourCourts

  return (
    <div
      ref={containerRef}
      className="relative z-[800] w-full flex border-y border-[var(--border)] py-4 bg-sand"
    >
      {FILTER_GROUPS.map((group, index) => {
        const isOpen = openGroup === group.title
        const count = group.items.filter((k) => !!filters[k.key]).length
        const isLast = index === FILTER_GROUPS.length - 1
        const isMiddle = index === 1
        return (
          <div
            key={group.title}
            className={`flex-1 min-w-0 relative flex flex-col items-center justify-center text-center ${
              isMiddle ? 'border-x border-[var(--border)]' : ''
            }`}
          >
            <div className="flex items-center justify-center gap-2 w-full px-2">
              <button
                type="button"
                onClick={() => setOpenGroup(isOpen ? null : group.title)}
                className="flex items-center justify-center gap-2 flex-1 text-[12px] font-semibold text-bark uppercase tracking-wider hover:bg-[var(--cream)] transition-colors py-1 rounded"
              >
                <span>{group.title}</span>
                {count > 0 && (
                  <span className="text-[10px] font-normal text-g600 bg-g100 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                )}
                <svg
                  className={`w-3.5 h-3.5 text-bark-lt transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isLast && hasActive && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] font-medium text-g600 hover:underline flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            {isOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white border border-[var(--border)] rounded-xl shadow-lg py-2 px-3 z-[810] min-w-[180px]">
                {group.items.map(({ key, label }) => {
                  const checked = !!filters[key]
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-[13px] text-bark-lt cursor-pointer select-none py-1"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(key)}
                        className="w-3.5 h-3.5 rounded border-[var(--border)] text-g600 focus:ring-g200 cursor-pointer"
                      />
                      <span className={checked ? 'font-medium text-bark' : ''}>{label}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}