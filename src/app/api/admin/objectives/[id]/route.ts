import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { UpdateOKRRequest } from '@/types/database'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Use the pre-configured supabase client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user to find company_id
    const { data: adminUser, error: adminError } = await getAdminUser(user.id)
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    const body: UpdateOKRRequest = await request.json()
    const {
      objective,
      quarter,
      key_results,
      owner_id,
      status,
      starts_at,
      ends_at
    } = body

    // Update OKR
    const { data: updatedObjective, error: updateError } = await supabase
      .from('strategic_objectives')
      .update({
        objective,
        quarter,
        key_results: key_results as any,
        owner_id,
        status,
        starts_at,
        ends_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', adminUser.company_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating objective:', updateError)
      return NextResponse.json({ error: 'Failed to update objective' }, { status: 500 })
    }

    if (!updatedObjective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 })
    }

    return NextResponse.json({ objective: updatedObjective }, { status: 200 })
  } catch (error) {
    console.error('Error updating objective:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Use the pre-configured supabase client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user to find company_id
    const { data: adminUser, error: adminError } = await getAdminUser(user.id)
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Delete OKR
    const { error: deleteError } = await supabase
      .from('strategic_objectives')
      .delete()
      .eq('id', params.id)
      .eq('company_id', adminUser.company_id)

    if (deleteError) {
      console.error('Error deleting objective:', deleteError)
      return NextResponse.json({ error: 'Failed to delete objective' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Objective deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting objective:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
