import type { Env } from '../index'

export async function handleSendNotification(
  payload: Record<string, unknown>,
  env: Env
): Promise<void> {
  const { type, userId, message, phone } = payload as {
    type: 'email' | 'sms' | 'push'
    userId?: string
    message: string
    phone?: string
  }

  if (type === 'sms' && phone) {
    await sendSms(env, phone, message)
  } else if (type === 'email' && userId) {
    const user = await env.DB.prepare('SELECT email, name FROM users WHERE id = ?')
      .bind(userId)
      .first<{ email: string; name: string }>()
    if (user) {
      await sendEmail(env, user.email, user.name, 'Framework Notification', message)
    }
  }

  console.log(`Notification sent [${type}]`)
}

async function sendSms(env: Env, to: string, body: string): Promise<void> {
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`)
  const params = new URLSearchParams({
    To: to,
    From: env.TWILIO_PHONE_NUMBER,
    Body: body,
  })

  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  )

  if (!resp.ok) throw new Error(`Twilio error: ${resp.status}`)
}

async function sendEmail(env: Env, to: string, name: string, subject: string, htmlContent: string): Promise<void> {
  const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to, name }] }],
      from: { email: 'noreply@framework.co.nz', name: 'Framework' },
      subject,
      content: [{ type: 'text/html', value: htmlContent }],
    }),
  })

  if (!resp.ok) throw new Error(`SendGrid error: ${resp.status}`)
}
