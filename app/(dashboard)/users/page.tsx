'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { userService } from '@/lib/services'
import { getStoredUser } from '@/lib/auth'
import type { ManagedUser } from '@/types'
import { Plus, Pencil, Trash2, Search, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react'

const ROLE_COLORS: Record<string, string> = {
  'super-admin':   'bg-purple-100 text-purple-700',
  'admin-sekolah': 'bg-blue-100 text-blue-700',
  'guru':          'bg-green-100 text-green-700',
  'orang-tua':     'bg-amber-100 text-amber-700',
  'siswa':         'bg-gray-100 text-gray-600',
}

export default function UsersPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const currentUser = getStoredUser()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null)

  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['users', page],
    queryFn: () => userService.getAll(page),
  })
  const users = result?.data ?? []
  const meta = result?.meta

  const deleteMutation = useMutation({
    mutationFn: userService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setDeleteTarget(null) },
  })

  const filtered = users.filter((u) => {
    if (!search) return true
    return u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.role ?? '').toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <Header title="Pengguna" />
      <main className="flex-1 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama, email, atau role..."
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
            <button
              onClick={() => router.push('/users/new')}
              className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={16} />
              Tambah
            </button>
          </div>
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
              <UserCircle size={32} className="opacity-30" />
              <span className="text-sm">{search ? 'Tidak ada hasil pencarian' : 'Belum ada pengguna'}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Role</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((user, idx) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {(meta ? (meta.current_page - 1) * meta.per_page : 0) + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-blue-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-700">{user.name}</span>
                          {currentUser?.id === user.id && (
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">(kamu)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        {user.role ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                            {user.role}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => router.push(`/users/${user.id}/edit`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => currentUser?.id !== user.id && setDeleteTarget(user)}
                            disabled={currentUser?.id === user.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={currentUser?.id === user.id ? 'Tidak dapat menghapus akun sendiri' : 'Hapus'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
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

        <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Konfirmasi Hapus" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Apakah Anda yakin ingin menghapus pengguna <strong>{deleteTarget?.name}</strong>?
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
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
