'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, paymentService, paymentTypeService, schoolService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { formatCurrency, formatDate, MONTHS } from '@/lib/utils'
import SearchableSelect from '@/components/ui/SearchableSelect'

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

export default function PenerimaanPage() {
  const schoolId = useSchoolId()
  const [year, setYear] = useState(String(currentYear))
  const [month, setMonth] = useState('')
  const [paymentTypeId, setPaymentTypeId] = useState('')

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: payments = [], isLoading } = useQuery({ queryKey: ['payments', 'all-report'], queryFn: () => fetchAllPages(paymentService) })
  const { data: paymentTypes = [] } = useQuery({ queryKey: ['payment-types', 'all'], queryFn: () => fetchAllPages(paymentTypeService) })

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (!p.date) return false
      const d = new Date(p.date)
      if (year && String(d.getFullYear()) !== year) return false
      if (month && String(d.getMonth() + 1) !== month) return false
      if (paymentTypeId && p.payment_type_name !== paymentTypes.find(pt => String(pt.id) === paymentTypeId)?.name) return false
      return true
    })
  }, [payments, year, month, paymentTypeId, paymentTypes])

  const grandTotal = filtered.reduce((s, p) => s + p.amount, 0)

  const byType = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach(p => {
      const key = p.payment_type_name ?? 'Lainnya'
      map.set(key, (map.get(key) ?? 0) + p.amount)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [filtered])

  const monthLabel = MONTHS.find(m => String(m.value) === month)?.label
  const subtitle = [monthLabel, year].filter(Boolean).join(' ')

  return (
    <>
      <Header title="Rekap Penerimaan" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper title="Rekap Penerimaan" subtitle={subtitle || undefined} schoolName={school?.name}>

          {/* Filters */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tahun <span className="text-red-500">*</span></label>
              <SearchableSelect value={year} onChange={setYear} isClearable={false} options={YEARS.map(y => ({ value: y, label: String(y) }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bulan</label>
              <SearchableSelect value={month} onChange={setMonth} placeholder="Semua Bulan" options={MONTHS.map(m => ({ value: m.value, label: m.label }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Pembayaran</label>
              <SearchableSelect value={paymentTypeId} onChange={setPaymentTypeId} placeholder="Semua" options={paymentTypes.map(p => ({ value: p.id, label: p.name }))} />
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-green-600 font-medium">{filtered.length} transaksi</p>
                <p className="text-sm font-bold text-green-700">{formatCurrency(grandTotal)}</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Tidak ada pembayaran pada periode ini.</p>
          ) : (
            <div className="space-y-5">
              {/* Ringkasan per jenis */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ringkasan per Jenis Pembayaran</p>
                </div>
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Jenis</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Total</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {byType.map(([name, total]) => (
                      <tr key={name} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-700">{name}</td>
                        <td className="px-4 py-2.5 text-right text-green-700 font-semibold">{formatCurrency(total)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-400 text-xs">{grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                    <tr>
                      <td className="px-4 py-2.5 font-bold text-gray-800">Grand Total</td>
                      <td className="px-4 py-2.5 text-right font-bold text-green-700">{formatCurrency(grandTotal)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500 text-xs">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Detail transaksi */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detail Transaksi</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100">
                      <tr>
                        {['#', 'Tanggal', 'Siswa', 'Jenis', 'Metode', 'Nominal'].map(h => (
                          <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase text-left ${h === 'Nominal' ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((p, i) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatDate(p.date)}</td>
                          <td className="px-4 py-2.5 text-gray-700 font-medium">{p.student_name ?? '-'}</td>
                          <td className="px-4 py-2.5 text-gray-600">{p.payment_type_name ?? '-'}</td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">{p.payment_method}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-green-700">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </ReportWrapper>
      </main>
    </>
  )
}
