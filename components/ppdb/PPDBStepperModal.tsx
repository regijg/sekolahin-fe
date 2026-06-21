'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import Modal from '@/components/ui/Modal'
import SearchableSelect from '@/components/ui/SearchableSelect'
import BirthdatePicker from '@/components/ui/BirthdatePicker'
import { ppdbService } from '@/lib/services'
import { Check } from 'lucide-react'

const GENDER_OPTIONS = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Diajukan' },
  { value: 'accepted', label: 'Diterima' },
  { value: 'rejected', label: 'Ditolak' },
]

const GUARDIAN_RELATION_OPTIONS = [
  { value: 'ayah', label: 'Ayah' },
  { value: 'ibu', label: 'Ibu' },
  { value: 'kakek', label: 'Kakek' },
  { value: 'nenek', label: 'Nenek' },
  { value: 'paman', label: 'Paman' },
  { value: 'bibi', label: 'Bibi' },
  { value: 'wali', label: 'Wali' },
]

const STEPS = ['Pendaftaran Siswa', 'Data Wali', 'Preview']

interface FormData {
  name: string
  gender: string
  birthdate: string
  address: string
  status: string
  guardian_name: string
  guardian_phone: string
  guardian_relation: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  hiddenValues?: Record<string, unknown>
  editItem?: Record<string, unknown> | null
}

function labelOf(options: { value: string; label: string }[], value: string) {
  return options.find((o) => o.value === value)?.label ?? (value || '-')
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

export default function PPDBStepperModal({ isOpen, onClose, hiddenValues = {}, editItem = null }: Props) {
  const [step, setStep] = useState(0)
  const [formError, setFormError] = useState('')
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { status: 'draft' }, mode: 'onChange' })

  const watchAll = watch()

  // Populate form when modal opens
  useEffect(() => {
    if (!isOpen) return
    setStep(0)
    setFormError('')
    if (editItem) {
      reset({
        name: String(editItem.name ?? ''),
        gender: String(editItem.gender ?? ''),
        birthdate: String(editItem.birthdate ?? ''),
        address: String(editItem.address ?? ''),
        status: String(editItem.status ?? 'draft'),
        guardian_name: String(editItem.guardian_name ?? ''),
        guardian_phone: String(editItem.guardian_phone ?? ''),
        guardian_relation: String(editItem.guardian_relation ?? ''),
      })
    } else {
      reset({ status: 'draft' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const createMutation = useMutation({
    mutationFn: ppdbService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ppdb-applications'] })
      handleClose()
    },
    onError: (e: unknown) => {
      setFormError(e instanceof Error ? e.message : 'Gagal menyimpan data')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => ppdbService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ppdb-applications'] })
      handleClose()
    },
    onError: (e: unknown) => {
      setFormError(e instanceof Error ? e.message : 'Gagal memperbarui data')
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleClose = () => {
    setStep(0)
    setFormError('')
    onClose()
  }

  const goNext = async () => {
    const stepFields: Record<number, (keyof FormData)[]> = {
      0: ['name', 'status'],
      1: ['guardian_name', 'guardian_phone'],
    }
    const valid = await trigger(stepFields[step] ?? [])
    if (!valid) return
    setStep((s) => s + 1)
  }

  const goPrev = () => setStep((s) => s - 1)

  const onSubmit = (data: FormData) => {
    if (step !== 2) return
    setFormError('')
    if (editItem) {
      updateMutation.mutate({ id: editItem.id as number, data: { ...hiddenValues, ...data } })
    } else {
      createMutation.mutate({ ...hiddenValues, ...data })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={editItem ? 'Edit Pendaftaran PPDB' : 'Tambah Pendaftaran PPDB'} size="xl">
      {/* Step Indicator */}
      <div className="flex items-start mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div className={`flex-1 h-0.5 transition-colors ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
              <div
                className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i < step
                    ? 'bg-blue-600 text-white'
                    : i === step
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 transition-colors ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
            <span
              className={`text-xs mt-2 text-center leading-tight ${
                i <= step ? 'text-blue-600 font-medium' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Pendaftaran Siswa */}
        {step === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Nama Pendaftar <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', { required: 'Nama Pendaftar wajib diisi' })}
                type="text"
                placeholder="Masukkan nama lengkap"
                className={inputClass}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Jenis Kelamin</label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <SearchableSelect
                    options={GENDER_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div>
              <label className={labelClass}>Tanggal Lahir</label>
              <Controller
                control={control}
                name="birthdate"
                render={({ field }) => (
                  <BirthdatePicker value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
            </div>

            <div>
              <label className={labelClass}>
                Status <span className="text-red-500">*</span>
              </label>
              <Controller
                control={control}
                name="status"
                rules={{ required: 'Status wajib diisi' }}
                render={({ field }) => (
                  <SearchableSelect
                    options={STATUS_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Alamat</label>
              <textarea
                {...register('address')}
                rows={3}
                placeholder="Alamat lengkap"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Step 2: Data Wali */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nama Wali <span className="text-red-500">*</span></label>
              <input
                {...register('guardian_name', { required: 'Nama Wali wajib diisi' })}
                type="text"
                placeholder="Nama lengkap wali"
                className={inputClass}
              />
              {errors.guardian_name && <p className="text-red-500 text-xs mt-1">{errors.guardian_name.message}</p>}
            </div>

            <div>
              <label className={labelClass}>No. HP Wali <span className="text-red-500">*</span></label>
              <input
                {...register('guardian_phone', { required: 'No. HP Wali wajib diisi' })}
                type="text"
                placeholder="Nomor HP wali"
                className={inputClass}
              />
              {errors.guardian_phone && <p className="text-red-500 text-xs mt-1">{errors.guardian_phone.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Hubungan Wali</label>
              <Controller
                control={control}
                name="guardian_relation"
                render={({ field }) => (
                  <SearchableSelect
                    options={GUARDIAN_RELATION_OPTIONS}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
                Data Siswa
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="text-gray-500 text-xs">Nama Pendaftar</dt>
                  <dd className="text-gray-900 font-medium">{watchAll.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 text-xs">Jenis Kelamin</dt>
                  <dd className="text-gray-900">{labelOf(GENDER_OPTIONS, watchAll.gender)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 text-xs">Tanggal Lahir</dt>
                  <dd className="text-gray-900">{watchAll.birthdate || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 text-xs">Status</dt>
                  <dd className="text-gray-900">{labelOf(STATUS_OPTIONS, watchAll.status)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-gray-500 text-xs">Alamat</dt>
                  <dd className="text-gray-900">{watchAll.address || '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">
                Data Wali
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="text-gray-500 text-xs">Nama Wali</dt>
                  <dd className="text-gray-900">{watchAll.guardian_name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 text-xs">No. HP Wali</dt>
                  <dd className="text-gray-900">{watchAll.guardian_phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 text-xs">Hubungan Wali</dt>
                  <dd className="text-gray-900">
                    {labelOf(GUARDIAN_RELATION_OPTIONS, watchAll.guardian_relation)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-4 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={step === 0 ? handleClose : goPrev}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {step === 0 ? 'Batal' : 'Sebelumnya'}
          </button>

          {step < 2 ? (
            <button
              key="next"
              type="button"
              onClick={goNext}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Selanjutnya
            </button>
          ) : (
            <button
              key="submit"
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Menyimpan...' : editItem ? 'Perbarui' : 'Simpan'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
