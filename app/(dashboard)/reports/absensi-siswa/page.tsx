'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, studentAttendanceService, studentService, classroomService, schoolService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { MONTHS } from '@/lib/utils'

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - 1 + i)

const STATUS_LABELS: Record<string, string> = {
  present: 'Hadir', late: 'Terlambat', sick: 'Sakit', permission: 'Izin', absent: 'Alpa',
}

export default function AbsensiSiswaPage() {
  const schoolId = useSchoolId()
  const [classroomId, setClassroomId] = useState('')
  const [month, setMonth] = useState(String(currentMonth))
  const [year, setYear] = useState(String(currentYear))

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: classrooms = [] } = useQuery({ queryKey: ['classrooms', 'all'], queryFn: () => fetchAllPages(classroomService) })
  const { data: students = [] } = useQuery({ queryKey: ['students', 'all'], queryFn: () => fetchAllPages(studentService) })
  const { data: attendances = [], isLoading } = useQuery({ queryKey: ['student-attendances', 'all-report'], queryFn: () => fetchAllPages(studentAttendanceService) })

  const studentsInClass = useMemo(() =>
    classroomId ? students.filter(s => String(s.classroom_id) === classroomId) : []
  , [students, classroomId])

  const studentIdSet = useMemo(() => new Set(studentsInClass.map(s => s.id)), [studentsInClass])

  const filtered = useMemo(() => {
    if (!classroomId) return []
    return attendances.filter(a => {
      if (!studentIdSet.has(a.student_id)) return false
      const d = new Date(a.date)
      if (String(d.getMonth() + 1) !== month) return false
      if (String(d.getFullYear()) !== year) return false
      return true
    })
  }, [attendances, studentIdSet, classroomId, month, year])

  const rows = useMemo(() => {
    return studentsInClass.map(s => {
      const records = filtered.filter(a => a.student_id === s.id)
      const counts = { present: 0, late: 0, sick: 0, permission: 0, absent: 0 }
      records.forEach(a => { counts[a.status as keyof typeof counts] = (counts[a.status as keyof typeof counts] || 0) + 1 })
      const totalDays = records.length
      const pct = totalDays > 0 ? (((counts.present + counts.late) / totalDays) * 100).toFixed(0) : '-'
      return { student: s, counts, totalDays, pct }
    }).sort((a, b) => a.student.name.localeCompare(b.student.name))
  }, [studentsInClass, filtered])

  const classroom = classrooms.find(c => String(c.id) === classroomId)
  const monthLabel = MONTHS.find(m => String(m.value) === month)?.label
  const subtitle = [classroom?.name, monthLabel, year].filter(Boolean).join(' · ')

  return (
    <>
      <Header title="Absensi Siswa" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper title="Rekap Absensi Siswa" subtitle={subtitle || undefined} schoolName={school?.name}>

          {/* Filters */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kelas <span className="text-red-500">*</span></label>
              <select value={classroomId} onChange={e => setClassroomId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Pilih kelas...</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bulan</label>
              <select value={month} onChange={e => setMonth(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tahun</label>
              <select value={year} onChange={e => setYear(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-blue-500 font-medium">{studentsInClass.length} siswa</p>
                <p className="text-xs text-blue-600">{filtered.length} catatan absen</p>
              </div>
            </div>
          </div>

          {!classroomId ? (
            <p className="text-sm text-gray-400 py-10 text-center">Pilih kelas untuk melihat rekap absensi.</p>
          ) : isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Tidak ada data absensi untuk kelas & periode ini.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nama Siswa</th>
                      {Object.keys(STATUS_LABELS).map(s => (
                        <th key={s} className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">{STATUS_LABELS[s]}</th>
                      ))}
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">Total Hari</th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">% Hadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, i) => (
                      <tr key={row.student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-800">{row.student.name}</p>
                          <p className="text-xs text-gray-400">{row.student.nis}</p>
                        </td>
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
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                Keterangan: Hadir = tepat waktu · Terlambat = masuk tapi terlambat · % Hadir = (Hadir + Terlambat) / Total Hari
              </div>
            </div>
          )}
        </ReportWrapper>
      </main>
    </>
  )
}
