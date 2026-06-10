'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { parentGuardianService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
  { name: 'name', label: 'Nama', type: 'text', required: true, showInTable: true },
  { name: 'phone', label: 'Telepon', type: 'text', showInTable: true },
  { name: 'email', label: 'Email', type: 'email', showInTable: true },
  { name: 'address', label: 'Alamat', type: 'textarea', showInTable: false },
]

export default function ParentGuardiansPage() {
  const schoolId = useSchoolId()
  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Orang Tua / Wali" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Orang Tua / Wali" queryKey="parent-guardians" service={parentGuardianService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
