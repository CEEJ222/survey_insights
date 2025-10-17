import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get company_id from the authenticated user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }

    const themeId = params.id
    const body = await request.json()
    const { decision, notes, declined_reason } = body

    // Validate decision
    const validDecisions = ['approve', 'decline', 'explore_lightweight', 'needs_more_research']
    if (!decision || !validDecisions.includes(decision)) {
      return NextResponse.json(
        { error: `Invalid decision. Must be one of: ${validDecisions.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate that the theme belongs to the user's company
    const { data: existingTheme, error: themeError } = await supabaseAdmin
      .from('themes')
      .select('id, company_id, title, recommendation')
      .eq('id', themeId)
      .eq('company_id', adminUser.company_id)
      .single()

    if (themeError || !existingTheme) {
      return NextResponse.json(
        { error: 'Theme not found or access denied' },
        { status: 404 }
      )
    }

    // Prepare update data based on decision
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (decision) {
      case 'approve':
        updateData.recommendation = 'high_priority'
        updateData.status = 'approved'
        updateData.pm_notes = notes || null
        updateData.declined_reason = null
        break
        
      case 'decline':
        updateData.recommendation = 'off_strategy'
        updateData.status = 'declined'
        updateData.declined_reason = declined_reason || 'Declined by PM review'
        updateData.pm_notes = notes || null
        break
        
      case 'explore_lightweight':
        updateData.recommendation = 'explore_lightweight'
        updateData.status = 'approved'
        updateData.pm_notes = notes || null
        updateData.declined_reason = null
        break
        
      case 'needs_more_research':
        updateData.recommendation = 'needs_review'
        updateData.status = 'needs_review'
        updateData.pm_notes = notes || null
        updateData.declined_reason = null
        break
    }

    // Update the theme
    const { data: updatedTheme, error: updateError } = await supabaseAdmin
      .from('themes')
      .update(updateData)
      .eq('id', themeId)
      .eq('company_id', adminUser.company_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating theme review:', updateError)
      return NextResponse.json(
        { error: 'Failed to update theme review' },
        { status: 500 }
      )
    }

    // Log the review action for audit purposes
    console.log(`Theme ${themeId} (${existingTheme.title}) reviewed by user ${user.id}: ${decision}`)

    return NextResponse.json({
      success: true,
      theme: updatedTheme,
      message: `Theme ${decision}d successfully`,
      review_summary: {
        theme_id: themeId,
        theme_title: existingTheme.title,
        previous_recommendation: existingTheme.recommendation,
        new_recommendation: updateData.recommendation,
        decision,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in theme review:', error)
    return NextResponse.json(
      { 
        error: 'Failed to review theme',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const themeId = params.id

    // Get theme review history and current status
    const { data: theme, error } = await supabaseAdmin
      .from('themes')
      .select(`
        id,
        title,
        recommendation,
        pm_notes,
        declined_reason,
        strategic_alignment_score,
        final_priority_score,
        updated_at
      `)
      .eq('id', themeId)
      .single()

    if (error) {
      console.error('Error fetching theme review status:', error)
      return NextResponse.json({ error: 'Failed to fetch theme review status' }, { status: 500 })
    }

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    return NextResponse.json({
      theme_id: themeId,
      current_status: {
        recommendation: theme.recommendation,
        pm_notes: theme.pm_notes,
        declined_reason: theme.declined_reason,
        strategic_alignment_score: theme.strategic_alignment_score,
        final_priority_score: theme.final_priority_score,
        last_updated: theme.updated_at
      },
      review_actions: {
        can_approve: theme.recommendation !== 'high_priority',
        can_decline: theme.recommendation !== 'off_strategy',
        can_explore: theme.recommendation !== 'explore_lightweight',
        needs_review: theme.recommendation === 'needs_review'
      }
    })

  } catch (error) {
    console.error('Error in theme review GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
