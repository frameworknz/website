import { Link } from 'react-router-dom'

const inspectionTypes = [
  { stage: 'Site / Foundation', clauses: 'B1, B2, E1' },
  { stage: 'Subfloor Framing', clauses: 'B1, H1' },
  { stage: 'Pre-Wrap', clauses: 'B2, E2' },
  { stage: 'Framing', clauses: 'B1, C, F6' },
  { stage: 'Pre-Line (Insulation)', clauses: 'H1, F2' },
  { stage: 'Wet Area Pre-Line', clauses: 'E3, B2' },
  { stage: 'Pre-Plaster', clauses: 'E2' },
  { stage: 'Final Inspection', clauses: 'All clauses' },
]

const stats = [
  { value: '2,400+', label: 'Inspections completed' },
  { value: '98%', label: 'Council acceptance rate' },
  { value: '340+', label: 'Qualified Persons' },
  { value: '7yr', label: 'Compliant record retention' },
]

const features = [
  {
    icon: '📋',
    title: 'Digital Inspection Checklists',
    description: 'NZBC clause-mapped checklists auto-populated for each inspection stage. Pass, fail, or N/A — with notes and photo attachment.',
  },
  {
    icon: '📸',
    title: 'On-Site Photo Capture',
    description: 'Capture and annotate site photos directly from the field. EXIF-stripped and stored securely in Cloudflare R2.',
  },
  {
    icon: '📄',
    title: 'Instant PDF Reports',
    description: 'Professional inspection reports generated automatically with QP letterhead, licence details, and digital sign-off.',
  },
  {
    icon: '🔄',
    title: 'Zoho CRM Integration',
    description: 'Every project, inspection, and report syncs to Zoho CRM. Trigger invoices automatically on final sign-off.',
  },
  {
    icon: '📱',
    title: 'Works Offline',
    description: 'Service worker-backed PWA. Complete inspections in areas with no signal — data syncs automatically when you reconnect.',
  },
  {
    icon: '🔐',
    title: 'Legally Compliant',
    description: 'Every QP action is logged to an immutable audit trail. 7-year retention. Aligned with NZ Building Act 2004.',
  },
]

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-green-brand/10 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-green-brand/20 text-green-300 text-sm font-medium px-3 py-1 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Built for the NZ Building Act 2004
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Building compliance,
              <br />
              <span className="text-green-brand">done right.</span>
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl">
              Framework gives Qualified Persons the tools to conduct, document, and deliver
              NZBC-compliant building inspections — from the foundation to final sign-off.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/contact"
                className="bg-green-brand text-white font-semibold px-8 py-3 rounded-lg hover:bg-green-light transition-colors text-center"
              >
                Get Started Free
              </Link>
              <Link
                to="/services"
                className="border border-slate-600 text-white font-semibold px-8 py-3 rounded-lg hover:border-slate-400 transition-colors text-center"
              >
                See How It Works
              </Link>
            </div>

            <p className="text-slate-400 text-sm mt-4">
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-brand text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold">{stat.value}</div>
                <div className="text-green-100 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything a QP needs, in one platform
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Designed with Qualified Persons who work on-site, in all conditions, under deadline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspection stages */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Every inspection stage covered
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Framework maps every NZBC clause to its inspection stage. Checklists are
                automatically generated — you just work through them on-site.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 text-green-brand font-semibold hover:text-green-dark"
              >
                View all inspection types
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="space-y-3">
              {inspectionTypes.map((type, i) => (
                <div
                  key={type.stage}
                  className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-green-brand/10 text-green-brand rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="font-medium text-slate-900 text-sm">{type.stage}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono bg-white border border-slate-200 px-2 py-1 rounded">
                    {type.clauses}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted by QPs across New Zealand</h2>
            <p className="text-slate-400 text-lg">From sole-trader inspectors to large compliance firms</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Framework cut my report turnaround from 2 days to 2 hours. The checklist auto-population alone is worth it.",
                name: "James T.",
                role: "Independent QP, Auckland",
              },
              {
                quote: "Every report we generate is council-ready. No more back-and-forth on missing clauses.",
                name: "Sarah M.",
                role: "Compliance Manager, Wellington",
              },
              {
                quote: "The offline mode is a game-changer. We work in remote areas — now we never lose inspection data.",
                name: "Mike R.",
                role: "LBP Inspector, Queenstown",
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-slate-800 rounded-xl p-6">
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                  <div className="text-slate-400 text-xs">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-green-brand text-white">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-4">Ready to modernise your inspections?</h2>
          <p className="text-green-100 text-lg mb-8">
            Join 340+ Qualified Persons using Framework to deliver faster, more accurate compliance reports.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-white text-green-brand font-bold px-8 py-4 rounded-lg hover:bg-slate-100 transition-colors text-lg"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </>
  )
}
