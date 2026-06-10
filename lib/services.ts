import { api, extractData, extractPaginated } from './api'
import type {
  AuthData,
  LoginCredentials,
  PaginatedData,
  School,
  AcademicYear,
  Semester,
  Major,
  Classroom,
  Subject,
  Teacher,
  ParentGuardian,
  Student,
  Schedule,
  StudentAttendance,
  TeacherAttendance,
  PPDBApplication,
  Announcement,
  Letter,
  PaymentType,
  Invoice,
  Payment,
  InventoryItem,
  InventoryMutation,
  CanteenAccount,
  CanteenTransaction,
  DashboardStats,
  Permission,
  Role,
  ManagedUser,
} from '@/types'

// Auth
export const authService = {
  login: async (credentials: LoginCredentials) => {
    const res = await api.post('/v1/login', credentials)
    return res.data.data as AuthData
  },
  logout: async () => { await api.post('/v1/logout') },
  me: async () => extractData<{ user: import('@/types').User }>(await api.get('/v1/me')),
}

// Dashboard
export const dashboardService = {
  getStats: async () => extractData<DashboardStats>(await api.get('/v1/dashboard')),
}

// Schools
export const schoolService = {
  getAll: async (page = 1) => extractPaginated<School>(await api.get('/v1/schools', { params: { page } })),
  getById: async (id: number) => extractData<School>(await api.get(`/v1/schools/${id}`)),
  create: async (data: unknown) => extractData<School>(await api.post('/v1/schools', data)),
  update: async (id: number, data: unknown) => extractData<School>(await api.put(`/v1/schools/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/schools/${id}`),
}

// Academic Years
export const academicYearService = {
  getAll: async (page = 1) => extractPaginated<AcademicYear>(await api.get('/v1/academic-years', { params: { page } })),
  getById: async (id: number) => extractData<AcademicYear>(await api.get(`/v1/academic-years/${id}`)),
  create: async (data: unknown) => extractData<AcademicYear>(await api.post('/v1/academic-years', data)),
  update: async (id: number, data: unknown) => extractData<AcademicYear>(await api.put(`/v1/academic-years/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/academic-years/${id}`),
}

// Semesters
export const semesterService = {
  getAll: async (page = 1) => extractPaginated<Semester>(await api.get('/v1/semesters', { params: { page } })),
  getById: async (id: number) => extractData<Semester>(await api.get(`/v1/semesters/${id}`)),
  create: async (data: unknown) => extractData<Semester>(await api.post('/v1/semesters', data)),
  update: async (id: number, data: unknown) => extractData<Semester>(await api.put(`/v1/semesters/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/semesters/${id}`),
}

// Majors
export const majorService = {
  getAll: async (page = 1) => extractPaginated<Major>(await api.get('/v1/majors', { params: { page } })),
  getById: async (id: number) => extractData<Major>(await api.get(`/v1/majors/${id}`)),
  create: async (data: unknown) => extractData<Major>(await api.post('/v1/majors', data)),
  update: async (id: number, data: unknown) => extractData<Major>(await api.put(`/v1/majors/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/majors/${id}`),
}

// Classrooms
export const classroomService = {
  getAll: async (page = 1) => extractPaginated<Classroom>(await api.get('/v1/classrooms', { params: { page } })),
  getById: async (id: number) => extractData<Classroom>(await api.get(`/v1/classrooms/${id}`)),
  create: async (data: unknown) => extractData<Classroom>(await api.post('/v1/classrooms', data)),
  update: async (id: number, data: unknown) => extractData<Classroom>(await api.put(`/v1/classrooms/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/classrooms/${id}`),
}

// Subjects
export const subjectService = {
  getAll: async (page = 1) => extractPaginated<Subject>(await api.get('/v1/subjects', { params: { page } })),
  getById: async (id: number) => extractData<Subject>(await api.get(`/v1/subjects/${id}`)),
  create: async (data: unknown) => extractData<Subject>(await api.post('/v1/subjects', data)),
  update: async (id: number, data: unknown) => extractData<Subject>(await api.put(`/v1/subjects/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/subjects/${id}`),
}

// Teachers
export const teacherService = {
  getAll: async (page = 1) => extractPaginated<Teacher>(await api.get('/v1/teachers', { params: { page } })),
  getById: async (id: number) => extractData<Teacher>(await api.get(`/v1/teachers/${id}`)),
  create: async (data: unknown) => extractData<Teacher>(await api.post('/v1/teachers', data)),
  update: async (id: number, data: unknown) => extractData<Teacher>(await api.put(`/v1/teachers/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/teachers/${id}`),
}

// Parent Guardians
export const parentGuardianService = {
  getAll: async (page = 1) => extractPaginated<ParentGuardian>(await api.get('/v1/parent-guardians', { params: { page } })),
  getById: async (id: number) => extractData<ParentGuardian>(await api.get(`/v1/parent-guardians/${id}`)),
  create: async (data: unknown) => extractData<ParentGuardian>(await api.post('/v1/parent-guardians', data)),
  update: async (id: number, data: unknown) => extractData<ParentGuardian>(await api.put(`/v1/parent-guardians/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/parent-guardians/${id}`),
}

// Students
export const studentService = {
  getAll: async (page = 1) => extractPaginated<Student>(await api.get('/v1/students', { params: { page } })),
  getById: async (id: number) => extractData<Student>(await api.get(`/v1/students/${id}`)),
  create: async (data: unknown) => extractData<Student>(await api.post('/v1/students', data)),
  update: async (id: number, data: unknown) => extractData<Student>(await api.put(`/v1/students/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/students/${id}`),
}

// Schedules
export const scheduleService = {
  getAll: async (page = 1) => extractPaginated<Schedule>(await api.get('/v1/schedules', { params: { page } })),
  getById: async (id: number) => extractData<Schedule>(await api.get(`/v1/schedules/${id}`)),
  create: async (data: unknown) => extractData<Schedule>(await api.post('/v1/schedules', data)),
  update: async (id: number, data: unknown) => extractData<Schedule>(await api.put(`/v1/schedules/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/schedules/${id}`),
}

// Student Attendances
export const studentAttendanceService = {
  getAll: async (page = 1) => extractPaginated<StudentAttendance>(await api.get('/v1/student-attendances', { params: { page } })),
  getById: async (id: number) => extractData<StudentAttendance>(await api.get(`/v1/student-attendances/${id}`)),
  create: async (data: unknown) => extractData<StudentAttendance>(await api.post('/v1/student-attendances', data)),
  update: async (id: number, data: unknown) => extractData<StudentAttendance>(await api.put(`/v1/student-attendances/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/student-attendances/${id}`),
  getSession: async (schoolId: number, classroomId: number, date: string) => {
    const res = await api.get('/v1/student-attendances/session', {
      params: { school_id: schoolId, classroom_id: classroomId, date },
    })
    return res.data.data as {
      exists: boolean
      classroom_name: string
      date: string
      records: Array<{
        student_id: number
        student_name: string
        student_nis: string
        attendance_id: number | null
        status: string
        note: string
      }>
    }
  },
  bulkSave: async (data: { school_id: number; date: string; records: Array<{ student_id: number; status: string; note: string }> }) => {
    const res = await api.post('/v1/student-attendances/bulk', data)
    return res.data.data as { saved: number }
  },
}

// Teacher Attendances
export const teacherAttendanceService = {
  getAll: async (page = 1) => extractPaginated<TeacherAttendance>(await api.get('/v1/teacher-attendances', { params: { page } })),
  getById: async (id: number) => extractData<TeacherAttendance>(await api.get(`/v1/teacher-attendances/${id}`)),
  create: async (data: unknown) => extractData<TeacherAttendance>(await api.post('/v1/teacher-attendances', data)),
  update: async (id: number, data: unknown) => extractData<TeacherAttendance>(await api.put(`/v1/teacher-attendances/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/teacher-attendances/${id}`),
}

// PPDB Applications
export const ppdbService = {
  getAll: async (page = 1) => extractPaginated<PPDBApplication>(await api.get('/v1/ppdb-applications', { params: { page } })),
  getById: async (id: number) => extractData<PPDBApplication>(await api.get(`/v1/ppdb-applications/${id}`)),
  create: async (data: unknown) => extractData<PPDBApplication>(await api.post('/v1/ppdb-applications', data)),
  update: async (id: number, data: unknown) => extractData<PPDBApplication>(await api.put(`/v1/ppdb-applications/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/ppdb-applications/${id}`),
  getAccepted: async () => extractData<PPDBApplication[]>(await api.get('/v1/ppdb-applications', { params: { accepted: true } })),
}

// Announcements
export const announcementService = {
  getAll: async (page = 1) => extractPaginated<Announcement>(await api.get('/v1/announcements', { params: { page } })),
  getById: async (id: number) => extractData<Announcement>(await api.get(`/v1/announcements/${id}`)),
  create: async (data: unknown) => extractData<Announcement>(await api.post('/v1/announcements', data)),
  update: async (id: number, data: unknown) => extractData<Announcement>(await api.put(`/v1/announcements/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/announcements/${id}`),
}

// Letters
export const letterService = {
  getAll: async (page = 1) => extractPaginated<Letter>(await api.get('/v1/letters', { params: { page } })),
  getById: async (id: number) => extractData<Letter>(await api.get(`/v1/letters/${id}`)),
  create: async (data: unknown) => extractData<Letter>(await api.post('/v1/letters', data)),
  update: async (id: number, data: unknown) => extractData<Letter>(await api.put(`/v1/letters/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/letters/${id}`),
}

// Payment Types
export const paymentTypeService = {
  getAll: async (page = 1) => extractPaginated<PaymentType>(await api.get('/v1/payment-types', { params: { page } })),
  getById: async (id: number) => extractData<PaymentType>(await api.get(`/v1/payment-types/${id}`)),
  create: async (data: unknown) => extractData<PaymentType>(await api.post('/v1/payment-types', data)),
  update: async (id: number, data: unknown) => extractData<PaymentType>(await api.put(`/v1/payment-types/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/payment-types/${id}`),
}

// Invoices
export const invoiceService = {
  getAll: async (page = 1) => extractPaginated<Invoice>(await api.get('/v1/invoices', { params: { page } })),
  getById: async (id: number) => extractData<Invoice>(await api.get(`/v1/invoices/${id}`)),
  create: async (data: unknown) => extractData<Invoice>(await api.post('/v1/invoices', data)),
  update: async (id: number, data: unknown) => extractData<Invoice>(await api.put(`/v1/invoices/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/invoices/${id}`),
  bulkGenerate: async (data: unknown) => {
    const res = await api.post('/v1/invoices/bulk-generate', data)
    return res.data.data as { created: number; skipped: number; total_students: number }
  },
}

// Payments
export const paymentService = {
  getAll: async (page = 1) => extractPaginated<Payment>(await api.get('/v1/payments', { params: { page } })),
  getById: async (id: number) => extractData<Payment>(await api.get(`/v1/payments/${id}`)),
  create: async (data: unknown) => extractData<Payment>(await api.post('/v1/payments', data)),
  update: async (id: number, data: unknown) => extractData<Payment>(await api.put(`/v1/payments/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/payments/${id}`),
}

// Inventory Items
export const inventoryItemService = {
  getAll: async (page = 1) => extractPaginated<InventoryItem>(await api.get('/v1/inventory-items', { params: { page } })),
  getById: async (id: number) => extractData<InventoryItem>(await api.get(`/v1/inventory-items/${id}`)),
  create: async (data: unknown) => extractData<InventoryItem>(await api.post('/v1/inventory-items', data)),
  update: async (id: number, data: unknown) => extractData<InventoryItem>(await api.put(`/v1/inventory-items/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/inventory-items/${id}`),
}

// Inventory Mutations
export const inventoryMutationService = {
  getAll: async (page = 1) => extractPaginated<InventoryMutation>(await api.get('/v1/inventory-mutations', { params: { page } })),
  getById: async (id: number) => extractData<InventoryMutation>(await api.get(`/v1/inventory-mutations/${id}`)),
  create: async (data: unknown) => extractData<InventoryMutation>(await api.post('/v1/inventory-mutations', data)),
  update: async (id: number, data: unknown) => extractData<InventoryMutation>(await api.put(`/v1/inventory-mutations/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/inventory-mutations/${id}`),
}

// Canteen Accounts
export const canteenAccountService = {
  getAll: async (page = 1) => extractPaginated<CanteenAccount>(await api.get('/v1/canteen-accounts', { params: { page } })),
  getById: async (id: number) => extractData<CanteenAccount>(await api.get(`/v1/canteen-accounts/${id}`)),
  create: async (data: unknown) => extractData<CanteenAccount>(await api.post('/v1/canteen-accounts', data)),
  update: async (id: number, data: unknown) => extractData<CanteenAccount>(await api.put(`/v1/canteen-accounts/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/canteen-accounts/${id}`),
}

// Canteen Transactions
export const canteenTransactionService = {
  getAll: async (page = 1) => extractPaginated<CanteenTransaction>(await api.get('/v1/canteen-transactions', { params: { page } })),
  getById: async (id: number) => extractData<CanteenTransaction>(await api.get(`/v1/canteen-transactions/${id}`)),
  create: async (data: unknown) => extractData<CanteenTransaction>(await api.post('/v1/canteen-transactions', data)),
  update: async (id: number, data: unknown) => extractData<CanteenTransaction>(await api.put(`/v1/canteen-transactions/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/canteen-transactions/${id}`),
}

// Permissions
export const permissionService = {
  getAll: async (page = 1) => extractPaginated<Permission>(await api.get('/v1/permissions', { params: { page } })),
  getAllFlat: async () => extractData<Permission[]>(await api.get('/v1/permissions', { params: { all: true } })),
  getById: async (id: number) => extractData<Permission>(await api.get(`/v1/permissions/${id}`)),
  create: async (data: unknown) => extractData<Permission>(await api.post('/v1/permissions', data)),
  update: async (id: number, data: unknown) => extractData<Permission>(await api.put(`/v1/permissions/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/permissions/${id}`),
}

// Roles
export const roleService = {
  getAll: async (page = 1) => extractPaginated<Role>(await api.get('/v1/roles', { params: { page } })),
  getAllFlat: async () => extractData<Role[]>(await api.get('/v1/roles', { params: { all: true } })),
  getById: async (id: number) => extractData<Role>(await api.get(`/v1/roles/${id}`)),
  create: async (data: unknown) => extractData<Role>(await api.post('/v1/roles', data)),
  update: async (id: number, data: unknown) => extractData<Role>(await api.put(`/v1/roles/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/roles/${id}`),
  syncPermissions: async (id: number, permission_ids: number[]) =>
    extractData<Role>(await api.post(`/v1/roles/${id}/permissions`, { permission_ids })),
}

// Users
export const userService = {
  getAll: async (page = 1) => extractPaginated<ManagedUser>(await api.get('/v1/users', { params: { page } })),
  getById: async (id: number) => extractData<ManagedUser>(await api.get(`/v1/users/${id}`)),
  create: async (data: unknown) => extractData<ManagedUser>(await api.post('/v1/users', data)),
  update: async (id: number, data: unknown) => extractData<ManagedUser>(await api.put(`/v1/users/${id}`, data)),
  delete: async (id: number) => api.delete(`/v1/users/${id}`),
}

// Helpers — fetch all items across pages (for dropdowns/selects that need full list)
export async function fetchAllPages<T>(
  service: { getAll: (page: number) => Promise<PaginatedData<T>> }
): Promise<T[]> {
  const first = await service.getAll(1)
  if (first.meta.last_page === 1) return first.data
  const rest = await Promise.all(
    Array.from({ length: first.meta.last_page - 1 }, (_, i) => service.getAll(i + 2))
  )
  return [first, ...rest].flatMap((r) => r.data)
}
