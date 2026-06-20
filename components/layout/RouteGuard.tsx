'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getStoredUser } from '@/lib/auth'
import { ROUTE_PERMISSIONS } from '@/lib/routes'

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [permitted, setPermitted] = useState<boolean | null>(null)

  useEffect(() => {
    const user = getStoredUser()
    const perms = user?.permissions ?? []
    const isSuperAdmin = !user?.school_id

    const routeConfig = ROUTE_PERMISSIONS.find(r =>
      pathname === r.href || pathname.startsWith(r.href + '/')
    )

    if (!routeConfig) {
      setPermitted(true)
      return
    }

    if (routeConfig.superAdminOnly && !isSuperAdmin) {
      router.replace('/dashboard')
      return
    }

    if (perms.length > 0 && !perms.includes(routeConfig.permission)) {
      router.replace('/dashboard')
      return
    }

    setPermitted(true)
  }, [pathname, router])

  if (permitted !== true) return null

  return <>{children}</>
}
