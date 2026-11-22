import { Link, NavLink, Outlet } from 'react-router-dom'
import SearchBar from './SearchBar'
import { useVerticals } from '../hooks/useVerticals'

export default function Layout() {
  const { verticals } = useVerticals()

  return (
    <div className="shell">
      <header className="masthead">
        <Link to="/" className="brand">
          <h1>CENTRAL WEBSITE</h1>
          <p className="tagline">One domain. Six knowledge verticals.</p>
        </Link>
        <SearchBar />
      </header>

      <nav className="vertical-nav" aria-label="Verticals">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'vertical-btn active' : 'vertical-btn')}>
          All
        </NavLink>
        {verticals.map((v) => (
          <NavLink
            key={v.id}
            to={`/${v.slug}`}
            className={({ isActive }) => (isActive ? 'vertical-btn active' : 'vertical-btn')}
          >
            {v.name}
            <span className="volume">{v.target_volume}</span>
          </NavLink>
        ))}
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>CENTRAL WEBSITE — unified knowledge platform</span>
      </footer>
    </div>
  )
}
