'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { announcementService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
  { name: 'title', label: 'Judul', type: 'text', required: true, showInTable: true },
  { name: 'body', label: 'Isi Pengumuman', type: 'textarea', required: true, showInTable: false },
  { name: 'published_at', label: 'Tanggal Terbit', type: 'date', showInTable: true },
]

export default function AnnouncementsPage() {
  const schoolId = useSchoolId()
  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Pengumuman" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Pengumuman" queryKey="announcements" service={announcementService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
