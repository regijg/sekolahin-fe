'use client'

import { Fragment, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, invoiceService, paymentService, studentService, schoolService, classroomService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { formatCurrency, formatDate, MONTHS } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import SearchableSelect from '@/components/ui/SearchableSelect'

const METHOD_LABEL: Record<string, string> = { cash: 'Tunai', transfer: 'Transfer', qris: 'QRIS' }

export default function TagihanSiswaPage() {
  const schoolId = useSchoolId()
  const [classroomId, setClassroomId] = useState('')
  const [studentId, setStudentId] = useState('')

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: classrooms = [] } = useQuery({ queryKey: ['classrooms', 'all'], queryFn: () => fetchAllPages(classroomService) })
  const { data: students = [] } = useQuery({ queryKey: ['students', 'all'], queryFn: () => fetchAllPages(studentService) })
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices', 'all-report'], queryFn: () => fetchAllPages(invoiceService) })
  const { data: allPayments = [] } = useQuery({ queryKey: ['payments', 'all'], queryFn: () => fetchAllPages(paymentService) })

  const paidByInvoice = useMemo(() => {
    const map: Record<number, number> = {}
    allPayments.forEach(p => {
      if (p.invoice_id) map[p.invoice_id] = (map[p.invoice_id] ?? 0) + Number(p.amount)
    })
    return map
  }, [allPayments])

  const paymentsByInvoice = useMemo(() => {
    const map: Record<number, typeof allPayments> = {}
    allPayments.forEach(p => {
      if (!p.invoice_id) return
      if (!map[p.invoice_id]) map[p.invoice_id] = []
      map[p.invoice_id].push(p)
    })
    return map
  }, [allPayments])

  const filteredStudents = classroomId
    ? students.filter(s => String(s.classroom_id) === classroomId)
    : []

  const selectedStudent = students.find(s => String(s.id) === studentId)

  const filtered = useMemo(() =>
    invoices
      .filter(inv => String(inv.student_id) === studentId)
      .map(inv => {
        const totalDue = Number(inv.amount) + Number(inv.late_fee ?? 0)
        const paid = paidByInvoice[inv.id] ?? 0
        const remaining = totalDue - paid
        return { ...inv, totalDue, paid, remaining }
      })
      .sort((a, b) => b.year - a.year || b.month - a.month)
  , [invoices, studentId, paidByInvoice])

  const [expandedInvoices, setExpandedInvoices] = useState<Set<number>>(new Set())

  const allHavePayments = filtered.filter(inv => (paymentsByInvoice[inv.id]?.length ?? 0) > 0)
  const allExpanded = allHavePayments.length > 0 && allHavePayments.every(inv => expandedInvoices.has(inv.id))

  const toggleExpand = (id: number) =>
    setExpandedInvoices(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAllExpand = () =>
    setExpandedInvoices(allExpanded
      ? new Set()
      : new Set(allHavePayments.map(inv => inv.id))
    )

  const totalTagihan = filtered.reduce((s, inv) => s + inv.totalDue, 0)
  const totalDibayar = filtered.reduce((s, inv) => s + inv.paid, 0)
  const totalSisa = filtered.reduce((s, inv) => s + inv.remaining, 0)

  return (
    <>
      <Header title="Tagihan per Siswa" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper
          title="Laporan Tagihan Siswa"
          subtitle={selectedStudent ? `${selectedStudent.name} — ${selectedStudent.classroom_name ?? ''}` : undefined}
          schoolName={school?.name}
        >
          {/* Filter */}
          <div className="no-print mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Pilih Kelas <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={classroomId}
                onChange={v => { setClassroomId(v); setStudentId('') }}
                placeholder="-- Pilih Kelas --"
                options={classrooms.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Pilih Siswa <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={studentId}
                onChange={setStudentId}
                placeholder={classroomId ? '-- Pilih Siswa --' : '— Pilih kelas dulu —'}
                disabled={!classroomId}
                options={filteredStudents.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: `${s.name} (${s.nis})` }))}
              />
            </div>
          </div>

          {!studentId ? (
            <p className="text-sm text-gray-400 py-10 text-center">Pilih siswa untuk melihat riwayat tagihan.</p>
          ) : isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : (
            <div className="space-y-5">
              {/* Info siswa */}
              {selectedStudent && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-xs text-gray-500">Nama</p><p className="font-semibold text-gray-800">{selectedStudent.name}</p></div>
                  <div><p className="text-xs text-gray-500">NIS</p><p className="font-medium text-gray-700">{selectedStudent.nis}</p></div>
                  <div><p className="text-xs text-gray-500">Kelas</p><p className="font-medium text-gray-700">{selectedStudent.classroom_name ?? '-'}</p></div>
                  <div><p className="text-xs text-gray-500">Orang Tua/Wali</p><p className="font-medium text-gray-700">{selectedStudent.parent_guardian_name ?? '-'}</p></div>
                </div>
              )}

              {/* Ringkasan */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Tagihan</p>
                  <p className="text-base font-bold text-gray-800">{formatCurrency(totalTagihan)}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-green-600 mb-1">Sudah Dibayar</p>
                  <p className="text-base font-bold text-green-700">{formatCurrency(totalDibayar)}</p>
                </div>
                <div className="bg-white border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-red-500 mb-1">Sisa Tagihan</p>
                  <p className="text-base font-bold text-red-600">{formatCurrency(totalSisa)}</p>
                </div>
              </div>

              {filtered.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">Belum ada tagihan untuk siswa ini.</p>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Expand all toggle */}
                  {allHavePayments.length > 0 && (
                    <div className="no-print flex justify-end px-4 py-2 border-b border-gray-100 bg-gray-50">
                      <button
                        onClick={toggleAllExpand}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {allExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        {allExpanded ? 'Sembunyikan Semua Pembayaran' : 'Tampilkan Semua Pembayaran'}
                      </button>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {['#', 'Jenis Pembayaran', 'Periode', 'Tagihan', 'Dibayar', 'Sisa', 'Status'].map(h => (
                            <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-left ${['Tagihan', 'Dibayar', 'Sisa'].includes(h) ? 'text-right' : ''}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filtered.map((inv, i) => {
                          const payments = paymentsByInvoice[inv.id] ?? []
                          const isExpanded = expandedInvoices.has(inv.id)
                          return (
                            <Fragment key={inv.id}>
                              <tr
                                onClick={() => payments.length > 0 && toggleExpand(inv.id)}
                                className={`hover:bg-gray-50 ${payments.length > 0 ? 'cursor-pointer' : ''}`}
                              >
                                <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                                <td className="px-4 py-2.5 font-medium text-gray-700">
                                  <div className="flex items-center gap-1.5">
                                    {payments.length > 0 && (
                                      <span className="no-print text-gray-400">
                                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                      </span>
                                    )}
                                    {inv.payment_type_name ?? '-'}
                                    {payments.length > 0 && (
                                      <span className="no-print text-xs text-gray-400 font-normal">({payments.length}x bayar)</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5 text-gray-600">{MONTHS.find(m => m.value === inv.month)?.label} {inv.year}</td>
                                <td className="px-4 py-2.5 text-right text-gray-700">{formatCurrency(inv.totalDue)}</td>
                                <td className="px-4 py-2.5 text-right text-green-600">{inv.paid > 0 ? formatCurrency(inv.paid) : <span className="text-gray-300">—</span>}</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-red-600">{inv.remaining > 0 ? formatCurrency(inv.remaining) : <span className="text-green-600 font-normal">Lunas</span>}</td>
                                <td className="px-4 py-2.5"><Badge value={inv.status} /></td>
                              </tr>
                              {payments.map((p, pi) => (
                                <tr
                                  key={`pay-${p.id}`}
                                  className={`bg-green-50 border-l-2 border-green-300 text-xs ${isExpanded ? '' : 'hidden'} print:table-row`}
                                >
                                  <td className="px-4 py-1.5 text-gray-300">↳</td>
                                  <td className="px-4 py-1.5 text-gray-500 pl-7" colSpan={2}>
                                    Pembayaran ke-{pi + 1} &nbsp;·&nbsp; {formatDate(p.date)}
                                  </td>
                                  <td className="px-4 py-1.5 text-right text-gray-300">—</td>
                                  <td className="px-4 py-1.5 text-right text-green-600 font-medium">{formatCurrency(Number(p.amount))}</td>
                                  <td className="px-4 py-1.5 text-right text-gray-300">—</td>
                                  <td className="px-4 py-1.5 text-gray-500">{METHOD_LABEL[p.payment_method] ?? p.payment_method}</td>
                                </tr>
                              ))}
                            </Fragment>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                        <tr>
                          <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-gray-700 text-right">Total</td>
                          <td className="px-4 py-2.5 text-right font-bold text-gray-800">{formatCurrency(totalTagihan)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-green-700">{formatCurrency(totalDibayar)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-red-600">{formatCurrency(totalSisa)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </ReportWrapper>
      </main>
    </>
  )
}
