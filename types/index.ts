export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface PaginatedData<T> {
  data: T[]
  meta: PaginationMeta
}

// Auth
export interface LoginCredentials {
  email: string
  password: string
}

export interface User {
  id: number
  name: string
  email: string
  role: string
  school_id?: number
  permissions?: string[]
}

export interface AuthData {
  user: User
  token: string
}

// School
export interface School {
  id: number
  name: string
  npsn: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  principal_name?: string
  active: boolean
  created_at?: string
  updated_at?: string
}

// Academic Year
export interface AcademicYear {
  id: number
  school_id: number
  name: string
  start_date: string
  end_date: string
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface Enrollment {
  id: number
  school_id: number
  student_id: number
  student_name?: string
  student_nis?: string
  classroom_id: number
  classroom_name?: string
  academic_year_id: number
  academic_year_name?: string
  status: 'active' | 'graduated' | 'transferred' | 'dropped'
  created_at?: string
  updated_at?: string
}

// Semester — DB: school_id, academic_year_id, name, active (no start/end_date)
export interface Semester {
  id: number
  school_id: number
  academic_year_id: number
  academic_year_name?: string
  name: string
  active: boolean
  created_at?: string
  updated_at?: string
}

// Major — DB: school_id, code, name (no description)
export interface Major {
  id: number
  school_id: number
  code: string
  name: string
  created_at?: string
  updated_at?: string
}

// Classroom — DB: school_id, name, grade, homeroom_teacher_id (no major_id, academic_year_id, capacity)
export interface Classroom {
  id: number
  school_id: number
  name: string
  level?: 'SMP' | 'SMA'
  grade?: string
  homeroom_teacher_id?: number
  created_at?: string
  updated_at?: string
}

// Subject — DB: school_id, code, name (no description)
export interface Subject {
  id: number
  school_id: number
  code: string
  name: string
  created_at?: string
  updated_at?: string
}

// Teacher — DB: school_id, nip, name, gender, birthdate, address, phone, photo (no email, subject_id)
export interface Teacher {
  id: number
  school_id: number
  nip: string
  name: string
  gender?: string
  birthdate?: string
  address?: string
  phone?: string
  photo?: string
  created_at?: string
  updated_at?: string
}

// Parent Guardian — DB: school_id, name, phone, email, address (no relation, occupation)
export interface ParentGuardian {
  id: number
  school_id: number
  name: string
  phone?: string
  email?: string
  address?: string
  created_at?: string
  updated_at?: string
}

// Student
export interface Student {
  id: number
  school_id: number
  nis: string
  nisn: string
  name: string
  gender?: string
  birthdate?: string
  address?: string
  classroom_id?: number
  classroom_name?: string
  parent_guardian_id?: number
  parent_guardian_name?: string
  created_at?: string
  updated_at?: string
}

// Schedule
export interface Schedule {
  id: number
  school_id: number
  classroom_id: number
  classroom_name?: string
  subject_id: number
  subject_name?: string
  teacher_id: number
  teacher_name?: string
  day: string
  start_time: string
  end_time: string
  created_at?: string
  updated_at?: string
}

// Student Attendance — DB: school_id, student_id, date, status, note (no classroom_id, schedule_id)
export interface StudentAttendance {
  id: number
  school_id: number
  student_id: number
  student_name?: string
  student_nis?: string
  date: string
  status: 'present' | 'absent' | 'late' | 'sick' | 'permission'
  note?: string
  created_at?: string
  updated_at?: string
}

// Teacher Attendance
export interface TeacherAttendance {
  id: number
  school_id: number
  teacher_id: number
  teacher_name?: string
  date: string
  check_in_at?: string
  check_out_at?: string
  status: 'present' | 'absent' | 'late' | 'sick' | 'permission'
  note?: string
  created_at?: string
  updated_at?: string
}

// PPDB Application — DB: school_id, registration_number, name, gender, birthdate, address, phone, email, status
export interface PPDBApplication {
  id: number
  school_id: number
  registration_number: string
  name: string
  gender?: string
  birthdate?: string
  address?: string
  phone?: string
  email?: string
  status: 'draft' | 'submitted' | 'accepted' | 'rejected'
  guardian_name?: string
  guardian_phone?: string
  guardian_relation?: string
  created_at?: string
  updated_at?: string
}

// Announcement — DB: school_id, title, body, published_at (no content, target)
export interface Announcement {
  id: number
  school_id: number
  title: string
  body: string
  published_at?: string
  created_at?: string
  updated_at?: string
}

// Letter — DB: school_id, type, number, title, content, issued_at (no student_id)
export interface Letter {
  id: number
  school_id: number
  type: string
  number: string
  title: string
  content: string
  issued_at?: string
  created_at?: string
  updated_at?: string
}

// Payment Type — DB: school_id, code, name, description, is_periodic (no amount)
export interface PaymentType {
  id: number
  school_id: number
  code: string
  name: string
  description?: string
  is_periodic?: boolean
  created_at?: string
  updated_at?: string
}

// Invoice — DB: school_id, student_id, payment_type_id, month, year, amount, late_fee, status, due_date
export interface Invoice {
  id: number
  school_id: number
  student_id: number
  student_name?: string
  student_nis?: string
  payment_type_id: number
  payment_type_name?: string
  month: number
  year: number
  amount: number
  late_fee?: number
  due_date?: string
  status: 'belum_lunas' | 'lunas' | 'cicilan'
  created_at?: string
  updated_at?: string
}

// Payment — DB: school_id, invoice_id, date, amount, payment_method, receipt_path
export interface Payment {
  id: number
  school_id: number
  invoice_id: number
  invoice_label?: string
  student_name?: string
  payment_type_name?: string
  date: string
  amount: number
  payment_method: string
  receipt_path?: string
  created_at?: string
  updated_at?: string
}

// Inventory Item — DB: school_id, category, name, quantity, condition
export interface InventoryItem {
  id: number
  school_id: number
  category: string
  name: string
  quantity: number
  condition?: string
  created_at?: string
  updated_at?: string
}

// Inventory Mutation — DB: school_id, inventory_item_id, type, quantity, note
export interface InventoryMutation {
  id: number
  school_id: number
  inventory_item_id: number
  inventory_item_name?: string
  type: 'in' | 'out'
  quantity: number
  note?: string
  created_at?: string
  updated_at?: string
}

// Canteen Account — DB: school_id, student_id, balance
export interface CanteenAccount {
  id: number
  school_id: number
  student_id: number
  student_name?: string
  student_nis?: string
  balance: number
  created_at?: string
  updated_at?: string
}

// Canteen Transaction — DB: school_id, canteen_account_id, amount, type, status, description
export interface CanteenTransaction {
  id: number
  school_id: number
  canteen_account_id: number
  account_student_name?: string
  amount: number
  type: 'debit' | 'credit'
  status: 'completed' | 'pending' | 'failed'
  description?: string
  created_at?: string
  updated_at?: string
}

// Permission
export interface Permission {
  id: number
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

// Role
export interface Role {
  id: number
  school_id: number | null
  name: string
  description?: string
  permissions?: Permission[]
  permission_ids?: number[]
  created_at?: string
  updated_at?: string
}

// User Management
export interface ManagedUser {
  id: number
  school_id: number | null
  name: string
  email: string
  role_id: number | null
  role?: string
  created_at?: string
  updated_at?: string
}

// Dashboard
export interface DashboardStats {
  schools?: number
  students?: number
  teachers?: number
  classrooms?: number
  subjects?: number
  ppdb_applications?: number
  inventory_items?: number
  announcements?: number
  total_income?: number
  total_outstanding?: number
  payments_today?: number
  payments_this_month?: number
  teacher_attendance_today?: number
  student_attendance_today?: number
}

// Generic field config for CrudPage forms
export type FieldType = 'text' | 'email' | 'number' | 'password' | 'date' | 'time' | 'textarea' | 'select' | 'boolean'

export interface FieldOption {
  value: string | number
  label: string
}

export interface FieldConfig {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: FieldOption[]
  showInTable?: boolean
  hidden?: boolean
  filterOnly?: boolean
  dependsOn?: string
  filterOptions?: (dependentValue: unknown) => FieldOption[]
  defaultValue?: unknown
  tableRender?: (value: unknown, row: Record<string, unknown>) => React.ReactNode
  disabled?: boolean
}
