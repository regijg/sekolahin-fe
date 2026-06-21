'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { gradeService, semesterService, classroomService, schoolService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'

const PREDICATE_CLASS: Record<string, string> = {
  A: 'text-green-700 font-bold',
  B: 'text-blue-700 font-semibold',
  C: 'text-yellow-700 font-semibold',
  D: 'text-red-600 font-semibold',
}

export default function RekapNilaiPage() {
  const schoolId = useSchoolId()
  const [semesterId, setSemesterId] = useState('')
  const [classroomId, setClassroomId] = useState('')

  const { data: school }     = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: semesters  = [] } = useQuery({ queryKey: ['semesters',  'all'], queryFn: () => fetchAllPages(semesterService)  })
  const { data: classrooms = [] } = useQuery({ queryKey: ['classrooms', 'all'], queryFn: () => fetchAllPages(classroomService) })

  const allSelected = !!(semesterId && classroomId)

  const { data: rekap, isLoading, error } = useQuery({
    queryKey: ['grades-rekap', semesterId, classroomId],
    queryFn: () => gradeService.getRekapByClassroom(Number(semesterId), Number(classroomId)),
    enabled: allSelected,
  })

  const { students = [], subjects = [], grades = {} } = rekap ?? {}

  // Rata-rata nilai akhir per siswa (across subjects)
  const studentAvg = useMemo(() =>
    Object.fromEntries(
      students.map(s => {
        const vals = subjects.map(sub => grades[s.id]?.[sub.id]?.final_grade).filter((v): v is number => v !== null && v !== undefined)
        const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null
        return [s.id, avg]
      })
    )
  , [students, subjects, grades])

  // Rata-rata per mapel
  const subjectAvg = useMemo(() =>
    Object.fromEntries(
      subjects.map(sub => {
        const vals = students.map(s => grades[s.id]?.[sub.id]?.final_grade).filter((v): v is number => v !== null && v !== undefined)
        const avg = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100 : null
        return [sub.id, avg]
      })
    )
  , [students, subjects, grades])

  const semesterLabel = semesters.find(s => String(s.id) === semesterId)?.name
  const classroomLabel = classrooms.find(c => String(c.id) === classroomId)?.name
  const subtitle = [classroomLabel, semesterLabel].filter(Boolean).join(' · ')

  return (
    <>
      <Header title="Rekap Nilai Siswa" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper title="Rekap Nilai Siswa" subtitle={subtitle || undefined} schoolName={school?.name}>

          {/* Filters */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Semester <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={semesterId}
                onChange={v => { setSemesterId(v); setClassroomId('') }}
                isClearable={false}
                placeholder="Pilih semester..."
                options={semesters.map(s => ({ value: s.id, label: s.name + (s.active ? ' (Aktif)' : '') }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kelas <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={classroomId}
                onChange={setClassroomId}
                isClearable={false}
                placeholder="Pilih kelas..."
                disabled={!semesterId}
                options={classrooms.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div className="flex flex-col justify-end">
              <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-green-600 font-medium">{students.length} siswa</p>
                <p className="text-xs text-green-500">{subjects.length} mata pelajaran</p>
              </div>
            </div>
          </div>

          {!allSelected ? (
            <p className="text-sm text-gray-400 py-10 text-center">Pilih semester dan kelas untuk menampilkan rekap nilai.</p>
          ) : isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : error ? (
            <p className="text-sm text-red-500 py-10 text-center">Gagal memuat data.</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Tidak ada siswa aktif di kelas ini pada semester tersebut.</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Belum ada nilai yang diinput untuk kelas dan semester ini.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8 border-r border-gray-100">#</th>
                      <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-100 min-w-[160px]">Nama Siswa</th>
                      {subjects.map(sub => (
                        <th key={sub.id} className="text-center px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-gray-100 min-w-[80px]">
                          <span className="block">{sub.code}</span>
                          <span className="block text-gray-400 font-normal normal-case text-[10px] mt-0.5 max-w-[80px] truncate">{sub.name}</span>
                        </th>
                      ))}
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[72px] bg-blue-50">
                        Rata-rata
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student, idx) => {
                      const avg = studentAvg[student.id]
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2.5 text-gray-400 text-xs border-r border-gray-100">{idx + 1}</td>
                          <td className="px-3 py-2.5 border-r border-gray-100">
                            <p className="font-medium text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-400">{student.nis}</p>
                          </td>
                          {subjects.map(sub => {
                            const g = grades[student.id]?.[sub.id]
                            return (
                              <td key={sub.id} className="px-2 py-2.5 text-center border-r border-gray-100">
                                {g?.final_grade !== null && g?.final_grade !== undefined ? (
                                  <>
                                    <span className="block text-sm font-semibold text-gray-700">{g.final_grade}</span>
                                    {g.predicate && (
                                      <span className={`block text-[10px] ${PREDICATE_CLASS[g.predicate] ?? 'text-gray-500'}`}>
                                        {g.predicate}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-300 text-xs">—</span>
                                )}
                              </td>
                            )
                          })}
                          <td className="px-3 py-2.5 text-center bg-blue-50">
                            {avg !== null ? (
                              <>
                                <span className="block text-sm font-bold text-blue-700">{avg}</span>
                                <span className={`block text-[10px] ${PREDICATE_CLASS[avg >= 85 ? 'A' : avg >= 70 ? 'B' : avg >= 55 ? 'C' : 'D']}`}>
                                  {avg >= 85 ? 'A' : avg >= 70 ? 'B' : avg >= 55 ? 'C' : 'D'}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Rata-rata per mapel */}
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={2} className="px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase border-r border-gray-100">
                        Rata-rata Kelas
                      </td>
                      {subjects.map(sub => {
                        const avg = subjectAvg[sub.id]
                        return (
                          <td key={sub.id} className="px-2 py-2.5 text-center border-r border-gray-100">
                            {avg !== null ? (
                              <span className="text-sm font-bold text-gray-700">{avg}</span>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2.5 text-center bg-blue-50" />
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
                Predikat: A ≥ 85 · B ≥ 70 · C ≥ 55 · D &lt; 55 · Nilai akhir: 30% Tugas + 30% UTS + 40% UAS
              </div>
            </div>
          )}
        </ReportWrapper>
      </main>
    </>
  )
}
