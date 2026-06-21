'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import CrudPage from '@/components/crud/CrudPage'
import Header from '@/components/layout/Header'
import Modal from '@/components/ui/Modal'
import StudentStepperModal from '@/components/students/StudentStepperModal'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { studentService, parentGuardianService, ppdbService, classroomService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { usePermissions } from '@/hooks/usePermissions'
import type { FieldConfig, PPDBApplication } from '@/types'
import { Plus, UserPlus } from 'lucide-react'

export default function StudentsPage() {
  const schoolId = useSchoolId()
  const qc = useQueryClient()
  const { can } = usePermissions()
  const canCreate = can('create-students')
  const { data: parentGuardians = [] } = useQuery({ queryKey: ['parent-guardians', 'all'], queryFn: () => fetchAllPages(parentGuardianService) })
  const { data: acceptedPpdb = [] } = useQuery<PPDBApplication[]>({ queryKey: ['ppdb', 'accepted'], queryFn: () => ppdbService.getAccepted() })
  const { data: classrooms = [] } = useQuery({ queryKey: ['classrooms', 'all'], queryFn: () => fetchAllPages(classroomService) })

  const [filterClassroomId, setFilterClassroomId] = useState('')

  const queryFilters = useMemo(() => {
    if (!filterClassroomId) return undefined
    return { classroom_id: Number(filterClassroomId) }
  }, [filterClassroomId])

  const [ppdbModalOpen, setPpdbModalOpen] = useState(false)
  const [ppdbLoading, setPpdbLoading] = useState(false)
  const [selectedPpdbAppId, setSelectedPpdbAppId] = useState<number | null>(null)

  const [stepperOpen, setStepperOpen] = useState(false)
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [stepperPrefill, setStepperPrefill] = useState<Record<string, unknown> | null>(null)

  const openCreate = () => { setEditItem(null); setStepperPrefill(null); setStepperOpen(true) }
  const openEdit = (item: Record<string, unknown>) => { setEditItem(item); setStepperPrefill(null); setStepperOpen(true) }
  const closeModal = () => { setStepperOpen(false); setEditItem(null); setStepperPrefill(null) }

  const fields: FieldConfig[] = useMemo(() => [
    { name: 'school_id', label: 'ID Sekolah', type: 'number', required: true, hidden: true, showInTable: false },
    { name: 'nis', label: 'NIS', type: 'text', required: true, showInTable: true },
    { name: 'nisn', label: 'NISN', type: 'text', required: true, showInTable: true },
    { name: 'name', label: 'Nama Siswa', type: 'text', required: true, showInTable: true },
    {
      name: 'gender', label: 'L/P', type: 'select', required: true, showInTable: true, tableAlign: 'center',
      options: [
        { value: 'male', label: 'Laki-laki' },
        { value: 'female', label: 'Perempuan' },
      ],
      tableRender: (value) => {
        const isMale = value === 'L' || value === 'male'
        const isFemale = value === 'P' || value === 'female'
        if (!isMale && !isFemale) return <span className="text-gray-400">-</span>
        return (
          <span className={`font-semibold ${isMale ? 'text-blue-600' : 'text-pink-500'}`}>
            {isMale ? 'L' : 'P'}
          </span>
        )
      },
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
    setEditItem(null)
    setStepperPrefill({
      name: app.name,
      gender: app.gender,
      birthdate: app.birthdate,
      address: app.address ?? '',
      ...(guardianId ? { parent_guardian_id: guardianId } : {}),
    })
    setStepperOpen(true)
  }

  const extraActions = (
    <>
      <button
        onClick={() => setPpdbModalOpen(true)}
        disabled={ppdbLoading}
        className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-green-700 border border-green-300 bg-green-50 rounded-lg hover:bg-green-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <UserPlus size={15} />
        <span className="hidden sm:inline">{ppdbLoading ? 'Memproses...' : 'Dari PPDB'}</span>
      </button>
      {canCreate && (
        <button
          onClick={openCreate}
          className="flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={16} />
          Tambah
        </button>
      )}
    </>
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
          hideAddButton
          extraActions={extraActions}
          queryFilters={queryFilters}
          extraFilters={
            <div className="w-full sm:w-48">
              <SearchableSelect
                value={filterClassroomId}
                onChange={setFilterClassroomId}
                placeholder="Semua Kelas"
                options={classrooms.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
          }
          onEditClick={(item) => openEdit(item as unknown as Record<string, unknown>)}
        />
      </main>

      <StudentStepperModal
        isOpen={stepperOpen}
        onClose={closeModal}
        hiddenValues={hiddenValues}
        editItem={editItem}
        prefillValues={stepperPrefill}
        onCreateSuccess={handleStudentCreated}
        schoolId={schoolId}
        parentGuardians={parentGuardians}
      />

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
