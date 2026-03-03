export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'qp' | 'admin' | 'viewer'
  licence_number: string | null
  licence_expiry: string | null
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('fw_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function storeUser(user: AuthUser): void {
  localStorage.setItem('fw_user', JSON.stringify(user))
}

export function clearUser(): void {
  localStorage.removeItem('fw_user')
  localStorage.removeItem('fw_token')
  localStorage.removeItem('fw_refresh')
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('fw_token') && !!getStoredUser()
}
