import { Link, NavLink, Outlet } from 'react-router-dom'
import SearchBar from './SearchBar'
import { useVerticals } from '../hooks/useVerticals'
import { useTheme } from '../hooks/useTheme'
import { MoonIcon, SunIcon, SettingsIcon, HomeIcon } from './Icons'

export default function Layout() {
  const { verticals } = useVerticals()
  const { theme, toggle } = useTheme()

  return (
    <div className="shell">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">CW</span>
            <span className="brand-text">
              <strong>Central Website</strong>
              <small>Unified Knowledge Platform</small>
            </span>
          </Link>

          <SearchBar />

          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={toggle}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            </button>
            <Link to="/admin" className="header-admin">
              <SettingsIcon size={15} />
              <span>Admin</span>
            </Link>
          </div>
        </div>

        <nav className="vertical-nav" aria-label="Verticals">
          <NavLink to="/" end className={({ isActive }) => 'vertical-pill' + (isActive ? ' active' : '')}>
            <HomeIcon size={14} />
            <span>All</span>
          </NavLink>
          {verticals.map((v) => (
            <NavLink
              key={v.id}
              to={`/${v.slug}`}
              className={({ isActive }) => 'vertical-pill' + (isActive ? ' active' : '')}
            >
              <span className={`vp-dot vp-${v.slug}`} />
              <span>{v.name}</span>
              <span className="vp-target">{v.target_volume}</span>
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>Central Website — one domain, six knowledge verticals.</span>
          <span className="footer-scale">1B+ scale · 16-partition architecture</span>
        </div>
      </footer>
    </div>
  )
}
