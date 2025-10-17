import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeline = searchParams.get('timeline') // 'now', 'next', 'later', or null for all
    const status = searchParams.get('status') // 'backlog', 'planned', 'in_progress', 'shipped', 'cancelled', or null for all

    // Build query
    let query = supabase
      .from('initiatives')
      .select(`
        *,
        themes!initiatives_theme_id_fkey(
          id,
          name,
          description,
          customer_count,
          mention_count,
          priority_score,
          strategic_alignment_score,
          final_priority_score,
          recommendation
        ),
        strategic_objectives!initiatives_objective_id_fkey(
          id,
          objective,
          quarter,
          status
        ),
        admin_users!initiatives_owner_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('company_id', adminUser.company_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (timeline) {
      query = query.eq('timeline_bucket', timeline)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data: initiatives, error } = await query

    if (error) {
      console.error('Error fetching initiatives:', error)
      return NextResponse.json({ error: 'Failed to fetch initiatives' }, { status: 500 })
    }

    return NextResponse.json({ initiatives: initiatives || [] }, { status: 200 })
  } catch (error) {
    console.error('Error fetching initiatives:', error)
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

    const body = await request.json()
    const {
      title,
      description,
      theme_id,
      objective_id,
      owner_id,
      team_ids = [],
      effort = 'M',
      target_quarter,
      timeline_bucket = 'next',
      status = 'backlog'
    } = body

    // Validation
    if (!title || title.trim().length < 3) {
      return NextResponse.json({ 
        error: 'Initiative title is required and must be at least 3 characters' 
      }, { status: 400 })
    }

    if (!['XS', 'S', 'M', 'L', 'XL'].includes(effort)) {
      return NextResponse.json({ 
        error: 'Effort must be one of: XS, S, M, L, XL' 
      }, { status: 400 })
    }

    if (!['now', 'next', 'later'].includes(timeline_bucket)) {
      return NextResponse.json({ 
        error: 'Timeline bucket must be one of: now, next, later' 
      }, { status: 400 })
    }

    if (!['backlog', 'planned', 'in_progress', 'shipped', 'cancelled'].includes(status)) {
      return NextResponse.json({ 
        error: 'Status must be one of: backlog, planned, in_progress, shipped, cancelled' 
      }, { status: 400 })
    }

    // Create initiative
    const { data: newInitiative, error: createError } = await supabase
      .from('initiatives')
      .insert({
        company_id: adminUser.company_id,
        title: title.trim(),
        description: description?.trim() || null,
        theme_id: theme_id || null,
        objective_id: objective_id || null,
        owner_id: owner_id || null,
        team_ids: team_ids,
        effort,
        target_quarter: target_quarter || null,
        timeline_bucket,
        status
      })
      .select(`
        *,
        themes!initiatives_theme_id_fkey(
          id,
          name,
          description,
          customer_count,
          mention_count,
          priority_score,
          strategic_alignment_score,
          final_priority_score,
          recommendation
        ),
        strategic_objectives!initiatives_objective_id_fkey(
          id,
          objective,
          quarter,
          status
        ),
        admin_users!initiatives_owner_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .single()

    if (createError) {
      console.error('Error creating initiative:', createError)
      return NextResponse.json({ error: 'Failed to create initiative' }, { status: 500 })
    }

    return NextResponse.json({ initiative: newInitiative }, { status: 201 })
  } catch (error) {
    console.error('Error creating initiative:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
