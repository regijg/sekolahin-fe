'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useSidebar } from '@/context/SidebarContext'
import { getStoredUser, clearStoredUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  LayoutDashboard,
  School,
  CalendarDays,
  BookMarked,
  GraduationCap,
  DoorOpen,
  BookCopy,
  Users,
  UserCheck,
  ClipboardList,
  CalendarCheck,
  CheckSquare,
  UserPlus,
  Megaphone,
  FileText,
  CreditCard,
  Receipt,
  Wallet,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  Banknote,
  LogOut,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Shield,
  KeyRound,
  UserCog,
  BarChart2,
} from 'lucide-react'

const menuGroups = [
  {
    label: 'Utama',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'view-dashboard' },
    ],
  },
  {
    label: 'Manajemen Sekolah',
    items: [
      { href: '/schools', label: 'Sekolah', icon: School, permission: 'view-schools', superAdminOnly: true },
      { href: '/academic-years', label: 'Tahun Ajaran', icon: CalendarDays, permission: 'view-academic-years' },
      { href: '/semesters', label: 'Semester', icon: BookMarked, permission: 'view-semesters' },
      { href: '/majors', label: 'Jurusan', icon: GraduationCap, permission: 'view-majors' },
      { href: '/classrooms', label: 'Kelas', icon: DoorOpen, permission: 'view-classrooms' },
      { href: '/enrollments', label: 'Pendaftaran Kelas', icon: ClipboardList, permission: 'view-enrollments' },
      { href: '/subjects', label: 'Mata Pelajaran', icon: BookCopy, permission: 'view-subjects' },
    ],
  },
  {
    label: 'Sumber Daya Manusia',
    items: [
      { href: '/teachers', label: 'Guru', icon: Users, permission: 'view-teachers' },
      { href: '/parent-guardians', label: 'Orang Tua / Wali', icon: UserCheck, permission: 'view-parent-guardians' },
      { href: '/students', label: 'Siswa', icon: GraduationCap, permission: 'view-students' },
    ],
  },
  {
    label: 'Akademik',
    items: [
      { href: '/schedules', label: 'Jadwal', icon: ClipboardList, permission: 'view-schedules' },
      { href: '/student-attendances', label: 'Absensi Siswa', icon: CalendarCheck, permission: 'view-student-attendances' },
      { href: '/teacher-attendances', label: 'Absensi Guru', icon: CheckSquare, permission: 'view-teacher-attendances' },
    ],
  },
  {
    label: 'PPDB',
    items: [
      { href: '/ppdb-applications', label: 'Pendaftaran (PPDB)', icon: UserPlus, permission: 'view-ppdb-applications' },
    ],
  },
  {
    label: 'Komunikasi',
    items: [
      { href: '/announcements', label: 'Pengumuman', icon: Megaphone, permission: 'view-announcements' },
      { href: '/letters', label: 'Surat Keterangan', icon: FileText, permission: 'view-letters' },
    ],
  },
  {
    label: 'Keuangan',
    items: [
      { href: '/payment-types', label: 'Jenis Pembayaran', icon: CreditCard, permission: 'view-payment-types' },
      { href: '/invoices', label: 'Tagihan', icon: Receipt, permission: 'view-invoices' },
      { href: '/payments', label: 'Pembayaran', icon: Wallet, permission: 'view-payments' },
    ],
  },
  {
    label: 'Inventaris',
    items: [
      { href: '/inventory-items', label: 'Barang Inventaris', icon: Package, permission: 'view-inventory-items' },
      { href: '/inventory-mutations', label: 'Mutasi Inventaris', icon: ArrowLeftRight, permission: 'view-inventory-mutations' },
    ],
  },
  {
    label: 'Kantin',
    items: [
      { href: '/canteen-accounts', label: 'Akun Kantin', icon: ShoppingCart, permission: 'view-canteen-accounts' },
      { href: '/canteen-transactions', label: 'Transaksi Kantin', icon: Banknote, permission: 'view-canteen-transactions' },
    ],
  },
  {
    label: 'Laporan',
    items: [
      { href: '/reports', label: 'Laporan', icon: BarChart2, permission: 'view-reports' },
    ],
  },
  {
    label: 'Akses & Hak',
    items: [
      { href: '/users', label: 'Pengguna', icon: UserCog, permission: 'view-users' },
      { href: '/roles', label: 'Roles', icon: Shield, permission: 'view-roles' },
      { href: '/permissions', label: 'Permissions', icon: KeyRound, permission: 'view-permissions', superAdminOnly: true },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { collapsed, mobileOpen, isMobile, toggleCollapsed, closeMobile } = useSidebar()
  const [groupCollapsed, setGroupCollapsed] = useState<string[]>([])
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    const user = getStoredUser()
    setUserPermissions(user?.permissions ?? [])
    setIsSuperAdmin(!user?.school_id)
  }, [])

  const canView = (permission: string) =>
    userPermissions.length === 0 || userPermissions.includes(permission)

  const toggleGroup = (label: string) => {
    setGroupCollapsed(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
    clearStoredUser()
    router.push('/login')
  }

  const isCollapsed = !isMobile && collapsed

  // Mobile overlay backdrop
  const backdrop = isMobile && mobileOpen && (
    <div
      className="fixed inset-0 z-30 bg-black/40 md:hidden"
      onClick={closeMobile}
    />
  )

  const sidebarVisible = isMobile ? mobileOpen : true
  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64'
  const translateX = isMobile
    ? mobileOpen ? 'translate-x-0' : '-translate-x-full'
    : 'translate-x-0'

  return (
    <>
      {backdrop}

      <aside
        className={`
          ${sidebarVisible || !isMobile ? '' : ''}
          ${sidebarWidth}
          ${translateX}
          bg-slate-900 text-white flex flex-col h-screen
          fixed left-0 top-0 z-40
          transition-all duration-200 ease-in-out
        `}
      >
        {/* Logo */}
        <div className={`flex items-center border-b border-slate-700 h-16 shrink-0 ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-5'}`}>
          <div className="bg-blue-500 rounded-lg p-1.5 shrink-0">
            <BookOpen size={20} />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-sm leading-tight whitespace-nowrap">SEKOLAHIN</div>
              <div className="text-slate-400 text-xs whitespace-nowrap">Admin Panel</div>
            </div>
          )}
          {/* Close button on mobile */}
          {isMobile && (
            <button onClick={closeMobile} className="ml-auto text-slate-400 hover:text-white p-1">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((item) =>
              canView(item.permission) && (!('superAdminOnly' in item) || !item.superAdminOnly || isSuperAdmin)
            )
            if (visibleItems.length === 0) return null

            const isGroupCollapsed = groupCollapsed.includes(group.label)
            return (
              <div key={group.label} className="mb-1">
                {/* Group header — hidden when sidebar is icon-only */}
                {group.label !== 'Utama' && !isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                  >
                    <span>{group.label}</span>
                    {isGroupCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}

                {/* Separator line in collapsed mode */}
                {isCollapsed && group.label !== 'Utama' && (
                  <div className="border-t border-slate-700/50 my-1.5 mx-2" />
                )}

                {(!isGroupCollapsed || isCollapsed) && (
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const Icon = item.icon
                      const active = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          prefetch={false}
                          onMouseEnter={() => router.prefetch(item.href)}
                          title={isCollapsed ? item.label : undefined}
                          onClick={isMobile ? closeMobile : undefined}
                          className={`flex items-center rounded-lg text-sm transition-colors group relative
                            ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'}
                            ${active
                              ? 'bg-blue-600 text-white font-medium'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                          <Icon size={16} className="shrink-0" />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}

                          {/* Tooltip for collapsed mode */}
                          {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                              {item.label}
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom: collapse toggle + logout */}
        <div className="border-t border-slate-700 p-2 space-y-1 shrink-0">
          {/* Collapse toggle — desktop only */}
          {!isMobile && (
            <button
              onClick={toggleCollapsed}
              title={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
              className={`w-full flex items-center rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors
                ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'}`}
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
              {!isCollapsed && <span>Perkecil</span>}
            </button>
          )}

          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Keluar' : undefined}
            className={`w-full flex items-center rounded-lg text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-colors
              ${isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2'}`}
          >
            <LogOut size={16} className="shrink-0" />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
