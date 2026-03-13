import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import type { Venue } from '../data/venues'
import { SYDNEY_CENTER } from '../data/venues'

/** Fix default marker icon in Vite/React */
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const selectedIcon = new L.DivIcon({
  className: 'venue-marker-selected',
  html: `<div style="
    width: 36px; height: 36px;
    background: #030213;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
})

interface FlyToSelectedProps {
  venue: Venue | null
}

function FlyToSelected({ venue }: FlyToSelectedProps) {
  const map = useMap()
  useEffect(() => {
    if (venue) {
      map.flyTo([venue.lat, venue.lng], 14, { duration: 0.5 })
    }
  }, [venue, map])
  return null
}

interface VenueMapProps {
  venues: Venue[]
  selectedVenueId: string | null
  onSelectVenue?: (id: string | null) => void
}

export function VenueMap({ venues, selectedVenueId, onSelectVenue }: VenueMapProps) {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
      <MapContainer
        center={[SYDNEY_CENTER.lat, SYDNEY_CENTER.lng]}
        zoom={11}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToSelected venue={selectedVenueId ? venues.find((v) => v.id === selectedVenueId) ?? null : null} />
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            position={[venue.lat, venue.lng]}
            icon={venue.id === selectedVenueId ? selectedIcon : markerIcon}
            eventHandlers={{
              click: () => onSelectVenue?.(venue.id === selectedVenueId ? null : venue.id),
            }}
          >
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-medium text-slate-900 mb-1">{venue.name}</p>
                <p className="text-sm text-gray-600 mb-2">{venue.suburb}</p>
                <Link
                  to={`/venue/${venue.id}`}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
