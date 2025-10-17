import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { CreateOKRRequest } from '@/types/database'

export async function GET(request: NextRequest) {
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

    // Get current OKRs
    const { data: objectives, error: objectivesError } = await supabase
      .from('strategic_objectives')
      .select(`
        *,
        admin_users!strategic_objectives_owner_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('company_id', adminUser.company_id)
      .order('created_at', { ascending: false })

    if (objectivesError) {
      console.error('Error fetching objectives:', objectivesError)
      return NextResponse.json({ error: 'Failed to fetch objectives' }, { status: 500 })
    }

    return NextResponse.json({ objectives: objectives || [] }, { status: 200 })
  } catch (error) {
    console.error('Error fetching objectives:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body: CreateOKRRequest = await request.json()
    const {
      objective,
      quarter,
      key_results = [],
      owner_id,
      starts_at,
      ends_at
    } = body

    // Get current active strategy to link to
    const { data: currentStrategy } = await supabase
      .from('product_strategy')
      .select('id')
      .eq('company_id', adminUser.company_id)
      .eq('is_active', true)
      .single()

    if (!currentStrategy) {
      return NextResponse.json({ error: 'No active strategy found. Please create a strategy first.' }, { status: 400 })
    }

    // Create new OKR
    const { data: newObjective, error: createError } = await supabase
      .from('strategic_objectives')
      .insert({
        company_id: adminUser.company_id,
        strategy_id: currentStrategy.id,
        objective,
        quarter,
        key_results: key_results as any,
        owner_id,
        starts_at,
        ends_at
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating objective:', createError)
      return NextResponse.json({ error: 'Failed to create objective' }, { status: 500 })
    }

    return NextResponse.json({ objective: newObjective }, { status: 201 })
  } catch (error) {
    console.error('Error creating objective:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
