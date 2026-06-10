import type { User } from '@/types'

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function getSchoolId(): number | null {
  return getStoredUser()?.school_id ?? null
}
