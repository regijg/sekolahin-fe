'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import Modal from '@/components/ui/Modal'
import SearchableSelect from '@/components/ui/SearchableSelect'
import BirthdatePicker from '@/components/ui/BirthdatePicker'
import { studentService, parentGuardianService } from '@/lib/services'
import { Check, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import type { ParentGuardian } from '@/types'

const STEPS = ['Data Siswa', 'Data Wali', 'Preview']

const GENDER_OPTIONS = [
  { value: 'L', label: 'Laki-laki' },
  { value: 'P', label: 'Perempuan' },
]

function normalizeGender(v: unknown): string {
  if (v === 'male' || v === 'L') return 'L'
  if (v === 'female' || v === 'P') return 'P'
  return ''
}

interface FormData {
  nis: string
  nisn: string
  name: string
  gender: string
  birthdate: string
  address: string
  parent_guardian_id: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  hiddenValues?: Record<string, unknown>
  editItem?: Record<string, unknown> | null
  prefillValues?: Record<string, unknown> | null
  onCreateSuccess?: () => void
  schoolId: number | null
  parentGuardians: ParentGuardian[]
}

function labelOf(options: { value: string | number; label: string }[], value: string) {
  return options.find((o) => String(o.value) === value)?.label ?? (value || '-')
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

function InlineGuardianCreate({
  schoolId,
  onCreated,
  onOpenChange,
}: {
  schoolId: number | null
  onCreated: (id: number) => void
  onOpenChange: (open: boolean) => void
}) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [nameError, setNameError] = useState('')

  const toggle = (next: boolean) => { setOpen(next); onOpenChange(next) }

  const handleCreate = async () => {
    if (!name.trim()) { setNameError('Nama wali wajib diisi'); return }
    if (!schoolId) return
    setNameError('')
    setLoading(true)
    setError('')
    try {
      const guardian = await parentGuardianService.create({ school_id: schoolId, name: name.trim(), phone, address })
      await qc.refetchQueries({ queryKey: ['parent-guardians'] })
      onCreated(guardian.id)
      setName(''); setPhone(''); setAddress('')
      toggle(false)
    } catch {
      setError('Gagal menyimpan wali. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-3 mt-3">
      <button
        type="button"
        onClick={() => toggle(!open)}
        className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
      >
        {open ? <ChevronUp size={14} /> : <Plus size={14} />}
        {open ? 'Tutup form wali' : 'Belum ada wali? Tambah wali baru'}
        {!open && <ChevronDown size={12} className="ml-auto opacity-50" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nama Wali <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); if (nameError) setNameError('') }}
                placeholder="Nama lengkap wali"
                className={inputClass}
              />
              {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. HP</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxx" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Alamat</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inputClass} />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? 'Menyimpan...' : 'Simpan & Pilih Wali'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function StudentStepperModal({
  isOpen,
  onClose,
  hiddenValues = {},
  editItem = null,
  prefillValues = null,
  onCreateSuccess,
  schoolId,
  parentGuardians,
}: Props) {
  const [step, setStep] = useState(0)
  const [formError, setFormError] = useState('')
  const [guardianFormOpen, setGuardianFormOpen] = useState(false)
  const qc = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ mode: 'onChange' })

  const watchAll = watch()

  useEffect(() => {
    if (!isOpen) return
    setStep(0)
    setFormError('')
    setGuardianFormOpen(false)
    if (editItem) {
      reset({
        nis: String(editItem.nis ?? ''),
        nisn: String(editItem.nisn ?? ''),
        name: String(editItem.name ?? ''),
        gender: normalizeGender(editItem.gender),
        birthdate: String(editItem.birthdate ?? ''),
        address: String(editItem.address ?? ''),
        parent_guardian_id: editItem.parent_guardian_id ? String(editItem.parent_guardian_id) : '',
      })
    } else if (prefillValues) {
      reset({
        nis: '',
        nisn: '',
        name: String(prefillValues.name ?? ''),
        gender: normalizeGender(prefillValues.gender),
        birthdate: String(prefillValues.birthdate ?? ''),
        address: String(prefillValues.address ?? ''),
        parent_guardian_id: prefillValues.parent_guardian_id ? String(prefillValues.parent_guardian_id) : '',
      })
    } else {
      reset({ nis: '', nisn: '', name: '', gender: '', birthdate: '', address: '', parent_guardian_id: '' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const createMutation = useMutation({
    mutationFn: studentService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      onCreateSuccess?.()
      handleClose()
    },
    onError: (e: unknown) => setFormError(e instanceof Error ? e.message : 'Gagal menyimpan data'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) => studentService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
      handleClose()
    },
    onError: (e: unknown) => setFormError(e instanceof Error ? e.message : 'Gagal memperbarui data'),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleClose = () => {
    setStep(0)
    setFormError('')
    setGuardianFormOpen(false)
    onClose()
  }

  const goNext = async () => {
    const stepFields: Record<number, (keyof FormData)[]> = {
      0: ['nis', 'nisn', 'name', 'gender'],
    }
    const valid = await trigger(stepFields[step] ?? [])
    if (!valid) return
    setStep((s) => s + 1)
  }

  const goPrev = () => setStep((s) => s - 1)

  const onSubmit = (data: FormData) => {
    if (step !== 2) return
    setFormError('')
    const payload = {
      ...hiddenValues,
      ...data,
      parent_guardian_id: data.parent_guardian_id ? Number(data.parent_guardian_id) : null,
    }
    if (editItem) {
      updateMutation.mutate({ id: editItem.id as number, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const guardianOptions = parentGuardians.map((p) => ({ value: p.id, label: p.name }))
  const selectedGuardian = parentGuardians.find((p) => String(p.id) === watchAll.parent_guardian_id)

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editItem ? 'Edit Data Siswa' : 'Tambah Siswa'}
      size="xl"
    >
      {/* Step Indicator */}
      <div className="flex items-start mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div className={`flex-1 h-0.5 transition-colors ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 transition-colors ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
            <span className={`text-xs mt-2 text-center leading-tight ${i <= step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
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
        {/* Step 1: Data Siswa */}
        {step === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>NIS <span className="text-red-500">*</span></label>
              <input
                {...register('nis', { required: 'NIS wajib diisi' })}
                type="text"
                placeholder="Nomor Induk Siswa"
                className={inputClass}
              />
              {errors.nis && <p className="text-red-500 text-xs mt-1">{errors.nis.message}</p>}
            </div>

            <div>
              <label className={labelClass}>NISN <span className="text-red-500">*</span></label>
              <input
                {...register('nisn', { required: 'NISN wajib diisi' })}
                type="text"
                placeholder="Nomor Induk Siswa Nasional"
                className={inputClass}
              />
              {errors.nisn && <p className="text-red-500 text-xs mt-1">{errors.nisn.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Nama Siswa <span className="text-red-500">*</span></label>
              <input
                {...register('name', { required: 'Nama Siswa wajib diisi' })}
                type="text"
                placeholder="Nama lengkap siswa"
                className={inputClass}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className={labelClass}>Jenis Kelamin <span className="text-red-500">*</span></label>
              <Controller
                control={control}
                name="gender"
                rules={{ required: 'Jenis Kelamin wajib diisi' }}
                render={({ field }) => (
                  <SearchableSelect options={GENDER_OPTIONS} value={field.value ?? ''} onChange={field.onChange} />
                )}
              />
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
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

            <div className="sm:col-span-2">
              <label className={labelClass}>Alamat</label>
              <textarea {...register('address')} rows={3} placeholder="Alamat lengkap" className={inputClass} />
            </div>
          </div>
        )}

        {/* Step 2: Data Wali */}
        {step === 1 && (
          <div>
            <label className={labelClass}>Orang Tua / Wali</label>
            <Controller
              control={control}
              name="parent_guardian_id"
              render={({ field }) => (
                <SearchableSelect
                  options={guardianOptions}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="-- Pilih wali --"
                />
              )}
            />
            <InlineGuardianCreate
              schoolId={schoolId}
              onCreated={(id) => setValue('parent_guardian_id', String(id))}
              onOpenChange={setGuardianFormOpen}
            />
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">Data Siswa</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="text-gray-500 text-xs">NIS</dt>
                  <dd className="text-gray-900 font-medium">{watchAll.nis || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 text-xs">NISN</dt>
                  <dd className="text-gray-900 font-medium">{watchAll.nisn || '-'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 text-xs">Nama Siswa</dt>
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
                <div className="col-span-2">
                  <dt className="text-gray-500 text-xs">Alamat</dt>
                  <dd className="text-gray-900">{watchAll.address || '-'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2 mb-3">Data Wali</h3>
              <dl className="text-sm">
                <div>
                  <dt className="text-gray-500 text-xs">Orang Tua / Wali</dt>
                  <dd className="text-gray-900">{selectedGuardian?.name || '-'}</dd>
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
              disabled={step === 1 && guardianFormOpen}
              title={step === 1 && guardianFormOpen ? 'Simpan atau tutup form wali terlebih dahulu' : undefined}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
