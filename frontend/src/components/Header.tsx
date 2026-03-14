import { Link } from 'react-router-dom'

/**
 * Alternative header component (backup / optional).
 * Current UI uses Nav.tsx (top bar) + LeftPanel brand block instead.
 */
export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="block">
            <h1 className="text-slate-900 font-medium text-xl">your-rock-is-coming</h1>
            <p className="mt-1 text-sm text-gray-600">
              Discover tennis courts and venues across Sydney
            </p>
          </Link>
          <div className="text-right">
            <p className="text-xs text-gray-500">UniHack 2026</p>
            <p className="text-xs text-gray-400 mt-0.5">With persistence, reach the top 🎾</p>
          </div>
        </div>
      </div>
    </header>
  )
}
