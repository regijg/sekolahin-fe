'use client'

import { useState } from 'react'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import PPDBStepperModal from '@/components/ppdb/PPDBStepperModal'
import { ppdbService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { usePermissions } from '@/hooks/usePermissions'
import { Plus } from 'lucide-react'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
  { name: 'registration_number', label: 'No. Pendaftaran', type: 'text', showInTable: true, disabled: true, placeholder: 'Otomatis dibuat oleh sistem' },
  { name: 'name', label: 'Nama Pendaftar', type: 'text', required: true, showInTable: true },
  {
    name: 'gender', label: 'Jenis Kelamin', type: 'select', showInTable: true, tableAlign: 'center',
    options: [
      { value: 'male', label: 'Laki-laki' },
      { value: 'female', label: 'Perempuan' },
    ],
  },
  { name: 'birthdate', label: 'Tanggal Lahir', type: 'date', showInTable: false },
  { name: 'phone', label: 'Telepon', type: 'text', showInTable: false },
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
  { name: 'guardian_name', label: 'Nama Wali', type: 'text', showInTable: true },
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
  const { can } = usePermissions()
  const canCreate = can('create-ppdb')

  const [stepperOpen, setStepperOpen] = useState(false)
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)

  const openCreate = () => {
    setEditItem(null)
    setStepperOpen(true)
  }

  const openEdit = (item: Record<string, unknown>) => {
    setEditItem(item)
    setStepperOpen(true)
  }

  const closeModal = () => {
    setStepperOpen(false)
    setEditItem(null)
  }

  return (
    <>
      <Header title="Pendaftaran PPDB" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage
          title="Pendaftaran PPDB"
          queryKey="ppdb-applications"
          service={ppdbService}
          fields={fields}
          hiddenValues={hiddenValues}
          hideAddButton
          onEditClick={(item) => openEdit(item as unknown as Record<string, unknown>)}
          extraActions={
            canCreate ? (
              <button
                onClick={openCreate}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={16} />
                Tambah
              </button>
            ) : undefined
          }
        />
      </main>

      <PPDBStepperModal
        isOpen={stepperOpen}
        onClose={closeModal}
        hiddenValues={hiddenValues}
        editItem={editItem}
      />
    </>
  )
}
