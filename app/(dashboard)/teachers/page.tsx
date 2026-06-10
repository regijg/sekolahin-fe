'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { teacherService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
  { name: 'nip', label: 'NIP', type: 'text', required: true, showInTable: true },
  { name: 'name', label: 'Nama Guru', type: 'text', required: true, showInTable: true },
  {
    name: 'gender', label: 'Jenis Kelamin', type: 'select', showInTable: true,
    options: [
      { value: 'male', label: 'Laki-laki' },
      { value: 'female', label: 'Perempuan' },
    ],
  },
  { name: 'birthdate', label: 'Tanggal Lahir', type: 'date', showInTable: false },
  { name: 'phone', label: 'Telepon', type: 'text', showInTable: true },
  { name: 'address', label: 'Alamat', type: 'textarea', showInTable: false },
]

export default function TeachersPage() {
  const schoolId = useSchoolId()
  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Data Guru" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Guru" queryKey="teachers" service={teacherService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
