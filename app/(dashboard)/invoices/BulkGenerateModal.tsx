'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/ui/Modal'
import SearchableSelect from '@/components/ui/SearchableSelect'
import NumberInput from '@/components/ui/NumberInput'
import { invoiceService } from '@/lib/services'
import type { PaymentType, Classroom } from '@/types'

const MONTHS = [
  { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' }, { value: 8, label: 'Agu' }, { value: 9, label: 'Sep' },
  { value: 10, label: 'Okt' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Des' },
]

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)

interface Props {
  isOpen: boolean
  onClose: () => void
  schoolId: number
  paymentTypes: PaymentType[]
  classrooms: Classroom[]
}

interface Result {
  created: number
  skipped: number
  total_students: number
}

export default function BulkGenerateModal({ isOpen, onClose, schoolId, paymentTypes, classrooms }: Props) {
  const qc = useQueryClient()
  const [paymentTypeId, setPaymentTypeId] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [selectedMonths, setSelectedMonths] = useState<number[]>([])
  const [singleMonth, setSingleMonth] = useState(String(currentMonth))
  const [amount, setAmount] = useState('')
  const [lateFee, setLateFee] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  const selectedPaymentType = paymentTypes.find(p => String(p.id) === paymentTypeId)
  const isPeriodic = selectedPaymentType ? (selectedPaymentType.is_periodic !== false) : true

  const toggleMonth = (m: number) =>
    setSelectedMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])

  const toggleAll = () =>
    setSelectedMonths(prev => prev.length === 12 ? [] : MONTHS.map(m => m.value))

  const handlePaymentTypeChange = (val: string) => {
    setPaymentTypeId(val)
    setSelectedMonths([])
    setSingleMonth(String(currentMonth))
  }

  const mutation = useMutation({
    mutationFn: () => invoiceService.bulkGenerate({
      school_id: schoolId,
      payment_type_id: Number(paymentTypeId),
      months: isPeriodic ? selectedMonths : [Number(singleMonth)],
      year: Number(year),
      amount: Number(amount),
      late_fee: lateFee ? Number(lateFee) : 0,
      due_date: dueDate || null,
      classroom_id: classroomId ? Number(classroomId) : null,
      cicilan_count: 1,
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      setResult(data)
    },
  })

  const handleClose = () => {
    setResult(null)
    setPaymentTypeId('')
    setSelectedMonths([])
    setSingleMonth(String(currentMonth))
    setAmount('')
    setLateFee('')
    setDueDate('')
    setClassroomId('')
    onClose()
  }

  const canSubmit = paymentTypeId
    && (isPeriodic ? selectedMonths.length > 0 : !!singleMonth)
    && amount
    && !mutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generate Tagihan Massal" size="lg">
      {result ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 border border-green-200 p-5 text-center space-y-3">
            <div className="text-4xl font-bold text-green-600">{result.created}</div>
            <div className="text-sm text-green-700 font-medium">
              Siswa mendapat tagihan baru
            </div>
            <div className="flex justify-center gap-6 text-sm text-gray-600 pt-2">
              <span>{result.total_students} siswa diproses</span>
              <span className="text-yellow-600">{result.skipped} dilewati (sudah ada)</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Tutup
          </button>
        </div>
      ) : (
        <form
          onSubmit={e => { e.preventDefault(); mutation.mutate() }}
          className="space-y-5"
        >
          {/* Jenis Pembayaran */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Pembayaran <span className="text-red-500">*</span></label>
            <SearchableSelect
              value={paymentTypeId}
              onChange={handlePaymentTypeChange}
              placeholder="Pilih jenis pembayaran..."
              options={paymentTypes.map(p => ({
                value: p.id,
                label: p.is_periodic !== false ? p.name : `${p.name} · Satu Kali`,
              }))}
            />
            {selectedPaymentType && !isPeriodic && (
              <p className="text-xs text-purple-600 mt-1">
                Pembayaran satu kali — siswa yang sudah pernah bayar ini akan otomatis dilewati.
              </p>
            )}
          </div>

          {/* Tahun */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun <span className="text-red-500">*</span></label>
            <SearchableSelect value={year} onChange={setYear} isClearable={false} options={YEARS.map(y => ({ value: y, label: String(y) }))} />
          </div>

          {/* Bulan — conditional based on is_periodic */}
          {isPeriodic ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Bulan <span className="text-red-500">*</span></label>
                <button type="button" onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                  {selectedMonths.length === 12 ? 'Batal Semua' : 'Pilih Semua'}
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {MONTHS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => toggleMonth(m.value)}
                    className={`py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                      selectedMonths.includes(m.value)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {selectedMonths.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">{selectedMonths.length} bulan dipilih</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bulan Tagihan <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={singleMonth}
                onChange={setSingleMonth}
                isClearable={false}
                options={MONTHS.map(m => ({ value: m.value, label: m.label }))}
              />
              <p className="text-xs text-gray-500 mt-1">Bulan pencatatan tagihan — biasanya awal tahun ajaran (Juli).</p>
            </div>
          )}

          {/* Nominal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp) <span className="text-red-500">*</span></label>
              <NumberInput
                value={amount}
                onChange={(val) => setAmount(val === '' ? '' : String(val))}
                required
                placeholder="300.000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Denda (Rp)</label>
              <NumberInput
                value={lateFee}
                onChange={(val) => setLateFee(val === '' ? '' : String(val))}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Kelas + Jatuh Tempo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter Kelas</label>
              <SearchableSelect value={classroomId} onChange={setClassroomId} placeholder="Semua Kelas" options={classrooms.map(c => ({ value: c.id, label: c.name }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Terjadi kesalahan. Silakan coba lagi.
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {mutation.isPending
                ? 'Membuat tagihan...'
                : isPeriodic
                  ? `Generate ${selectedMonths.length > 0 ? `(${selectedMonths.length} bulan)` : ''}`
                  : 'Generate'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
