'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { semesterService, academicYearService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

export default function SemestersPage() {
  const schoolId = useSchoolId()
  const { data: academicYears = [] } = useQuery({ queryKey: ['academic-years', 'all'], queryFn: () => fetchAllPages(academicYearService) })

  const fields: FieldConfig[] = useMemo(() => [
    { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
    {
      name: 'academic_year_id', label: 'Tahun Ajaran', type: 'select', required: true, showInTable: true,
      options: academicYears.map(ay => ({ value: ay.id, label: ay.name })),
    },
    { name: 'name', label: 'Nama Semester', type: 'text', required: true, placeholder: 'Semester 1', showInTable: true },
    { name: 'active', label: 'Aktif', type: 'boolean', showInTable: true },
  ], [academicYears])

  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Semester" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Semester" queryKey="semesters" service={semesterService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
