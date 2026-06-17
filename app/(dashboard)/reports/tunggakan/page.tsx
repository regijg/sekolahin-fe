'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, invoiceService, paymentService, paymentTypeService, studentService, schoolService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { formatCurrency, formatDate, MONTHS } from '@/lib/utils'
import SearchableSelect from '@/components/ui/SearchableSelect'

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

export default function TunggakanPage() {
  const schoolId = useSchoolId()
  const [paymentTypeId, setPaymentTypeId] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [month, setMonth] = useState('')
  const [collapsedClasses, setCollapsedClasses] = useState<Set<string>>(new Set())

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices', 'all-report'], queryFn: () => fetchAllPages(invoiceService) })
  const { data: payments = [] } = useQuery({ queryKey: ['payments', 'all'], queryFn: () => fetchAllPages(paymentService) })
  const { data: paymentTypes = [] } = useQuery({ queryKey: ['payment-types', 'all'], queryFn: () => fetchAllPages(paymentTypeService) })
  const { data: students = [] } = useQuery({ queryKey: ['students', 'all'], queryFn: () => fetchAllPages(studentService) })

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students])

  const paidByInvoice = useMemo(() => {
    const map: Record<number, number> = {}
    payments.forEach(p => {
      if (p.invoice_id) map[p.invoice_id] = (map[p.invoice_id] ?? 0) + Number(p.amount)
    })
    return map
  }, [payments])

  const filtered = useMemo(() => {
    return invoices
      .filter(inv => inv.status !== 'lunas')
      .filter(inv => !paymentTypeId || String(inv.payment_type_id) === paymentTypeId)
      .filter(inv => !year || String(inv.year) === year)
      .filter(inv => !month || String(inv.month) === month)
      .map(inv => {
        const totalDue = Number(inv.amount) + Number(inv.late_fee ?? 0)
        const paid = paidByInvoice[inv.id] ?? 0
        const remaining = totalDue - paid
        return {
          ...inv,
          classroom_name: studentMap.get(inv.student_id)?.classroom_name ?? '-',
          totalDue,
          paid,
          remaining,
        }
      })
      .sort((a, b) => a.classroom_name.localeCompare(b.classroom_name) || (a.student_name ?? '').localeCompare(b.student_name ?? ''))
  }, [invoices, paymentTypeId, year, month, studentMap, paidByInvoice])

  const byClass = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    filtered.forEach(inv => {
      const cls = inv.classroom_name
      if (!map.has(cls)) map.set(cls, [])
      map.get(cls)!.push(inv)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const totalRemaining = filtered.reduce((s, inv) => s + inv.remaining, 0)
  const countCicilan = filtered.filter(inv => inv.status === 'cicilan').length

  const monthLabel = MONTHS.find(m => String(m.value) === month)?.label
  const subtitle = [monthLabel, year].filter(Boolean).join(' ')

  const allCollapsed = collapsedClasses.size === byClass.length
  const toggleAll = () => {
    if (allCollapsed) setCollapsedClasses(new Set())
    else setCollapsedClasses(new Set(byClass.map(([cls]) => cls)))
  }
  const toggleClass = (cls: string) => {
    setCollapsedClasses(prev => {
      const next = new Set(prev)
      next.has(cls) ? next.delete(cls) : next.add(cls)
      return next
    })
  }

  return (
    <>
      <Header title="Laporan Tunggakan" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper title="Laporan Tunggakan" subtitle={subtitle || undefined} schoolName={school?.name}>

          {/* Filters */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Pembayaran</label>
              <SearchableSelect value={paymentTypeId} onChange={setPaymentTypeId} placeholder="Semua" options={paymentTypes.map(p => ({ value: p.id, label: p.name }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tahun</label>
              <SearchableSelect value={year} onChange={setYear} placeholder="Semua" options={YEARS.map(y => ({ value: y, label: String(y) }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bulan</label>
              <SearchableSelect value={month} onChange={setMonth} placeholder="Semua" options={MONTHS.map(m => ({ value: m.value, label: m.label }))} />
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-red-500 font-medium">{filtered.length - countCicilan} belum bayar · {countCicilan} cicilan</p>
                <p className="text-sm font-bold text-red-700">{formatCurrency(totalRemaining)}</p>
              </div>
            </div>
          </div>

          {/* Summary cards per kelas — screen only */}
          {byClass.length > 1 && (
            <div className="no-print grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-5">
              {byClass.map(([cls, rows]) => {
                const clsTotal = rows.reduce((s, inv) => s + inv.remaining, 0)
                const uniqueStudents = new Set(rows.map(r => r.student_id)).size
                return (
                  <button
                    key={cls}
                    onClick={() => {
                      const othersCollapsed = byClass.filter(([c]) => c !== cls).map(([c]) => c)
                      const isAlreadyFocused = collapsedClasses.size === othersCollapsed.length && !collapsedClasses.has(cls)
                      setCollapsedClasses(isAlreadyFocused ? new Set() : new Set(othersCollapsed))
                    }}
                    className={`text-left bg-white border rounded-xl px-3 py-2.5 hover:shadow-sm transition-all ${
                      collapsedClasses.size > 0 && !collapsedClasses.has(cls)
                        ? 'border-red-400 ring-1 ring-red-300'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <p className="text-xs font-semibold text-gray-700 truncate">{cls}</p>
                    <p className="text-sm font-bold text-red-600 mt-0.5">{formatCurrency(clsTotal)}</p>
                    <p className="text-xs text-gray-400">{uniqueStudents} siswa · {rows.length} tagihan</p>
                  </button>
                )
              })}
            </div>
          )}

          <div className="hidden print:flex justify-between mb-4 text-sm border-b pb-2">
            <span>Jumlah tunggakan: <strong>{filtered.length}</strong></span>
            <span>Total sisa: <strong>{formatCurrency(totalRemaining)}</strong></span>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Tidak ada tunggakan ditemukan.</p>
          ) : (
            <div className="space-y-3">
              {/* Collapse all toggle */}
              {byClass.length > 1 && (
                <div className="no-print flex justify-end">
                  <button onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                    {allCollapsed ? 'Buka Semua' : 'Tutup Semua'}
                  </button>
                </div>
              )}

              {byClass.map(([cls, rows], groupIdx) => {
                const isCollapsed = collapsedClasses.has(cls)
                const clsTotal = rows.reduce((s, inv) => s + inv.remaining, 0)
                const uniqueStudents = new Set(rows.map(r => r.student_id)).size
                const offset = byClass.slice(0, groupIdx).reduce((s, [, r]) => s + r.length, 0)

                return (
                  <div key={cls} className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${isCollapsed ? 'print:hidden' : ''}`}>
                    {/* Classroom header row */}
                    <button
                      onClick={() => toggleClass(cls)}
                      className="no-print w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed
                          ? <ChevronRight size={15} className="text-gray-400" />
                          : <ChevronDown size={15} className="text-gray-400" />
                        }
                        <span className="text-sm font-semibold text-gray-700">{cls}</span>
                        <span className="text-xs text-gray-400">{uniqueStudents} siswa · {rows.length} tagihan</span>
                      </div>
                      <span className="text-sm font-bold text-red-600">{formatCurrency(clsTotal)}</span>
                    </button>
                    {/* Print-only classroom header */}
                    <div className="hidden print:flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-300">
                      <span className="text-sm font-semibold text-gray-700">{cls}</span>
                      <span className="text-xs text-gray-500">{uniqueStudents} siswa · {rows.length} tagihan · {formatCurrency(clsTotal)}</span>
                    </div>

                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="border-b border-gray-100">
                            <tr>
                              {['#', 'Siswa', 'Jenis Pembayaran', 'Periode', 'Status', 'Sisa Tagihan', 'Jatuh Tempo'].map(h => (
                                <th key={h} className={`px-4 py-2.5 text-xs font-medium text-gray-500 text-left ${h === 'Sisa Tagihan' ? 'text-right' : ''}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {rows.map((inv, i) => (
                              <tr key={inv.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 text-gray-400 text-xs">{offset + i + 1}</td>
                                <td className="px-4 py-2.5">
                                  <p className="font-medium text-gray-800">{inv.student_name ?? '-'}</p>
                                  {inv.student_nis && <p className="text-xs text-gray-400">{inv.student_nis}</p>}
                                </td>
                                <td className="px-4 py-2.5 text-gray-600">{inv.payment_type_name ?? '-'}</td>
                                <td className="px-4 py-2.5 text-gray-600">{MONTHS.find(m => m.value === inv.month)?.label} {inv.year}</td>
                                <td className="px-4 py-2.5">
                                  {inv.status === 'cicilan' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Cicilan</span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Belum Bayar</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <p className="font-semibold text-red-600">{formatCurrency(inv.remaining)}</p>
                                  {inv.status === 'cicilan' && (
                                    <p className="text-xs text-gray-400">dari {formatCurrency(inv.totalDue)}</p>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDate(inv.due_date)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="border-t border-gray-200 bg-gray-50">
                            <tr>
                              <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-gray-500 text-right">Subtotal {cls}</td>
                              <td className="px-4 py-2 text-right font-bold text-red-600 text-sm">{formatCurrency(clsTotal)}</td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Grand total */}
              <div className="no-print flex justify-between items-center px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-sm font-semibold text-red-700">Grand Total ({filtered.length} tagihan)</span>
                <span className="text-base font-bold text-red-700">{formatCurrency(totalRemaining)}</span>
              </div>
            </div>
          )}
        </ReportWrapper>
      </main>
    </>
  )
}
