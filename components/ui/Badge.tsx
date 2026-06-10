import { cn } from '@/lib/utils'

const variants: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
}

const statusMap: Record<string, string> = {
  active: 'success',
  inactive: 'danger',
  present: 'success',
  absent: 'danger',
  late: 'warning',
  sick: 'info',
  excused: 'purple',
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  paid: 'success',
  unpaid: 'danger',
  overdue: 'warning',
  in: 'success',
  out: 'danger',
  debit: 'danger',
  credit: 'success',
  true: 'success',
  false: 'danger',
}

const labelMap: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Tidak Aktif',
  present: 'Hadir',
  absent: 'Tidak Hadir',
  late: 'Terlambat',
  sick: 'Sakit',
  excused: 'Izin',
  pending: 'Pending',
  accepted: 'Diterima',
  rejected: 'Ditolak',
  paid: 'Lunas',
  unpaid: 'Belum Bayar',
  overdue: 'Jatuh Tempo',
  in: 'Masuk',
  out: 'Keluar',
  debit: 'Debit',
  credit: 'Kredit',
  male: 'Laki-laki',
  female: 'Perempuan',
  monday: 'Senin',
  tuesday: 'Selasa',
  wednesday: 'Rabu',
  thursday: 'Kamis',
  friday: 'Jumat',
  saturday: 'Sabtu',
  sunday: 'Minggu',
}

interface BadgeProps {
  value: string | boolean
  className?: string
}

export default function Badge({ value, className }: BadgeProps) {
  const key = String(value).toLowerCase()
  const variant = statusMap[key] || 'default'
  const label = labelMap[key] || String(value)
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
