'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, teacherAttendanceService, teacherService, schoolService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { MONTHS } from '@/lib/utils'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - 1 + i)

const STATUS_LABELS: Record<string, string> = {
  present: 'Hadir', late: 'Terlambat', sick: 'Sakit', permission: 'Izin', absent: 'Alpa',
}

export default function AbsensiGuruPage() {
  const schoolId = useSchoolId()
  const [month, setMonth] = useState(String(currentMonth))
  const [year, setYear] = useState(String(currentYear))

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: teachers = [] } = useQuery({ queryKey: ['teachers', 'all'], queryFn: () => fetchAllPages(teacherService) })
  const { data: attendances = [], isLoading } = useQuery({ queryKey: ['teacher-attendances', 'all-report'], queryFn: () => fetchAllPages(teacherAttendanceService) })

  const filtered = useMemo(() =>
    attendances.filter(a => {
      const d = new Date(a.date)
      return String(d.getMonth() + 1) === month && String(d.getFullYear()) === year
    })
  , [attendances, month, year])

  const rows = useMemo(() => {
    return teachers.map(t => {
      const records = filtered.filter(a => a.teacher_id === t.id)
      const counts = { present: 0, late: 0, sick: 0, permission: 0, absent: 0 }
      records.forEach(a => { counts[a.status as keyof typeof counts] = (counts[a.status as keyof typeof counts] || 0) + 1 })
      const totalDays = records.length
      const pct = totalDays > 0 ? (((counts.present + counts.late) / totalDays) * 100).toFixed(0) : '-'
      return { teacher: t, counts, totalDays, pct }
    })
      .filter(r => r.totalDays > 0)
      .sort((a, b) => a.teacher.name.localeCompare(b.teacher.name))
  }, [teachers, filtered])

  const monthLabel = MONTHS.find(m => String(m.value) === month)?.label
  const subtitle = [monthLabel, year].filter(Boolean).join(' ')

  return (
    <>
      <Header title="Absensi Guru" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper title="Rekap Absensi Guru" subtitle={subtitle || undefined} schoolName={school?.name}>

          {/* Filters */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bulan</label>
              <select value={month} onChange={e => setMonth(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tahun</label>
              <select value={year} onChange={e => setYear(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-blue-500 font-medium">{rows.length} guru dicatat</p>
                <p className="text-xs text-blue-600">{filtered.length} catatan absen</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Tidak ada data absensi guru pada periode ini.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Guru</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">NIP</th>
                      {Object.keys(STATUS_LABELS).map(s => (
                        <th key={s} className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{STATUS_LABELS[s]}</th>
                      ))}
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">% Hadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                      <tr key={row.teacher.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{row.teacher.name}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{row.teacher.nip}</td>
                        <td className="px-3 py-2.5 text-center text-green-600 font-medium">{row.counts.present}</td>
                        <td className="px-3 py-2.5 text-center text-yellow-600 font-medium">{row.counts.late}</td>
                        <td className="px-3 py-2.5 text-center text-blue-600 font-medium">{row.counts.sick}</td>
                        <td className="px-3 py-2.5 text-center text-purple-600 font-medium">{row.counts.permission}</td>
                        <td className="px-3 py-2.5 text-center text-red-600 font-medium">{row.counts.absent}</td>
                        <td className="px-3 py-2.5 text-center text-gray-600">{row.totalDays}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-xs font-semibold ${Number(row.pct) >= 80 ? 'text-green-600' : Number(row.pct) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {row.pct === '-' ? '-' : `${row.pct}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </ReportWrapper>
      </main>
    </>
  )
}
