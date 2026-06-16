'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CheckCircle, RefreshCw, Save, Users } from 'lucide-react'
import Header from '@/components/layout/Header'
import { classroomService, studentAttendanceService, fetchAllPages } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'

const TODAY = new Date().toISOString().split('T')[0]

const STATUS_CONFIG = [
  { value: 'present',    label: 'Hadir',     short: 'H', bg: 'bg-green-500',  ring: 'ring-green-400',  text: 'text-green-700',  light: 'bg-green-50' },
  { value: 'late',       label: 'Terlambat', short: 'T', bg: 'bg-orange-500', ring: 'ring-orange-400', text: 'text-orange-700', light: 'bg-orange-50' },
  { value: 'sick',       label: 'Sakit',     short: 'S', bg: 'bg-yellow-500', ring: 'ring-yellow-400', text: 'text-yellow-700', light: 'bg-yellow-50' },
  { value: 'permission', label: 'Izin',      short: 'I', bg: 'bg-blue-500',   ring: 'ring-blue-400',   text: 'text-blue-700',   light: 'bg-blue-50' },
  { value: 'absent',     label: 'Absen',     short: 'A', bg: 'bg-red-500',    ring: 'ring-red-400',    text: 'text-red-700',    light: 'bg-red-50' },
]

interface AttendanceRecord {
  student_id: number
  student_name: string
  student_nis: string
  attendance_id: number | null
  status: string
  note: string
}

export default function StudentAttendancePage() {
  const schoolId = useSchoolId()
  const [classroomId, setClassroomId] = useState('')
  const [date, setDate] = useState(TODAY)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  const { data: classrooms = [] } = useQuery({
    queryKey: ['classrooms', 'all'],
    queryFn: () => fetchAllPages(classroomService),
  })

  const sessionQuery = useQuery({
    queryKey: ['attendance-session', classroomId, date],
    queryFn: () => studentAttendanceService.getSession(schoolId!, Number(classroomId), date),
    enabled: false,
  })

  const loadSession = useCallback(async () => {
    if (!schoolId || !classroomId || !date) return
    setSavedOk(false)
    const data = await studentAttendanceService.getSession(schoolId, Number(classroomId), date)
    setRecords(data.records.map(r => ({ ...r })))
    setLoaded(true)
  }, [schoolId, classroomId, date])

  const saveMutation = useMutation({
    mutationFn: () => studentAttendanceService.bulkSave({
      school_id: schoolId!,
      date,
      records: records.map(r => ({ student_id: r.student_id, status: r.status, note: r.note })),
    }),
    onSuccess: () => setSavedOk(true),
  })

  const setStatus = (studentId: number, status: string) => {
    setRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, status } : r))
    setSavedOk(false)
  }

  const setNote = (studentId: number, note: string) => {
    setRecords(prev => prev.map(r => r.student_id === studentId ? { ...r, note } : r))
    setSavedOk(false)
  }

  const setAllPresent = () => {
    setRecords(prev => prev.map(r => ({ ...r, status: 'present' })))
    setSavedOk(false)
  }

  const summary = STATUS_CONFIG.map(s => ({
    ...s,
    count: records.filter(r => r.status === s.value).length,
  }))

  return (
    <>
      <Header title="Absensi Siswa" />
      <main className="flex-1 p-3 sm:p-6 space-y-5">

        {/* Filter */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">Kelas</label>
              <select
                value={classroomId}
                onChange={e => { setClassroomId(e.target.value); setLoaded(false) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Pilih kelas...</option>
                {classrooms.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); setLoaded(false) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={loadSession}
              disabled={!classroomId || !schoolId}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
            >
              <RefreshCw size={14} />
              Muat Data
            </button>
          </div>
        </div>

        {/* Empty state */}
        {!loaded && (
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Users size={32} className="opacity-30" />
            <p className="text-sm">Pilih kelas dan tanggal, lalu klik <strong>Muat Data</strong></p>
          </div>
        )}

        {/* Attendance table */}
        {loaded && records.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

            {/* Summary + actions */}
            <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex gap-2 flex-wrap flex-1">
                {summary.map(s => (
                  <span key={s.value} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${s.light} ${s.text}`}>
                    {s.label} <strong>{s.count}</strong>
                  </span>
                ))}
              </div>
              <button
                onClick={setAllPresent}
                className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
              >
                Semua Hadir
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-10">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Nama Siswa</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 w-28">NIS</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((rec, idx) => {
                    const activeStatus = STATUS_CONFIG.find(s => s.value === rec.status)
                    return (
                      <tr key={rec.student_id} className={`transition-colors ${activeStatus?.light ?? ''}`}>
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{rec.student_name}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs font-mono">{rec.student_nis}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-center gap-1">
                            {STATUS_CONFIG.map(s => (
                              <button
                                key={s.value}
                                onClick={() => setStatus(rec.student_id, s.value)}
                                title={s.label}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                  rec.status === s.value
                                    ? `${s.bg} text-white shadow-sm ring-2 ${s.ring} ring-offset-1`
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                {s.short}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={rec.note}
                            onChange={e => setNote(rec.student_id, e.target.value)}
                            placeholder="Catatan..."
                            className="w-full border-0 bg-transparent text-sm text-gray-600 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-300 rounded px-1 py-0.5"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Save footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-xs text-gray-400">{records.length} siswa</span>
              <div className="flex items-center gap-3">
                {savedOk && (
                  <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                    <CheckCircle size={16} /> Tersimpan
                  </span>
                )}
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium w-full sm:w-auto justify-center"
                >
                  <Save size={14} />
                  {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Absensi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loaded && records.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <Users size={32} className="opacity-30" />
            <p className="text-sm">Tidak ada siswa di kelas ini</p>
          </div>
        )}
      </main>
    </>
  )
}
