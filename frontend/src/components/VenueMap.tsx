import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import type { Venue } from '../data/venues'
import { MAP_CENTER, MAP_ZOOM } from '../data/constants'

function escapeHtml(text: string): string {
  const el = document.createElement('div')
  el.textContent = text
  return el.innerHTML
}

type Props = {
  venues: Venue[]
  selectedVenueId: string | null
  onSelectVenue: (id: string | null) => void
  onViewDetail?: (venueId: string) => void
  /** When set, map fits to show this point + all venues (zoom to your area after location) */
  userPosition?: { lat: number; lng: number } | null
}

function createIcon(venue: Venue, isSelected: boolean) {
  const count = venue.courts ?? 0
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

export function VenueMap({ venues, selectedVenueId, onSelectVenue, userPosition }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Record<string, L.Marker>>({})

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
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Sync markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    Object.values(markersRef.current).forEach((m) => map.removeLayer(m))
    markersRef.current = {}

    venues.forEach((v) => {
      const icon = createIcon(v, v.id === selectedVenueId)
      const name = escapeHtml(v.name)
      const priceShort = escapeHtml(v.priceRange.split(' ')[0] || '')

      const popup = `
        <div class="venue-popup-inner">
          <div class="venue-popup-name">${name}</div>
          <div class="venue-popup-price">${priceShort}<span class="venue-popup-price-unit">/hr</span></div>
          <a href="/book?court=${v.id}" class="venue-popup-quickbook">Quick book</a>
        </div>
      `
      const marker = L.marker([v.lat, v.lng], { icon })
        .addTo(map)
        .bindPopup(popup, { maxWidth: 260, className: 'venue-map-popup' })
      marker.on('click', () => onSelectVenue(v.id === selectedVenueId ? null : v.id))
      markersRef.current[v.id] = marker
    })

    // Fit bounds: if user position available, only show nearby venues (within 5km)
    if (userPosition) {
      const nearby: [number, number][] = venues
        .filter((v) => {
          const R = 6371
          const dLat = ((v.lat - userPosition.lat) * Math.PI) / 180
          const dLng = ((v.lng - userPosition.lng) * Math.PI) / 180
          const a = Math.sin(dLat/2)**2 + Math.cos((userPosition.lat*Math.PI)/180)*Math.cos((v.lat*Math.PI)/180)*Math.sin(dLng/2)**2
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) < 5
        })
        .map((v) => [v.lat, v.lng] as [number, number])
      nearby.push([userPosition.lat, userPosition.lng])
      if (nearby.length === 1) {
        map.setView(nearby[0], 15)
      } else {
        map.fitBounds(L.latLngBounds(nearby), { padding: [40, 40], maxZoom: 16 })
      }
    } else {
      const points: [number, number][] = venues.map((v) => [v.lat, v.lng] as [number, number])
      if (points.length === 0) return
      if (points.length === 1) {
        map.setView(points[0], 14)
      } else {
        map.fitBounds(L.latLngBounds(points), { padding: [24, 24], maxZoom: 15 })
      }
    }
  }, [venues, selectedVenueId, onSelectVenue, userPosition])

  // Fly to selected venue (center map on it, same as CourtMap on Map page)
  useEffect(() => {
    if (!selectedVenueId || !mapRef.current) return
    const venue = venues.find((v) => v.id === selectedVenueId)
    if (venue) {
      mapRef.current.flyTo([venue.lat, venue.lng], 15, { duration: 0.5 })
      markersRef.current[venue.id]?.openPopup()
    }
  }, [selectedVenueId, venues])

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), [])
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), [])
  const resetView = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    let points: [number, number][]
    if (userPosition) {
      const RADIUS_KM = 5
      const R = 6371
      points = venues
        .filter((v) => {
          const dLat = ((v.lat - userPosition.lat) * Math.PI) / 180
          const dLng = ((v.lng - userPosition.lng) * Math.PI) / 180
          const a = Math.sin(dLat/2)**2 + Math.cos((userPosition.lat*Math.PI)/180)*Math.cos((v.lat*Math.PI)/180)*Math.sin(dLng/2)**2
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) < RADIUS_KM
        })
        .map((v) => [v.lat, v.lng] as [number, number])
      points.push([userPosition.lat, userPosition.lng])
    } else {
      points = venues.map((v) => [v.lat, v.lng] as [number, number])
    }
    if (points.length === 1) {
      map.setView(points[0], 14)
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: userPosition ? 16 : 15 })
      if (!userPosition && map.getZoom() < 12) map.setZoom(12)
    } else {
      map.flyTo([MAP_CENTER.lat, MAP_CENTER.lng], MAP_ZOOM, { duration: 0.5 })
    }
  }, [venues, userPosition])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
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