import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// PATCH - Update a user's role or status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Update user - RLS policies handle security
    const { error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update(updates)
      .eq('id', targetUserId)

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
    const targetUserId = params.id

    // Delete from admin_users - RLS policies handle security
    const { error: deleteError } = await supabaseAdmin
      .from('admin_users')
      .delete()
      .eq('id', targetUserId)

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