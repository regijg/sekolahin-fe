'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import { studentService, parentGuardianService, ppdbService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import type { FieldConfig, PPDBApplication } from '@/types'
import { ChevronDown, ChevronUp, Plus, UserPlus } from 'lucide-react'

function InlineGuardianCreate({
  schoolId,
  onCreated,
  onOpenChange,
}: {
  schoolId: number | null
  onCreated: (id: number) => void
  onOpenChange?: (open: boolean) => void
}) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [nameError, setNameError] = useState('')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => { onOpenChange?.(false) }, [])

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
      setOpen(false); onOpenChange?.(false)
    } catch {
      setError('Gagal menyimpan wali. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-3 mt-1">
      <button
        type="button"
        onClick={() => { const next = !open; setOpen(next); onOpenChange?.(next) }}
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
                onChange={e => { setName(e.target.value); if (nameError) setNameError('') }}
                placeholder="Nama lengkap wali"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. HP</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="08xxxxxxxx"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Alamat</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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

export default function StudentsPage() {
  const schoolId = useSchoolId()
  const qc = useQueryClient()
  const { data: parentGuardians = [] } = useQuery({ queryKey: ['parent-guardians', 'all'], queryFn: () => fetchAllPages(parentGuardianService) })
  const { data: acceptedPpdb = [] } = useQuery<PPDBApplication[]>({ queryKey: ['ppdb', 'accepted'], queryFn: () => ppdbService.getAccepted() })

  const [ppdbModalOpen, setPpdbModalOpen] = useState(false)
  const [ppdbLoading, setPpdbLoading] = useState(false)
  const [prefillValues, setPrefillValues] = useState<Record<string, unknown> | null>(null)
  const [selectedPpdbAppId, setSelectedPpdbAppId] = useState<number | null>(null)
  const [guardianFormOpen, setGuardianFormOpen] = useState(false)

  const fields: FieldConfig[] = useMemo(() => [
    { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
    { name: 'nis', label: 'NIS', type: 'text', required: true, showInTable: true },
    { name: 'nisn', label: 'NISN', type: 'text', required: true, showInTable: true },
    { name: 'name', label: 'Nama Siswa', type: 'text', required: true, showInTable: true },
    {
      name: 'gender', label: 'Jenis Kelamin', type: 'select', required: true, showInTable: true,
      options: [
        { value: 'male', label: 'Laki-laki' },
        { value: 'female', label: 'Perempuan' },
      ],
    },
    { name: 'birthdate', label: 'Tanggal Lahir', type: 'date', showInTable: false },
    { name: 'classroom_name', label: 'Kelas', type: 'text', showInTable: true, hidden: true },
    {
      name: 'parent_guardian_id', label: 'Orang Tua / Wali', type: 'select', showInTable: false,
      options: parentGuardians.map(p => ({ value: p.id, label: p.name })),
    },
    { name: 'address', label: 'Alamat', type: 'textarea', showInTable: false },
  ], [parentGuardians])

  const hiddenValues = schoolId ? { school_id: schoolId } : {}

  const guardianExtraContent = useCallback(
    (setValue: (name: string, value: unknown) => void) => (
      <InlineGuardianCreate
        schoolId={schoolId}
        onCreated={(id) => setValue('parent_guardian_id', id)}
        onOpenChange={setGuardianFormOpen}
      />
    ),
    [schoolId]
  )

  const handleStudentCreated = useCallback(async () => {
    if (!selectedPpdbAppId) return
    const id = selectedPpdbAppId
    setSelectedPpdbAppId(null)
    try {
      await ppdbService.delete(id)
      qc.invalidateQueries({ queryKey: ['ppdb'] })
    } catch {
      // silently ignore — student already saved
    }
  }, [selectedPpdbAppId, qc])

  const handleSelectPpdb = async (app: PPDBApplication) => {
    setPpdbModalOpen(false)
    setPpdbLoading(true)
    setSelectedPpdbAppId(app.id)

    let guardianId: number | undefined
    if (app.guardian_name && schoolId) {
      const existing = parentGuardians.find(
        (p) => p.name === app.guardian_name && (!app.guardian_phone || p.phone === app.guardian_phone)
      )
      if (existing) {
        guardianId = existing.id
      } else {
        try {
          const guardian = await parentGuardianService.create({
            school_id: schoolId,
            name: app.guardian_name,
            phone: app.guardian_phone ?? '',
            address: app.address ?? '',
          })
          guardianId = guardian.id
          qc.invalidateQueries({ queryKey: ['parent-guardians'] })
        } catch {
          // guardian creation failed — proceed without pre-selecting guardian
        }
      }
    }

    setPpdbLoading(false)
    setPrefillValues({
      name: app.name,
      gender: app.gender,
      birthdate: app.birthdate,
      address: app.address ?? '',
      ...(guardianId ? { parent_guardian_id: guardianId } : {}),
    })
  }

  const extraActions = (
    <button
      onClick={() => setPpdbModalOpen(true)}
      disabled={ppdbLoading}
      className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-green-700 border border-green-300 bg-green-50 rounded-lg hover:bg-green-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <UserPlus size={15} />
      <span className="hidden sm:inline">{ppdbLoading ? 'Memproses...' : 'Dari PPDB'}</span>
    </button>
  )

  return (
    <>
      <Header title="Data Siswa" />
      <main className="flex-1 p-3 sm:p-6">
        <CrudPage
          title="Siswa"
          queryKey="students"
          service={studentService}
          fields={fields}
          hiddenValues={hiddenValues}
          extraActions={extraActions}
          prefillValues={prefillValues}
          onPrefillConsumed={() => setPrefillValues(null)}
          extraFormContent={guardianExtraContent}
          formBlocked={guardianFormOpen}
          onCreateSuccess={handleStudentCreated}
        />
      </main>

      {/* PPDB Picker Modal */}
      <Modal isOpen={ppdbModalOpen} onClose={() => setPpdbModalOpen(false)} title="Pilih Pendaftar PPDB" size="lg">
        {acceptedPpdb.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">Belum ada pendaftar PPDB dengan status diterima.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {acceptedPpdb.map((app) => (
              <button
                key={app.id}
                onClick={() => handleSelectPpdb(app)}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-800 text-sm">{app.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {app.registration_number} · {app.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                  {app.birthdate ? ` · ${app.birthdate}` : ''}
                </div>
                {app.guardian_name && (
                  <div className="text-xs text-blue-600 mt-1">
                    Wali: {app.guardian_name} ({app.guardian_relation ?? 'wali'}){app.guardian_phone ? ` · ${app.guardian_phone}` : ''}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </Modal>
    </>
  )
}
