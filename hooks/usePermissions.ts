import { getStoredUser } from '@/lib/auth'

export function usePermissions() {
  const user = getStoredUser()
  const perms = user?.permissions ?? []

  const hasActionPerms = perms.some(p =>
    p.startsWith('create-') || p.startsWith('edit-') || p.startsWith('delete-')
  )

  const can = (permission: string): boolean => {
    if (perms.length === 0) return true
    if (perms.includes(permission)) return true
    const isActionPerm = permission.startsWith('create-') || permission.startsWith('edit-') || permission.startsWith('delete-')
    if (isActionPerm && !hasActionPerms) return true
    return false
  }

  return { can }
}
