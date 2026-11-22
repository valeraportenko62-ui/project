import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-inner">
          <NavLink to="/admin" end className="admin-brand">
            <span className="admin-brand-icon">CW</span>
            <span className="admin-brand-text">
              <strong>Central Website</strong>
              <small>Admin Dashboard</small>
            </span>
          </NavLink>
          <nav className="admin-nav">
            <NavLink to="/admin" end className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>
              Overview
            </NavLink>
            <NavLink to="/admin/entries" className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>
              Entries
            </NavLink>
            <NavLink to="/admin/categories" className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>
              Categories & Links
            </NavLink>
            <NavLink to="/admin/batch" className={({ isActive }) => 'admin-nav-link' + (isActive ? ' active' : '')}>
              Batch Generator
            </NavLink>
          </nav>
          <NavLink to="/" className="admin-view-site">
            View site &rarr;
          </NavLink>
        </div>
      </header>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
