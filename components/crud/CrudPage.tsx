'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import Modal from '@/components/ui/Modal'
import NumberInput from '@/components/ui/NumberInput'
import Badge from '@/components/ui/Badge'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { Plus, Pencil, Trash2, Search, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import type { FieldConfig, PaginatedData } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

interface CrudService<T> {
  getAll: (page?: number) => Promise<PaginatedData<T>>
  create: (data: unknown) => Promise<T>
  update: (id: number, data: unknown) => Promise<T>
  delete: (id: number) => Promise<unknown>
}

interface CrudPageProps<T extends { id: number }> {
  title: string
  queryKey: string
  service: CrudService<T>
  fields: FieldConfig[]
  hiddenValues?: Record<string, unknown>
  filterFn?: (item: T) => boolean
  disableDelete?: boolean
  extraActions?: React.ReactNode
  prefillValues?: Record<string, unknown> | null
  onPrefillConsumed?: () => void
  extraFormContent?: (setValue: (name: string, value: unknown) => void, watchValues: Record<string, unknown>, editItem: unknown) => React.ReactNode
  formBlocked?: boolean
  onCreateSuccess?: (item: unknown) => void | Promise<void>
  onUpdateSuccess?: (item: unknown) => void | Promise<void>
}

function renderCell(value: unknown, field: FieldConfig): React.ReactNode {
  if (field.tableRender) return field.tableRender(value, {})
  if (value === null || value === undefined || value === '') return <span className="text-gray-400">-</span>
  if (field.type === 'boolean') return <Badge value={Boolean(value)} />
  if (field.name.includes('status') || field.name === 'type' || field.name === 'relation' || field.name === 'gender') {
    return <Badge value={String(value)} />
  }
  if (field.name.endsWith('_at') || field.name === 'date' || field.name.includes('_date') || field.name === 'issued_at' || field.name === 'published_at') {
    return formatDate(String(value))
  }
  if (field.name === 'amount' || field.name === 'balance') return formatCurrency(Number(value))
  if (field.type === 'select' && field.options) {
    const opt = field.options.find((o) => String(o.value) === String(value))
    return opt ? opt.label : String(value)
  }
  return String(value)
}

export default function CrudPage<T extends { id: number }>({
  title,
  queryKey,
  service,
  fields,
  hiddenValues = {},
  filterFn,
  disableDelete = false,
  extraActions,
  prefillValues,
  onPrefillConsumed,
  extraFormContent,
  formBlocked = false,
  onCreateSuccess,
  onUpdateSuccess,
}: CrudPageProps<T>) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<T | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [formError, setFormError] = useState('')

  const { data: result, isLoading, error, refetch } = useQuery<PaginatedData<T>>({
    queryKey: [queryKey, page],
    queryFn: () => service.getAll(page),
  })

  const allData = result?.data ?? []
  const meta = result?.meta

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors, isSubmitting } } = useForm()
  const watchAll = watch() as Record<string, unknown>

  const createMutation = useMutation({
    mutationFn: service.create,
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: [queryKey] })
      if (onCreateSuccess) await onCreateSuccess(data)
      closeModal()
    },
    onError: (e: unknown) => {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan data')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => service.update(id, data),
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: [queryKey] })
      if (onUpdateSuccess) await onUpdateSuccess(data)
      closeModal()
    },
    onError: (e: unknown) => {
      setFormError(e instanceof Error ? e.message : 'Gagal memperbarui data')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: service.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: [queryKey] }); setDeleteTarget(null) },
  })

  const visibleFields = fields.filter((f) => f.showInTable !== false && !f.filterOnly)
  const formFields = fields.filter((f) => !f.hidden)

  const filtered = allData
    .filter((item) => (filterFn ? filterFn(item) : true))
    .filter((item) => {
      if (!search) return true
      return Object.values(item as Record<string, unknown>).some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase())
      )
    })

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const openCreate = (overrides?: Record<string, unknown>) => {
    setEditItem(null)
    const fieldDefaults = Object.fromEntries(
      fields.filter((f) => f.defaultValue !== undefined).map((f) => [f.name, f.defaultValue])
    )
    reset({ ...fieldDefaults, ...hiddenValues, ...overrides })
    setFormError('')
    setModalOpen(true)
  }

  useEffect(() => {
    if (!prefillValues) return
    setEditItem(null)
    const fieldDefaults = Object.fromEntries(
      fields.filter((f) => f.defaultValue !== undefined).map((f) => [f.name, f.defaultValue])
    )
    reset({ ...fieldDefaults, ...hiddenValues, ...prefillValues })
    setFormError('')
    setModalOpen(true)
    onPrefillConsumed?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillValues])

  const openEdit = (item: T) => {
    setEditItem(item)
    reset(item as Record<string, unknown>)
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditItem(null)
    setFormError('')
  }

  const onSubmit = async (formData: Record<string, unknown>) => {
    setFormError('')
    const processed = { ...hiddenValues, ...formData }
    fields.filter((f) => f.filterOnly).forEach((f) => delete processed[f.name])
    formFields.forEach((f) => {
      if (f.type === 'number' && processed[f.name] !== undefined && processed[f.name] !== '') {
        processed[f.name] = Number(processed[f.name])
      }
      if (f.type === 'boolean') {
        processed[f.name] = processed[f.name] === true || processed[f.name] === 'true'
      }
      if (f.type === 'time' && typeof processed[f.name] === 'string') {
        const t = processed[f.name] as string
        if (t && t.length === 5) processed[f.name] = t + ':00'
      }
    })
    fields.filter((f) => f.hidden && f.type === 'number').forEach((f) => {
      if (processed[f.name] !== undefined && processed[f.name] !== null) {
        processed[f.name] = Number(processed[f.name])
      }
    })
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data: processed })
    } else {
      createMutation.mutate(processed)
    }
  }

  const pageNumbers = meta
    ? Array.from({ length: meta.last_page }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 1
      )
    : []

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={`Cari ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {extraActions}
          <button
            onClick={() => refetch()}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => openCreate()}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={16} />
            Tambah
          </button>
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
            <span className="text-sm">Gagal memuat data.</span>
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  {visibleFields.map((f) => (
                    <th key={f.name} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {meta ? (meta.current_page - 1) * meta.per_page + idx + 1 : idx + 1}
                    </td>
                    {visibleFields.map((f) => (
                      <td key={f.name} className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                        {renderCell((item as Record<string, unknown>)[f.name], f)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        {!disableDelete && (
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer: info + pagination */}
        {meta && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-gray-400">
              Total {meta.total} data · Halaman {meta.current_page} dari {meta.last_page}
            </span>
            {meta.last_page > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page === 1}
                  className="p-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>

                {pageNumbers.map((p, i) => {
                  const prev = pageNumbers[i - 1]
                  return (
                    <span key={p} className="flex items-center gap-1">
                      {prev && p - prev > 1 && (
                        <span className="px-1 text-xs text-gray-400">…</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`min-w-[32px] h-8 rounded border text-xs font-medium transition-colors ${
                          p === meta.current_page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}

                <button
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={meta.current_page === meta.last_page}
                  className="p-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editItem ? `Edit ${title}` : `Tambah ${title}`}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formFields.map((field) => (
              <div
                key={field.name}
                className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'select' ? (
                  <Controller
                    control={control}
                    name={field.name}
                    rules={{ required: field.required ? `${field.label} wajib diisi` : false }}
                    render={({ field: cf }) => {
                      const isDepDisabled = !!(field.dependsOn && !watchAll[field.dependsOn])
                      const opts = (field.dependsOn && field.filterOptions
                        ? field.filterOptions(watchAll[field.dependsOn])
                        : field.options) ?? []
                      return (
                        <SearchableSelect
                          options={opts}
                          value={String(cf.value ?? '')}
                          onChange={cf.onChange}
                          placeholder={isDepDisabled
                            ? `— Pilih ${fields.find((f) => f.name === field.dependsOn)?.label ?? 'filter'} dulu —`
                            : undefined}
                          disabled={isDepDisabled}
                        />
                      )
                    }}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    {...register(field.name, { required: field.required ? `${field.label} wajib diisi` : false })}
                    rows={3}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : field.type === 'boolean' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      {...register(field.name)}
                      type="checkbox"
                      id={`field-${field.name}`}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`field-${field.name}`} className="text-sm text-gray-600">
                      {field.placeholder || field.label}
                    </label>
                  </div>
                ) : field.type === 'number' ? (
                  <Controller
                    control={control}
                    name={field.name}
                    rules={{ required: field.required ? `${field.label} wajib diisi` : false }}
                    render={({ field: cf }) => (
                      <NumberInput
                        value={cf.value ?? ''}
                        onChange={cf.onChange}
                        placeholder={field.placeholder}
                        readOnly={field.disabled}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${field.disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                      />
                    )}
                  />
                ) : (
                  <input
                    {...register(field.name, {
                      required: field.required ? `${field.label} wajib diisi` : false,
                    })}
                    type={field.type}
                    placeholder={field.placeholder}
                    readOnly={field.disabled}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${field.disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  />
                )}

                {errors[field.name] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors[field.name]?.message as string}
                  </p>
                )}
              </div>
            ))}
          </div>

          {extraFormContent?.(setValue as (name: string, value: unknown) => void, watchAll, editItem)}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending || formBlocked}
              title={formBlocked ? 'Simpan atau tutup form wali terlebih dahulu' : undefined}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || createMutation.isPending || updateMutation.isPending
                ? 'Menyimpan...'
                : editItem
                ? 'Perbarui'
                : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Konfirmasi Hapus" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
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
    </div>
  )
}
