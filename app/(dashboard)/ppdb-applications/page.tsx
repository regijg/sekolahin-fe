'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { ppdbService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
  { name: 'registration_number', label: 'No. Pendaftaran', type: 'text', showInTable: true, disabled: true, placeholder: 'Otomatis dibuat oleh sistem' },
  { name: 'name', label: 'Nama Pendaftar', type: 'text', required: true, showInTable: true },
  {
    name: 'gender', label: 'Jenis Kelamin', type: 'select', showInTable: true,
    options: [
      { value: 'male', label: 'Laki-laki' },
      { value: 'female', label: 'Perempuan' },
    ],
  },
  { name: 'birthdate', label: 'Tanggal Lahir', type: 'date', showInTable: false },
  { name: 'phone', label: 'Telepon', type: 'text', showInTable: true },
  { name: 'email', label: 'Email', type: 'email', showInTable: false },
  {
    name: 'status', label: 'Status', type: 'select', required: true, showInTable: true,
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'submitted', label: 'Diajukan' },
      { value: 'accepted', label: 'Diterima' },
      { value: 'rejected', label: 'Ditolak' },
    ],
  },
  { name: 'address', label: 'Alamat', type: 'textarea', showInTable: false },
  { name: 'guardian_name', label: 'Nama Wali', type: 'text', showInTable: false },
  { name: 'guardian_phone', label: 'No. HP Wali', type: 'text', showInTable: false },
  {
    name: 'guardian_relation', label: 'Hubungan Wali', type: 'select', showInTable: false,
    options: [
      { value: 'ayah', label: 'Ayah' },
      { value: 'ibu', label: 'Ibu' },
      { value: 'kakek', label: 'Kakek' },
      { value: 'nenek', label: 'Nenek' },
      { value: 'paman', label: 'Paman' },
      { value: 'bibi', label: 'Bibi' },
      { value: 'wali', label: 'Wali' },
    ],
  },
]

export default function PPDBApplicationsPage() {
  const schoolId = useSchoolId()
  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Pendaftaran PPDB" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Pendaftaran PPDB" queryKey="ppdb-applications" service={ppdbService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
