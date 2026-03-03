const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.framework.co.nz/v1'

function getToken(): string | null {
  return localStorage.getItem('fw_token')
}

export function setToken(token: string): void {
  localStorage.setItem('fw_token', token)
}

export function clearToken(): void {
  localStorage.removeItem('fw_token')
  localStorage.removeItem('fw_refresh')
}

export function setRefreshToken(token: string): void {
  localStorage.setItem('fw_refresh', token)
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const resp = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (resp.status === 401) {
    // Try token refresh
    const refreshToken = localStorage.getItem('fw_refresh')
    if (refreshToken) {
      const refreshResp = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (refreshResp.ok) {
        const { data } = await refreshResp.json() as { data: { token: string } }
        setToken(data.token)
        // Retry original request
        return request<T>(method, path, body)
      }
    }
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const data = await resp.json() as { ok: boolean; data: T; error?: unknown }
  if (!data.ok) throw new Error(JSON.stringify(data.error))
  return data.data
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
}
