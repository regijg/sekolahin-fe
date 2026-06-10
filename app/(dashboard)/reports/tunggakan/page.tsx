'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, invoiceService, paymentTypeService, studentService, schoolService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { formatCurrency, formatDate, MONTHS } from '@/lib/utils'

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

export default function TunggakanPage() {
  const schoolId = useSchoolId()
  const [paymentTypeId, setPaymentTypeId] = useState('')
  const [year, setYear] = useState(String(currentYear))
  const [month, setMonth] = useState('')

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices', 'all-report'], queryFn: () => fetchAllPages(invoiceService) })
  const { data: paymentTypes = [] } = useQuery({ queryKey: ['payment-types', 'all'], queryFn: () => fetchAllPages(paymentTypeService) })
  const { data: students = [] } = useQuery({ queryKey: ['students', 'all'], queryFn: () => fetchAllPages(studentService) })

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students])

  const filtered = useMemo(() =>
    invoices
      .filter(inv => inv.status === 'belum_lunas')
      .filter(inv => !paymentTypeId || String(inv.payment_type_id) === paymentTypeId)
      .filter(inv => !year || String(inv.year) === year)
      .filter(inv => !month || String(inv.month) === month)
      .map(inv => ({ ...inv, classroom_name: studentMap.get(inv.student_id)?.classroom_name ?? '-' }))
      .sort((a, b) => (a.classroom_name).localeCompare(b.classroom_name) || (a.student_name ?? '').localeCompare(b.student_name ?? ''))
  , [invoices, paymentTypeId, year, month, studentMap])

  const total = filtered.reduce((s, inv) => s + inv.amount, 0)
  const monthLabel = MONTHS.find(m => String(m.value) === month)?.label
  const subtitle = [monthLabel, year].filter(Boolean).join(' ')

  return (
    <>
      <Header title="Laporan Tunggakan" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper title="Laporan Tunggakan" subtitle={subtitle || undefined} schoolName={school?.name}>

          {/* Filters */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Pembayaran</label>
              <select value={paymentTypeId} onChange={e => setPaymentTypeId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua</option>
                {paymentTypes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tahun</label>
              <select value={year} onChange={e => setYear(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bulan</label>
              <select value={month} onChange={e => setMonth(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua</option>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-red-500 font-medium">{filtered.length} tagihan belum lunas</p>
                <p className="text-sm font-bold text-red-700">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>

          <div className="hidden print:flex justify-between mb-4 text-sm border-b pb-2">
            <span>Jumlah tunggakan: <strong>{filtered.length}</strong></span>
            <span>Total nominal: <strong>{formatCurrency(total)}</strong></span>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Tidak ada tunggakan ditemukan.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['#', 'Siswa', 'Kelas', 'Jenis Pembayaran', 'Periode', 'Nominal', 'Jatuh Tempo'].map(h => (
                        <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-left ${h === 'Nominal' ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((inv, i) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-800">{inv.student_name ?? '-'}</p>
                          {inv.student_nis && <p className="text-xs text-gray-400">{inv.student_nis}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{inv.classroom_name}</td>
                        <td className="px-4 py-2.5 text-gray-600">{inv.payment_type_name ?? '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{MONTHS.find(m => m.value === inv.month)?.label} {inv.year}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-red-600">{formatCurrency(inv.amount)}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDate(inv.due_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={5} className="px-4 py-2.5 text-sm font-semibold text-gray-700 text-right">Total</td>
                      <td className="px-4 py-2.5 text-right font-bold text-red-600">{formatCurrency(total)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </ReportWrapper>
      </main>
    </>
  )
}
