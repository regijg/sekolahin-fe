'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { letterService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
  {
    name: 'type', label: 'Jenis Surat', type: 'select', required: true, showInTable: true,
    options: [
      { value: 'active', label: 'Keterangan Aktif' },
      { value: 'graduate', label: 'Keterangan Lulus' },
      { value: 'absence', label: 'Keterangan Ketidakhadiran' },
      { value: 'other', label: 'Lainnya' },
    ],
  },
  { name: 'number', label: 'Nomor Surat', type: 'text', required: true, showInTable: true },
  { name: 'title', label: 'Judul Surat', type: 'text', required: true, showInTable: true },
  { name: 'content', label: 'Isi Surat', type: 'textarea', required: true, showInTable: false },
  { name: 'issued_at', label: 'Tanggal Terbit', type: 'date', showInTable: true },
]

export default function LettersPage() {
  const schoolId = useSchoolId()
  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Surat Keterangan" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Surat Keterangan" queryKey="letters" service={letterService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
