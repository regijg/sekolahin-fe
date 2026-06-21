'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layers } from 'lucide-react'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import BulkPaymentModal from './BulkPaymentModal'
import { paymentService, invoiceService, classroomService, studentService, paymentTypeService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig } from '@/types'
import { formatCurrency } from '@/lib/utils'
import SearchableSelect from '@/components/ui/SearchableSelect'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function PaymentsPage() {
  const schoolId = useSchoolId()
  const [bulkOpen, setBulkOpen] = useState(false)
  const [filterPaymentTypeId, setFilterPaymentTypeId] = useState('')

  const { data: paymentTypes = [] } = useQuery({ queryKey: ['payment-types', 'all'], queryFn: () => fetchAllPages(paymentTypeService) })
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices', 'all'], queryFn: () => fetchAllPages(invoiceService) })
  const { data: classrooms = [] } = useQuery({ queryKey: ['classrooms', 'all'], queryFn: () => fetchAllPages(classroomService) })
  const { data: students = [] } = useQuery({ queryKey: ['students', 'all'], queryFn: () => fetchAllPages(studentService) })
  const { data: allPayments = [] } = useQuery({ queryKey: ['payments', 'all'], queryFn: () => fetchAllPages(paymentService) })

  const paidByInvoice = useMemo(() => {
    const map: Record<number, number> = {}
    allPayments.forEach(p => {
      if (p.invoice_id) map[p.invoice_id] = (map[p.invoice_id] ?? 0) + Number(p.amount)
    })
    return map
  }, [allPayments])

  const fields: FieldConfig[] = useMemo(() => [
    {
      name: 'classroom_filter',
      label: 'Kelas',
      type: 'select',
      filterOnly: true,
      showInTable: false,
      options: classrooms.map(c => ({ value: c.id, label: c.name })),
    },
    { name: 'student_name', label: 'Siswa', type: 'text', showInTable: true, hidden: true },
    { name: 'payment_type_name', label: 'Jenis Pembayaran', type: 'text', showInTable: true, hidden: true },
    {
      name: 'invoice_id',
      label: 'Tagihan Siswa',
      type: 'select',
      required: true,
      showInTable: false,
      dependsOn: 'classroom_filter',
      filterOptions: (classroomId) => {
        if (!classroomId) return []
        const unpaidInvoices = invoices.filter(
          (inv) => (inv as unknown as { status: string }).status !== 'lunas'
        )
        const studentIds = students
          .filter(s => String(s.classroom_id) === String(classroomId))
          .map(s => s.id)
        return unpaidInvoices
          .filter(inv => studentIds.includes(inv.student_id!))
          .map(inv => {
            const totalDue = Number(inv.amount) + Number(inv.late_fee ?? 0)
            const paid = paidByInvoice[inv.id] ?? 0
            const remaining = totalDue - paid
            const status = paid > 0 ? `cicilan · sisa ${formatCurrency(remaining)}` : formatCurrency(totalDue)
            return {
              value: inv.id,
              label: `${inv.student_name ?? ''} — ${inv.payment_type_name ?? ''} ${inv.month}/${inv.year} (${status})`,
            }
          })
      },
      options: invoices.map(inv => ({ value: inv.id, label: `${inv.student_name ?? ''} #${inv.id}` })),
    },
    {
      name: 'date',
      label: 'Tanggal Bayar',
      type: 'date',
      required: true,
      showInTable: true,
      defaultValue: todayStr(),
    },
    {
      name: 'amount',
      label: 'Jumlah (Rp)',
      type: 'number',
      required: true,
      showInTable: true,
      tableRender: (v) => formatCurrency(Number(v)),
    },
    {
      name: 'payment_method',
      label: 'Metode',
      type: 'select',
      required: true,
      showInTable: true,
      options: [
        { value: 'cash', label: 'Tunai' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'qris', label: 'QRIS' },
      ],
    },
  ], [invoices, classrooms, students, paidByInvoice])

  const filteredService = useMemo(() => ({
    ...paymentService,
    getAll: (page = 1) => paymentService.getAllFiltered(page, {
      payment_type_id: filterPaymentTypeId ? Number(filterPaymentTypeId) : undefined,
    }),
  }), [filterPaymentTypeId])

  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  return (
    <>
      <Header title="Pembayaran" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage
          key={filterPaymentTypeId}
          title="Pembayaran"
          queryKey="payments"
          service={filteredService}
          extraFilters={
            <div className="w-full sm:w-48">
              <SearchableSelect
                value={filterPaymentTypeId}
                onChange={setFilterPaymentTypeId}
                placeholder="Semua Jenis"
                options={paymentTypes.map(p => ({ value: p.id, label: p.name }))}
              />
            </div>
          }
          fields={fields}
          hiddenValues={hiddenValues}
          disableDelete
          hideAddButton
          extraActions={
            <button
              onClick={() => setBulkOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
            >
              <Layers size={16} />
              <span className="hidden sm:inline">Bayar Multi-Tagihan</span>
              <span className="sm:hidden">Multi-Tagihan</span>
            </button>
          }
        />

        {schoolId && (
          <BulkPaymentModal
            isOpen={bulkOpen}
            onClose={() => setBulkOpen(false)}
            schoolId={schoolId}
            students={students}
            classrooms={classrooms}
            invoices={invoices}
            paidByInvoice={paidByInvoice}
          />
        )}
      </main>
    </>
  )
}
