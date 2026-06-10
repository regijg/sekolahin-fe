'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { majorService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
  { name: 'code', label: 'Kode', type: 'text', required: true, placeholder: 'TKJ', showInTable: true },
  { name: 'name', label: 'Nama Jurusan', type: 'text', required: true, showInTable: true },
]

export default function MajorsPage() {
  const schoolId = useSchoolId()
  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Jurusan" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Jurusan" queryKey="majors" service={majorService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
