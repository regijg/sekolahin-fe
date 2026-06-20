'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { enrollmentService, academicYearService, studentService, classroomService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { usePermissions } from '@/hooks/usePermissions'
import type { Enrollment, AcademicYear } from '@/types'
import { Plus, Pencil, Trash2, RefreshCw, AlertCircle, ArrowUpCircle } from 'lucide-react'

// Parse "Kelas 7A" / "7A" / "7 A" → { grade: 7, letter: 'A' }
function parseClassroom(name: string): { grade: number | null; letter: string } {
  const m = name.match(/(\d+)\s*([A-Za-z])\b/)
  if (!m) return { grade: null, letter: '' }
  return { grade: Number(m[1]), letter: m[2].toUpperCase() }
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'graduated', label: 'Lulus' },
  { value: 'transferred', label: 'Pindah' },
  { value: 'dropped', label: 'Keluar' },
]

export default function EnrollmentsPage() {
  const { can } = usePermissions()
  const canCreate = can('create-enrollments')
  const canEdit = can('edit-enrollments')
  const canDelete = can('delete-enrollments')

  const schoolId = useSchoolId()
  const qc = useQueryClient()

  const [selectedYearId, setSelectedYearId] = useState('')
  const [filterClassroom, setFilterClassroom] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Enrollment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null)
  const [promoteOpen, setPromoteOpen] = useState(false)
  const [formError, setFormError] = useState('')

  // Form state
  const [formStudentId, setFormStudentId] = useState('')
  const [formClassroomId, setFormClassroomId] = useState('')
  const [formAcademicYearId, setFormAcademicYearId] = useState('')
  const [formStatus, setFormStatus] = useState('active')

  // Promote state
  const [promoteYearId, setPromoteYearId] = useState('')
  const [promoteClassroomMap, setPromoteClassroomMap] = useState<Record<number, string>>({})

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years', 'all'],
    queryFn: () => fetchAllPages(academicYearService),
  })
  const { data: classrooms = [] } = useQuery({
    queryKey: ['classrooms', 'all'],
    queryFn: () => fetchAllPages(classroomService),
  })
  const { data: students = [] } = useQuery({
    queryKey: ['students', 'all'],
    queryFn: () => fetchAllPages(studentService),
  })

  const activeYear = academicYears.find(y => y.active)
  const effectiveYearId = selectedYearId || String(activeYear?.id ?? '')

  const { data: enrollments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['enrollments', effectiveYearId],
    queryFn: () => effectiveYearId ? enrollmentService.getByAcademicYear(Number(effectiveYearId)) : Promise.resolve([]),
    enabled: !!effectiveYearId,
  })

  const filtered = useMemo(() =>
    enrollments.filter(e => !filterClassroom || String(e.classroom_id) === filterClassroom)
  , [enrollments, filterClassroom])

  const invalidate = () => qc.invalidateQueries({ queryKey: ['enrollments'] })

  const enrolledStudentIds = useMemo(
    () => new Set(enrollments.map(e => e.student_id)),
    [enrollments]
  )

  const createMutation = useMutation({
    mutationFn: enrollmentService.create,
    onSuccess: () => { invalidate(); closeModal() },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('already exists')) {
        setFormError('Siswa ini sudah terdaftar di tahun ajaran tersebut.')
      } else {
        setFormError(msg || 'Gagal menyimpan')
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => enrollmentService.update(id, data),
    onSuccess: () => { invalidate(); closeModal() },
    onError: (e: unknown) => setFormError(e instanceof Error ? e.message : 'Gagal memperbarui'),
  })

  const deleteMutation = useMutation({
    mutationFn: enrollmentService.delete,
    onSuccess: () => { invalidate(); setDeleteTarget(null) },
  })

  const promoteMutation = useMutation({
    mutationFn: enrollmentService.promote,
    onSuccess: () => { invalidate(); setPromoteOpen(false); setPromoteClassroomMap({}) },
    onError: (e: unknown) => setFormError(e instanceof Error ? e.message : 'Gagal naik kelas'),
  })

  const openCreate = () => {
    setEditItem(null)
    setFormStudentId(''); setFormClassroomId(''); setFormStatus('active')
    setFormAcademicYearId(effectiveYearId)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (item: Enrollment) => {
    setEditItem(item)
    setFormStudentId(String(item.student_id))
    setFormClassroomId(String(item.classroom_id))
    setFormAcademicYearId(String(item.academic_year_id))
    setFormStatus(item.status)
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditItem(null); setFormError('') }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formStudentId || !formClassroomId || !formAcademicYearId) {
      setFormError('Siswa, kelas, dan tahun ajaran wajib dipilih')
      return
    }
    const data = {
      school_id: schoolId,
      student_id: Number(formStudentId),
      classroom_id: Number(formClassroomId),
      academic_year_id: Number(formAcademicYearId),
      status: formStatus,
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: { classroom_id: data.classroom_id, status: data.status } })
    } else {
      createMutation.mutate(data)
    }
  }

  const activeEnrollments = useMemo(
    () => enrollments.filter(e => e.status === 'active'),
    [enrollments]
  )

  // Classrooms with no next-grade class in the system (e.g. kelas 9 di SMP)
  const terminalClassroomIds = useMemo(() => {
    return new Set(
      classrooms
        .filter(c => {
          const { grade } = parseClassroom(c.name)
          if (grade === null) return false
          return !classrooms.some(other => parseClassroom(other.name).grade === grade + 1)
        })
        .map(c => c.id)
    )
  }, [classrooms])

  const sourceClassrooms = useMemo(() => {
    const seen = new Set<number>()
    return activeEnrollments.reduce<Array<{ id: number; name: string; count: number }>>((acc, e) => {
      if (!seen.has(e.classroom_id)) {
        seen.add(e.classroom_id)
        acc.push({ id: e.classroom_id, name: e.classroom_name ?? '-', count: 0 })
      }
      acc.find(c => c.id === e.classroom_id)!.count++
      return acc
    }, []).sort((a, b) => a.name.localeCompare(b.name))
  }, [activeEnrollments])

  const openPromote = () => {
    // Auto-fill: kelas asal 7A → kelas tujuan 8A (grade+1, huruf sama)
    const autoMap: Record<number, string> = {}
    sourceClassrooms.forEach(src => {
      const { grade, letter } = parseClassroom(src.name)
      if (grade === null) return
      const match = classrooms.find(c => {
        const p = parseClassroom(c.name)
        return p.grade === grade + 1 && p.letter === letter
      })
      if (match) autoMap[src.id] = String(match.id)
    })
    setPromoteClassroomMap(autoMap)
    setPromoteYearId('')
    setFormError('')
    setPromoteOpen(true)
  }

  const onPromote = () => {
    if (!promoteYearId || !schoolId) { setFormError('Pilih tahun ajaran tujuan'); return }
    const assignments = activeEnrollments
      .filter(e => !!promoteClassroomMap[e.classroom_id])
      .map(e => ({ student_id: e.student_id, new_classroom_id: Number(promoteClassroomMap[e.classroom_id]) }))
    const graduates = activeEnrollments
      .filter(e => terminalClassroomIds.has(e.classroom_id))
      .map(e => ({ student_id: e.student_id, classroom_id: e.classroom_id }))
    if (assignments.length === 0 && graduates.length === 0) {
      setFormError('Tentukan minimal satu kelas tujuan'); return
    }
    promoteMutation.mutate({ school_id: schoolId!, to_academic_year_id: Number(promoteYearId), assignments, graduates })
  }

  const currentYearName = academicYears.find(y => String(y.id) === effectiveYearId)?.name

  return (
    <>
      <Header title="Pendaftaran Kelas" />
      <main className="flex-1 p-3 sm:p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-52">
              <SearchableSelect
                value={effectiveYearId}
                onChange={setSelectedYearId}
                isClearable={false}
                placeholder="Pilih Tahun Ajaran"
                options={academicYears.map(y => ({ value: y.id, label: y.name + (y.active ? ' (Aktif)' : '') }))}
              />
            </div>
            <div className="w-full sm:w-44">
              <SearchableSelect
                value={filterClassroom}
                onChange={setFilterClassroom}
                placeholder="Semua Kelas"
                options={classrooms.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => refetch()}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            {canCreate && (
              <button onClick={openPromote} disabled={!effectiveYearId || enrollments.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-40">
                <ArrowUpCircle size={16} /> Naik Kelas
              </button>
            )}
            {canCreate && (
              <button onClick={openCreate} disabled={!effectiveYearId}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-40">
                <Plus size={16} /> Daftarkan
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!effectiveYearId ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">Pilih tahun ajaran untuk melihat data.</div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Memuat data...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
              <AlertCircle size={24} /><span className="text-sm">Gagal memuat data.</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              {enrollments.length === 0 ? 'Belum ada siswa yang terdaftar di tahun ajaran ini.' : 'Tidak ada hasil filter.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[50px]">#</th>
                    {['NIS', 'Nama Siswa', 'Kelas', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                    {(canEdit || canDelete) && (
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.student_nis ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{item.student_name ?? '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.classroom_name ?? '-'}</td>
                      <td className="px-4 py-3"><Badge value={item.status} /></td>
                      {(canEdit || canDelete) && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {canEdit && (
                              <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <Pencil size={14} />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => setDeleteTarget(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
                {filtered.length} siswa terdaftar{currentYearName ? ` · ${currentYearName}` : ''}
              </div>
            </div>
          )}
        </div>

        {/* Enroll / Edit Modal */}
        <Modal isOpen={modalOpen} onClose={closeModal} title={editItem ? 'Edit Pendaftaran' : 'Daftarkan Siswa'} size="sm">
          <form onSubmit={onSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{formError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={formAcademicYearId}
                onChange={setFormAcademicYearId}
                isClearable={false}
                disabled={!!editItem}
                placeholder="Pilih tahun ajaran..."
                options={academicYears.map(y => ({ value: y.id, label: y.name + (y.active ? ' (Aktif)' : '') }))}
              />
            </div>
            {!editItem && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Siswa <span className="text-red-500">*</span></label>
                <SearchableSelect
                  value={formStudentId}
                  onChange={setFormStudentId}
                  placeholder="Cari siswa..."
                  options={students
                    .filter(s => formAcademicYearId === effectiveYearId ? !enrolledStudentIds.has(s.id) : true)
                    .map(s => ({ value: s.id, label: `${s.name} (${s.nis})` }))}
                />
              </div>
            )}
            {editItem && (
              <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                <span className="font-medium">{editItem.student_name}</span>
                <span className="text-gray-400 ml-1">({editItem.student_nis})</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kelas <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={formClassroomId}
                onChange={setFormClassroomId}
                placeholder="Pilih kelas..."
                options={classrooms.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <SearchableSelect
                value={formStatus}
                onChange={setFormStatus}
                isClearable={false}
                options={STATUS_OPTIONS}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : editItem ? 'Perbarui' : 'Daftarkan'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Naik Kelas Modal */}
        <Modal isOpen={promoteOpen} onClose={() => setPromoteOpen(false)} title="Naik Kelas" size="md">
          <div className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{formError}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Ajaran Tujuan <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={promoteYearId}
                onChange={v => { setPromoteYearId(v); setFormError('') }}
                placeholder="Pilih tahun ajaran baru..."
                options={academicYears
                  .filter(y => String(y.id) !== effectiveYearId)
                  .map(y => ({ value: y.id, label: y.name + (y.active ? ' (Aktif)' : '') }))}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Mapping Kelas
                <span className="ml-2 text-xs font-normal text-gray-400">({sourceClassrooms.length} kelas · {activeEnrollments.length} siswa aktif)</span>
              </p>
              {sourceClassrooms.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center border border-gray-200 rounded-lg">Tidak ada siswa aktif di tahun ajaran ini.</p>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_24px_1fr] items-center bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <span>Kelas Asal</span>
                    <span />
                    <span>Kelas Tujuan</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {sourceClassrooms.map(src => (
                      <div key={src.id} className="grid grid-cols-[1fr_24px_1fr] items-center gap-2 px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{src.name}</p>
                          <p className="text-xs text-gray-400">{src.count} siswa</p>
                        </div>
                        <span className="text-gray-300 text-center">→</span>
                        {terminalClassroomIds.has(src.id) ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <span className="text-xs font-semibold text-green-700">Lulus</span>
                            <span className="text-xs text-green-500">{src.count} siswa akan diluluskan</span>
                          </div>
                        ) : (
                          <SearchableSelect
                            value={promoteClassroomMap[src.id] ?? ''}
                            onChange={v => setPromoteClassroomMap(prev => ({ ...prev, [src.id]: v }))}
                            placeholder="Pilih kelas..."
                            options={(() => {
                              const { grade } = parseClassroom(src.name)
                              const nextGradeOptions = grade !== null
                                ? classrooms.filter(c => parseClassroom(c.name).grade === grade + 1)
                                : classrooms
                              return nextGradeOptions.map(c => ({ value: c.id, label: c.name }))
                            })()}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setPromoteOpen(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={onPromote} disabled={promoteMutation.isPending || !promoteYearId || sourceClassrooms.length === 0}
                className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                {promoteMutation.isPending ? 'Memproses...' : (() => {
                  const naik = activeEnrollments.filter(e => !!promoteClassroomMap[e.classroom_id]).length
                  const lulus = activeEnrollments.filter(e => terminalClassroomIds.has(e.classroom_id)).length
                  const parts = []
                  if (naik > 0) parts.push(`Naik Kelas ${naik}`)
                  if (lulus > 0) parts.push(`Lulus ${lulus}`)
                  return parts.length ? `Proses: ${parts.join(' · ')} Siswa` : 'Proses'
                })()}
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Konfirmasi Hapus" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Hapus pendaftaran <strong>{deleteTarget?.student_name}</strong> dari <strong>{deleteTarget?.classroom_name}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50">
                {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  )
}
