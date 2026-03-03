import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ServicesPage } from './pages/ServicesPage'
import { QualifiedPersonsPage } from './pages/QualifiedPersonsPage'
import { PricingPage } from './pages/PricingPage'
import { ContactPage } from './pages/ContactPage'
import { ResourcesPage } from './pages/ResourcesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="qualified-persons" element={<QualifiedPersonsPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="resources" element={<ResourcesPage />} />
      </Route>
    </Routes>
  )
}
