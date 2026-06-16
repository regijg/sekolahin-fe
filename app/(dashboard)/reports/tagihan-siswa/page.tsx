'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import ReportWrapper from '@/components/reports/ReportWrapper'
import { fetchAllPages, invoiceService, studentService, schoolService, classroomService } from '@/lib/services'
import { useSchoolId } from '@/hooks/useSchoolId'
import { formatCurrency, MONTHS } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import SearchableSelect from '@/components/ui/SearchableSelect'

export default function TagihanSiswaPage() {
  const schoolId = useSchoolId()
  const [classroomId, setClassroomId] = useState('')
  const [studentId, setStudentId] = useState('')

  const { data: school } = useQuery({ queryKey: ['school', schoolId], queryFn: () => schoolService.getById(schoolId!), enabled: !!schoolId })
  const { data: classrooms = [] } = useQuery({ queryKey: ['classrooms', 'all'], queryFn: () => fetchAllPages(classroomService) })
  const { data: students = [] } = useQuery({ queryKey: ['students', 'all'], queryFn: () => fetchAllPages(studentService) })
  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices', 'all-report'], queryFn: () => fetchAllPages(invoiceService) })

  const filteredStudents = classroomId
    ? students.filter(s => String(s.classroom_id) === classroomId)
    : []

  const selectedStudent = students.find(s => String(s.id) === studentId)

  const filtered = useMemo(() =>
    invoices
      .filter(inv => String(inv.student_id) === studentId)
      .sort((a, b) => b.year - a.year || b.month - a.month)
  , [invoices, studentId])

  const totalTagihan = filtered.reduce((s, inv) => s + inv.amount, 0)
  const totalLunas = filtered.filter(inv => inv.status === 'lunas').reduce((s, inv) => s + inv.amount, 0)
  const totalBelumLunas = filtered.filter(inv => inv.status === 'belum_lunas').reduce((s, inv) => s + inv.amount, 0)

  return (
    <>
      <Header title="Tagihan per Siswa" />
      <main className="flex-1 p-3 sm:p-6">
        <ReportWrapper
          title="Laporan Tagihan Siswa"
          subtitle={selectedStudent ? `${selectedStudent.name} — ${selectedStudent.classroom_name ?? ''}` : undefined}
          schoolName={school?.name}
        >
          {/* Filter */}
          <div className="no-print mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Pilih Kelas <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={classroomId}
                onChange={v => { setClassroomId(v); setStudentId('') }}
                placeholder="-- Pilih Kelas --"
                options={classrooms.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Pilih Siswa <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={studentId}
                onChange={setStudentId}
                placeholder={classroomId ? '-- Pilih Siswa --' : '— Pilih kelas dulu —'}
                disabled={!classroomId}
                options={filteredStudents.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => ({ value: s.id, label: `${s.name} (${s.nis})` }))}
              />
            </div>
          </div>

          {!studentId ? (
            <p className="text-sm text-gray-400 py-10 text-center">Pilih siswa untuk melihat riwayat tagihan.</p>
          ) : isLoading ? (
            <p className="text-sm text-gray-500 py-10 text-center">Memuat data...</p>
          ) : (
            <div className="space-y-5">
              {/* Info siswa */}
              {selectedStudent && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-xs text-gray-500">Nama</p><p className="font-semibold text-gray-800">{selectedStudent.name}</p></div>
                  <div><p className="text-xs text-gray-500">NIS</p><p className="font-medium text-gray-700">{selectedStudent.nis}</p></div>
                  <div><p className="text-xs text-gray-500">Kelas</p><p className="font-medium text-gray-700">{selectedStudent.classroom_name ?? '-'}</p></div>
                  <div><p className="text-xs text-gray-500">Orang Tua/Wali</p><p className="font-medium text-gray-700">{selectedStudent.parent_guardian_name ?? '-'}</p></div>
                </div>
              )}

              {/* Ringkasan */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Tagihan</p>
                  <p className="text-base font-bold text-gray-800">{formatCurrency(totalTagihan)}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-green-600 mb-1">Sudah Lunas</p>
                  <p className="text-base font-bold text-green-700">{formatCurrency(totalLunas)}</p>
                </div>
                <div className="bg-white border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-red-500 mb-1">Belum Lunas</p>
                  <p className="text-base font-bold text-red-600">{formatCurrency(totalBelumLunas)}</p>
                </div>
              </div>

              {filtered.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">Belum ada tagihan untuk siswa ini.</p>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {['#', 'Jenis Pembayaran', 'Periode', 'Nominal', 'Status'].map(h => (
                            <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-left ${h === 'Nominal' ? 'text-right' : ''}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filtered.map((inv, i) => (
                          <tr key={inv.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                            <td className="px-4 py-2.5 font-medium text-gray-700">{inv.payment_type_name ?? '-'}</td>
                            <td className="px-4 py-2.5 text-gray-600">{MONTHS.find(m => m.value === inv.month)?.label} {inv.year}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{formatCurrency(inv.amount)}</td>
                            <td className="px-4 py-2.5"><Badge value={inv.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </ReportWrapper>
      </main>
    </>
  )
}
