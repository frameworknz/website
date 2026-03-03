import { Outlet, Link, NavLink } from 'react-router-dom'
import { useState } from 'react'

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { to: '/services', label: 'Services' },
    { to: '/qualified-persons', label: 'For QPs' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/resources', label: 'Resources' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900">
                Frame<span className="text-green-brand">work</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-sm font-medium transition-colors ${isActive ? 'text-green-brand' : 'text-slate-600 hover:text-slate-900'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <a
                href="https://portal.framework.co.nz"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Sign In
              </a>
              <Link
                to="/contact"
                className="bg-green-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-dark transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-600"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block text-sm font-medium py-2 ${isActive ? 'text-green-brand' : 'text-slate-700'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/contact"
              onClick={() => setMobileOpen(false)}
              className="block bg-green-brand text-white text-sm font-semibold px-4 py-2 rounded-lg text-center mt-2"
            >
              Get Started
            </Link>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold mb-3">
                Frame<span className="text-green-brand">work</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                The compliance platform built for Qualified Persons who make buildings safe in New Zealand.
              </p>
              <div className="flex gap-4 mt-5">
                {['LinkedIn', 'Facebook', 'Instagram'].map((platform) => (
                  <a
                    key={platform}
                    href="#"
                    className="text-slate-400 hover:text-white text-xs transition-colors"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-4">Platform</h4>
              <ul className="space-y-2">
                {[
                  { to: '/services', label: 'Services' },
                  { to: '/qualified-persons', label: 'For QPs' },
                  { to: '/pricing', label: 'Pricing' },
                  { to: '/resources', label: 'Resources' },
                ].map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-slate-400 hover:text-white text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-4">Compliance</h4>
              <ul className="space-y-2">
                {['NZBC Clauses', 'Building Act 2004', 'LBP Licence', 'BCA Submissions', 'Privacy Policy'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} Framework. All rights reserved. Built for the NZ Building Act 2004.
            </p>
            <p className="text-slate-500 text-xs">framework.co.nz</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
