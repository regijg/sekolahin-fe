'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, ppdbService, schoolService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import SearchableSelect from '@/components/ui/SearchableSelect'

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Diajukan' },
  { value: 'accepted', label: 'Diterima' },
  { value: 'rejected', label: 'Ditolak' },
]

export default function PpdbPage() {
  const schoolId = useSchoolId()
  const [status, setStatus] = useState('')

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: applications = [], isLoading } = useQuery({ queryKey: ['ppdb', 'all-report'], queryFn: () => fetchAllPages(ppdbService) })

  const filtered = useMemo(() =>
    applications
      .filter(a => !status || a.status === status)
      .sort((a, b) => a.name.localeCompare(b.name))
  , [applications, status])

  const summary = useMemo(() => {
    const counts: Record<string, number> = { draft: 0, submitted: 0, accepted: 0, rejected: 0 }
    applications.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1 })
    return counts
  }, [applications])

  return (
    <>
      <Header title="Rekap PPDB" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper title="Rekap Pendaftaran PPDB" subtitle={status ? STATUS_OPTIONS.find(s => s.value === status)?.label : undefined} schoolName={school?.name}>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Pendaftar', value: applications.length, color: 'bg-gray-50 border-gray-200 text-gray-700' },
              { label: 'Diajukan', value: summary.submitted, color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { label: 'Diterima', value: summary.accepted, color: 'bg-green-50 border-green-200 text-green-700' },
              { label: 'Ditolak', value: summary.rejected, color: 'bg-red-50 border-red-200 text-red-700' },
            ].map(card => (
              <div key={card.label} className={`border rounded-xl p-3 text-center ${card.color}`}>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs font-medium mt-0.5 opacity-80">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="no-print mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-1">Filter Status</label>
            <div className="w-full sm:w-60">
              <SearchableSelect value={status} onChange={setStatus} placeholder="Semua Status" options={STATUS_OPTIONS.filter(s => s.value !== '').map(s => ({ value: s.value, label: s.label }))} />
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Tidak ada pendaftar ditemukan.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['#', 'No. Registrasi', 'Nama Pendaftar', 'L/P', 'Tanggal Lahir', 'Wali', 'Status', 'Tanggal Daftar'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((app, i) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{app.registration_number}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{app.name}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{app.gender === 'male' ? 'L' : app.gender === 'female' ? 'P' : '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{formatDate(app.birthdate)}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{app.guardian_name ?? '-'}</td>
                        <td className="px-4 py-2.5"><Badge value={app.status} /></td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{formatDate(app.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={2} className="px-4 py-2.5 text-sm font-semibold text-gray-700">Total</td>
                      <td className="px-4 py-2.5 font-bold text-gray-800">{filtered.length} pendaftar</td>
                      <td colSpan={5} />
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
