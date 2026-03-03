import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken, setRefreshToken } from '../lib/api'
import { storeUser, type AuthUser } from '../lib/auth'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.framework.co.nz/v1'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const resp = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await resp.json() as {
        ok: boolean
        data?: { token: string; refreshToken: string; user: AuthUser }
        error?: { message: string }
      }

      if (!data.ok || !data.data) {
        setError(data.error?.message ?? 'Invalid email or password')
        return
      }

      setToken(data.data.token)
      setRefreshToken(data.data.refreshToken)
      storeUser(data.data.user)
      navigate('/dashboard')
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-white mb-1">
            Frame<span className="text-green-brand">work</span>
          </div>
          <div className="text-slate-400 text-sm">Building Compliance Portal</div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-brand focus:border-transparent outline-none"
                placeholder="you@example.co.nz"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-brand focus:border-transparent outline-none"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-brand text-white font-semibold py-3 rounded-lg hover:bg-green-dark transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-6">
            Need an account?{' '}
            <a href="https://framework.co.nz/contact" className="text-green-brand font-medium">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
