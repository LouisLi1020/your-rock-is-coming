import { useEffect, useRef } from 'react'
import L from 'leaflet'

type Props = {
  lat: number
  lng: number
  name?: string
  className?: string
}

export function VenueDetailMap({ lat, lng, name, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const map = L.map(containerRef.current, { zoomControl: false })
      .setView([lat, lng], 15)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OSM © CARTO',
      maxZoom: 19,
    }).addTo(map)
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:36px;height:36px;background:#2DB87A;border:2px solid #1A7A4F;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);font-size:16px;">🎾</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })
    const marker = L.marker([lat, lng], { icon }).addTo(map)
    if (name) marker.bindPopup(`<div style="font-weight:600;font-size:13px;">${name}</div>`, { maxWidth: 220 })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng, name])

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--cream)] ${className}`}
      style={{ minHeight: 200 }}
    />
  )
}
