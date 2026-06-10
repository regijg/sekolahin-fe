'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { academicYearService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
  { name: 'name', label: 'Nama Tahun Ajaran', type: 'text', required: true, placeholder: '2024/2025', showInTable: true },
  { name: 'start_date', label: 'Tanggal Mulai', type: 'date', required: true, showInTable: true },
  { name: 'end_date', label: 'Tanggal Selesai', type: 'date', required: true, showInTable: true },
  { name: 'active', label: 'Aktif', type: 'boolean', showInTable: true },
]

export default function AcademicYearsPage() {
  const schoolId = useSchoolId()
  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Tahun Ajaran" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Tahun Ajaran" queryKey="academic-years" service={academicYearService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
