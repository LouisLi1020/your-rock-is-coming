import { VenueList } from './components/VenueList'
import { venues } from './data/venues'

export function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>your-rock-is-coming 🎾</h1>
        <p>Discover tennis venues & clubs across Sydney</p>
      </header>
      <main>
        <section>
          <h2>Venues (v1.0)</h2>
          <p className="subtitle">
            Browse locations, opening hours and basic contact info. Later versions will add direct
            booking and live status.
          </p>
          <VenueList venues={venues} />
        </section>
      </main>
    </div>
  )
}
