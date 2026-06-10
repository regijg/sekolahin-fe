'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import Header from '@/components/layout/Header'
import { userService, roleService } from '@/lib/services'
import type { ManagedUser, Role } from '@/types'
import { ArrowLeft, RefreshCw, Save, Eye, EyeOff } from 'lucide-react'

interface UserFormData {
  name: string
  email: string
  password?: string
  role_id: number
}

interface Props {
  userId?: number
}

export default function UserFormPage({ userId }: Props) {
  const isEdit = !!userId
  const router = useRouter()
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UserFormData>()

  const { data: existingUser, isLoading: loadingUser } = useQuery<ManagedUser>({
    queryKey: ['users', userId],
    queryFn: () => userService.getById(userId!),
    enabled: isEdit,
  })

  const { data: roles = [], isLoading: loadingRoles } = useQuery<Role[]>({
    queryKey: ['roles', 'all'],
    queryFn: () => roleService.getAllFlat(),
  })

  useEffect(() => {
    if (existingUser) {
      reset({
        name: existingUser.name,
        email: existingUser.email,
        password: '',
        role_id: existingUser.role_id ?? undefined,
      })
    }
  }, [existingUser, reset])

  const saveMutation = useMutation({
    mutationFn: (data: UserFormData) => {
      const payload = { ...data, role_id: Number(data.role_id) }
      if (isEdit && !payload.password) delete payload.password
      return isEdit ? userService.update(userId!, payload) : userService.create(payload)
    },
    onSuccess: () => router.push('/users'),
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
      const msg = err.response?.data?.message
      const errs = err.response?.data?.errors
      setFormError(msg || (errs ? Object.values(errs).flat().join(', ') : 'Gagal menyimpan data'))
    },
  })

  const onSubmit = (data: UserFormData) => {
    setFormError('')
    saveMutation.mutate(data)
  }

  const isPending = isSubmitting || saveMutation.isPending

  if (isEdit && loadingUser) {
    return (
      <>
        <Header title="Edit Pengguna" />
        <main className="flex-1 p-6 flex items-center justify-center text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Memuat data...
        </main>
      </>
    )
  }

  return (
    <>
      <Header title={isEdit ? `Edit Pengguna — ${existingUser?.name ?? ''}` : 'Tambah Pengguna'} />
      <main className="flex-1 p-3 sm:p-6 max-w-2xl">
        <button
          onClick={() => router.push('/users')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke daftar pengguna
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {formError}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Informasi Pengguna</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: 'Nama wajib diisi' })}
                type="text"
                placeholder="Nama lengkap"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                {...register('email', {
                  required: 'Email wajib diisi',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format email tidak valid' },
                })}
                type="email"
                placeholder="contoh@email.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {!isEdit && <span className="text-red-500">*</span>}
                {isEdit && <span className="text-xs font-normal text-gray-400 ml-1">(kosongkan jika tidak ingin mengubah)</span>}
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: isEdit ? false : 'Password wajib diisi',
                    minLength: { value: 8, message: 'Minimal 8 karakter' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isEdit ? '••••••••' : 'Minimal 8 karakter'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              {loadingRoles ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <RefreshCw size={14} className="animate-spin" /> Memuat roles...
                </div>
              ) : (
                <select
                  {...register('role_id', { required: 'Role wajib dipilih' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— Pilih Role —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
              {errors.role_id && <p className="text-red-500 text-xs mt-1">{errors.role_id.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={() => router.push('/users')}
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
              {isPending ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </main>
    </>
  )
}
