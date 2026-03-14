// src/components/home/CourtMap.tsx
import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import type { Court } from '../../api/courts'
import { MAP_CENTER, MAP_ZOOM } from '../../data/constants'

type Props = {
  courts: Court[]
  selectedId: number | null
  onSelectCourt: (id: number) => void
  onBookCourt: (id: number) => void
}

function createIcon(court: Court, isSelected: boolean) {
  const bg = isSelected ? '#2DB87A' : '#FFFFFF'
  const bdr = isSelected ? '#2DB87A' : '#C8E632'
  const shadow = isSelected ? '0 3px 12px rgba(45,184,122,0.4)' : '0 2px 8px rgba(0,0,0,0.1)'
  return L.divIcon({
    className: '',
    html: `<div style="width:44px;height:44px;background:${bg};border:2.5px solid ${bdr};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:${shadow};font-size:18px;position:relative;transition:all 0.2s;">🎾<span style="position:absolute;top:-5px;right:-8px;background:${isSelected ? '#C8E632' : '#2DB87A'};color:${isSelected ? '#1A1A1A' : '#fff'};font-size:9px;font-weight:700;padding:1px 5px;border-radius:10px;font-family:Outfit,sans-serif;">${court.courts_count}</span></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
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
      attribution: '© OSM © CARTO',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map

    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Sync markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove old
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m))
    markersRef.current = {}

    // Add new
    courts.forEach((c) => {
      const icon = createIcon(c, c.id === selectedId)
      const sf = c.surface === 'synthetic_grass' ? 'Synthetic' : 'Hard'
      const popup = `
        <div style="min-width:200px;font-family:Outfit,sans-serif;">
          <div style="font-weight:700;font-size:14px;margin-bottom:2px;">${c.name}</div>
          <div style="color:#8A8A8A;font-size:11px;">${c.address}</div>
          <div style="color:#3D3D3D;font-size:11px;margin-top:5px;">
            <span style="margin-right:8px;">🎾 ${c.courts_count}</span>
            <span>📐 ${sf}</span>
          </div>
          <div style="color:#2DB87A;font-weight:700;font-size:16px;margin-top:6px;">$${c.price_per_hr}<small style="font-size:11px;font-weight:400;color:#8A8A8A;">/hr</small></div>
          <div style="display:flex;gap:6px;margin-top:8px;">
            <a href="/venue/${c.id}" data-venue-link data-venue-id="${c.id}" style="flex:1;padding:8px 0;text-align:center;background:#E8E6E1;color:#1A1A1A;border:none;border-radius:10px;font-family:Outfit,sans-serif;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;">View detail</a>
            <a href="/book?court=${c.id}" style="flex:1;padding:8px 0;text-align:center;background:#C8E632;color:#1A1A1A;border:none;border-radius:10px;font-family:Outfit,sans-serif;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;">Quick book</a>
          </div>
        </div>
      `
      const marker = L.marker([c.lat, c.lng], { icon })
        .addTo(map)
        .bindPopup(popup, { maxWidth: 260 })
      marker.on('click', () => onSelectCourt(c.id))
      markersRef.current[c.id] = marker
    })
  }, [courts, selectedId, onSelectCourt])

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
      {/* Controls */}
      <div className="absolute bottom-6 right-3.5 z-[1000] flex flex-col gap-[5px]">
        {[
          { fn: zoomIn, icon: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> },
          { fn: zoomOut, icon: <line x1="5" y1="12" x2="19" y2="12"/> },
          { fn: resetView, icon: <><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></> },
        ].map(({ fn, icon }, i) => (
          <button
            key={i}
            onClick={fn}
            className="w-9 h-9 bg-white border-[1.5px] border-[#E8E6E1] rounded-[9px] text-ink-soft flex items-center justify-center cursor-pointer hover:border-green hover:text-green transition-all shadow-sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">{icon}</svg>
          </button>
        ))}
      </div>
    </div>
  )
}
