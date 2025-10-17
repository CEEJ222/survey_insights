import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the pre-configured supabaseAdmin client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user to find company_id
    const { data: adminUser, error: adminError } = await getAdminUser(user.id)
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    const { data: initiative, error } = await supabaseAdmin
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
          recommendation,
          supporting_feedback_item_ids,
          related_tag_ids
        ),
        strategic_objectives!initiatives_objective_id_fkey(
          id,
          objective,
          quarter,
          status,
          key_results
        ),
        admin_users!initiatives_owner_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('id', params.id)
      .eq('company_id', (adminUser as any).company_id)
      .single()

    if (error) {
      console.error('Error fetching initiative:', error)
      return NextResponse.json({ error: 'Failed to fetch initiative' }, { status: 500 })
    }

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 })
    }

    return NextResponse.json({ initiative }, { status: 200 })
  } catch (error) {
    console.error('Error fetching initiative:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the pre-configured supabaseAdmin client
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
      team_ids,
      effort,
      target_quarter,
      timeline_bucket,
      status,
      started_at,
      shipped_at,
      actual_impact,
      retrospective_url
    } = body

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) {
      if (!title || title.trim().length < 3) {
        return NextResponse.json({ 
          error: 'Initiative title must be at least 3 characters' 
        }, { status: 400 })
      }
      updateData.title = title.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (theme_id !== undefined) {
      updateData.theme_id = theme_id || null
    }

    if (objective_id !== undefined) {
      updateData.objective_id = objective_id || null
    }

    if (owner_id !== undefined) {
      updateData.owner_id = owner_id || null
    }

    if (team_ids !== undefined) {
      updateData.team_ids = team_ids || []
    }

    if (effort !== undefined) {
      if (!['XS', 'S', 'M', 'L', 'XL'].includes(effort)) {
        return NextResponse.json({ 
          error: 'Effort must be one of: XS, S, M, L, XL' 
        }, { status: 400 })
      }
      updateData.effort = effort
    }

    if (target_quarter !== undefined) {
      updateData.target_quarter = target_quarter || null
    }

    if (timeline_bucket !== undefined) {
      if (!['now', 'next', 'later'].includes(timeline_bucket)) {
        return NextResponse.json({ 
          error: 'Timeline bucket must be one of: now, next, later' 
        }, { status: 400 })
      }
      updateData.timeline_bucket = timeline_bucket
    }

    if (status !== undefined) {
      if (!['backlog', 'planned', 'in_progress', 'shipped', 'cancelled'].includes(status)) {
        return NextResponse.json({ 
          error: 'Status must be one of: backlog, planned, in_progress, shipped, cancelled' 
        }, { status: 400 })
      }
      updateData.status = status
    }

    if (started_at !== undefined) {
      updateData.started_at = started_at || null
    }

    if (shipped_at !== undefined) {
      updateData.shipped_at = shipped_at || null
    }

    if (actual_impact !== undefined) {
      updateData.actual_impact = actual_impact || null
    }

    if (retrospective_url !== undefined) {
      updateData.retrospective_url = retrospective_url || null
    }

    // Update initiative
    const { data: updatedInitiative, error: updateError } = await (supabaseAdmin as any)
      .from('initiatives')
      .update(updateData)
      .eq('id', params.id)
      .eq('company_id', (adminUser as any).company_id)
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

    if (updateError) {
      console.error('Error updating initiative:', updateError)
      return NextResponse.json({ error: 'Failed to update initiative' }, { status: 500 })
    }

    if (!updatedInitiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 })
    }

    return NextResponse.json({ initiative: updatedInitiative }, { status: 200 })
  } catch (error) {
    console.error('Error updating initiative:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the pre-configured supabaseAdmin client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user to find company_id
    const { data: adminUser, error: adminError } = await getAdminUser(user.id)
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Delete initiative
    const { error: deleteError } = await supabaseAdmin
      .from('initiatives')
      .delete()
      .eq('id', params.id)
      .eq('company_id', (adminUser as any).company_id)

    if (deleteError) {
      console.error('Error deleting initiative:', deleteError)
      return NextResponse.json({ error: 'Failed to delete initiative' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Initiative deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting initiative:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
