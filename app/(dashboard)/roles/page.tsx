'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { roleService } from '@/lib/services'
import { getStoredUser } from '@/lib/auth'
import type { Role, Permission } from '@/types'
import { Plus, Pencil, Trash2, Search, RefreshCw, AlertCircle, Shield, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

export default function RolesPage() {
  const { can } = usePermissions()
  const canCreate = can('create-roles')
  const canEdit = can('edit-roles')
  const canDelete = can('delete-roles')

  const isSuperAdmin = getStoredUser()?.role === 'super-admin'
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)
  const [viewPermTarget, setViewPermTarget] = useState<Role | null>(null)

  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['roles', page],
    queryFn: () => roleService.getAll(page),
  })
  const roles = result?.data ?? []
  const meta = result?.meta

  const deleteMutation = useMutation({
    mutationFn: roleService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['roles'] }); setDeleteTarget(null) },
  })

  const filtered = roles.filter((r) => {
    if (!isSuperAdmin && r.name === 'super-admin') return false
    if (!search) return true
    return r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <Header title="Roles" />
      <main className="flex-1 p-3 sm:p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari role..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => refetch()}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            {canCreate && (
              <button
                onClick={() => router.push('/roles/new')}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus size={16} />
                Tambah
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <RefreshCw size={20} className="animate-spin mr-2" />
              Memuat data...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
              <AlertCircle size={24} />
              <span className="text-sm">Gagal memuat data. Pastikan server API berjalan.</span>
              <button onClick={() => refetch()} className="text-blue-600 text-xs underline">Coba lagi</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
              <span className="text-sm">{search ? 'Tidak ada hasil pencarian' : 'Belum ada data'}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-[50px]">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deskripsi</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Permissions</th>
                    {(canEdit || canDelete) && <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((role, idx) => (
                    <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {(meta ? (meta.current_page - 1) * meta.per_page : 0) + idx + 1}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{role.name}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{role.description || <span className="text-gray-300">-</span>}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setViewPermTarget(role)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                        >
                          <Eye size={12} />
                          {role.permissions?.length ?? 0} permission
                        </button>
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {canEdit && (
                              <button
                                onClick={() => router.push(`/roles/${role.id}/edit`)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setDeleteTarget(role)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
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
            </div>
          )}
          {meta && (
            <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-xs text-gray-400">
                Total {meta.total} data · Halaman {meta.current_page} dari {meta.last_page}
              </span>
              {meta.last_page > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={meta.current_page === 1}
                    className="p-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 1)
                    .map((p, i, arr) => (
                      <span key={p} className="flex items-center gap-1">
                        {arr[i - 1] && p - arr[i - 1] > 1 && <span className="px-1 text-xs text-gray-400">…</span>}
                        <button onClick={() => setPage(p)}
                          className={`min-w-[32px] h-8 rounded border text-xs font-medium transition-colors ${p === meta.current_page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                          {p}
                        </button>
                      </span>
                    ))}
                  <button onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={meta.current_page === meta.last_page}
                    className="p-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* View Permissions Modal */}
        <Modal
          isOpen={!!viewPermTarget}
          onClose={() => setViewPermTarget(null)}
          title={`Permissions — ${viewPermTarget?.name ?? ''}`}
          size="lg"
        >
          <div className="space-y-3">
            {viewPermTarget?.permissions && viewPermTarget.permissions.length > 0 ? (
              <>
                <p className="text-xs text-gray-400">{viewPermTarget.permissions.length} permission aktif</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                  {viewPermTarget.permissions.map((p: Permission) => (
                    <div
                      key={p.id}
                      className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg"
                    >
                      <Shield size={13} className="text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-blue-800">{p.name}</div>
                        {p.description && <div className="text-xs text-blue-500 mt-0.5">{p.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <Shield size={32} className="opacity-30" />
                <p className="text-sm">Role ini belum memiliki permission</p>
              </div>
            )}
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setViewPermTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirm Modal */}
        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Konfirmasi Hapus" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus role <strong>{deleteTarget?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  )
}
