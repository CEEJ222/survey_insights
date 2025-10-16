import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// PATCH - Update a user's role or status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const targetUserId = params.id
    const body = await request.json()
    const { role, isActive } = body

    // Validate role if provided
    if (role && !['admin', 'user', 'company_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Build update object
    const updates: any = {}
    if (role !== undefined) updates.role = role
    if (isActive !== undefined) updates.is_active = isActive

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      )
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

    // Update user - ensure they're in the same company
    const { error: updateError } = await (supabaseAdmin as any)
      .from('admin_users')
      .update(updates)
      .eq('id', targetUserId)
      .eq('company_id', (currentUser as any).company_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a user from the company
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const targetUserId = params.id

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

    // Delete from admin_users - ensure they're in the same company
    const { error: deleteError } = await supabaseAdmin
      .from('admin_users')
      .delete()
      .eq('id', targetUserId)
      .eq('company_id', (currentUser as any).company_id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    // Also delete from auth
    await supabaseAdmin.auth.admin.deleteUser(targetUserId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/users/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}