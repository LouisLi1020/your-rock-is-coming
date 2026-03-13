import type { Venue } from '../data/venues'

interface VenueListProps {
  venues: Venue[]
}

export function VenueList({ venues }: VenueListProps) {
  if (!venues.length) {
    return <p>No venues yet. Check back soon.</p>
  }

  return (
    <ul className="venue-list" aria-label="Sydney tennis venues">
      {venues.map((venue) => (
        <li key={venue.id} className="venue-card">
          <h3>{venue.name}</h3>
          <p className="venue-meta">{venue.suburb}</p>
          <p>📍 {venue.address}</p>
          <p>⏰ {venue.openingHours}</p>
          {venue.surface && <p>🎾 Surface: {venue.surface}</p>}
          {venue.courts && <p>🟩 Courts: {venue.courts}</p>}
          {venue.contact && <p>☎️ {venue.contact}</p>}
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noreferrer" className="venue-link">
              Visit venue website
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}
