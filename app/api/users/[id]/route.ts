import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, school_id, name, email, role_id, roles(name)')
      .eq('id', Number(id))
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({
      id: data.id,
      school_id: data.school_id,
      name: data.name,
      email: data.email,
      role_id: data.role_id,
      role: (data.roles as unknown as { name: string } | null)?.name,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json() as { name?: string; email?: string; password?: string; role_id?: number; school_id?: number }
    const supabase = createAdminClient()

    // Fetch current profile to get user_id
    const { data: current, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('id', Number(id))
      .single()
    if (fetchError) return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })

    // Update auth user if email or password changed
    if (body.email || body.password) {
      const authUpdate: Record<string, string> = {}
      if (body.email && body.email !== current.email) authUpdate.email = body.email
      if (body.password) authUpdate.password = body.password

      if (Object.keys(authUpdate).length > 0) {
        const { error: authError } = await supabase.auth.admin.updateUserById(current.user_id, authUpdate)
        if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })
      }
    }

    // Update profile
    const profileUpdate: Record<string, unknown> = {}
    if (body.name) profileUpdate.name = body.name
    if (body.email) profileUpdate.email = body.email
    if (body.role_id !== undefined) profileUpdate.role_id = body.role_id
    if (body.school_id !== undefined) profileUpdate.school_id = body.school_id

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', Number(id))
      .select('id, school_id, name, email, role_id, roles(name)')
      .single()

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    return NextResponse.json({
      id: profile.id,
      school_id: profile.school_id,
      name: profile.name,
      email: profile.email,
      role_id: profile.role_id,
      role: (profile.roles as unknown as { name: string } | null)?.name,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Get user_id before deleting
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', Number(id))
      .single()
    if (fetchError) return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })

    // Delete auth user (profile auto-deleted via CASCADE)
    const { error } = await supabase.auth.admin.deleteUser(profile.user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
