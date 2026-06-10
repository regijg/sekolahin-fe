'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { teacherAttendanceService, teacherService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

export default function TeacherAttendancesPage() {
  const schoolId = useSchoolId()
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers', 'all'], queryFn: () => fetchAllPages(teacherService) })

  const fields: FieldConfig[] = useMemo(() => [
    { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
    {
      name: 'teacher_id', label: 'Guru', type: 'select', required: true, showInTable: true,
      options: teachers.map(t => ({ value: t.id, label: t.name })),
    },
    { name: 'date', label: 'Tanggal', type: 'date', required: true, showInTable: true },
    {
      name: 'status', label: 'Status', type: 'select', required: true, showInTable: true,
      options: [
        { value: 'present', label: 'Hadir' },
        { value: 'absent', label: 'Tidak Hadir' },
        { value: 'late', label: 'Terlambat' },
        { value: 'sick', label: 'Sakit' },
      ],
    },
    { name: 'check_in_at', label: 'Jam Masuk', type: 'time', showInTable: true },
    { name: 'check_out_at', label: 'Jam Keluar', type: 'time', showInTable: true },
    { name: 'note', label: 'Catatan', type: 'textarea', showInTable: false },
  ], [teachers])

  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Absensi Guru" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Absensi Guru" queryKey="teacher-attendances" service={teacherAttendanceService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
