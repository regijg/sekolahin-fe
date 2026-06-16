'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import { roleService, permissionService } from '@/lib/services'
import { getStoredUser } from '@/lib/auth'
import type { Permission, Role } from '@/types'
import { ArrowLeft, RefreshCw, Save, Shield } from 'lucide-react'

interface RoleFormData {
  name: string
  description?: string
}

interface Props {
  roleId?: number
}

const MODULE_LABELS: Record<string, string> = {
  'dashboard':             'Dashboard',
  'schools':               'Sekolah',
  'academic-years':        'Tahun Ajaran',
  'semesters':             'Semester',
  'majors':                'Jurusan',
  'classrooms':            'Kelas',
  'subjects':              'Mata Pelajaran',
  'teachers':              'Guru',
  'parent-guardians':      'Orang Tua / Wali',
  'students':              'Siswa',
  'schedules':             'Jadwal',
  'student-attendances':   'Absensi Siswa',
  'teacher-attendances':   'Absensi Guru',
  'ppdb-applications':     'Pendaftaran (PPDB)',
  'announcements':         'Pengumuman',
  'letters':               'Surat Keterangan',
  'payment-types':         'Jenis Pembayaran',
  'invoices':              'Tagihan',
  'payments':              'Pembayaran',
  'inventory-items':       'Barang Inventaris',
  'inventory-mutations':   'Mutasi Inventaris',
  'canteen-accounts':      'Akun Kantin',
  'canteen-transactions':  'Transaksi Kantin',
  'users':                 'Pengguna',
  'roles':                 'Roles',
  'permissions':           'Permissions',
}

const ACTION_LABELS: Record<string, string> = {
  view: 'Lihat',
  create: 'Tambah',
  edit: 'Edit',
  delete: 'Hapus',
}

const ACTION_ORDER = ['view', 'create', 'edit', 'delete']

const ACTION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  view:   { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
  create: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400'  },
  edit:   { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  delete: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400'    },
}

function extractAction(name: string): string {
  for (const a of ACTION_ORDER) {
    if (name.startsWith(`${a}-`)) return a
  }
  return ''
}

function extractModule(name: string): string {
  for (const a of ACTION_ORDER) {
    if (name.startsWith(`${a}-`)) return name.slice(a.length + 1)
  }
  return name
}

type PermissionWithAction = Permission & { action: string }
type PermissionGroup = { module: string; label: string; items: PermissionWithAction[] }

function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const map = new Map<string, PermissionGroup>()
  for (const p of permissions) {
    const action = extractAction(p.name)
    const module = extractModule(p.name)
    if (!map.has(module)) {
      const rawLabel = MODULE_LABELS[module] ?? module.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      map.set(module, { module, label: rawLabel, items: [] })
    }
    map.get(module)!.items.push({ ...p, action })
  }
  for (const group of map.values()) {
    group.items.sort((a, b) => {
      const ai = ACTION_ORDER.indexOf(a.action)
      const bi = ACTION_ORDER.indexOf(b.action)
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
  }
  const moduleOrder = Object.keys(MODULE_LABELS)
  return Array.from(map.values()).sort((a, b) => {
    const ai = moduleOrder.indexOf(a.module)
    const bi = moduleOrder.indexOf(b.module)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function RoleFormPage({ roleId }: Props) {
  const isEdit = !!roleId
  const isSuperAdmin = getStoredUser()?.role === 'super-admin'
  const router = useRouter()
  const qc = useQueryClient()

  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [formError, setFormError] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<RoleFormData>()

  const { data: existingRole, isLoading: loadingRole } = useQuery<Role>({
    queryKey: ['roles', roleId],
    queryFn: () => roleService.getById(roleId!),
    enabled: isEdit,
  })

  const { data: allPermissions = [], isLoading: loadingPerms } = useQuery<Permission[]>({
    queryKey: ['permissions', 'all'],
    queryFn: () => permissionService.getAllFlat(),
  })

  useEffect(() => {
    if (existingRole) {
      reset({ name: existingRole.name, description: existingRole.description ?? '' })
      setSelectedPermissions(
        existingRole.permission_ids ?? existingRole.permissions?.map((p) => p.id) ?? []
      )
    }
  }, [existingRole, reset])

  const saveMutation = useMutation({
    mutationFn: (data: RoleFormData & { permission_ids: number[] }) =>
      isEdit
        ? roleService.update(roleId!, data)
        : roleService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); router.push('/roles') },
    onError: (e: unknown) => {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan data')
    },
  })

  const visiblePermissions = allPermissions.filter(
    (p) => isSuperAdmin || !p.name.endsWith('-schools')
  )
  const groups = groupPermissions(visiblePermissions)

  const togglePermission = (id: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleGroup = (items: PermissionWithAction[]) => {
    const ids = items.map((i) => i.id)
    const allSelected = ids.every((id) => selectedPermissions.includes(id))
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...ids])])
    }
  }

  const onSubmit = (formData: RoleFormData) => {
    setFormError('')
    saveMutation.mutate({ ...formData, permission_ids: selectedPermissions })
  }

  const isPending = isSubmitting || saveMutation.isPending

  if (isEdit && loadingRole) {
    return (
      <>
        <Header title={isEdit ? 'Edit Role' : 'Tambah Role'} />
        <main className="flex-1 p-6 flex items-center justify-center text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Memuat data...
        </main>
      </>
    )
  }

  return (
    <>
      <Header title={isEdit ? `Edit Role — ${existingRole?.name ?? ''}` : 'Tambah Role'} />
      <main className="flex-1 p-3 sm:p-6 max-w-5xl">
        <button
          onClick={() => router.push('/roles')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke daftar role
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {formError}
            </div>
          )}

          {/* Info dasar */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Informasi Role</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Role <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name', { required: 'Nama role wajib diisi' })}
                  type="text"
                  placeholder="contoh: Admin, Guru, Siswa"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <input
                  {...register('description')}
                  type="text"
                  placeholder="Deskripsi singkat (opsional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-700">Permissions</h2>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {selectedPermissions.length} / {visiblePermissions.length} dipilih
              </span>
            </div>

            {loadingPerms ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                <RefreshCw size={16} className="animate-spin" /> Memuat permissions...
              </div>
            ) : groups.length === 0 ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                Belum ada permission tersedia.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {groups.map((group) => {
                  const groupSelected = group.items.every((i) => selectedPermissions.includes(i.id))
                  const groupPartial = !groupSelected && group.items.some((i) => selectedPermissions.includes(i.id))

                  return (
                    <div key={group.module} className="px-5 py-4">
                      {/* Group header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{group.label}</span>
                          {groupPartial && (
                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                              sebagian
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.items)}
                          className={`text-xs px-3 py-1 rounded-lg border transition-colors font-medium ${
                            groupSelected
                              ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                              : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {groupSelected ? 'Hapus semua' : 'Pilih semua'}
                        </button>
                      </div>

                      {/* Permission items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {group.items.map((p) => {
                          const isOn = selectedPermissions.includes(p.id)
                          const color = ACTION_COLORS[p.action] ?? ACTION_COLORS['view']
                          const actionLabel = ACTION_LABELS[p.action] ?? p.action

                          return (
                            <div
                              key={p.id}
                              onClick={() => togglePermission(p.id)}
                              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                                isOn
                                  ? `${color.bg} border-current border-opacity-30`
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`h-2 w-2 rounded-full shrink-0 ${isOn ? color.dot : 'bg-gray-300'}`} />
                                <span className={`text-sm font-medium truncate ${isOn ? color.text : 'text-gray-500'}`}>
                                  {actionLabel}
                                </span>
                              </div>
                              <Toggle checked={isOn} onChange={() => togglePermission(p.id)} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={() => router.push('/roles')}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              <Save size={15} />
              {isPending ? 'Menyimpan...' : isEdit ? 'Perbarui Role' : 'Simpan Role'}
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
