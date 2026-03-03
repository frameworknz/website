import { Link } from 'react-router-dom'

const steps = [
  {
    step: '1',
    title: 'Create your QP profile',
    description: 'Enter your LBP licence number — we validate it against the MBIE register. Add your details once, use everywhere.',
  },
  {
    step: '2',
    title: 'Add a project',
    description: 'Enter site address, owner details, and council reference. Syncs to Zoho CRM automatically.',
  },
  {
    step: '3',
    title: 'Schedule an inspection',
    description: 'Select the inspection stage. Your NZBC checklist is auto-generated with all applicable clauses.',
  },
  {
    step: '4',
    title: 'Complete on-site',
    description: 'Work through the checklist on your phone. Capture photos, add notes, mark pass/fail/N/A per item.',
  },
  {
    step: '5',
    title: 'Submit & sign off',
    description: 'One tap to submit. Framework generates the PDF report and emails it to the client automatically.',
  },
]

export function QualifiedPersonsPage() {
  return (
    <>
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">Built for Qualified Persons</h1>
            <p className="text-slate-300 text-xl leading-relaxed">
              Framework is designed by people who understand what it takes to conduct a legally
              compliant building inspection in New Zealand.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">How it works</h2>
          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.step} className="flex gap-6">
                <div className="flex-shrink-0 w-10 h-10 bg-green-brand text-white rounded-full flex items-center justify-center font-bold">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features for QPs */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">What you get</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📱', title: 'Mobile-first', desc: 'Designed for phones. Works in gloves. Large touch targets for on-site use.' },
              { icon: '✈️', title: 'Offline mode', desc: 'Complete inspections anywhere. Auto-syncs when signal returns.' },
              { icon: '📋', title: 'Smart checklists', desc: 'NZBC clauses auto-loaded per inspection type. No manual setup.' },
              { icon: '📸', title: 'Photo evidence', desc: 'Attach photos to checklist items. Stored securely, stripped of EXIF data.' },
              { icon: '✍️', title: 'Digital sign-off', desc: 'Sign reports digitally. Legally equivalent to wet signature in NZ.' },
              { icon: '🕒', title: 'Audit trail', desc: 'Every action logged. Immutable record for Building Act compliance.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-5 border border-slate-100">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-brand py-16 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Start your free trial today</h2>
          <p className="text-green-100 mb-8">14 days free. No credit card. Full access to all features.</p>
          <Link
            to="/contact"
            className="bg-white text-green-brand font-bold px-8 py-4 rounded-lg hover:bg-slate-100 transition-colors inline-block"
          >
            Create Your QP Account
          </Link>
        </div>
      </section>
    </>
  )
}
