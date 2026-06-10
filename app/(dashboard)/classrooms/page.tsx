'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { classroomService, teacherService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

export default function ClassroomsPage() {
  const schoolId = useSchoolId()
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers', 'all'], queryFn: () => fetchAllPages(teacherService) })

  const fields: FieldConfig[] = useMemo(() => [
    { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
    { name: 'name', label: 'Nama Kelas', type: 'text', required: true, placeholder: 'XII TKJ 1', showInTable: true },
    {
      name: 'grade', label: 'Tingkat', type: 'select', showInTable: true,
      options: [
        { value: 'X', label: 'X' },
        { value: 'XI', label: 'XI' },
        { value: 'XII', label: 'XII' },
      ],
    },
    {
      name: 'homeroom_teacher_id', label: 'Wali Kelas', type: 'select', showInTable: false,
      options: teachers.map(t => ({ value: t.id, label: t.name })),
    },
  ], [teachers])

  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Kelas" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Kelas" queryKey="classrooms" service={classroomService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
