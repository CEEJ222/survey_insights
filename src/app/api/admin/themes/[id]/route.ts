import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// GET - Get single theme details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const themeId = params.id

    const { data: theme, error } = await supabaseAdmin
      .from('themes')
      .select(`
        id,
        title,
        description,
        feedback_count,
        sentiment_score,
        priority_score,
        strategic_alignment_score,
        strategic_reasoning,
        strategic_conflicts,
        strategic_opportunities,
        final_priority_score,
        recommendation,
        pm_notes,
        declined_reason,
        created_at,
        updated_at
      `)
      .eq('id', themeId)
      .single()

    if (error) {
      console.error('Error fetching theme:', error)
      return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 })
    }

    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Transform data for frontend
    const transformedTheme = {
      id: theme.id,
      name: theme.title,
      description: theme.description,
      customerCount: theme.feedback_count || 0,
      mentionCount: theme.feedback_count || 0,
      sentiment: theme.sentiment_score || 0,
      priority: theme.priority_score || 0,
      finalPriority: theme.final_priority_score || theme.priority_score || 0,
      strategicAlignment: theme.strategic_alignment_score || 50,
      strategicReasoning: theme.strategic_reasoning || '',
      strategicConflicts: theme.strategic_conflicts || [],
      strategicOpportunities: theme.strategic_opportunities || [],
      recommendation: theme.recommendation || 'needs_review',
      pmNotes: theme.pm_notes,
      declinedReason: theme.declined_reason,
      status: theme.recommendation === 'needs_review' ? 'needs_review' : 'approved',
      createdAt: theme.created_at,
      updatedAt: theme.updated_at
    }

    return NextResponse.json({ theme: transformedTheme })
  } catch (error) {
    console.error('Error in theme GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update theme (archive, edit, etc.)
export async function PATCH(
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

    // Validate that the theme belongs to the user's company
    const { data: existingTheme, error: themeError } = await supabaseAdmin
      .from('themes')
      .select('id, company_id')
      .eq('id', themeId)
      .eq('company_id', adminUser.company_id)
      .single()

    if (themeError || !existingTheme) {
      return NextResponse.json(
        { error: 'Theme not found or access denied' },
        { status: 404 }
      )
    }

    // Update the theme
    const { data: updatedTheme, error: updateError } = await supabaseAdmin
      .from('themes')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', themeId)
      .eq('company_id', adminUser.company_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating theme:', updateError)
      return NextResponse.json(
        { error: 'Failed to update theme' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      theme: updatedTheme,
    })

  } catch (error) {
    console.error('Error in theme update:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update theme',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete theme
export async function DELETE(
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

    // Validate that the theme belongs to the user's company
    const { data: existingTheme, error: themeError } = await supabaseAdmin
      .from('themes')
      .select('id, company_id')
      .eq('id', themeId)
      .eq('company_id', adminUser.company_id)
      .single()

    if (themeError || !existingTheme) {
      return NextResponse.json(
        { error: 'Theme not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the theme
    const { error: deleteError } = await supabaseAdmin
      .from('themes')
      .delete()
      .eq('id', themeId)
      .eq('company_id', adminUser.company_id)

    if (deleteError) {
      console.error('Error deleting theme:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete theme' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Theme deleted successfully',
    })

  } catch (error) {
    console.error('Error in theme deletion:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete theme',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
