import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'https://api.framework.co.nz/v1'

export function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: 'qp', message: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    try {
      // Post to Zoho CRM via API
      const resp = await fetch(`${API_URL}/webhooks/zoho`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'web_lead', ...form }),
      })

      if (resp.ok) {
        setStatus('sent')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-4">Get in touch</h1>
            <p className="text-slate-300 text-xl">
              Start your free trial, ask a question, or talk to us about Enterprise pricing.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {status === 'sent' ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Message received!</h2>
              <p className="text-slate-600">
                We'll be in touch within one business day. Check your email for a confirmation.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-brand focus:border-transparent outline-none"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-brand focus:border-transparent outline-none"
                      placeholder="jane@example.co.nz"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-brand focus:border-transparent outline-none"
                    placeholder="+64 21 xxx xxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-brand focus:border-transparent outline-none"
                  >
                    <option value="qp">Qualified Person / LBP</option>
                    <option value="firm">Compliance firm</option>
                    <option value="owner">Building owner / developer</option>
                    <option value="council">Council / BCA</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                  <textarea
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-brand focus:border-transparent outline-none resize-none"
                    placeholder="Tell us what you need..."
                  />
                </div>

                {status === 'error' && (
                  <p className="text-red-600 text-sm">Something went wrong. Please try again or email us directly.</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full bg-green-brand text-white font-bold py-3 rounded-lg hover:bg-green-dark transition-colors disabled:opacity-60"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>

                <p className="text-slate-400 text-xs text-center">
                  By submitting, you agree to our Privacy Policy. Your data is handled under the NZ Privacy Act 2020.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
