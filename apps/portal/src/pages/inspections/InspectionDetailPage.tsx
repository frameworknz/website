import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

interface ChecklistItem {
  id: string
  category: string
  item_code: string
  description: string
  result: 'pass' | 'fail' | 'n/a' | 'pending'
  notes: string | null
  requires_remediation: boolean
}

interface Inspection {
  id: string
  inspection_type: string
  scheduled_date: string | null
  conducted_date: string | null
  status: string
  overall_result: string | null
  weather_conditions: string | null
  site_conditions: string | null
  notes: string | null
  project_title: string
  project_address: string
  qp_name: string
}

const RESULT_OPTS: { value: ChecklistItem['result']; label: string; style: string }[] = [
  { value: 'pass', label: '✓ Pass', style: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'fail', label: '✗ Fail', style: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'n/a', label: '— N/A', style: 'bg-gray-100 text-gray-600 border-gray-300' },
]

export function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get<Inspection>(`/inspections/${id}`),
      api.get<ChecklistItem[]>(`/inspections/${id}/checklist`),
    ])
      .then(([insp, cl]) => {
        setInspection(insp)
        setChecklist(cl)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const updateItem = async (itemId: string, result: ChecklistItem['result']) => {
    setSaving(itemId)
    try {
      const updated = await api.patch<ChecklistItem>(`/checklist-items/${itemId}`, { result })
      setChecklist((prev) => prev.map((i) => (i.id === itemId ? updated : i)))
    } catch {
      // non-fatal
    } finally {
      setSaving(null)
    }
  }

  const startInspection = async () => {
    if (!id) return
    await api.patch(`/inspections/${id}`, {
      status: 'in_progress',
      conducted_date: new Date().toISOString().slice(0, 10),
    })
    setInspection((prev) => prev ? { ...prev, status: 'in_progress' } : null)
  }

  const submitInspection = async () => {
    if (!id) return
    setSubmitting(true)

    const passCount = checklist.filter((i) => i.result === 'pass').length
    const failCount = checklist.filter((i) => i.result === 'fail').length
    const pendingCount = checklist.filter((i) => i.result === 'pending').length

    if (pendingCount > 0) {
      alert(`${pendingCount} checklist items are still pending. Please complete all items before submitting.`)
      setSubmitting(false)
      return
    }

    const overallResult = failCount > 0
      ? failCount > passCount / 2 ? 'fail' : 'conditional_pass'
      : 'pass'

    await api.patch(`/inspections/${id}`, { overall_result: overallResult })
    await api.post(`/inspections/${id}/submit`)
    navigate('/inspections')
  }

  if (loading) return <div className="p-6 text-center text-slate-400">Loading...</div>
  if (!inspection) return <div className="p-6 text-center text-slate-400">Inspection not found</div>

  const canStart = inspection.status === 'scheduled'
  const canSubmit = inspection.status === 'in_progress'
  const isReadOnly = !['scheduled', 'in_progress'].includes(inspection.status)

  const passCount = checklist.filter((i) => i.result === 'pass').length
  const failCount = checklist.filter((i) => i.result === 'fail').length
  const pendingCount = checklist.filter((i) => i.result === 'pending').length

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 mb-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{inspection.project_title}</h1>
            <p className="text-slate-500 text-sm">{inspection.project_address}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            inspection.status === 'approved' ? 'bg-green-100 text-green-700' :
            inspection.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
            inspection.status === 'submitted' ? 'bg-purple-100 text-purple-700' :
            inspection.status === 'failed' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {inspection.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-slate-400">Type:</span> <span className="font-medium">{inspection.inspection_type.replace(/_/g, ' ')}</span></div>
          <div><span className="text-slate-400">Date:</span> <span className="font-medium">{inspection.scheduled_date ?? 'TBC'}</span></div>
          <div><span className="text-slate-400">QP:</span> <span className="font-medium">{inspection.qp_name}</span></div>
          {inspection.overall_result && (
            <div><span className="text-slate-400">Result:</span> <span className="font-medium capitalize">{inspection.overall_result.replace(/_/g, ' ')}</span></div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>{checklist.length} items total</span>
            <span>{passCount} pass · {failCount} fail · {pendingCount} pending</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-green-brand h-full transition-all" style={{ width: `${(passCount / Math.max(checklist.length, 1)) * 100}%` }} />
            <div className="bg-red-500 h-full transition-all" style={{ width: `${(failCount / Math.max(checklist.length, 1)) * 100}%` }} />
          </div>
        </div>

        {/* Actions */}
        {canStart && (
          <button
            onClick={startInspection}
            className="mt-4 w-full bg-green-brand text-white font-semibold py-3 rounded-lg hover:bg-green-dark transition-colors"
          >
            Begin Inspection
          </button>
        )}
      </div>

      {/* Checklist */}
      <h2 className="text-lg font-bold text-slate-900 mb-3">Checklist</h2>

      {checklist.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-6 text-center text-slate-400">
          No checklist items
        </div>
      ) : (
        <div className="space-y-3">
          {checklist.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {item.category}
                    </span>
                    {saving === item.id && (
                      <span className="text-xs text-slate-400">Saving...</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-900 mt-1">{item.description}</p>
                </div>
              </div>

              {!isReadOnly && (
                <div className="flex gap-2">
                  {RESULT_OPTS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateItem(item.id, opt.value)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all ${
                        item.result === opt.value
                          ? opt.style
                          : 'border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {isReadOnly && (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  item.result === 'pass' ? 'bg-green-100 text-green-700' :
                  item.result === 'fail' ? 'bg-red-100 text-red-700' :
                  item.result === 'n/a' ? 'bg-gray-100 text-gray-500' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {item.result}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit button — fixed bottom */}
      {canSubmit && (
        <div className="fixed bottom-16 md:bottom-6 left-0 right-0 px-4 md:px-6 max-w-3xl mx-auto">
          <button
            onClick={submitInspection}
            disabled={submitting}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-2xl hover:bg-slate-800 transition-colors disabled:opacity-60 text-base"
          >
            {submitting ? 'Submitting...' : `Submit Inspection ${pendingCount > 0 ? `(${pendingCount} pending)` : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}
