import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, school_id, name, email, role_id, roles(name)')
      .order('id', { ascending: false })
    if (error) throw error
    return NextResponse.json(data?.map(p => ({
      id: p.id,
      school_id: p.school_id,
      name: p.name,
      email: p.email,
      role_id: p.role_id,
      role: (p.roles as unknown as { name: string } | null)?.name,
    })))
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name: string; email: string; password: string; role_id: number; school_id?: number }
    const { name, email, password, role_id, school_id } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, dan password wajib diisi' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // Update profile (created by trigger) with additional info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ name, role_id: role_id ?? null, school_id: school_id ?? null })
      .eq('user_id', authData.user.id)
      .select('id, school_id, name, email, role_id, roles(name)')
      .single()

    if (profileError) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      id: profile.id,
      school_id: profile.school_id,
      name: profile.name,
      email: profile.email,
      role_id: profile.role_id,
      role: (profile.roles as unknown as { name: string } | null)?.name,
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
