'use client'

import Link from 'next/link'
import { AlertCircle, BarChart2, Calendar, Package, ShoppingCart, UserPlus, Users, Wallet, BookOpen } from 'lucide-react'
import Header from '@/components/layout/Header'

const groups = [
  {
    label: 'Keuangan',
    color: 'blue',
    items: [
      { href: '/reports/tunggakan', icon: AlertCircle, title: 'Tunggakan', desc: 'Daftar siswa yang belum melunasi tagihan per periode' },
      { href: '/reports/penerimaan', icon: Wallet, title: 'Rekap Penerimaan', desc: 'Total pembayaran masuk per jenis dan periode' },
      { href: '/reports/tagihan-siswa', icon: BookOpen, title: 'Tagihan per Siswa', desc: 'Riwayat tagihan dan status pembayaran satu siswa' },
    ],
  },
  {
    label: 'Akademik',
    color: 'green',
    items: [
      { href: '/reports/absensi-siswa', icon: Calendar, title: 'Absensi Siswa', desc: 'Rekap kehadiran siswa per kelas dan bulan' },
      { href: '/reports/absensi-guru', icon: Calendar, title: 'Absensi Guru', desc: 'Rekap kehadiran guru per bulan' },
      { href: '/reports/daftar-siswa', icon: Users, title: 'Daftar Siswa', desc: 'Data lengkap siswa per kelas' },
    ],
  },
  {
    label: 'PPDB',
    color: 'purple',
    items: [
      { href: '/reports/ppdb', icon: UserPlus, title: 'Rekap PPDB', desc: 'Daftar pendaftar beserta status penerimaan' },
    ],
  },
  {
    label: 'Operasional',
    color: 'orange',
    items: [
      { href: '/reports/inventaris', icon: Package, title: 'Inventaris', desc: 'Daftar stok barang dan kondisi aset sekolah' },
      { href: '/reports/kantin', icon: ShoppingCart, title: 'Transaksi Kantin', desc: 'Rekap kredit & debit kantin per siswa per periode' },
    ],
  },
]

const colorIcon: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
}

export default function ReportsPage() {
  return (
    <>
      <Header title="Laporan" />
      <main className="flex-1 p-3 sm:p-6 space-y-7">
        <div className="flex items-center gap-2 text-gray-500">
          <BarChart2 size={18} />
          <p className="text-sm">Pilih laporan yang ingin ditampilkan atau dicetak.</p>
        </div>

        {groups.map((g) => (
          <div key={g.label}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{g.label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {g.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    <div className={`p-2.5 rounded-lg shrink-0 ${colorIcon[g.color]}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </main>
    </>
  )
}
