import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET - List all users in the company
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get current user's company_id first
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('admin_users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      console.error('Error fetching current user:', currentUserError)
      return NextResponse.json({ error: 'Current user not found' }, { status: 500 })
    }

    // Get all users in the same company
    const { data: users, error: usersError } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, full_name, role, is_active, created_at')
      .eq('company_id', (currentUser as any).company_id)
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Invite a new user to the company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName, role } = body

    if (!email || !fullName || !role) {
      return NextResponse.json(
        { error: 'Email, full name, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "user"' },
        { status: 400 }
      )
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get current user's company_id
    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('admin_users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: 'Current user not found' },
        { status: 500 }
      )
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'

    // Create auth user
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm for now
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authCreateError) {
      console.error('Auth error:', authCreateError)
      return NextResponse.json(
        { error: authCreateError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create admin user record with company_id
    const { error: insertError } = await (supabaseAdmin as any)
      .from('admin_users')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        is_active: true,
        company_id: (currentUser as any).company_id,
        invited_by: user.id,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      )
    }

    // TODO: Send invitation email with password reset link
    // For now, we'll return the temp password (in production, send via email)

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
      },
      tempPassword, // In production, this should be sent via email instead
    })
  } catch (error) {
    console.error('Error in POST /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}