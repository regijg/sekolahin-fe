'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, studentService, classroomService, schoolService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'

export default function DaftarSiswaPage() {
  const schoolId = useSchoolId()
  const [classroomId, setClassroomId] = useState('')

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: classrooms = [] } = useQuery({ queryKey: ['classrooms', 'all'], queryFn: () => fetchAllPages(classroomService) })
  const { data: students = [], isLoading } = useQuery({ queryKey: ['students', 'all'], queryFn: () => fetchAllPages(studentService) })

  const filtered = useMemo(() =>
    students
      .filter(s => !classroomId || String(s.classroom_id) === classroomId)
      .sort((a, b) => (a.classroom_name ?? '').localeCompare(b.classroom_name ?? '') || a.name.localeCompare(b.name))
  , [students, classroomId])

  const classroom = classrooms.find(c => String(c.id) === classroomId)

  const groupedByClass = useMemo(() => {
    const map = new Map<string, number>()
    filtered.forEach(s => {
      const key = s.classroom_name ?? 'Tanpa Kelas'
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return map
  }, [filtered])

  return (
    <>
      <Header title="Daftar Siswa" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper
          title="Daftar Siswa"
          subtitle={classroom ? classroom.name : `Semua Kelas Â· ${filtered.length} siswa`}
          schoolName={school?.name}
        >
          {/* Filters */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kelas</label>
              <select value={classroomId} onChange={e => setClassroomId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Semua Kelas</option>
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-2 flex items-end gap-2 flex-wrap">
              {Array.from(groupedByClass.entries()).map(([name, count]) => (
                <span key={name} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-100">
                  {name}: {count} siswa
                </span>
              ))}
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 py-10 text-center">Tidak ada siswa ditemukan.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['#', 'NIS', 'NISN', 'Nama Siswa', 'L/P', 'Kelas', 'Orang Tua / Wali', 'Alamat'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((s, i) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{s.nis}</td>
                        <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{s.nisn}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{s.name}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{s.gender === 'male' ? 'L' : s.gender === 'female' ? 'P' : '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.classroom_name ?? '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{s.parent_guardian_name ?? '-'}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[180px] truncate">{s.address ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-gray-700">Total</td>
                      <td className="px-4 py-2.5 font-bold text-gray-800">{filtered.length} siswa</td>
                      <td colSpan={4} />
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
