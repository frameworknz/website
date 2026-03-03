const resources = [
  {
    category: 'NZBC Guides',
    items: [
      { title: 'Understanding Clause B1 — Structure', type: 'PDF', gated: false },
      { title: 'Clause E2 — External Moisture Explained', type: 'PDF', gated: false },
      { title: 'H1 Energy Efficiency: Climate Zone Guide', type: 'PDF', gated: true },
      { title: 'Complete NZBC Inspection Checklist Template', type: 'PDF', gated: true },
    ],
  },
  {
    category: 'Inspection Checklists',
    items: [
      { title: 'Foundation Inspection Checklist', type: 'PDF', gated: false },
      { title: 'Framing Inspection Checklist', type: 'PDF', gated: false },
      { title: 'Pre-Line Insulation Checklist', type: 'PDF', gated: true },
      { title: 'Wet Area Waterproofing Checklist', type: 'PDF', gated: true },
    ],
  },
  {
    category: 'Regulatory References',
    items: [
      { title: 'NZ Building Act 2004 Summary', type: 'Guide', gated: false },
      { title: 'LBP Licence Categories Explained', type: 'Guide', gated: false },
      { title: 'Council Submission Requirements by Region', type: 'PDF', gated: true },
      { title: 'Record-Keeping Requirements for QPs', type: 'Guide', gated: false },
    ],
  },
]

export function ResourcesPage() {
  return (
    <>
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">Resources</h1>
            <p className="text-slate-300 text-xl">
              Guides, checklists, and reference documents for Qualified Persons and building professionals.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {resources.map((group) => (
            <div key={group.category} className="mb-12">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                {group.category}
              </h2>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <div
                    key={item.title}
                    className="bg-white rounded-lg border border-slate-100 px-5 py-4 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-500">
                        {item.type.slice(0, 3)}
                      </div>
                      <span className="text-slate-900 text-sm font-medium">{item.title}</span>
                    </div>
                    <button
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        item.gated
                          ? 'border border-slate-300 text-slate-600 hover:border-slate-400'
                          : 'bg-green-brand text-white hover:bg-green-dark'
                      }`}
                    >
                      {item.gated ? '🔒 Download (free)' : 'Download'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-slate-900 text-white rounded-2xl p-8 text-center mt-8">
            <h3 className="text-2xl font-bold mb-2">Get all resources free</h3>
            <p className="text-slate-400 mb-6 text-sm">
              Create a free Framework account to access the full resource library.
            </p>
            <a
              href="/contact"
              className="bg-green-brand text-white font-bold px-6 py-3 rounded-lg hover:bg-green-light transition-colors inline-block"
            >
              Create Free Account
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
