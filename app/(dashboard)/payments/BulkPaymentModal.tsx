'use client'

import { useState, useMemo, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '@/components/ui/Modal'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { paymentService } from '@/lib/services'
import { formatCurrency } from '@/lib/utils'
import type { Invoice, Student, Classroom } from '@/types'

const TODAY = new Date().toISOString().split('T')[0]
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

interface Props {
  isOpen: boolean
  onClose: () => void
  schoolId: number
  students: Student[]
  classrooms: Classroom[]
  invoices: Invoice[]
  paidByInvoice: Record<number, number>
}

export default function BulkPaymentModal({ isOpen, onClose, schoolId, students, classrooms, invoices, paidByInvoice }: Props) {
  const qc = useQueryClient()

  const [classroomId, setClassroomId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [date, setDate] = useState(TODAY)
  const [method, setMethod] = useState('cash')
  const [error, setError] = useState('')

  useEffect(() => { setStudentId(''); setSelectedIds(new Set()) }, [classroomId])
  useEffect(() => { setSelectedIds(new Set()) }, [studentId])

  const filteredStudents = useMemo(() => {
    const base = classroomId
      ? students.filter(s => String(s.classroom_id) === classroomId)
      : students
    return base.slice().sort((a, b) => a.name.localeCompare(b.name))
  }, [students, classroomId])

  const studentInvoices = useMemo(() => {
    if (!studentId) return []
    const typePriority = (name: string | undefined) => {
      const n = (name ?? '').toUpperCase()
      if (n.includes('PPDB')) return 0
      if (n.includes('SPP')) return 1
      return 2
    }
    return invoices
      .filter(inv => String(inv.student_id) === studentId && (inv as unknown as { status: string }).status !== 'lunas')
      .slice()
      .sort((a, b) => {
        const pa = typePriority(a.payment_type_name), pb = typePriority(b.payment_type_name)
        if (pa !== pb) return pa - pb
        if (pa === 2 && pb === 2) {
          const nameA = a.payment_type_name ?? '', nameB = b.payment_type_name ?? ''
          if (nameA !== nameB) return nameA.localeCompare(nameB)
        }
        return a.year !== b.year ? a.year - b.year : a.month - b.month
      })
  }, [invoices, studentId])

  const remainingByInvoice = useMemo(() => {
    const map: Record<number, number> = {}
    studentInvoices.forEach(inv => {
      const totalDue = Number(inv.amount) + Number(inv.late_fee ?? 0)
      const paid = paidByInvoice[inv.id] ?? 0
      map[inv.id] = Math.max(0, totalDue - paid)
    })
    return map
  }, [studentInvoices, paidByInvoice])

  const totalSelected = useMemo(() => {
    let sum = 0
    selectedIds.forEach(id => { sum += remainingByInvoice[id] ?? 0 })
    return sum
  }, [selectedIds, remainingByInvoice])

  const toggleInvoice = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = studentInvoices.length > 0 && selectedIds.size === studentInvoices.length

  const toggleAll = () => {
    if (allChecked) setSelectedIds(new Set())
    else setSelectedIds(new Set(studentInvoices.map(i => i.id)))
  }

  const mutation = useMutation({
    mutationFn: async () => {
      for (const invoiceId of Array.from(selectedIds)) {
        await paymentService.create({
          school_id: schoolId,
          invoice_id: invoiceId,
          date,
          amount: remainingByInvoice[invoiceId],
          payment_method: method,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['payments'] })
      handleClose()
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'Gagal menyimpan pembayaran'),
  })

  const handleClose = () => {
    setClassroomId('')
    setStudentId('')
    setSelectedIds(new Set())
    setDate(TODAY)
    setMethod('cash')
    setError('')
    onClose()
  }

  const canSubmit = !!studentId && selectedIds.size > 0 && !!date && !!method && !mutation.isPending

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bayar Multi-Tagihan" size="lg">
      <div className="space-y-5">

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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Siswa <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={studentId}
              onChange={setStudentId}
              placeholder="Cari nama siswa..."
              options={filteredStudents.map(s => ({ value: s.id, label: `${s.name} (${s.nis})` }))}
            />
          </div>
        </div>

        {/* Daftar tagihan */}
        {studentId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Pilih Tagihan Belum Lunas
              </label>
              {studentInvoices.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {allChecked ? 'Batal Semua' : 'Pilih Semua'}
                </button>
              )}
            </div>

            {studentInvoices.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Tidak ada tagihan yang belum lunas
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {studentInvoices.map(inv => {
                  const remaining = remainingByInvoice[inv.id]
                  const paid = paidByInvoice[inv.id] ?? 0
                  const checked = selectedIds.has(inv.id)
                  return (
                    <label
                      key={inv.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleInvoice(inv.id)}
                        className="h-4 w-4 rounded text-blue-600 border-gray-300 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-800">
                            {inv.payment_type_name ?? 'SPP'} — {MONTH_NAMES[inv.month]} {inv.year}
                          </span>
                          {paid > 0 && (
                            <span className="text-[11px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">
                              Cicilan
                            </span>
                          )}
                        </div>
                        {paid > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Sudah bayar {formatCurrency(paid)} · Sisa {formatCurrency(remaining)}
                          </p>
                        )}
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${checked ? 'text-blue-700' : 'text-gray-700'}`}>
                        {formatCurrency(remaining)}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Detail pembayaran */}
        {selectedIds.size > 0 && (
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-3">
            <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-4 h-4 bg-green-600 text-white rounded-full text-[10px] font-bold">✓</span>
              {selectedIds.size} tagihan · Total {formatCurrency(totalSelected)}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tanggal Bayar <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Metode <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  value={method}
                  onChange={setMethod}
                  isClearable={false}
                  options={[
                    { value: 'cash', label: 'Tunai' },
                    { value: 'transfer', label: 'Transfer' },
                    { value: 'qris', label: 'QRIS' },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

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
            type="button"
            disabled={!canSubmit}
            onClick={() => { setError(''); mutation.mutate() }}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {mutation.isPending
              ? `Menyimpan...`
              : `Bayar${selectedIds.size > 0 ? ` ${selectedIds.size} Tagihan` : ''}`}
          </button>
        </div>

      </div>
    </Modal>
  )
}
