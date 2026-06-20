'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/ui/Modal'
import SearchableSelect from '@/components/ui/SearchableSelect'
import NumberInput from '@/components/ui/NumberInput'
import { invoiceService, paymentService } from '@/lib/services'
import type { PaymentType, Classroom, Student } from '@/types'

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
]

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i)
const TODAY = new Date().toISOString().split('T')[0]

interface Props {
  isOpen: boolean
  onClose: () => void
  schoolId: number
  paymentTypes: PaymentType[]
  classrooms: Classroom[]
  students: Student[]
}

export default function AddInvoiceModal({ isOpen, onClose, schoolId, paymentTypes, classrooms, students }: Props) {
  const qc = useQueryClient()

  const [classroomId, setClassroomId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [paymentTypeId, setPaymentTypeId] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [month, setMonth] = useState(String(currentMonth))
  const [amount, setAmount] = useState('')
  const [lateFee, setLateFee] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [recordPayment, setRecordPayment] = useState(false)
  const [payDate, setPayDate] = useState(TODAY)
  const [payMethod, setPayMethod] = useState('cash')
  const [payAmount, setPayAmount] = useState('')

  const [error, setError] = useState('')

  const selectedPaymentType = paymentTypes.find(p => String(p.id) === paymentTypeId)
  const isPeriodic = selectedPaymentType ? (selectedPaymentType.is_periodic !== false) : true

  const filteredStudents = classroomId
    ? students.filter(s => String(s.classroom_id) === classroomId)
    : students

  useEffect(() => { setStudentId('') }, [classroomId])

  useEffect(() => {
    if (!isPeriodic) setMonth(String(7))
  }, [paymentTypeId, isPeriodic])

  useEffect(() => {
    if (recordPayment && amount) setPayAmount(amount)
  }, [recordPayment, amount])

  const mutation = useMutation({
    mutationFn: async () => {
      const invoice = await invoiceService.create({
        school_id: schoolId,
        student_id: Number(studentId),
        payment_type_id: Number(paymentTypeId),
        month: Number(month),
        year: Number(year),
        amount: Number(amount),
        late_fee: lateFee ? Number(lateFee) : 0,
        due_date: dueDate || null,
        status: 'belum_lunas',
      }) as { id: number }

      if (recordPayment && payDate && payMethod) {
        await paymentService.create({
          school_id: schoolId,
          invoice_id: invoice.id,
          date: payDate,
          amount: Number(payAmount) || Number(amount),
          payment_method: payMethod,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      handleClose()
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Gagal menyimpan tagihan'),
  })

  const handleClose = () => {
    setClassroomId('')
    setStudentId('')
    setPaymentTypeId('')
    setYear(String(currentYear))
    setMonth(String(currentMonth))
    setAmount('')
    setLateFee('')
    setDueDate('')
    setRecordPayment(false)
    setPayDate(TODAY)
    setPayMethod('cash')
    setPayAmount('')
    setError('')
    onClose()
  }

  const canSubmit = studentId && paymentTypeId && month && year && amount && !mutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Tagihan" size="lg">
      <form onSubmit={e => { e.preventDefault(); setError(''); mutation.mutate() }} className="space-y-5">

        {/* Kelas + Siswa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter Kelas</label>
            <SearchableSelect
              value={classroomId}
              onChange={setClassroomId}
              placeholder="Semua Kelas"
              options={classrooms.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ value: c.id, label: c.name }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Siswa <span className="text-red-500">*</span></label>
            <SearchableSelect
              value={studentId}
              onChange={setStudentId}
              placeholder={classroomId ? 'Pilih siswa...' : 'Pilih kelas dulu'}
              options={filteredStudents.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: `${s.name} (${s.nis})` }))}
            />
          </div>
        </div>

        {/* Jenis Pembayaran */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Pembayaran <span className="text-red-500">*</span></label>
          <SearchableSelect
            value={paymentTypeId}
            onChange={setPaymentTypeId}
            placeholder="Pilih jenis pembayaran..."
            options={paymentTypes.map(p => ({ value: p.id, label: p.name }))}
          />
          {selectedPaymentType && (
            <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded text-xs font-medium ${isPeriodic ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {isPeriodic ? 'Periodik (Bulanan)' : 'Satu Kali'}
            </span>
          )}
        </div>

        {/* Tahun + Bulan */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun <span className="text-red-500">*</span></label>
            <SearchableSelect
              value={year}
              onChange={setYear}
              isClearable={false}
              options={YEARS.map(y => ({ value: y, label: String(y) }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isPeriodic ? 'Bulan' : 'Bulan Tagihan'}
              <span className="text-red-500"> *</span>
            </label>
            <SearchableSelect
              value={month}
              onChange={setMonth}
              isClearable={false}
              options={MONTHS.map(m => ({ value: m.value, label: m.label }))}
            />
            {!isPeriodic && (
              <p className="text-xs text-gray-400 mt-1">Bulan pencatatan — biasanya Juli (awal tahun ajaran).</p>
            )}
          </div>
        </div>

        {/* Nominal + Denda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp) <span className="text-red-500">*</span></label>
            <NumberInput
              value={amount}
              onChange={val => setAmount(val === '' ? '' : String(val))}
              placeholder="300.000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Denda (Rp)</label>
            <NumberInput
              value={lateFee}
              onChange={val => setLateFee(val === '' ? '' : String(val))}
              placeholder="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Jatuh Tempo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Toggle catat pembayaran langsung */}
        <div className={`rounded-xl border transition-colors ${recordPayment ? 'border-green-300 bg-green-50/40' : 'border-gray-200 bg-gray-50'}`}>
          <button
            type="button"
            onClick={() => setRecordPayment(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700">Catat Pembayaran Langsung</p>
              <p className="text-xs text-gray-400">Tandai tagihan ini langsung lunas atau cicilan saat dibuat</p>
            </div>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${recordPayment ? 'bg-green-600' : 'bg-gray-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${recordPayment ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </button>

          {recordPayment && (
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Bayar <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Metode <span className="text-red-500">*</span></label>
                <SearchableSelect
                  value={payMethod}
                  onChange={setPayMethod}
                  isClearable={false}
                  options={[{ value: 'cash', label: 'Tunai' }, { value: 'transfer', label: 'Transfer' }, { value: 'qris', label: 'QRIS' }]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nominal (Rp) <span className="text-red-500">*</span></label>
                <NumberInput
                  value={payAmount}
                  onChange={val => setPayAmount(val === '' ? '' : String(val))}
                  placeholder={amount || '0'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
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
            {mutation.isPending ? 'Menyimpan...' : 'Simpan Tagihan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
