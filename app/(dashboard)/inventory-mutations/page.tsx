'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { inventoryMutationService, inventoryItemService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'

export default function InventoryMutationsPage() {
  const schoolId = useSchoolId()
  const { data: inventoryItems = [] } = useQuery({ queryKey: ['inventory-items', 'all'], queryFn: () => fetchAllPages(inventoryItemService) })

  const fields: FieldConfig[] = useMemo(() => [
    {
      name: 'inventory_item_id', label: 'Barang', type: 'select', required: true, showInTable: true,
      options: inventoryItems.map(item => ({ value: item.id, label: `${item.category} - ${item.name}` })),
    },
    {
      name: 'type', label: 'Jenis Mutasi', type: 'select', required: true, showInTable: true,
      options: [
        { value: 'in', label: 'Masuk' },
        { value: 'out', label: 'Keluar' },
      ],
    },
    { name: 'quantity', label: 'Jumlah', type: 'number', required: true, showInTable: true },
    { name: 'note', label: 'Catatan', type: 'textarea', showInTable: false },
  ], [inventoryItems])

  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Mutasi Inventaris" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Mutasi Inventaris" queryKey="inventory-mutations" service={inventoryMutationService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
