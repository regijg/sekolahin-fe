import { createClient } from '@/lib/supabase/client'
import { getSchoolId, setStoredUser } from '@/lib/auth'
import { pageRange, buildPaginated } from '@/lib/api'
import type {
  LoginCredentials,
  PaginatedData,
  School,
  AcademicYear,
  Enrollment,
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
  getActive: async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('school_id', getSchoolId()!)
      .eq('active', true)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data as AcademicYear | null
  },
}

// ─── Enrollments ──────────────────────────────────────────────────────────────

export const enrollmentService = {
  getAll: async (page = 1) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const { data, count, error } = await supabase
      .from('enrollments')
      .select('*, students(name, nis), classrooms(name), academic_years(name)', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })
      .range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Enrollment>(
      (data ?? []).map((r: Record<string, unknown>) => ({
        ...r,
        student_name:       (r.students as { name: string; nis: string } | null)?.name,
        student_nis:        (r.students as { name: string; nis: string } | null)?.nis,
        classroom_name:     (r.classrooms as { name: string } | null)?.name,
        academic_year_name: (r.academic_years as { name: string } | null)?.name,
      }) as Enrollment),
      count,
      page
    )
  },
  getByAcademicYear: async (academic_year_id: number) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, students(name, nis), classrooms(name)')
      .eq('school_id', getSchoolId()!)
      .eq('academic_year_id', academic_year_id)
      .order('student_id')
    if (error) throw new Error(error.message)
    return (data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      student_name:   (r.students as { name: string; nis: string } | null)?.name,
      student_nis:    (r.students as { name: string; nis: string } | null)?.nis,
      classroom_name: (r.classrooms as { name: string } | null)?.name,
    })) as Enrollment[]
  },
  create: async (data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('enrollments').insert(data as object).select().single()
    if (error) throw new Error(error.message)
    return row as Enrollment
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { data: row, error } = await supabase.from('enrollments').update(data as object).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Enrollment
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('enrollments').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
  promote: async (payload: {
    school_id: number
    to_academic_year_id: number
    assignments: Array<{ student_id: number; new_classroom_id: number }>
    graduates?: Array<{ student_id: number; classroom_id: number }>
  }) => {
    const supabase = createClient()
    const rows = [
      ...payload.assignments.map(a => ({
        school_id: payload.school_id,
        student_id: a.student_id,
        classroom_id: a.new_classroom_id,
        academic_year_id: payload.to_academic_year_id,
        status: 'active',
      })),
      ...(payload.graduates ?? []).map(g => ({
        school_id: payload.school_id,
        student_id: g.student_id,
        classroom_id: g.classroom_id,
        academic_year_id: payload.to_academic_year_id,
        status: 'graduated',
      })),
    ]
    const { error } = await supabase.from('enrollments').upsert(rows, { onConflict: 'student_id,academic_year_id' })
    if (error) throw new Error(error.message)
    return { promoted: payload.assignments.length, graduated: payload.graduates?.length ?? 0 }
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
    const { academic_year_name: _, academic_years: __, ...clean } = data as Record<string, unknown>
    if (clean.active) {
      await supabase.from('semesters').update({ active: false }).eq('school_id', getSchoolId()!)
    }
    const { data: row, error } = await supabase.from('semesters').insert(clean).select().single()
    if (error) throw new Error(error.message)
    return row as Semester
  },
  update: async (id: number, data: unknown) => {
    const supabase = createClient()
    const { academic_year_name: _, academic_years: __, ...clean } = data as Record<string, unknown>
    if (clean.active) {
      await supabase.from('semesters').update({ active: false }).eq('school_id', getSchoolId()!).neq('id', id)
    }
    const { data: row, error } = await supabase.from('semesters').update(clean).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    return row as Semester
  },
  delete: async (id: number) => {
    const supabase = createClient()
    const { error } = await supabase.from('semesters').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },
  setActive: async (id: number) => {
    const supabase = createClient()
    const schoolId = getSchoolId()!
    await supabase.from('semesters').update({ active: false }).eq('school_id', schoolId)
    const { error } = await supabase.from('semesters').update({ active: true }).eq('id', id)
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
      .order('id', { ascending: true })
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
  getByMonth: async (month: number, year: number) => {
    const supabase = createClient()
    const mm    = String(month).padStart(2, '0')
    const start = `${year}-${mm}-01`
    // last day: new Date(year, month, 0) → day-0 of next month = last day of current month
    const lastDay = new Date(year, month, 0).getDate()
    const end     = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`
    const { data, error } = await supabase
      .from('student_attendances')
      .select('*, students(name, nis)')
      .eq('school_id', getSchoolId()!)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
      .order('id',   { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []).map(r => ({
      ...r,
      student_name: (r.students as { name: string; nis: string } | null)?.name,
      student_nis:  (r.students as { name: string; nis: string } | null)?.nis,
    })) as StudentAttendance[]
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
    const schoolId = getSchoolId()!
    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('ppdb_applications')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .like('registration_number', `PPDB-${year}-%`)
    const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
    const registration_number = `PPDB-${year}-${seq}`
    const { data: row, error } = await supabase
      .from('ppdb_applications')
      .insert({ ...(data as object), registration_number })
      .select()
      .single()
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
  getAllFiltered: async (page = 1, filters: {
    status?: string
    payment_type_id?: number
    classroom_id?: number
    year?: number
    month?: number
  } = {}) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)

    let studentIds: number[] | null = null
    if (filters.classroom_id) {
      const { data: cls } = await supabase
        .from('students').select('id').eq('classroom_id', filters.classroom_id)
      studentIds = (cls ?? []).map((s: { id: number }) => s.id)
      if (studentIds.length === 0) return buildPaginated<Invoice>([], 0, page)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from('invoices')
      .select('*, students(name, nis), payment_types(name)', { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('id', { ascending: false })

    if (filters.status) q = q.eq('status', filters.status)
    if (filters.payment_type_id) q = q.eq('payment_type_id', filters.payment_type_id)
    if (filters.year) q = q.eq('year', filters.year)
    if (filters.month) q = q.eq('month', filters.month)
    if (studentIds) q = q.in('student_id', studentIds)

    const { data, count, error } = await q.range(from, to)
    if (error) throw new Error(error.message)
    return buildPaginated<Invoice>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data as any[])?.map(r => ({
        ...r,
        student_name: (r.students as { name: string; nis: string } | null)?.name,
        student_nis: (r.students as { name: string; nis: string } | null)?.nis,
        payment_type_name: (r.payment_types as { name: string } | null)?.name,
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
    const { school_id, payment_type_id, months, year, amount, late_fee, due_date, classroom_id } = payload as {
      school_id: number
      payment_type_id: number
      months: number[]
      year: number
      amount: number
      late_fee?: number
      due_date?: string | null
      classroom_id?: number | null
    }

    const { data: paymentType } = await supabase
      .from('payment_types').select('is_periodic').eq('id', payment_type_id).single()
    const isPeriodic = paymentType ? (paymentType.is_periodic !== false) : true

    let studentsQuery = supabase.from('students').select('id').eq('school_id', school_id)
    if (classroom_id) studentsQuery = studentsQuery.eq('classroom_id', classroom_id)
    const { data: students } = await studentsQuery
    const studentIds = (students ?? []).map((s: { id: number }) => s.id)

    let totalCreated = 0
    let totalSkipped = 0

    if (!isPeriodic) {
      // Satu kali seumur hidup — de-dup by student + payment_type saja (tanpa year/month)
      const startMonth = months[0]

      const { data: existing } = await supabase
        .from('invoices').select('student_id')
        .eq('school_id', school_id)
        .eq('payment_type_id', payment_type_id)

      const existingIds = new Set((existing ?? []).map((e: { student_id: number }) => e.student_id))
      const newStudentIds = studentIds.filter((id: number) => !existingIds.has(id))
      totalSkipped = existingIds.size

      if (newStudentIds.length > 0) {
        const rows = newStudentIds.map((id: number) => ({
          school_id,
          student_id: id,
          payment_type_id,
          month: startMonth,
          year,
          amount,
          late_fee: late_fee ?? 0,
          due_date: due_date ?? null,
          status: 'belum_lunas',
        }))

        const { error } = await supabase.from('invoices').insert(rows)
        if (error) throw new Error(error.message)
        totalCreated = newStudentIds.length
      }
    } else {
      for (const month of months) {
        const { data: existing } = await supabase
          .from('invoices').select('student_id')
          .eq('school_id', school_id)
          .eq('payment_type_id', payment_type_id)
          .eq('month', month)
          .eq('year', year)

        const existingIds = new Set((existing ?? []).map((e: { student_id: number }) => e.student_id))
        const newStudentIds = studentIds.filter((id: number) => !existingIds.has(id))
        totalSkipped += existingIds.size

        if (newStudentIds.length > 0) {
          const { error } = await supabase.from('invoices').insert(
            newStudentIds.map((id: number) => ({
              school_id,
              student_id: id,
              payment_type_id,
              month,
              year,
              amount,
              late_fee: late_fee ?? 0,
              due_date: due_date ?? null,
              status: 'belum_lunas',
            }))
          )
          if (error) throw new Error(error.message)
          totalCreated += newStudentIds.length
        }
      }
    }

    return {
      created: totalCreated,
      skipped: totalSkipped,
      total_students: studentIds.length,
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
  getAllFiltered: async (page = 1, filters: { payment_type_id?: number } = {}) => {
    const supabase = createClient()
    const { from, to } = pageRange(page)
    const selectStr = filters.payment_type_id
      ? '*, invoices!inner(student_id, payment_type_id, students(name), payment_types(name))'
      : '*, invoices(student_id, payment_type_id, students(name), payment_types(name))'
    let q = supabase
      .from('payments')
      .select(selectStr, { count: 'exact' })
      .eq('school_id', getSchoolId()!)
      .order('date', { ascending: false })
      .range(from, to)
    if (filters.payment_type_id) q = q.eq('invoices.payment_type_id', filters.payment_type_id)
    const { data, count, error } = await q
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
    const payment = row as Payment
    if (payment.invoice_id) {
      const [{ data: invoice }, { data: allPayments }] = await Promise.all([
        supabase.from('invoices').select('amount, late_fee').eq('id', payment.invoice_id).single(),
        supabase.from('payments').select('amount').eq('invoice_id', payment.invoice_id),
      ])
      const totalDue = Number(invoice?.amount ?? 0) + Number(invoice?.late_fee ?? 0)
      const totalPaid = (allPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
      const newStatus = totalPaid >= totalDue ? 'lunas' : 'cicilan'
      await supabase.from('invoices').update({ status: newStatus }).eq('id', payment.invoice_id)
    }
    return payment
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

// ─── Student Grades ───────────────────────────────────────────────────────────

export type StudentGradeRow = {
  student_id: number
  student_nis: string
  student_name: string
  assignment_score: number | null
  mid_exam_score: number | null
  final_exam_score: number | null
  final_grade: number | null
  predicate: string | null
}

export const gradeService = {
  getByContext: async (semesterId: number, classroomId: number, subjectId: number): Promise<StudentGradeRow[]> => {
    const supabase = createClient()
    const schoolId = getSchoolId()!

    const { data: semester, error: semErr } = await supabase
      .from('semesters').select('academic_year_id').eq('id', semesterId).single()
    if (semErr || !semester) throw new Error('Semester tidak ditemukan')

    const { data: enrollments, error: enrErr } = await supabase
      .from('enrollments')
      .select('student_id, students(nis, name)')
      .eq('school_id', schoolId)
      .eq('classroom_id', classroomId)
      .eq('academic_year_id', (semester as { academic_year_id: number }).academic_year_id)
      .eq('status', 'active')
    if (enrErr) throw new Error(enrErr.message)

    const list = (enrollments ?? []) as unknown as Array<{ student_id: number; students: { nis: string; name: string } | null }>
    if (list.length === 0) return []

    const studentIds = list.map(e => e.student_id)
    const { data: grades } = await supabase
      .from('student_grades')
      .select('student_id, assignment_score, mid_exam_score, final_exam_score, final_grade, predicate')
      .eq('school_id', schoolId)
      .eq('subject_id', subjectId)
      .eq('semester_id', semesterId)
      .in('student_id', studentIds)

    const gradeMap: Record<number, { assignment_score: number | null; mid_exam_score: number | null; final_exam_score: number | null; final_grade: number | null; predicate: string | null }> = {}
    ;(grades ?? []).forEach((g: { student_id: number; assignment_score: number | null; mid_exam_score: number | null; final_exam_score: number | null; final_grade: number | null; predicate: string | null }) => {
      gradeMap[g.student_id] = g
    })

    return list
      .map(e => {
        const g = gradeMap[e.student_id]
        return {
          student_id: e.student_id,
          student_nis: e.students?.nis ?? '',
          student_name: e.students?.name ?? '',
          assignment_score: g?.assignment_score ?? null,
          mid_exam_score: g?.mid_exam_score ?? null,
          final_exam_score: g?.final_exam_score ?? null,
          final_grade: g?.final_grade ?? null,
          predicate: g?.predicate ?? null,
        }
      })
      .sort((a, b) => a.student_name.localeCompare(b.student_name))
  },

  getRekapByClassroom: async (semesterId: number, classroomId: number): Promise<{
    students: Array<{ id: number; nis: string; name: string }>
    subjects: Array<{ id: number; code: string; name: string }>
    grades: Record<number, Record<number, { mid_exam_score: number | null; final_exam_score: number | null; final_grade: number | null; predicate: string | null }>>
  }> => {
    const supabase = createClient()
    const schoolId = getSchoolId()!

    const { data: semester } = await supabase.from('semesters').select('academic_year_id').eq('id', semesterId).single()
    if (!semester) throw new Error('Semester tidak ditemukan')

    const { data: enrollments, error: enrErr } = await supabase
      .from('enrollments')
      .select('student_id, students(nis, name)')
      .eq('school_id', schoolId)
      .eq('classroom_id', classroomId)
      .eq('academic_year_id', (semester as { academic_year_id: number }).academic_year_id)
      .eq('status', 'active')
    if (enrErr) throw new Error(enrErr.message)

    const students = ((enrollments ?? []) as unknown as Array<{ student_id: number; students: { nis: string; name: string } | null }>)
      .map(e => ({ id: e.student_id, nis: e.students?.nis ?? '', name: e.students?.name ?? '' }))
      .sort((a, b) => a.name.localeCompare(b.name))

    if (students.length === 0) return { students: [], subjects: [], grades: {} }

    const studentIds = students.map(s => s.id)
    const { data: gradeRows } = await supabase
      .from('student_grades')
      .select('student_id, subject_id, mid_exam_score, final_exam_score, final_grade, predicate, subjects(code, name)')
      .eq('school_id', schoolId)
      .eq('semester_id', semesterId)
      .in('student_id', studentIds)

    const subjectMap = new Map<number, { id: number; code: string; name: string }>()
    ;((gradeRows ?? []) as unknown as Array<{ subject_id: number; subjects: { code: string; name: string } | null }>).forEach((g) => {
      if (!subjectMap.has(g.subject_id)) {
        const sub = g.subjects as { code: string; name: string } | null
        subjectMap.set(g.subject_id, { id: g.subject_id, code: sub?.code ?? '', name: sub?.name ?? '' })
      }
    })
    const subjects = Array.from(subjectMap.values()).sort((a, b) => a.code.localeCompare(b.code))

    const grades: Record<number, Record<number, { mid_exam_score: number | null; final_exam_score: number | null; final_grade: number | null; predicate: string | null }>> = {}
    ;(gradeRows ?? []).forEach((g: { student_id: number; subject_id: number; mid_exam_score: number | null; final_exam_score: number | null; final_grade: number | null; predicate: string | null }) => {
      if (!grades[g.student_id]) grades[g.student_id] = {}
      grades[g.student_id][g.subject_id] = {
        mid_exam_score: g.mid_exam_score,
        final_exam_score: g.final_exam_score,
        final_grade: g.final_grade,
        predicate: g.predicate,
      }
    })

    return { students, subjects, grades }
  },

  upsertBulk: async (rows: Array<{
    student_id: number
    subject_id: number
    semester_id: number
    assignment_score: number | null
    mid_exam_score: number | null
    final_exam_score: number | null
    final_grade: number | null
    predicate: string | null
  }>) => {
    const supabase = createClient()
    const schoolId = getSchoolId()!
    const data = rows.map(r => ({ ...r, school_id: schoolId }))
    const { error } = await supabase
      .from('student_grades')
      .upsert(data, { onConflict: 'student_id,subject_id,semester_id' })
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


