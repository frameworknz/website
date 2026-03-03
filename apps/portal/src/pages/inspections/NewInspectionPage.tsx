import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

interface Project {
  id: string
  title: string
  address: string
}

const INSPECTION_TYPES = [
  { value: 'foundation', label: 'Foundation & Site' },
  { value: 'subfloor_framing', label: 'Subfloor Framing' },
  { value: 'pre_wrap', label: 'Pre-Wrap' },
  { value: 'framing', label: 'Framing' },
  { value: 'pre_line', label: 'Pre-Line (Insulation)' },
  { value: 'wet_area_pre_line', label: 'Wet Area Pre-Line' },
  { value: 'pre_plaster', label: 'Pre-Plaster' },
  { value: 'final', label: 'Final Inspection' },
]

export function NewInspectionPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState({
    project_id: '',
    inspection_type: '',
    scheduled_date: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // New project form
  const [newProject, setNewProject] = useState({
    title: '',
    address: '',
    project_type: 'residential' as 'residential' | 'commercial' | 'industrial',
  })
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    api.get<Project[]>('/projects?status=active')
      .then(setProjects)
      .catch(console.error)
  }, [])

  const handleCreateProject = async () => {
    if (!newProject.title || !newProject.address) return
    try {
      const project = await api.post<Project>('/projects', newProject)
      setProjects([project, ...projects])
      setForm({ ...form, project_id: project.id })
      setShowNewProject(false)
    } catch {
      setError('Failed to create project')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.project_id || !form.inspection_type) {
      setError('Please select a project and inspection type')
      return
    }
    setLoading(true)
    setError('')

    try {
      const insp = await api.post<{ id: string }>('/inspections', form)
      navigate(`/inspections/${insp.id}`)
    } catch {
      setError('Failed to create inspection')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New Inspection</h1>
        <p className="text-slate-500 text-sm mt-1">
          Select a project and inspection stage to begin
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Project</label>
              <button
                type="button"
                onClick={() => setShowNewProject(!showNewProject)}
                className="text-xs text-green-brand font-medium"
              >
                {showNewProject ? 'Cancel' : '+ New Project'}
              </button>
            </div>

            {showNewProject ? (
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
                <input
                  type="text"
                  placeholder="Project title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-brand"
                />
                <input
                  type="text"
                  placeholder="Site address"
                  value={newProject.address}
                  onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-brand"
                />
                <select
                  value={newProject.project_type}
                  onChange={(e) => setNewProject({ ...newProject, project_type: e.target.value as 'residential' | 'commercial' | 'industrial' })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-brand"
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                </select>
                <button
                  type="button"
                  onClick={handleCreateProject}
                  className="w-full bg-green-brand text-white py-2 rounded-lg text-sm font-medium"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <select
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-brand"
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {p.address}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Inspection type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Inspection Stage</label>
            <div className="grid grid-cols-2 gap-2">
              {INSPECTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, inspection_type: type.value })}
                  className={`text-left px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    form.inspection_type === type.value
                      ? 'border-green-brand bg-green-50 text-green-brand'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Scheduled Date (optional)
            </label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-brand"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-brand resize-none"
              placeholder="Any pre-inspection notes..."
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
            className="w-full bg-green-brand text-white font-semibold py-3 rounded-lg hover:bg-green-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Inspection'}
          </button>
        </form>
      </div>
    </div>
  )
}
