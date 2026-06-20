export const ROUTE_PERMISSIONS: Array<{
  href: string
  permission: string
  superAdminOnly?: boolean
}> = [
  { href: '/academic-years', permission: 'view-academic-years' },
  { href: '/semesters', permission: 'view-semesters' },
  { href: '/majors', permission: 'view-majors' },
  { href: '/classrooms', permission: 'view-classrooms' },
  { href: '/enrollments', permission: 'view-enrollments' },
  { href: '/subjects', permission: 'view-subjects' },
  { href: '/schools', permission: 'view-schools', superAdminOnly: true },
  { href: '/teachers', permission: 'view-teachers' },
  { href: '/parent-guardians', permission: 'view-parent-guardians' },
  { href: '/students', permission: 'view-students' },
  { href: '/schedules', permission: 'view-schedules' },
  { href: '/student-attendances', permission: 'view-student-attendances' },
  { href: '/teacher-attendances', permission: 'view-teacher-attendances' },
  { href: '/ppdb-applications', permission: 'view-ppdb-applications' },
  { href: '/announcements', permission: 'view-announcements' },
  { href: '/letters', permission: 'view-letters' },
  { href: '/payment-types', permission: 'view-payment-types' },
  { href: '/invoices', permission: 'view-invoices' },
  { href: '/payments', permission: 'view-payments' },
  { href: '/inventory-items', permission: 'view-inventory-items' },
  { href: '/inventory-mutations', permission: 'view-inventory-mutations' },
  { href: '/canteen-accounts', permission: 'view-canteen-accounts' },
  { href: '/canteen-transactions', permission: 'view-canteen-transactions' },
  { href: '/reports', permission: 'view-reports' },
  { href: '/users', permission: 'view-users' },
  { href: '/roles', permission: 'view-roles' },
  { href: '/permissions', permission: 'view-permissions', superAdminOnly: true },
]
