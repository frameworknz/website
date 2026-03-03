import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface Report {
  id: string
  inspection_id: string
  report_type: string
  r2_key: string | null
  signed_at: string | null
  sent_to: string | null
  created_at: string
  project_title: string
  inspection_type: string
}

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch reports via inspections
    api.get<{ id: string; inspection_type: string; project_title: string }[]>('/inspections?status=approved&limit=50')
      .then(async (inspections) => {
        // For each approved inspection, we'd normally fetch reports
        // For now, show approved inspections as reportable
        setReports(inspections.map((i) => ({
          id: i.id,
          inspection_id: i.id,
          report_type: 'inspection',
          r2_key: null,
          signed_at: null,
          sent_to: null,
          created_at: new Date().toISOString(),
          project_title: (i as { project_title?: string }).project_title ?? 'Unknown Project',
          inspection_type: i.inspection_type,
        })))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const generateReport = async (inspectionId: string) => {
    await api.post(`/reports/generate/${inspectionId}`)
    alert('Report generation queued. It will be available shortly.')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Reports</h1>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-slate-500">No reports yet</p>
          <p className="text-slate-400 text-sm mt-1">Reports are generated when inspections are approved</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="font-semibold text-slate-900 text-sm">{report.project_title}</div>
                <div className="text-slate-500 text-xs mt-0.5">
                  {report.inspection_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  {report.signed_at && ` · Signed ${new Date(report.signed_at).toLocaleDateString('en-NZ')}`}
                </div>
              </div>
              <div className="flex gap-2">
                {report.r2_key ? (
                  <a
                    href={`${import.meta.env.VITE_R2_URL ?? ''}/${report.r2_key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium px-3 py-1.5 bg-green-brand text-white rounded-lg hover:bg-green-dark"
                  >
                    Download
                  </a>
                ) : (
                  <button
                    onClick={() => generateReport(report.inspection_id)}
                    className="text-xs font-medium px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    Generate PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
