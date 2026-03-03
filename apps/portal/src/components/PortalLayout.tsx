import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { clearUser, getStoredUser } from '../lib/auth'

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/inspections', icon: '✓', label: 'Inspections' },
  { to: '/reports', icon: '📄', label: 'Reports' },
  { to: '/calendar', icon: '📅', label: 'Calendar' },
  { to: '/settings', icon: '⚙', label: 'Settings' },
]

export function PortalLayout() {
  const navigate = useNavigate()
  const user = getStoredUser()

  const handleLogout = () => {
    clearUser()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white">
        <div className="p-6 border-b border-slate-700">
          <div className="text-xl font-bold">
            Frame<span className="text-green-brand">work</span>
          </div>
          {user && (
            <div className="mt-3">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-slate-400">{user.role.toUpperCase()}</div>
              {user.licence_number && (
                <div className="text-xs text-slate-500 mt-0.5">LBP: {user.licence_number}</div>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-brand text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span>↩</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="text-lg font-bold">
            Frame<span className="text-green-brand">work</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden bg-white border-t border-gray-200 flex safe-bottom">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-3 text-xs gap-1 ${
                  isActive ? 'text-green-brand' : 'text-gray-500'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
