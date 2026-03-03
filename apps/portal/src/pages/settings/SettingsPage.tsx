import { useState } from 'react'
import { getStoredUser, storeUser } from '../../lib/auth'
import { api } from '../../lib/api'

export function SettingsPage() {
  const user = getStoredUser()
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: '',
    licence_number: user?.licence_number ?? '',
    licence_expiry: user?.licence_expiry ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const updated = await api.patch<typeof user>('/users/me', form)
      if (updated && user) {
        storeUser({ ...user, ...updated })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+64 21 xxx xxxx"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">LBP Licence Number</label>
              <input
                type="text"
                value={form.licence_number}
                onChange={(e) => setForm({ ...form, licence_number: e.target.value })}
                placeholder="LBP-XXXXXX"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-brand"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Licence Expiry</label>
              <input
                type="date"
                value={form.licence_expiry}
                onChange={(e) => setForm({ ...form, licence_expiry: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-brand"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-green-brand text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-green-dark transition-colors disabled:opacity-60"
          >
            {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm mt-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Role</span>
            <span className="font-medium capitalize">{user?.role ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Plan</span>
            <span className="font-medium">Solo</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Data retention</span>
            <span className="font-medium">7 years (NZ Building Act)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
