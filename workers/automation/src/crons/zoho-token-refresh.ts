import type { Env } from '../index'

export async function runZohoTokenRefresh(env: Env): Promise<void> {
  try {
    const resp = await fetch(
      `https://accounts.zoho.${env.ZOHO_REGION}/oauth/v2/token?refresh_token=${env.ZOHO_REFRESH_TOKEN}&client_id=${env.ZOHO_CLIENT_ID}&client_secret=${env.ZOHO_CLIENT_SECRET}&grant_type=refresh_token`,
      { method: 'POST' }
    )

    const data = await resp.json() as { access_token?: string; error?: string }

    if (data.access_token) {
      await env.SESSIONS.put('zoho_access_token', data.access_token, { expirationTtl: 3300 })
      console.log('Zoho token refreshed successfully')
    } else {
      console.error('Zoho token refresh failed:', data.error)
    }
  } catch (err) {
    console.error('Zoho token refresh error:', err)
  }
}
