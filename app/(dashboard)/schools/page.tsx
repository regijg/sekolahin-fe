'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { schoolService } from '@/lib/services'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'name', label: 'Nama Sekolah', type: 'text', required: true, showInTable: true },
  { name: 'npsn', label: 'NPSN', type: 'text', required: true, showInTable: true },
  { name: 'email', label: 'Email', type: 'email', showInTable: true },
  { name: 'phone', label: 'Telepon', type: 'text', showInTable: true },
  { name: 'principal_name', label: 'Nama Kepala Sekolah', type: 'text', showInTable: true },
  { name: 'address', label: 'Alamat', type: 'textarea', showInTable: false },
  { name: 'active', label: 'Aktif', type: 'boolean', showInTable: true },
]

export default function SchoolsPage() {
  return (
    <>
      <Header title="Manajemen Sekolah" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Sekolah" queryKey="schools" service={schoolService} fields={fields} />
      </main>
    </>
  )
}
