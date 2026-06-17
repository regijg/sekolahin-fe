'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { paymentTypeService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
  { name: 'code', label: 'Kode', type: 'text', required: true, placeholder: 'SPP-001', showInTable: true },
  { name: 'name', label: 'Nama Pembayaran', type: 'text', required: true, showInTable: true },
  {
    name: 'is_periodic',
    label: 'Periodik (Bulanan)',
    type: 'boolean',
    showInTable: true,
    defaultValue: true,
    tableRender: (value) => (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${value ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
        {value ? 'Periodik' : 'Satu Kali'}
      </span>
    ),
  },
  { name: 'description', label: 'Deskripsi', type: 'textarea', showInTable: false },
]

export default function PaymentTypesPage() {
  const schoolId = useSchoolId()
  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Jenis Pembayaran" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Jenis Pembayaran" queryKey="payment-types" service={paymentTypeService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
