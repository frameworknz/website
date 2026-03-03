import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { getStoredUser } from '../../lib/auth'

interface Inspection {
  id: string
  inspection_type: string
  scheduled_date: string | null
  status: string
  project_title: string
  project_address: string
}

interface DashStats {
  total: number
  scheduled: number
  in_progress: number
  submitted: number
  approved: number
}

export function DashboardPage() {
  const user = getStoredUser()
  const [upcoming, setUpcoming] = useState<Inspection[]>([])
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [inspList] = await Promise.all([
          api.get<Inspection[]>('/inspections?limit=5&status=scheduled'),
        ])
        setUpcoming(inspList)

        // Compute quick stats from all inspections
        const all = await api.get<Inspection[]>('/inspections?limit=100')
        const arr = Array.isArray(all) ? all : []
        setStats({
          total: arr.length,
          scheduled: arr.filter((i) => i.status === 'scheduled').length,
          in_progress: arr.filter((i) => i.status === 'in_progress').length,
          submitted: arr.filter((i) => i.status === 'submitted').length,
          approved: arr.filter((i) => i.status === 'approved').length,
        })
      } catch {
        // non-fatal
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Good morning, {user?.name?.split(' ')[0]}</h1>
        <p className="text-slate-500 text-sm mt-1">{today}</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Inspections', value: stats.total, color: 'bg-slate-100 text-slate-700' },
            { label: 'Scheduled', value: stats.scheduled, color: 'bg-blue-50 text-blue-700' },
            { label: 'In Progress', value: stats.in_progress, color: 'bg-amber-50 text-amber-700' },
            { label: 'Approved', value: stats.approved, color: 'bg-green-50 text-green-700' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl p-5 ${stat.color}`}>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="text-sm font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          to="/inspections/new"
          className="bg-green-brand text-white rounded-xl p-5 flex items-center gap-3 hover:bg-green-dark transition-colors"
        >
          <span className="text-2xl">+</span>
          <div>
            <div className="font-semibold">New Inspection</div>
            <div className="text-green-100 text-xs">Start a new job</div>
          </div>
        </Link>
        <Link
          to="/inspections"
          className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
        >
          <span className="text-2xl">📋</span>
          <div>
            <div className="font-semibold text-slate-900">All Inspections</div>
            <div className="text-slate-500 text-xs">View history</div>
          </div>
        </Link>
        <Link
          to="/reports"
          className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
        >
          <span className="text-2xl">📄</span>
          <div>
            <div className="font-semibold text-slate-900">Reports</div>
            <div className="text-slate-500 text-xs">Download PDFs</div>
          </div>
        </Link>
      </div>

      {/* Upcoming inspections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Upcoming Inspections</h2>
          <Link to="/inspections" className="text-sm text-green-brand hover:text-green-dark font-medium">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-400">
            Loading...
          </div>
        ) : upcoming.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-8 text-center">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-slate-500 text-sm">No upcoming inspections</p>
            <Link
              to="/inspections/new"
              className="mt-3 inline-block text-green-brand text-sm font-medium"
            >
              Schedule one now →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((insp) => (
              <Link
                key={insp.id}
                to={`/inspections/${insp.id}`}
                className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between hover:border-slate-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600">
                    {insp.inspection_type.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900 text-sm">{insp.project_title}</div>
                    <div className="text-slate-500 text-xs">{insp.project_address}</div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      {insp.inspection_type.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-slate-700">
                    {insp.scheduled_date ?? 'TBC'}
                  </div>
                  <div className={`text-xs mt-1 px-2 py-0.5 rounded-full font-medium ${
                    insp.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    insp.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {insp.status.replace(/_/g, ' ')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
