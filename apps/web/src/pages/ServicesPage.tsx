import { Link } from 'react-router-dom'

const services = [
  {
    title: 'Foundation & Site Inspection',
    clauses: ['B1 — Structure', 'B2 — Durability', 'E1 — Surface Water'],
    description: 'Verify foundation depths, bearing capacity, site drainage, and material durability before work proceeds.',
  },
  {
    title: 'Subfloor Framing',
    clauses: ['B1 — Structure', 'H1 — Energy Efficiency'],
    description: 'Check subfloor framing connections, bearer/joist spans, and underfloor insulation installation.',
  },
  {
    title: 'Pre-Wrap Inspection',
    clauses: ['B2 — Durability', 'E2 — External Moisture'],
    description: 'Inspect external wrap installation, fixings in exposed conditions, and moisture barrier continuity.',
  },
  {
    title: 'Framing Inspection',
    clauses: ['B1 — Structure', 'C — Fire', 'F6 — Visibility'],
    description: 'Full structural review — bracing elements, fire separations, connection hardware, and glazing locations.',
  },
  {
    title: 'Pre-Line (Insulation)',
    clauses: ['H1 — Energy', 'F2 — Hazardous Materials'],
    description: 'Confirm insulation R-values meet NZ climate zone requirements, with no gaps or compression.',
  },
  {
    title: 'Wet Area Pre-Line',
    clauses: ['E3 — Internal Moisture', 'B2 — Durability'],
    description: 'Waterproofing membrane inspection for bathrooms, ensuite, and laundry areas before lining.',
  },
  {
    title: 'Pre-Plaster',
    clauses: ['E2 — External Moisture'],
    description: 'Cladding system, flashing details, and cavity drainage verification before plastering.',
  },
  {
    title: 'Final Inspection',
    clauses: ['All NZBC Clauses'],
    description: 'Comprehensive final compliance check across all applicable clauses before CCC application.',
  },
]

export function ServicesPage() {
  return (
    <>
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">Inspection Services</h1>
            <p className="text-slate-300 text-xl leading-relaxed">
              Framework covers every stage of residential and commercial building compliance — from site
              preparation to final sign-off.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div key={service.title} className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">{service.description}</p>
                <div className="flex flex-wrap gap-2">
                  {service.clauses.map((clause) => (
                    <span
                      key={clause}
                      className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200"
                    >
                      {clause}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Link
              to="/contact"
              className="bg-green-brand text-white font-bold px-8 py-4 rounded-lg hover:bg-green-dark transition-colors inline-block"
            >
              Book an Inspection
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
