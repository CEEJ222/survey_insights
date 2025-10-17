import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { UpdateStrategyRequest } from '@/types/database'

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

    const body: UpdateStrategyRequest = await request.json()
    const {
      title,
      description,
      target_customer_description,
      target_customer_segments,
      problems_we_solve,
      problems_we_dont_solve,
      how_we_win,
      strategic_keywords,
      competitors,
      update_reason,
      what_we_learned
    } = body

    // Update strategy
    const { data: updatedStrategy, error: updateError } = await supabase
      .from('product_strategy')
      .update({
        title,
        description,
        target_customer_description,
        target_customer_segments,
        problems_we_solve,
        problems_we_dont_solve,
        how_we_win,
        strategic_keywords: strategic_keywords as any,
        competitors: competitors as any,
        update_reason,
        what_we_learned,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', adminUser.company_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating strategy:', updateError)
      return NextResponse.json({ error: 'Failed to update strategy' }, { status: 500 })
    }

    if (!updatedStrategy) {
      return NextResponse.json({ error: 'Strategy not found' }, { status: 404 })
    }

    return NextResponse.json({ strategy: updatedStrategy }, { status: 200 })
  } catch (error) {
    console.error('Error updating strategy:', error)
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
      .from('product_strategy')
      .update({
        is_active: false,
        active_until: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', adminUser.company_id)

    if (deleteError) {
      console.error('Error deleting strategy:', deleteError)
      return NextResponse.json({ error: 'Failed to delete strategy' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Strategy deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting strategy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
