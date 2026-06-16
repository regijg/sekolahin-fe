import { createClient } from '@/lib/supabase/client'
import { getSchoolId, setStoredUser } from '@/lib/auth'
import { pageRange, buildPaginated } from '@/lib/api'
import type {
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
  User,
} from '@/types'

// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })
    if (error) throw new Error(error.message)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, school_id, role_id, roles(name, role_permissions(permission_id, permissions(name)))')
      .eq('user_id', data.user.id)
      .single()

    if (profileError || !profile) throw new Error('Profil pengguna tidak ditemukan')

    const roleData = profile.roles as unknown as { name: string; role_permissions: { permissions: { name: string } | null }[] } | null
    const permissions = roleData?.role_permissions?.map(rp => rp.permissions?.name).filter(Boolean) as string[] ?? []

    const user: User = {
      id: profile.id,
      name: profile.name,
      email: data.user.email ?? '',
      role: roleData?.name ?? '',
      school_id: profile.school_id ?? undefined,
      permissions,
    }
    setStoredUser(user)
    return { user, token: data.session?.access_token ?? '' }
  },

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  },

  me: async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, school_id, role_id, roles(name, role_permissions(permission_id, permissions(name)))')
      .eq('user_id', authUser.id)
      .single()

    if (error || !profile) throw new Error('Profil tidak ditemukan')

    const roleData = profile.roles as unknown as { name: string; role_permissions: { permissions: { name: string } | null }[] } | null
    const permissions = roleData?.role_permissions?.map(rp => rp.permissions?.name).filter(Boolean) as string[] ?? []

    return {
      user: {
        id: profile.id,
        name: profile.name,
        email: authUser.email ?? '',
        role: roleData?.name ?? '',
        school_id: profile.school_id ?? undefined,
        permissions,
      } as User,
    }
  },
}

// â”€â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const supabase = createClient()
    const schoolId = getSchoolId()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const base = (table: string) =>
      supabase.from(table).select('*', { count: 'exact', head: true }).eq('school_id', schoolId!)

    const [
      { count: students },
      { count: teachers },
      { count: classrooms },
      { count: subjects },
      { count: ppdb_applications },
      { count: inventory_items },
      { count: announcements },
      { count: schools },
      { count: student_attendance_today },
      { count: teacher_attendance_today },
      { data: paymentsAll },
      { data: invoicesAll },
    ] = await Promise.all([
      base('students'),
      base('teachers'),
      base('classrooms'),
      base('subjects'),
      base('ppdb_applications'),
      base('inventory_items'),
      base('announcements'),
      supabase.from('schools').select('*', { count: 'exact', head: true }),
      base('student_attendances').eq('date', today),
      base('teacher_attendances').eq('date', today),
      supabase.from('payments').select('amount, date').eq('school_id', schoolId!),
      supabase.from('invoices').select('amount, status').eq('school_id', schoolId!),
    ])

    const total_income = paymentsAll?.reduce((s, p) => s + Number(p.amount), 0) ?? 0
    const payments_today = paymentsAll?.filter(p => p.date === today).reduce((s, p) => s + Number(p.amount), 0) ?? 0
    const payments_this_month = paymentsAll?.filter(p => p.date >= thisMonthStart).reduce((s, p) => s + Number(p.amount), 0) ?? 0
    const total_outstanding = invoicesAll?.filter(i => i.status !== 'lunas').reduce((s, i) => s + Number(i.amount), 0) ?? 0

    return {
      schools: schools ?? 0,
      students: students ?? 0,
      teachers: teachers ?? 0,
      classrooms: classrooms ?? 0,
      subjects: subjects ?? 0,
      ppdb_applications: ppdb_applications ?? 0,
      inventory_items: inventory_items ?? 0,
      announcements: announcements ?? 0,
      total_income,
      total_outstanding,
      payments_today,
      payments_this_month,
      student_attendance_today: student_attendance_today ?? 0,
      teacher_attendance_today: teacher_attendance_today ?? 0,
    }
  },
}

// â”€â”€â”€ Schools â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const schoolService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('schools')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<School>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('schools').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as School
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('schools').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as School
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('schools').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as School
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('schools').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Academic Years â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const academicYearService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('academic_years')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<AcademicYear>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('academic_years').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as AcademicYear
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('academic_years').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as AcademicYear
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('academic_years').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as AcademicYear
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('academic_years').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Semesters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const semesterService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('semesters')
      .select('*, academic_years(name)', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Semester>(
      data?.map(r => ({ ...r, academic_year_name: (r.academic_years as unknown as unknown as { name: string } | null)?.name })),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('semesters')
      .select('*, academic_years(name)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return { ...data, academic_year_name: (data.academic_years as unknown as unknown as { name: string } | null)?.name } as Semester
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('semesters').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Semester
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('semesters').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Semester
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('semesters').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Majors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const majorService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('majors')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Major>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('majors').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as Major
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('majors').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Major
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('majors').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Major
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('majors').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Classrooms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const classroomService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('classrooms')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('name')
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Classroom>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('classrooms').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as Classroom
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('classrooms').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Classroom
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('classrooms').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Classroom
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('classrooms').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Subjects â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const subjectService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('subjects')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Subject>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('subjects').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as Subject
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('subjects').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Subject
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('subjects').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Subject
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Teachers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const teacherService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('teachers')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('name')
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Teacher>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('teachers').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as Teacher
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('teachers').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Teacher
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('teachers').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Teacher
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('teachers').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Parent Guardians â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const parentGuardianService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('parent_guardians')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('name')
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<ParentGuardian>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('parent_guardians').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as ParentGuardian
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('parent_guardians').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as ParentGuardian
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('parent_guardians').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as ParentGuardian
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('parent_guardians').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Students â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const studentService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('students')
      .select('*, classrooms(name), parent_guardians(name)', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('name')
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Student>(
      data?.map(r => ({
        ...r,
        classroom_name: (r.classrooms as unknown as unknown as { name: string } | null)?.name,
        parent_guardian_name: (r.parent_guardians as unknown as unknown as { name: string } | null)?.name,
      })),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('students')
      .select('*, classrooms(name), parent_guardians(name)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return {
      ...data,
      classroom_name: (data.classrooms as unknown as unknown as { name: string } | null)?.name,
      parent_guardian_name: (data.parent_guardians as unknown as unknown as { name: string } | null)?.name,
    } as Student
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('students').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Student
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('students').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Student
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Schedules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const scheduleService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('schedules')
      .select('*, classrooms(name), subjects(name), teachers(name)', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Schedule>(
      data?.map(r => ({
        ...r,
        classroom_name: (r.classrooms as unknown as unknown as { name: string } | null)?.name,
        subject_name: (r.subjects as unknown as unknown as { name: string } | null)?.name,
        teacher_name: (r.teachers as unknown as unknown as { name: string } | null)?.name,
      })),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('schedules')
      .select('*, classrooms(name), subjects(name), teachers(name)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return {
      ...data,
      classroom_name: (data.classrooms as unknown as unknown as { name: string } | null)?.name,
      subject_name: (data.subjects as unknown as unknown as { name: string } | null)?.name,
      teacher_name: (data.teachers as unknown as unknown as { name: string } | null)?.name,
    } as Schedule
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('schedules').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Schedule
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('schedules').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Schedule
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Student Attendances â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const studentAttendanceService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('student_attendances')
      .select('*, students(name, nis)', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('date', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<StudentAttendance>(
      data?.map(r => ({
        ...r,
        student_name: (r.students as { name: string; nis: string } | null)?.name,
        student_nis: (r.students as { name: string; nis: string } | null)?.nis,
      })),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('student_attendances')
      .select('*, students(name, nis)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return {
      ...data,
      student_name: (data.students as { name: string; nis: string } | null)?.name,
      student_nis: (data.students as { name: string; nis: string } | null)?.nis,
    } as StudentAttendance
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('student_attendances').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as StudentAttendance
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('student_attendances').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as StudentAttendance
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('student_attendances').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  getSession: async (schoolId: number, classroomId: number, date: string) => {
    const supabase = createClient()

    const [{ data: classroom }, { data: students }, { data: attendances }] = await Promise.all([
      supabase.from('classrooms').select('name').eq('id', classroomId).single(),
      supabase.from('students').select('id, name, nis').eq('classroom_id', classroomId).eq('school_id', schoolId).order('name'),
      supabase.from('student_attendances').select('id, student_id, status, note').eq('school_id', schoolId).eq('date', date),
    ])

    const studentIds = students?.map(s => s.id) ?? []
    const relevantAttendances = attendances?.filter(a => studentIds.includes(a.student_id)) ?? []
    const attMap = new Map(relevantAttendances.map(a => [a.student_id, a]))

    return {
      exists: relevantAttendances.length > 0,
      classroom_name: (classroom as unknown as unknown as { name: string } | null)?.name ?? '',
      date,
      records: (students ?? []).map(s => ({
        student_id: s.id,
        student_name: s.name,
        student_nis: s.nis,
        attendance_id: attMap.get(s.id)?.id ?? null,
        status: attMap.get(s.id)?.status ?? 'present',
        note: attMap.get(s.id)?.note ?? '',
      })),
    }
  },

  bulkSave: async (payload: { school_id: number; date: string; records: Array<{ student_id: number; status: string; note: string }> }) => {
    const supabase = createClient()
    const rows = payload.records.map(r => ({
      school_id: payload.school_id,
      student_id: r.student_id,
      date: payload.date,
      status: r.status,
      note: r.note,
    }))
    const { error } = await supabase
      .from('student_attendances')
      .upsert(rows, { onConflict: 'school_id,student_id,date' })
    if (error) throw new Error(error.message)
    return { saved: rows.length }
  },
}

// â”€â”€â”€ Teacher Attendances â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const teacherAttendanceService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('teacher_attendances')
      .select('*, teachers(name)', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('date', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<TeacherAttendance>(
      data?.map(r => ({ ...r, teacher_name: (r.teachers as unknown as unknown as { name: string } | null)?.name })),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('teacher_attendances')
      .select('*, teachers(name)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return { ...data, teacher_name: (data.teachers as unknown as unknown as { name: string } | null)?.name } as TeacherAttendance
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('teacher_attendances').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as TeacherAttendance
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('teacher_attendances').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as TeacherAttendance
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('teacher_attendances').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ PPDB Applications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const ppdbService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('ppdb_applications')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<PPDBApplication>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('ppdb_applications').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as PPDBApplication
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('ppdb_applications').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as PPDBApplication
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('ppdb_applications').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as PPDBApplication
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('ppdb_applications').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
  getAccepted: async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('ppdb_applications')
      .select('*')
      .eq('school_id', getSchoolId()!)
      .eq('status', 'accepted')
    if (error) throw new Error(error.message)
    return data as PPDBApplication[]
  },
}

// â”€â”€â”€ Announcements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const announcementService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('announcements')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Announcement>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('announcements').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as Announcement
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('announcements').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Announcement
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('announcements').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Announcement
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Letters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const letterService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('letters')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Letter>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('letters').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as Letter
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('letters').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Letter
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('letters').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Letter
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('letters').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Payment Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const paymentTypeService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('payment_types')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<PaymentType>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('payment_types').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as PaymentType
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('payment_types').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as PaymentType
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('payment_types').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as PaymentType
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('payment_types').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Invoices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const invoiceService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('invoices')
      .select('*, students(name, nis), payment_types(name)', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Invoice>(
      data?.map(r => ({
        ...r,
        student_name: (r.students as { name: string; nis: string } | null)?.name,
        student_nis: (r.students as { name: string; nis: string } | null)?.nis,
        payment_type_name: (r.payment_types as unknown as unknown as { name: string } | null)?.name,
      })),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, students(name, nis), payment_types(name)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return {
      ...data,
      student_name: (data.students as { name: string; nis: string } | null)?.name,
      student_nis: (data.students as { name: string; nis: string } | null)?.nis,
      payment_type_name: (data.payment_types as unknown as unknown as { name: string } | null)?.name,
    } as Invoice
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('invoices').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Invoice
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('invoices').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Invoice
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
  bulkGenerate: async (payload: unknown) => {
    const supabase = createClient()
    const { school_id, payment_type_id, month, year, amount, due_date } = payload as {
      school_id: number; payment_type_id: number; month: number; year: number; amount: number; due_date?: string
    }

    const [{ data: students }, { data: existing }] = await Promise.all([
      supabase.from('students').select('id').eq('school_id', school_id),
      supabase.from('invoices').select('student_id')
        .eq('school_id', school_id)
        .eq('payment_type_id', payment_type_id)
        .eq('month', month)
        .eq('year', year),
    ])

    const existingIds = new Set((existing ?? []).map(e => e.student_id))
    const newStudents = (students ?? []).filter(s => !existingIds.has(s.id))

    if (newStudents.length > 0) {
      const { error } = await supabase.from('invoices').insert(
        newStudents.map(s => ({
          school_id,
          student_id: s.id,
          payment_type_id,
          month,
          year,
          amount,
          due_date: due_date ?? null,
          status: 'belum_lunas',
        }))
      )
      if (error) throw new Error(error.message)
    }

    return {
      created: newStudents.length,
      skipped: existingIds.size,
      total_students: (students ?? []).length,
    }
  },
}

// â”€â”€â”€ Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const paymentService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('payments')
      .select('*, invoices(student_id, payment_type_id, students(name), payment_types(name))', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('date', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Payment>(
      data?.map(r => {
        const inv = r.invoices as { student_id: number; payment_type_id: number; students: { name: string } | null; payment_types: { name: string } | null } | null
        return {
          ...r,
          student_name: inv?.students?.name,
          payment_type_name: inv?.payment_types?.name,
          invoice_label: inv ? `Invoice #${r.invoice_id}` : undefined,
        }
      }),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payments')
      .select('*, invoices(students(name), payment_types(name))')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return data as Payment
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('payments').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Payment
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('payments').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Payment
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('payments').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Inventory Items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const inventoryItemService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<InventoryItem>(data, count, page)
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('inventory_items').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as InventoryItem
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('inventory_items').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as InventoryItem
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('inventory_items').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as InventoryItem
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('inventory_items').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Inventory Mutations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const inventoryMutationService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('inventory_mutations')
      .select('*, inventory_items(name)', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<InventoryMutation>(
      data?.map(r => ({ ...r, inventory_item_name: (r.inventory_items as unknown as unknown as { name: string } | null)?.name })),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('inventory_mutations')
      .select('*, inventory_items(name)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return { ...data, inventory_item_name: (data.inventory_items as unknown as unknown as { name: string } | null)?.name } as InventoryMutation
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('inventory_mutations').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as InventoryMutation
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('inventory_mutations').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as InventoryMutation
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('inventory_mutations').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Canteen Accounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const canteenAccountService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('canteen_accounts')
      .select('*, students(name, nis)', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<CanteenAccount>(
      data?.map(r => ({
        ...r,
        student_name: (r.students as { name: string; nis: string } | null)?.name,
        student_nis: (r.students as { name: string; nis: string } | null)?.nis,
      })),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('canteen_accounts')
      .select('*, students(name, nis)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return {
      ...data,
      student_name: (data.students as { name: string; nis: string } | null)?.name,
      student_nis: (data.students as { name: string; nis: string } | null)?.nis,
    } as CanteenAccount
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('canteen_accounts').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as CanteenAccount
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('canteen_accounts').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as CanteenAccount
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('canteen_accounts').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Canteen Transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const canteenTransactionService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('canteen_transactions')
      .select('*, canteen_accounts(students(name))', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<CanteenTransaction>(
      data?.map(r => {
        const acc = r.canteen_accounts as { students: { name: string } | null } | null
        return { ...r, account_student_name: acc?.students?.name }
      }),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('canteen_transactions')
      .select('*, canteen_accounts(students(name))')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return data as CanteenTransaction
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('canteen_transactions').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as CanteenTransaction
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('canteen_transactions').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as CanteenTransaction
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('canteen_transactions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Permissions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const permissionService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('permissions')
      .select('*', { count: 'exact' })
      .order('name')
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Permission>(data, count, page)
  },
  getAllFlat: async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from('permissions').select('*').order('name')
    if (error) throw new Error(error.message)
    return (data ?? []) as Permission[]
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase.from('permissions').select('*').eq('id', id).single()
    if (error) throw new Error(error.message)
    return data as Permission
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('permissions').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Permission
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('permissions').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Permission
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('permissions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
}

// â”€â”€â”€ Roles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const roleService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('roles')
      .select('*, role_permissions(permission_id)', { count: 'exact' })
      .order('name')
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Role>(
      data?.map(r => ({
        ...r,
        permissions: (r.role_permissions as { permission_id: number }[] ?? []).map(rp => ({ id: rp.permission_id }) as Permission),
      })),
      count,
      page
    )
  },
  getAllFlat: async () => {
    const supabase = createClient()
    const schoolId = getSchoolId()
    // Exclude global roles (school_id IS NULL) â€” hanya role milik sekolah yang bisa di-assign ke user
    let query = supabase.from('roles').select('*').order('name').not('school_id', 'is', null)
    if (schoolId) query = query.eq('school_id', schoolId)
    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data ?? []) as Role[]
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('roles')
      .select('*, role_permissions(permission_id, permissions(id, name, description))')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    const rp = data.role_permissions as { permission_id: number; permissions: Permission }[]
    return {
      ...data,
      permissions: rp.map(r => r.permissions),
      permission_ids: rp.map(r => r.permission_id),
    } as Role
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { permission_ids, ...rest } = data as { permission_ids?: number[] } & Record<string, unknown>
    // Non-super-admin harus scope ke sekolahnya sendiri
    const schoolId = getSchoolId()
    if (schoolId) rest.school_id = schoolId
    const { data: row, error } = await supabase.from('roles').insert(rest).select().single()
    if (error) throw new Error(error.message)
    if (permission_ids?.length) {
      await supabase.from('role_permissions').insert(
        permission_ids.map(pid => ({ role_id: row.id, permission_id: pid }))
      )
    }
    return row as Role
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { permission_ids, ...rest } = data as { permission_ids?: number[] } & Record<string, unknown>
    // Jangan kirim school_id saat update (tidak boleh pindah sekolah)
    delete rest.school_id
    const { data: row, error } = await supabase.from('roles').update(rest).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    if (permission_ids !== undefined) {
      await supabase.from('role_permissions').delete().eq('role_id', id)
      if (permission_ids.length > 0) {
        await supabase.from('role_permissions').insert(
          permission_ids.map(pid => ({ role_id: id, permission_id: pid }))
        )
      }
    }
    return row as Role
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('roles').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
  syncPermissions: async (id: number, permission_ids: number[]) => {
    const supabase = createClient()
    await supabase.from('role_permissions').delete().eq('role_id', id)
    if (permission_ids.length > 0) {
      const { error } = await supabase.from('role_permissions').insert(
        permission_ids.map(pid => ({ role_id: id, permission_id: pid }))
      )
      if (error) throw new Error(error.message)
    }
    return roleService.getById(id)
  },
}

// â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const userService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('profiles')
      .select('id, user_id, school_id, name, email, role_id, roles(name)', { count: 'exact' })
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<ManagedUser>(
      data?.map(p => ({
        id: p.id,
        school_id: p.school_id,
        name: p.name,
        email: p.email,
        role_id: p.role_id,
        role: (p.roles as unknown as unknown as { name: string } | null)?.name,
      })),
      count,
      page
    )
  },
  getById: async (id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, school_id, name, email, role_id, roles(name)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return {
      id: data.id,
      school_id: data.school_id,
      name: data.name,
      email: data.email,
      role_id: data.role_id,
      role: (data.roles as unknown as unknown as { name: string } | null)?.name,
    } as ManagedUser
  },
  create: async (data: unknown) => {
    const payload = { ...(data as Record<string, unknown>) }
    // Non-super-admin: scope user ke sekolah sendiri
    const schoolId = getSchoolId()
    if (schoolId) payload.school_id = schoolId
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal membuat pengguna')
    }
    return res.json() as Promise<ManagedUser>
  },
  update: async (id: number, data: unknown) => {
    const payload = { ...(data as Record<string, unknown>) }
    const schoolId = getSchoolId()
    if (schoolId) payload.school_id = schoolId
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal memperbarui pengguna')
    }
    return res.json() as Promise<ManagedUser>
  },
  delete: async (id: number) => {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Gagal menghapus pengguna')
    }
  },
}

// â”€â”€â”€ Helper: fetch all pages for dropdowns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function fetchAllPages<T>(
  service: { getAll: (page: number) => Promise<PaginatedData<T>> }
): Promise<T[]> {
  const first = await service.getAll(1)
  if (first.meta.last_page <= 1) return first.data
  const rest = await Promise.all(
    Array.from({ length: first.meta.last_page - 1 }, (_, i) => service.getAll(i + 2))
  )
  return [first, ...rest].flatMap(r => r.data)
}


