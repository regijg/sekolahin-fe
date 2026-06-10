'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { permissionService } from '@/lib/services'
import { getStoredUser } from '@/lib/auth'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'name', label: 'Nama Permission', type: 'text', required: true, placeholder: 'contoh: view-students', showInTable: true },
  { name: 'description', label: 'Deskripsi', type: 'textarea', placeholder: 'Deskripsi permission (opsional)', showInTable: true },
]

export default function PermissionsPage() {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    if (getStoredUser()?.role === 'super-admin') {
      setAllowed(true)
    } else {
      router.replace('/dashboard')
    }
  }, [router])

  if (!allowed) return null

  return (
    <>
      <Header title="Permissions" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage
          title="Permission"
          queryKey="permissions"
          service={permissionService}
          fields={fields}
        />
      </main>
    </>
  )
}
