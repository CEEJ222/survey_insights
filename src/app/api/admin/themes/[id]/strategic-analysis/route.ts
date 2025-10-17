import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createThemeDiscoveryEngine } from '@/lib/ai/theme-discovery'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const themeId = params.id

    if (!themeId) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 })
    }

    // Get theme details
    const { data: theme, error: themeError } = await supabaseAdmin
      .from('themes')
      .select(`
        id,
        company_id,
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

    if (themeError) {
      console.error('Error fetching theme:', themeError)
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Get current strategy for context
    const { data: strategy } = await supabaseAdmin
      .from('product_strategy')
      .select('*')
      .eq('company_id', theme.company_id)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    // Get related tags
    const { data: tags } = await supabaseAdmin
      .from('theme_tags')
      .select(`
        tags (
          id,
          name,
          category
        )
      `)
      .eq('theme_id', themeId)

    // Get supporting evidence (survey responses and feedback items)
    const { data: surveyResponses } = await supabaseAdmin
      .from('survey_responses')
      .select(`
        id,
        responses,
        sentiment_score,
        submitted_at,
        customers (
          full_name,
          primary_email
        )
      `)
      .in('id', theme.supporting_survey_response_ids || [])

    const { data: feedbackItems } = await supabaseAdmin
      .from('feedback_items')
      .select(`
        id,
        content,
        sentiment_score,
        created_at,
        customers (
          full_name,
          primary_email
        )
      `)
      .in('id', theme.supporting_feedback_item_ids || [])

    // Transform data for frontend
    const analysis = {
      theme: {
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
        createdAt: theme.created_at,
        updatedAt: theme.updated_at
      },
      strategy: strategy ? {
        vision: strategy.vision_statement,
        targetCustomer: strategy.target_customer_description,
        problemsWeSolve: strategy.problems_we_solve || [],
        problemsWeDontSolve: strategy.problems_we_dont_solve || [],
        howWeWin: strategy.how_we_win,
        strategicKeywords: strategy.strategic_keywords || []
      } : null,
      tags: tags?.map(t => t.tags).filter(Boolean) || [],
      evidence: {
        surveyResponses: surveyResponses?.map(r => ({
          id: r.id,
          content: typeof r.responses === 'object' ? 
            Object.values(r.responses).join(' ') : r.responses,
          sentiment: r.sentiment_score,
          customer: r.customers?.full_name || 'Anonymous',
          date: r.submitted_at
        })) || [],
        feedbackItems: feedbackItems?.map(f => ({
          id: f.id,
          content: f.content,
          sentiment: f.sentiment_score,
          customer: f.customers?.full_name || 'Anonymous',
          date: f.created_at
        })) || []
      }
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error in strategic analysis GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const themeId = params.id
    const body = await request.json()
    const { action, pm_notes, declined_reason } = body

    if (!themeId) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 })
    }

    if (action === 'approve') {
      // Approve theme as opportunity
      const { error } = await supabaseAdmin
        .from('themes')
        .update({
          recommendation: 'approved',
          pm_notes: pm_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', themeId)

      if (error) {
        console.error('Error approving theme:', error)
        return NextResponse.json({ error: 'Failed to approve theme' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Theme approved successfully' 
      })
    }

    if (action === 'decline') {
      // Decline theme with reason
      const { error } = await supabaseAdmin
        .from('themes')
        .update({
          recommendation: 'declined',
          declined_reason: declined_reason || 'No reason provided',
          pm_notes: pm_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', themeId)

      if (error) {
        console.error('Error declining theme:', error)
        return NextResponse.json({ error: 'Failed to decline theme' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Theme declined successfully' 
      })
    }

    if (action === 'reanalyze') {
      // Re-analyze theme for strategic alignment
      const { data: theme } = await supabaseAdmin
        .from('themes')
        .select('company_id, *')
        .eq('id', themeId)
        .single()

      if (!theme) {
        return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
      }

      const discoveryEngine = createThemeDiscoveryEngine(theme.company_id)
      const strategy = await discoveryEngine.getCurrentStrategy()

      if (!strategy) {
        return NextResponse.json({ 
          error: 'No active strategy found. Please set up strategy first.' 
        }, { status: 400 })
      }

      const alignment = await discoveryEngine.calculateStrategicAlignment(theme, strategy)

      const { error } = await supabaseAdmin
        .from('themes')
        .update({
          strategic_alignment_score: alignment.alignment_score,
          strategic_reasoning: alignment.reasoning,
          strategic_conflicts: alignment.conflicts,
          strategic_opportunities: alignment.opportunities,
          recommendation: alignment.recommendation,
          final_priority_score: Math.round(theme.priority_score * (alignment.alignment_score / 100)),
          updated_at: new Date().toISOString()
        })
        .eq('id', themeId)

      if (error) {
        console.error('Error re-analyzing theme:', error)
        return NextResponse.json({ error: 'Failed to re-analyze theme' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Theme re-analyzed successfully',
        alignment: alignment
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in strategic analysis POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
