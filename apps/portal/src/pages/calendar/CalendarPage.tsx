import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'

interface Inspection {
  id: string
  inspection_type: string
  scheduled_date: string | null
  status: string
  project_title: string
  project_address: string
}

export function CalendarPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [viewYear, setViewYear] = useState(today.getFullYear())

  useEffect(() => {
    api.get<Inspection[]>('/inspections?limit=100')
      .then(setInspections)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()

  const inspsByDate: Record<string, Inspection[]> = {}
  inspections.forEach((i) => {
    if (i.scheduled_date) {
      const key = i.scheduled_date.slice(0, 10)
      inspsByDate[key] = [...(inspsByDate[key] ?? []), i]
    }
  })

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
        <Link
          to="/inspections/new"
          className="bg-green-brand text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-dark"
        >
          + Schedule
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button onClick={prevMonth} className="text-slate-400 hover:text-slate-700 p-1">‹</button>
          <span className="font-semibold text-slate-900">{monthName}</span>
          <button onClick={nextMonth} className="text-slate-400 hover:text-slate-700 p-1">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-slate-400">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        {loading ? (
          <div className="text-center text-slate-400 py-12">Loading...</div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="border-b border-r border-slate-50 min-h-[80px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayInspections = inspsByDate[dateKey] ?? []
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

              return (
                <div key={day} className="border-b border-r border-slate-50 min-h-[80px] p-1.5">
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    isToday ? 'bg-green-brand text-white' : 'text-slate-700'
                  }`}>
                    {day}
                  </div>
                  {dayInspections.slice(0, 2).map((insp) => (
                    <Link key={insp.id} to={`/inspections/${insp.id}`}>
                      <div className="text-xs bg-blue-50 text-blue-700 rounded px-1 py-0.5 truncate mb-0.5 hover:bg-blue-100">
                        {insp.project_title}
                      </div>
                    </Link>
                  ))}
                  {dayInspections.length > 2 && (
                    <div className="text-xs text-slate-400">+{dayInspections.length - 2} more</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
