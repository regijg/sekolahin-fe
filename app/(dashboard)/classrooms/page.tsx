'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { classroomService, teacherService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { Classroom } from '@/types'
import { Plus, Pencil, Trash2, RefreshCw, AlertCircle, School } from 'lucide-react'

const GRADE_OPTIONS = [
  'SMP VII', 'SMP VIII', 'SMP IX',
  'SMA X',   'SMA XI',   'SMA XII',
]

interface ClassroomForm {
  name: string
  grade: string
  homeroom_teacher_id?: number
}

export default function ClassroomsPage() {
  const schoolId = useSchoolId()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Classroom | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Classroom | null>(null)
  const [formError, setFormError] = useState('')

  const { data: allClassrooms = [], isLoading, error, refetch } = useQuery<Classroom[]>({
    queryKey: ['classrooms', 'all'],
    queryFn: () => fetchAllPages(classroomService),
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', 'all'],
    queryFn: () => fetchAllPages(teacherService),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClassroomForm>()

  const grouped = useMemo(() => {
    const map = new Map<string, Classroom[]>()
    allClassrooms.forEach(c => {
      const key = c.grade ?? ''
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(c)
    })
    return Array.from(map.entries())
      .sort((a, b) => GRADE_OPTIONS.indexOf(a[0]) - GRADE_OPTIONS.indexOf(b[0]))
      .filter(([, items]) => items.length > 0)
  }, [allClassrooms])

  const invalidate = () => qc.invalidateQueries({ queryKey: ['classrooms'] })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => classroomService.create(data),
    onSuccess: () => { invalidate(); closeModal() },
    onError: (e: unknown) => setFormError(e instanceof Error ? e.message : 'Gagal menyimpan data'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => classroomService.update(id, data),
    onSuccess: () => { invalidate(); closeModal() },
    onError: (e: unknown) => setFormError(e instanceof Error ? e.message : 'Gagal menyimpan data'),
  })

  const deleteMutation = useMutation({
    mutationFn: classroomService.delete,
    onSuccess: () => { invalidate(); setDeleteTarget(null) },
  })

  const openCreate = () => {
    setEditItem(null)
    reset({ grade: 'SMP VII' })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (item: Classroom) => {
    setEditItem(item)
    reset({
      name: item.name,
      grade: item.grade ?? '',
      homeroom_teacher_id: item.homeroom_teacher_id ?? undefined,
    })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditItem(null); setFormError('') }

  const onSubmit = (data: ClassroomForm) => {
    setFormError('')
    const payload: Record<string, unknown> = {
      name: data.name,
      grade: data.grade,
      homeroom_teacher_id: data.homeroom_teacher_id ? Number(data.homeroom_teacher_id) : null,
    }
    if (schoolId) payload.school_id = schoolId
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <>
      <Header title="Kelas" />
      <main className="flex-1 p-3 sm:p-6">
        <div className="flex items-center justify-end gap-2 mb-6">
          <button onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus size={16} /> Tambah
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" /> Memuat data...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
              <AlertCircle size={24} />
              <span className="text-sm">Gagal memuat data.</span>
              <button onClick={() => refetch()} className="text-blue-600 text-xs underline">Coba lagi</button>
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
              <School size={32} className="opacity-30" />
              <span className="text-sm">Belum ada data kelas</span>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {grouped.map(([key, items]) => {
                const label = key
                return (
                  <div key={key}>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
                      <span className="text-xs text-gray-400">· {items.length} kelas</span>
                    </div>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-50">
                        {items.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-400 text-xs w-10">{idx + 1}</td>
                            <td className="px-4 py-3 text-gray-700 font-medium">{item.name}</td>
                            <td className="px-4 py-3 text-gray-500 text-sm">
                              {item.homeroom_teacher_id
                                ? teachers.find(t => t.id === item.homeroom_teacher_id)?.name ?? '-'
                                : <span className="text-gray-300">Belum ada wali kelas</span>}
                            </td>
                            <td className="px-4 py-3 w-20">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => openEdit(item)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => setDeleteTarget(item)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        <Modal isOpen={modalOpen} onClose={closeModal}
          title={editItem ? `Edit Kelas — ${editItem.name}` : 'Tambah Kelas'} size="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{formError}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tingkat <span className="text-red-500">*</span>
              </label>
              <select
                {...register('grade', { required: 'Tingkat wajib dipilih' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="SMP">
                  <option value="SMP VII">VII</option>
                  <option value="SMP VIII">VIII</option>
                  <option value="SMP IX">IX</option>
                </optgroup>
                <optgroup label="SMA">
                  <option value="SMA X">X</option>
                  <option value="SMA XI">XI</option>
                  <option value="SMA XII">XII</option>
                </optgroup>
              </select>
              {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kelas <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: 'Nama kelas wajib diisi' })}
                type="text"
                placeholder="XII TKJ 1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wali Kelas</label>
              <select
                {...register('homeroom_teacher_id')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Belum ditentukan --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={closeModal}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button type="submit" disabled={isPending}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50">
                {isPending ? 'Menyimpan...' : editItem ? 'Perbarui' : 'Simpan'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Modal */}
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Konfirmasi Hapus" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Hapus kelas <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50">
                {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  )
}
