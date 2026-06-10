'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { scheduleService, classroomService, subjectService, teacherService, semesterService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

export default function SchedulesPage() {
  const schoolId = useSchoolId()
  const { data: classrooms = [] } = useQuery({ queryKey: ['classrooms', 'all'], queryFn: () => fetchAllPages(classroomService) })
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects', 'all'], queryFn: () => fetchAllPages(subjectService) })
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers', 'all'], queryFn: () => fetchAllPages(teacherService) })
  const { data: semesters = [] } = useQuery({ queryKey: ['semesters', 'all'], queryFn: () => fetchAllPages(semesterService) })

  const fields: FieldConfig[] = useMemo(() => [
    { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
    {
      name: 'classroom_id', label: 'Kelas', type: 'select', required: true, showInTable: true,
      options: classrooms.map(c => ({ value: c.id, label: c.name })),
    },
    {
      name: 'subject_id', label: 'Mata Pelajaran', type: 'select', required: true, showInTable: true,
      options: subjects.map(s => ({ value: s.id, label: s.name })),
    },
    {
      name: 'teacher_id', label: 'Guru', type: 'select', required: true, showInTable: true,
      options: teachers.map(t => ({ value: t.id, label: t.name })),
    },
    {
      name: 'semester_id', label: 'Semester', type: 'select', required: true, showInTable: false,
      options: semesters.map(s => ({ value: s.id, label: s.name })),
    },
    {
      name: 'day', label: 'Hari', type: 'select', required: true, showInTable: true,
      options: [
        { value: 'monday', label: 'Senin' },
        { value: 'tuesday', label: 'Selasa' },
        { value: 'wednesday', label: 'Rabu' },
        { value: 'thursday', label: 'Kamis' },
        { value: 'friday', label: 'Jumat' },
        { value: 'saturday', label: 'Sabtu' },
      ],
    },
    { name: 'start_time', label: 'Jam Mulai', type: 'time', required: true, showInTable: true },
    { name: 'end_time', label: 'Jam Selesai', type: 'time', required: true, showInTable: true },
  ], [classrooms, subjects, teachers, semesters])

  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Jadwal Pelajaran" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Jadwal" queryKey="schedules" service={scheduleService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
