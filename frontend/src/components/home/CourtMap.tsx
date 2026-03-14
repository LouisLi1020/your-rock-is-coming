// src/components/home/CourtMap.tsx
import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import type { Court } from '../../api/courts'
import { MAP_CENTER, MAP_ZOOM } from '../../data/constants'

const SURFACE_LABELS: Record<string, string> = {
  hard: 'Hard Court',
  clay: 'Clay',
  synthetic_clay: 'Synthetic Clay',
  grass: 'Grass',
  synthetic_grass: 'Synthetic Grass',
}

function escapeHtml(text: string): string {
  const el = document.createElement('div')
  el.textContent = text
  return el.innerHTML
}

type Props = {
  courts: Court[]
  selectedId: number | null
  onSelectCourt: (id: number) => void
  onBookCourt?: (id: number) => void
}

function createIcon(court: Court, isSelected: boolean) {
  const count = court.courts_count
  const badge = count > 0
    ? `<span class="venue-pin-badge ${isSelected ? 'venue-pin-badge--selected' : ''}">${count}</span>`
    : ''
  return L.divIcon({
    className: 'venue-pin-marker',
    html: `<div class="venue-pin ${isSelected ? 'venue-pin--selected' : ''}">\uD83C\uDFBE${badge}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -28],
  })
}

export function CourtMap({ courts, selectedId, onSelectCourt, onBookCourt }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Record<number, L.Marker>>({})

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: false }).setView(
      [MAP_CENTER.lat, MAP_CENTER.lng],
      MAP_ZOOM
    )
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Sync markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    Object.values(markersRef.current).forEach((m) => map.removeLayer(m))
    markersRef.current = {}

    courts.forEach((c) => {
      const icon = createIcon(c, c.id === selectedId)
      const name = escapeHtml(c.name)
      const address = escapeHtml(c.address)
      const surfaceLabel = escapeHtml(SURFACE_LABELS[c.surface] || c.surface)
      const facilities: string[] = []
      if (c.lights) facilities.push('Lights')
      if (c.parking) facilities.push('Parking')
      if (c.toilet) facilities.push('Toilet')
      const facilityHtml = facilities
        .map(
          (f) =>
            `<span style="display:inline-block;font-size:9px;font-weight:600;padding:2px 6px;border-radius:5px;background:rgba(45,184,122,0.1);color:#1A7A4F;margin-right:3px;margin-bottom:2px;">${f}</span>`
        )
        .join('')

      const popup = `
        <div class="venue-popup-inner">
          <div class="venue-popup-name">${name}</div>
          <div style="font-size:11px;color:#8A8A8A;margin-bottom:6px;line-height:1.3;">${address}</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px;">
            <span style="display:inline-block;font-size:9px;font-weight:700;padding:2px 7px;border-radius:5px;background:#E6F1FB;color:#0C447C;text-transform:uppercase;letter-spacing:0.5px;">${surfaceLabel}</span>
            <span style="display:inline-block;font-size:9px;font-weight:600;padding:2px 6px;border-radius:5px;background:rgba(45,184,122,0.1);color:#2DB87A;">${c.courts_count} courts</span>
            ${facilityHtml}
          </div>
          <div class="venue-popup-price">$${c.price_per_hr}<span class="venue-popup-price-unit">/hr</span></div>
          <div class="venue-popup-actions">
            <a
              href="/venue/${c.id}"
              class="court-popup-detail-btn"
              style="padding:8px 10px;text-align:center;border:1.5px solid #E8E6E1;color:#1A1A1A;border-radius:10px;font-family:Outfit,sans-serif;font-size:12px;font-weight:500;cursor:pointer;text-decoration:none;box-sizing:border-box;transition:all 0.2s;"
            >
              Details
            </a>
            <button
              onclick="window.__courtMapQuickBook&&window.__courtMapQuickBook(${c.id})"
              class="venue-popup-quickbook venue-popup-quickbook--inline"
            >
              Quick book
            </button>
          </div>
        </div>
      `
      const marker = L.marker([c.lat, c.lng], { icon })
        .addTo(map)
        .bindPopup(popup, { maxWidth: 280, className: 'venue-map-popup' })
      marker.on('click', () => onSelectCourt(c.id))
      markersRef.current[c.id] = marker
    })
  }, [courts, selectedId, onSelectCourt])

  // Expose quick book handler to popup buttons
  useEffect(() => {
    ;(window as any).__courtMapQuickBook = (id: number) => {
      onBookCourt?.(id)
    }
    return () => {
      delete (window as any).__courtMapQuickBook
    }
  }, [onBookCourt])

  // Fly to selected
  useEffect(() => {
    if (!selectedId || !mapRef.current) return
    const court = courts.find((c) => c.id === selectedId)
    if (court) {
      mapRef.current.flyTo([court.lat, court.lng], 15, { duration: 0.5 })
      markersRef.current[court.id]?.openPopup()
    }
  }, [selectedId, courts])

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), [])
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), [])
  const resetView = useCallback(() => {
    mapRef.current?.flyTo([MAP_CENTER.lat, MAP_CENTER.lng], MAP_ZOOM, { duration: 0.5 })
  }, [])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute bottom-6 right-3.5 z-[1000] flex flex-col gap-[5px]">
        {[
          {
            fn: zoomIn,
            icon: (
              <>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </>
            ),
          },
          { fn: zoomOut, icon: <line x1="5" y1="12" x2="19" y2="12" /> },
          {
            fn: resetView,
            icon: (
              <>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
              </>
            ),
          },
        ].map(({ fn, icon }, i) => (
          <button
            key={i}
            onClick={fn}
            className="w-9 h-9 bg-white border-[1.5px] border-[#E8E6E1] rounded-[9px] text-ink-soft flex items-center justify-center cursor-pointer hover:border-green hover:text-green transition-all shadow-sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {icon}
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}