'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { permissionService } from '@/lib/services'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'name', label: 'Nama Permission', type: 'text', required: true, placeholder: 'contoh: view-students', showInTable: true },
  { name: 'description', label: 'Deskripsi', type: 'textarea', placeholder: 'Deskripsi permission (opsional)', showInTable: true },
]

export default function PermissionsPage() {
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
