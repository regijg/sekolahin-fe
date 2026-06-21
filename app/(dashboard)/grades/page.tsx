'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { gradeService, semesterService, classroomService, subjectService, fetchAllPages } from '@/lib/services'
import type { StudentGradeRow } from '@/lib/services'
import { usePermissions } from '@/hooks/usePermissions'
import { Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

function calcFinal(assignment: number | null, mid: number | null, final: number | null) {
  if (assignment === null && mid === null && final === null) return { grade: null, predicate: null }
  const a = assignment ?? 0
  const m = mid ?? 0
  const f = final ?? 0
  const grade = Math.round((a * 0.3 + m * 0.3 + f * 0.4) * 100) / 100
  const predicate = grade >= 85 ? 'A' : grade >= 70 ? 'B' : grade >= 55 ? 'C' : 'D'
  return { grade, predicate }
}

const SCORE_FIELDS = [
  { key: 'assignment_score' as const, label: 'Tugas', weight: '30%' },
  { key: 'mid_exam_score'   as const, label: 'UTS',   weight: '30%' },
  { key: 'final_exam_score' as const, label: 'UAS',   weight: '40%' },
]

export default function GradesPage() {
  const { can } = usePermissions()
  const canEdit = can('edit-grades')

  const [semesterId, setSemesterId]   = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [subjectId, setSubjectId]     = useState('')
  const [rows, setRows]               = useState<StudentGradeRow[]>([])
  const [saved, setSaved]             = useState(false)

  const { data: semesters  = [] } = useQuery({ queryKey: ['semesters',  'all'], queryFn: () => fetchAllPages(semesterService)  })
  const { data: classrooms = [] } = useQuery({ queryKey: ['classrooms', 'all'], queryFn: () => fetchAllPages(classroomService) })
  const { data: subjects   = [] } = useQuery({ queryKey: ['subjects',   'all'], queryFn: () => fetchAllPages(subjectService)   })

  const allSelected = !!(semesterId && classroomId && subjectId)

  const { data: fetched, isLoading, error } = useQuery({
    queryKey: ['grades', semesterId, classroomId, subjectId],
    queryFn: () => gradeService.getByContext(Number(semesterId), Number(classroomId), Number(subjectId)),
    enabled: allSelected,
  })

  useEffect(() => { if (fetched) setRows(fetched) }, [fetched])

  const updateRow = (
    studentId: number,
    field: 'assignment_score' | 'mid_exam_score' | 'final_exam_score',
    val: string,
  ) => {
    setRows(prev => prev.map(r => {
      if (r.student_id !== studentId) return r
      const num = val === '' ? null : Math.min(100, Math.max(0, Number(val)))
      const updated = { ...r, [field]: num }
      const { grade, predicate } = calcFinal(
        updated.assignment_score,
        updated.mid_exam_score,
        updated.final_exam_score,
      )
      return { ...updated, final_grade: grade, predicate }
    }))
    setSaved(false)
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      gradeService.upsertBulk(
        rows.map(r => ({
          student_id:       r.student_id,
          subject_id:       Number(subjectId),
          semester_id:      Number(semesterId),
          assignment_score: r.assignment_score,
          mid_exam_score:   r.mid_exam_score,
          final_exam_score: r.final_exam_score,
          final_grade:      r.final_grade,
          predicate:        r.predicate,
        })),
      ),
    onSuccess: () => { setSaved(true) },
  })

  const semesterLabel = semesters.find(s => String(s.id) === semesterId)?.name
  const classroomLabel = classrooms.find(c => String(c.id) === classroomId)?.name
  const subjectLabel = subjects.find(s => String(s.id) === subjectId)?.name

  return (
    <>
      <Header title="Nilai Siswa" />
      <main className="flex-1 p-3 sm:p-6">

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Semester</label>
            <SearchableSelect
              value={semesterId}
              onChange={v => { setSemesterId(v); setClassroomId(''); setSubjectId(''); setRows([]) }}
              isClearable={false}
              placeholder="Pilih semester..."
              options={semesters.map(s => ({ value: s.id, label: s.name + (s.active ? ' (Aktif)' : '') }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label>
            <SearchableSelect
              value={classroomId}
              onChange={setClassroomId}
              isClearable={false}
              placeholder="Pilih kelas..."
              disabled={!semesterId}
              options={classrooms.map(c => ({ value: c.id, label: c.name }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Mata Pelajaran</label>
            <SearchableSelect
              value={subjectId}
              onChange={setSubjectId}
              isClearable={false}
              placeholder="Pilih mata pelajaran..."
              disabled={!semesterId}
              options={subjects.map(s => ({ value: s.id, label: `${s.code} – ${s.name}` }))}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!allSelected ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              Pilih semester, kelas, dan mata pelajaran untuk menampilkan data.
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Memuat data...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
              <AlertCircle size={24} />
              <span className="text-sm">Gagal memuat data.</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              Tidak ada siswa aktif di kelas ini pada semester tersebut.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">NIS</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                      {SCORE_FIELDS.map(f => (
                        <th key={f.key} className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                          {f.label}
                          <span className="ml-1 text-gray-300 font-normal normal-case">{f.weight}</span>
                        </th>
                      ))}
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Nilai Akhir</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row, idx) => (
                      <tr key={row.student_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-2 text-gray-500 font-mono text-xs">{row.student_nis}</td>
                        <td className="px-4 py-2 text-gray-700 font-medium">{row.student_name}</td>
                        {SCORE_FIELDS.map(f => (
                          <td key={f.key} className="px-2 py-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              value={row[f.key] ?? ''}
                              onChange={e => updateRow(row.student_id, f.key, e.target.value)}
                              disabled={!canEdit}
                              placeholder="—"
                              className="w-full text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-300"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-2 text-center text-sm font-semibold text-gray-700">
                          {row.final_grade !== null ? row.final_grade : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {row.predicate ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              row.predicate === 'A' ? 'bg-green-100 text-green-700' :
                              row.predicate === 'B' ? 'bg-blue-100 text-blue-700' :
                              row.predicate === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                                      'bg-red-100 text-red-700'
                            }`}>
                              {row.predicate}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs text-gray-400">
                  {rows.length} siswa · {subjectLabel} · {semesterLabel} · {classroomLabel}
                  <span className="ml-2 text-gray-300">· Nilai akhir: 30% Tugas + 30% UTS + 40% UAS</span>
                </span>
                {canEdit && (
                  <button
                    onClick={() => { setSaved(false); saveMutation.mutate() }}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors shrink-0"
                  >
                    {saved ? (
                      <><CheckCircle2 size={14} /> Tersimpan</>
                    ) : saveMutation.isPending ? (
                      <><RefreshCw size={14} className="animate-spin" /> Menyimpan...</>
                    ) : (
                      <><Save size={14} /> Simpan Nilai</>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
