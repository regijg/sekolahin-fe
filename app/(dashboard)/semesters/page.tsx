'use client'

import { useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { semesterService, academicYearService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

function ActiveToggle({ value, id, isPending, onToggle }: {
  value: boolean
  id: number
  isPending: boolean
  onToggle: (id: number) => void
}) {
  if (value) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Aktif
      </span>
    )
  }
  return (
    <button
      onClick={() => onToggle(id)}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50 cursor-pointer"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      {isPending ? 'Mengubah...' : 'Nonaktif'}
    </button>
  )
}

export default function SemestersPage() {
  const schoolId = useSchoolId()
  const qc = useQueryClient()
  const { data: academicYears = [] } = useQuery({ queryKey: ['academic-years', 'all'], queryFn: () => fetchAllPages(academicYearService) })

  const activateMutation = useMutation({
    mutationFn: (id: number) => semesterService.setActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['semesters'] }),
  })

  const handleToggle = useCallback((id: number) => {
    activateMutation.mutate(id)
  }, [activateMutation])

  const fields: FieldConfig[] = useMemo(() => [
    { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
    {
      name: 'academic_year_id', label: 'Tahun Ajaran', type: 'select', required: true, showInTable: true,
      options: academicYears.map(ay => ({ value: ay.id, label: ay.name })),
    },
    { name: 'name', label: 'Nama Semester', type: 'text', required: true, placeholder: 'Semester 1', showInTable: true },
    {
      name: 'active', label: 'Status', type: 'boolean', showInTable: true,
      tableRender: (value, row) => (
        <ActiveToggle
          value={Boolean(value)}
          id={Number((row as { id: number }).id)}
          isPending={activateMutation.isPending && activateMutation.variables === Number((row as { id: number }).id)}
          onToggle={handleToggle}
        />
      ),
    },
  ], [academicYears, activateMutation.isPending, activateMutation.variables, handleToggle])

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
