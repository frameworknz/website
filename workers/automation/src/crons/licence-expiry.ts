import type { Env } from '../index'

export async function runLicenceExpiryCheck(env: Env): Promise<void> {
  // Find QPs with licences expiring in 60, 30, or 7 days
  const { results: expiringQPs } = await env.DB.prepare(`
    SELECT id, name, email, phone, licence_number, licence_expiry,
           julianday(licence_expiry) - julianday('now') as days_until_expiry
    FROM users
    WHERE role = 'qp'
      AND is_active = 1
      AND licence_expiry IS NOT NULL
      AND julianday(licence_expiry) - julianday('now') IN (60, 30, 7)
  `)
    .all<{
      id: string; name: string; email: string; phone: string | null;
      licence_number: string; days_until_expiry: number
    }>()

  for (const qp of expiringQPs) {
    const days = Math.round(qp.days_until_expiry)
    const message = `Framework alert: Your LBP licence (${qp.licence_number}) expires in ${days} days. Renew at mbie.govt.nz to maintain your access. — Framework`

    await env.TASK_QUEUE.send({
      type: 'send_notification',
      payload: {
        type: 'email',
        userId: qp.id,
        message: `<p>Hi ${qp.name},</p><p>Your LBP licence <strong>${qp.licence_number}</strong> expires in <strong>${days} days</strong>.</p><p>Please renew at <a href="https://www.lbp.govt.nz">lbp.govt.nz</a> to maintain your Framework access.</p>`,
      },
    })

    if (qp.phone && days === 7) {
      await env.TASK_QUEUE.send({
        type: 'send_notification',
        payload: { type: 'sms', phone: qp.phone, message },
      })
    }
  }

  console.log(`Licence expiry checks sent for ${expiringQPs.length} QPs`)
}
