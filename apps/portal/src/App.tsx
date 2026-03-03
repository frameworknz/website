import { Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated } from './lib/auth'
import { PortalLayout } from './components/PortalLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { InspectionsPage } from './pages/inspections/InspectionsPage'
import { InspectionDetailPage } from './pages/inspections/InspectionDetailPage'
import { NewInspectionPage } from './pages/inspections/NewInspectionPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { CalendarPage } from './pages/calendar/CalendarPage'
import { SettingsPage } from './pages/settings/SettingsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <PortalLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="inspections/new" element={<NewInspectionPage />} />
        <Route path="inspections/:id" element={<InspectionDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
