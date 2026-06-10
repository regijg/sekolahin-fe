'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import { canteenTransactionService, canteenAccountService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'
import { formatCurrency } from '@/lib/utils'

export default function CanteenTransactionsPage() {
  const schoolId = useSchoolId()
  const { data: canteenAccounts = [] } = useQuery({ queryKey: ['canteen-accounts', 'all'], queryFn: () => fetchAllPages(canteenAccountService) })

  const fields: FieldConfig[] = useMemo(() => [
    {
      name: 'canteen_account_id', label: 'Akun Kantin', type: 'select', required: true, showInTable: true,
      options: canteenAccounts.map(acc => ({ value: acc.id, label: `Akun #${acc.id} - ${formatCurrency(acc.balance)}` })),
    },
    {
      name: 'type', label: 'Jenis', type: 'select', required: true, showInTable: true,
      options: [
        { value: 'debit', label: 'Debit (Keluar)' },
        { value: 'credit', label: 'Kredit (Masuk)' },
      ],
    },
    {
      name: 'amount', label: 'Jumlah (Rp)', type: 'number', required: true, showInTable: true,
      tableRender: (v) => formatCurrency(Number(v)),
    },
    {
      name: 'status', label: 'Status', type: 'select', required: true, showInTable: true,
      options: [
        { value: 'completed', label: 'Selesai' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Gagal' },
      ],
    },
    { name: 'description', label: 'Keterangan', type: 'text', showInTable: true },
  ], [canteenAccounts])

  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Transaksi Kantin" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage title="Transaksi Kantin" queryKey="canteen-transactions" service={canteenTransactionService} fields={fields} hiddenValues={hiddenValues} />
      </main>
    </>
  )
}
