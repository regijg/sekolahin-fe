'use client'

import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { inventoryItemService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

const fields: FieldConfig[] = [
  { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
  { name: 'name', label: 'Nama Barang', type: 'text', required: true, showInTable: true },
  { name: 'code', label: 'Kode', type: 'text', required: true, placeholder: 'INV-001', showInTable: true },
  { name: 'category', label: 'Kategori', type: 'text', required: true, showInTable: true },
  { name: 'quantity', label: 'Jumlah', type: 'number', required: true, showInTable: true },
  { name: 'unit', label: 'Satuan', type: 'text', required: true, placeholder: 'unit / buah / kg', showInTable: true },
  {
    name: 'condition', label: 'Kondisi', type: 'select', required: true, showInTable: true,
    options: [
      { value: 'good', label: 'Baik' },
      { value: 'damaged', label: 'Rusak' },
      { value: 'lost', label: 'Hilang' },
    ],
  },
  { name: 'location', label: 'Lokasi', type: 'text', showInTable: true },
  { name: 'notes', label: 'Catatan', type: 'textarea', showInTable: false },
]

export default function InventoryItemsPage() {
  const schoolId = useSchoolId()
  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Barang Inventaris" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Inventaris" queryKey="inventory-items" service={inventoryItemService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
