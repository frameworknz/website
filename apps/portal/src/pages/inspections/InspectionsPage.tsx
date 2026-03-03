import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

interface Inspection {
  id: string
  inspection_type: string
  scheduled_date: string | null
  conducted_date: string | null
  status: string
  overall_result: string | null
  project_title: string
  project_address: string
  qp_name: string
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  submitted: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  requires_remediation: 'bg-orange-100 text-orange-700',
}

export function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    api.get<Inspection[]>('/inspections?limit=100')
      .then(setInspections)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? inspections : inspections.filter((i) => i.status === filter)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Inspections</h1>
        <Link
          to="/inspections/new"
          className="bg-green-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-dark transition-colors"
        >
          + New Inspection
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['all', 'scheduled', 'in_progress', 'submitted', 'approved', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-500">No inspections found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insp) => (
            <Link
              key={insp.id}
              to={`/inspections/${insp.id}`}
              className="block bg-white rounded-xl border border-slate-100 p-4 hover:shadow-sm hover:border-slate-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{insp.project_title}</div>
                  <div className="text-slate-500 text-sm">{insp.project_address}</div>
                  <div className="text-slate-400 text-xs mt-1">
                    {insp.inspection_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    {insp.scheduled_date && ` · ${insp.scheduled_date}`}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[insp.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {insp.status.replace(/_/g, ' ')}
                  </span>
                  {insp.overall_result && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      insp.overall_result === 'pass' ? 'bg-green-100 text-green-700' :
                      insp.overall_result === 'fail' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {insp.overall_result.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
