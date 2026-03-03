import { Link } from 'react-router-dom'

const plans = [
  {
    name: 'Solo',
    price: '$79',
    period: '/month',
    description: 'For independent Qualified Persons',
    highlight: false,
    features: [
      '10 inspections per month',
      'PDF report generation',
      'Digital sign-off',
      'Mobile app access',
      'Photo capture (R2 storage)',
      'Basic audit log',
      'Email support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Practice',
    price: '$249',
    period: '/month',
    description: 'For small firms with 2–5 QPs',
    highlight: true,
    features: [
      'Unlimited inspections',
      'Everything in Solo',
      'Zoho CRM sync',
      'Team dashboard',
      'Multi-QP accounts',
      'Inspection scheduling',
      'Client portal access',
      'Priority support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    price: 'POA',
    period: '',
    description: 'For large firms and councils',
    highlight: false,
    features: [
      'Everything in Practice',
      'White-label branding',
      'Custom compliance rules',
      'API access',
      'Council submission exports',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
    ],
    cta: 'Contact Us',
  },
]

export function PricingPage() {
  return (
    <>
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-slate-300 text-xl max-w-2xl mx-auto">
            All plans include a 14-day free trial. NZ GST inclusive. Cancel anytime.
          </p>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? 'bg-slate-900 text-white shadow-2xl ring-2 ring-green-brand'
                    : 'bg-white border border-slate-200 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="bg-green-brand text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-2xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mt-1 ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {plan.description}
                </p>

                <div className="mt-6 mb-8">
                  <span className={`text-5xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <svg
                        className="w-5 h-5 text-green-brand flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={plan.highlight ? 'text-slate-300' : 'text-slate-700'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/contact"
                  className={`mt-8 w-full text-center font-bold py-3 rounded-lg transition-colors ${
                    plan.highlight
                      ? 'bg-green-brand text-white hover:bg-green-light'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 text-slate-500 text-sm">
            All prices in NZD including GST · Invoiced monthly via Zoho Books · Stripe payments accepted
          </div>
        </div>
      </section>
    </>
  )
}
