'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, canteenTransactionService, canteenAccountService, schoolService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { formatCurrency, MONTHS } from '@/lib/utils'
import SearchableSelect from '@/components/ui/SearchableSelect'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - 1 + i)

export default function KantinPage() {
  const schoolId = useSchoolId()
  const [month, setMonth] = useState(String(currentMonth))
  const [year, setYear] = useState(String(currentYear))

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: accounts = [] } = useQuery({ queryKey: ['canteen-accounts', 'all'], queryFn: () => fetchAllPages(canteenAccountService) })
  const { data: transactions = [], isLoading } = useQuery({ queryKey: ['canteen-transactions', 'all-report'], queryFn: () => fetchAllPages(canteenTransactionService) })

  const filtered = useMemo(() =>
    transactions.filter(t => {
      if (t.status !== 'completed') return false
      if (!t.created_at) return true
      const d = new Date(t.created_at)
      return String(d.getMonth() + 1) === month && String(d.getFullYear()) === year
    })
  , [transactions, month, year])

  const rows = useMemo(() => {
    const map = new Map<number, { studentName: string; credit: number; debit: number }>()
    filtered.forEach(t => {
      const acc = accounts.find(a => a.id === t.canteen_account_id)
      const name = t.account_student_name ?? acc?.student_name ?? 'Unknown'
      const prev = map.get(t.canteen_account_id) ?? { studentName: name, credit: 0, debit: 0 }
      map.set(t.canteen_account_id, {
        studentName: name,
        credit: prev.credit + (t.type === 'credit' ? t.amount : 0),
        debit: prev.debit + (t.type === 'debit' ? t.amount : 0),
      })
    })
    return Array.from(map.entries())
      .map(([accountId, data]) => {
        const acc = accounts.find(a => a.id === accountId)
        return { accountId, ...data, balance: acc?.balance ?? 0 }
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName))
  }, [filtered, accounts])

  const totalCredit = rows.reduce((s, r) => s + r.credit, 0)
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0)

  const monthLabel = MONTHS.find(m => String(m.value) === month)?.label
  const subtitle = [monthLabel, year].filter(Boolean).join(' ')

  return (
    <>
      <Header title="Transaksi Kantin" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper title="Rekap Transaksi Kantin" subtitle={subtitle || undefined} schoolName={school?.name}>

          {/* Filters */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bulan</label>
              <SearchableSelect value={month} onChange={setMonth} isClearable={false} options={MONTHS.map(m => ({ value: m.value, label: m.label }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tahun</label>
              <SearchableSelect value={year} onChange={setYear} isClearable={false} options={YEARS.map(y => ({ value: y, label: String(y) }))} />
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-green-500 font-medium">Total Top-up</p>
                <p className="text-sm font-bold text-green-700">{formatCurrency(totalCredit)}</p>
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-orange-500 font-medium">Total Belanja</p>
                <p className="text-sm font-bold text-orange-700">{formatCurrency(totalDebit)}</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Tidak ada transaksi pada periode ini.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['#', 'Nama Siswa', 'Top-up (Kredit)', 'Belanja (Debit)', 'Net', 'Saldo Saat Ini'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-right first:text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                      <tr key={row.accountId} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 text-xs text-left">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800 text-left">{row.studentName}</td>
                        <td className="px-4 py-2.5 text-right text-green-600 font-medium">{formatCurrency(row.credit)}</td>
                        <td className="px-4 py-2.5 text-right text-orange-600 font-medium">{formatCurrency(row.debit)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${row.credit - row.debit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {formatCurrency(row.credit - row.debit)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-700">{formatCurrency(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={2} className="px-4 py-2.5 text-sm font-semibold text-gray-700">Total</td>
                      <td className="px-4 py-2.5 text-right font-bold text-green-700">{formatCurrency(totalCredit)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-orange-700">{formatCurrency(totalDebit)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-gray-800">{formatCurrency(totalCredit - totalDebit)}</td>
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
