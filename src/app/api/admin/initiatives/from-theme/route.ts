import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdminAdmin } from '@/lib/supabaseAdmin/server'
import { getAdminUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Use the pre-configured supabaseAdmin client
    const { data: { user }, error: authError } = await supabaseAdminAdmin.auth.getUser()

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
      theme_id,
      title,
      description,
      objective_id,
      owner_id,
      team_ids = [],
      effort = 'M',
      target_quarter,
      timeline_bucket = 'next',
      pm_notes
    } = body

    // Validation
    if (!theme_id) {
      return NextResponse.json({ 
        error: 'Theme ID is required' 
      }, { status: 400 })
    }

    if (!title || title.trim().length < 3) {
      return NextResponse.json({ 
        error: 'Initiative title is required and must be at least 3 characters' 
      }, { status: 400 })
    }

    // Get the theme to verify it exists and get customer evidence
    const { data: theme, error: themeError } = await supabaseAdmin
      .from('themes')
      .select(`
        id,
        name,
        description,
        customer_count,
        mention_count,
        priority_score,
        strategic_alignment_score,
        final_priority_score,
        supporting_feedback_item_ids,
        company_id
      `)
      .eq('id', theme_id)
      .eq('company_id', adminUser.company_id)
      .single()

    if (themeError || !theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Create initiative with theme linking
    const { data: newInitiative, error: createError } = await supabaseAdmin
      .from('initiatives')
      .insert({
        company_id: adminUser.company_id,
        theme_id: theme_id,
        title: title.trim(),
        description: description?.trim() || null,
        objective_id: objective_id || null,
        owner_id: owner_id || null,
        team_ids: team_ids,
        effort,
        target_quarter: target_quarter || null,
        timeline_bucket,
        status: 'backlog'
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
          recommendation,
          supporting_feedback_item_ids,
          related_tag_ids
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
      console.error('Error creating initiative from theme:', createError)
      return NextResponse.json({ error: 'Failed to create initiative' }, { status: 500 })
    }

    // Update theme status to approved and link to initiative
    const { error: themeUpdateError } = await supabaseAdmin
      .from('themes')
      .update({
        status: 'approved',
        initiative_id: newInitiative.id,
        pm_notes: pm_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', theme_id)

    if (themeUpdateError) {
      console.error('Error updating theme status:', themeUpdateError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      initiative: newInitiative,
      message: 'Initiative created successfully from theme'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating initiative from theme:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
