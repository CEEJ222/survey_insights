import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { UpdateVisionRequest } from '@/types/database'

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

    const body: UpdateVisionRequest = await request.json()
    const { vision_statement, mission_statement } = body

    // Update vision
    const { data: updatedVision, error: updateError } = await supabase
      .from('company_vision')
      .update({
        vision_statement,
        mission_statement,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', adminUser.company_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating vision:', updateError)
      return NextResponse.json({ error: 'Failed to update vision' }, { status: 500 })
    }

    if (!updatedVision) {
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
    }

    return NextResponse.json({ vision: updatedVision }, { status: 200 })
  } catch (error) {
    console.error('Error updating vision:', error)
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

    // Soft delete by deactivating
    const { error: deleteError } = await supabase
      .from('company_vision')
      .update({
        is_active: false,
        active_until: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', adminUser.company_id)

    if (deleteError) {
      console.error('Error deleting vision:', deleteError)
      return NextResponse.json({ error: 'Failed to delete vision' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Vision deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting vision:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
