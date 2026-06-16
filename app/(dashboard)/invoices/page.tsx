'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Zap } from 'lucide-react'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import BulkGenerateModal from './BulkGenerateModal'
import { invoiceService, paymentService, studentService, paymentTypeService, classroomService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig, Invoice } from '@/types'
import { formatCurrency } from '@/lib/utils'
import NumberInput from '@/components/ui/NumberInput'
import SearchableSelect from '@/components/ui/SearchableSelect'

type PaymentDetails = { date: string; method: string; amount: string }

function InlinePaymentSection({
  amountDefault,
  onChange,
}: {
  amountDefault: number | string
  onChange: (val: PaymentDetails) => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [method, setMethod] = useState('cash')
  const [amount, setAmount] = useState(String(amountDefault ?? ''))
  const [userEdited, setUserEdited] = useState(false)

  useEffect(() => {
    if (!userEdited && amountDefault) setAmount(String(amountDefault))
  }, [amountDefault, userEdited])

  useEffect(() => {
    onChange({ date, method, amount })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, method, amount])

  return (
    <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
      <p className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-4 h-4 bg-green-600 text-white rounded-full text-[10px] font-bold">✓</span>
        Catat Pembayaran
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Bayar <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Metode <span className="text-red-500">*</span></label>
          <SearchableSelect
            value={method}
            onChange={setMethod}
            isClearable={false}
            options={[{ value: 'cash', label: 'Tunai' }, { value: 'transfer', label: 'Transfer' }, { value: 'qris', label: 'QRIS' }]}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nominal (Rp) <span className="text-red-500">*</span></label>
          <NumberInput
            value={amount}
            onChange={(val) => { setUserEdited(true); setAmount(val === '' ? '' : String(val)) }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>
    </div>
  )
}

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => ({ value: currentYear - 1 + i, label: String(currentYear - 1 + i) }))

export default function InvoicesPage() {
  const schoolId = useSchoolId()
  const qc = useQueryClient()
  const [bulkOpen, setBulkOpen] = useState(false)
  const pendingPaymentRef = useRef<PaymentDetails | null>(null)

  const { data: students = [] } = useQuery({ queryKey: ['students', 'all'], queryFn: () => fetchAllPages(studentService) })
  const { data: paymentTypes = [] } = useQuery({ queryKey: ['payment-types', 'all'], queryFn: () => fetchAllPages(paymentTypeService) })
  const { data: classrooms = [] } = useQuery({ queryKey: ['classrooms', 'all'], queryFn: () => fetchAllPages(classroomService) })

  const fields: FieldConfig[] = useMemo(() => [
    {
      name: 'student_id', label: 'Siswa', type: 'select', required: true, showInTable: true,
      options: students.map(s => ({ value: s.id, label: `${s.nis} - ${s.name}` })),
    },
    {
      name: 'payment_type_id', label: 'Jenis Pembayaran', type: 'select', required: true, showInTable: true,
      options: paymentTypes.map(p => ({ value: p.id, label: p.name })),
    },
    { name: 'month', label: 'Bulan', type: 'select', required: true, showInTable: true, options: MONTHS },
    { name: 'year', label: 'Tahun', type: 'select', required: true, showInTable: true, options: YEARS },
    {
      name: 'amount', label: 'Jumlah (Rp)', type: 'number', required: true, showInTable: true,
      tableRender: (v) => formatCurrency(Number(v)),
    },
    { name: 'late_fee', label: 'Denda (Rp)', type: 'number', showInTable: false },
    { name: 'due_date', label: 'Jatuh Tempo', type: 'date', showInTable: true },
    {
      name: 'status', label: 'Status', type: 'select', showInTable: true,
      options: [
        { value: 'belum_lunas', label: 'Belum Lunas' },
        { value: 'lunas', label: 'Lunas' },
        { value: 'cicilan', label: 'Cicilan' },
      ],
    },
  ], [students, paymentTypes])

  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  const invoiceExtraContent = useCallback((
    _setValue: (name: string, value: unknown) => void,
    watchValues: Record<string, unknown>,
    editItem: unknown,
  ) => {
    const status = watchValues.status as string
    const originalStatus = (editItem as Invoice | null)?.status
    const showPayment = status === 'lunas' && (editItem === null || originalStatus !== 'lunas')
    if (!showPayment) return null
    return (
      <InlinePaymentSection
        amountDefault={watchValues.amount as number ?? 0}
        onChange={(val) => { pendingPaymentRef.current = val }}
      />
    )
  }, [])

  const handleAfterSave = useCallback(async (item: unknown) => {
    const inv = item as Invoice
    if (inv.status !== 'lunas') return
    const payment = pendingPaymentRef.current
    if (!payment?.date || !payment?.method) return
    try {
      await paymentService.create({
        school_id: schoolId,
        invoice_id: inv.id,
        date: payment.date,
        amount: Number(payment.amount) || inv.amount,
        payment_method: payment.method,
      })
      qc.invalidateQueries({ queryKey: ['payments'] })
    } catch {
      // invoice saved; payment creation failed silently — can be added from Pembayaran menu
    }
    pendingPaymentRef.current = null
  }, [schoolId, qc])

  return (
    <>
      <Header title="Tagihan" />
      <main className="flex-1 p-3 sm:p-6">
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Zap size={16} />
            Generate Massal
          </button>
        </div>

        <CrudPage
          title="Tagihan"
          queryKey="invoices"
          service={invoiceService}
          fields={fields}
          hiddenValues={hiddenValues}
          filterFn={(inv) => (inv as unknown as { status: string }).status !== 'lunas'}
          extraFormContent={invoiceExtraContent}
          onCreateSuccess={handleAfterSave}
          onUpdateSuccess={handleAfterSave}
        />

        {schoolId && (
          <BulkGenerateModal
            isOpen={bulkOpen}
            onClose={() => setBulkOpen(false)}
            schoolId={schoolId}
            paymentTypes={paymentTypes}
            classrooms={classrooms}
          />
        )}
      </main>
    </>
  )
}
