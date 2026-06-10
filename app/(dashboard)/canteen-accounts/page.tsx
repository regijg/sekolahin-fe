'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { canteenAccountService, studentService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'
import { formatCurrency } from '@/lib/utils'

export default function CanteenAccountsPage() {
  const schoolId = useSchoolId()
  const { data: students = [] } = useQuery({ queryKey: ['students', 'all'], queryFn: () => fetchAllPages(studentService) })

  const fields: FieldConfig[] = useMemo(() => [
    {
      name: 'student_id', label: 'Siswa', type: 'select', required: true, showInTable: true,
      options: students.map(s => ({ value: s.id, label: `${s.nis} - ${s.name}` })),
    },
    {
      name: 'balance', label: 'Saldo (Rp)', type: 'number', required: true, showInTable: true,
      tableRender: (v) => formatCurrency(Number(v)),
    },
  ], [students])

  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Akun Kantin" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Akun Kantin" queryKey="canteen-accounts" service={canteenAccountService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
