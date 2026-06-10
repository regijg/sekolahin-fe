'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { dashboardService } from '@/lib/services'
import { getStoredUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import Header from '@/components/layout/Header'
import type { DashboardStats } from '@/types'
import {
  School, GraduationCap, Users, DoorOpen, BookCopy, UserPlus,
  Package, Megaphone, Wallet, AlertCircle, TrendingUp, CalendarCheck,
  RefreshCw,
} from 'lucide-react'

function StatCard({
  label, value, icon: Icon, color, subtext,
}: {
  label: string
  value: string | number | undefined
  icon: React.ElementType
  color: string
  subtext?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1.5">
            {value !== undefined && value !== null ? value : <span className="text-gray-300">—</span>}
          </p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`${color} text-white rounded-xl p-3 shrink-0`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

const quickLinks = [
  { href: '/students',            label: 'Data Siswa',    icon: GraduationCap },
  { href: '/teachers',            label: 'Data Guru',     icon: Users },
  { href: '/schedules',           label: 'Jadwal',        icon: BookCopy },
  { href: '/ppdb-applications',   label: 'PPDB',          icon: UserPlus },
  { href: '/invoices',            label: 'Tagihan',       icon: AlertCircle },
  { href: '/announcements',       label: 'Pengumuman',    icon: Megaphone },
]

export default function DashboardPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const user = getStoredUser()
    setIsSuperAdmin(user?.role === 'super-admin')
    setUserName(user?.name ?? '')
  }, [])

  const { data, isLoading, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getStats,
  })

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 p-3 sm:p-6 space-y-6">

        {/* Greeting */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Selamat datang{userName ? `, ${userName}` : ''}!
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">Sistem Informasi Manajemen Sekolah</p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-16 justify-center">
            <RefreshCw size={18} className="animate-spin" />
            Memuat statistik...
          </div>
        ) : error ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl p-5 text-sm">
            <p className="font-medium mb-1">Gagal memuat data dashboard</p>
            <p>Pastikan server Laravel berjalan di <code className="bg-yellow-100 px-1 rounded">http://localhost:8000</code></p>
            <button onClick={() => refetch()} className="mt-3 text-blue-600 underline text-xs">Coba lagi</button>
          </div>
        ) : (
          <>
            {/* Count stats */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ringkasan Data</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {isSuperAdmin && (
                  <StatCard label="Sekolah"      value={data?.schools}           icon={School}       color="bg-blue-500" />
                )}
                <StatCard label="Siswa"          value={data?.students}          icon={GraduationCap} color="bg-green-500" />
                <StatCard label="Guru"           value={data?.teachers}          icon={Users}         color="bg-purple-500" />
                <StatCard label="Kelas"          value={data?.classrooms}        icon={DoorOpen}      color="bg-orange-500" />
                <StatCard label="Mata Pelajaran" value={data?.subjects}          icon={BookCopy}      color="bg-pink-500" />
                <StatCard label="Pendaftar PPDB" value={data?.ppdb_applications} icon={UserPlus}      color="bg-teal-500" />
                <StatCard label="Inventaris"     value={data?.inventory_items}   icon={Package}       color="bg-red-500" />
                <StatCard label="Pengumuman"     value={data?.announcements}     icon={Megaphone}     color="bg-indigo-500" />
              </div>
            </div>

            {/* Attendance today */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Absensi Hari Ini</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                  label="Absensi Siswa"
                  value={data?.student_attendance_today}
                  icon={CalendarCheck}
                  color="bg-cyan-500"
                  subtext="record masuk hari ini"
                />
                <StatCard
                  label="Absensi Guru"
                  value={data?.teacher_attendance_today}
                  icon={CalendarCheck}
                  color="bg-violet-500"
                  subtext="record masuk hari ini"
                />
              </div>
            </div>

            {/* Financial */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Keuangan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Total Pemasukan"
                  value={data?.total_income !== undefined ? formatCurrency(data.total_income) : undefined}
                  icon={TrendingUp}
                  color="bg-emerald-500"
                />
                <StatCard
                  label="Belum Lunas"
                  value={data?.total_outstanding !== undefined ? formatCurrency(data.total_outstanding) : undefined}
                  icon={AlertCircle}
                  color="bg-red-500"
                />
                <StatCard
                  label="Pembayaran Hari Ini"
                  value={data?.payments_today !== undefined ? formatCurrency(data.payments_today) : undefined}
                  icon={Wallet}
                  color="bg-blue-500"
                />
                <StatCard
                  label="Pembayaran Bulan Ini"
                  value={data?.payments_this_month !== undefined ? formatCurrency(data.payments_this_month) : undefined}
                  icon={Wallet}
                  color="bg-sky-500"
                />
              </div>
            </div>
          </>
        )}

        {/* Quick links */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Akses Cepat</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
              >
                <Icon size={20} className="text-blue-600" />
                <span className="text-xs font-medium text-gray-600">{label}</span>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </>
  )
}
