import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createThemeDiscoveryEngine } from '@/lib/ai/theme-discovery'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const sortBy = searchParams.get('sort') || 'strategic_priority'
    const filterBy = searchParams.get('filter') || 'all'

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Build query based on sort and filter parameters
    let query = supabaseAdmin
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
      .eq('company_id', companyId)

    // Apply filters
    if (filterBy === 'in_strategy') {
      query = query.gte('strategic_alignment_score', 70)
    } else if (filterBy === 'off_strategy') {
      query = query.lt('strategic_alignment_score', 50)
    } else if (filterBy === 'needs_review') {
      query = query.eq('recommendation', 'needs_review')
    }

    // Apply sorting
    if (sortBy === 'strategic_priority') {
      query = query.order('final_priority_score', { ascending: false })
    } else if (sortBy === 'customer_signal') {
      query = query.order('priority_score', { ascending: false })
    } else if (sortBy === 'strategic_alignment') {
      query = query.order('strategic_alignment_score', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data: themes, error } = await query

    if (error) {
      console.error('Error fetching themes:', error)
      return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 })
    }

    // Transform data for frontend
    const transformedThemes = themes?.map(theme => ({
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
    })) || []

    return NextResponse.json({ themes: transformedThemes })
  } catch (error) {
    console.error('Error in themes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_id, action } = body

    if (!company_id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    if (action === 'discover_themes') {
      // Run theme discovery with strategic scoring
      const discoveryEngine = createThemeDiscoveryEngine(company_id)
      const themes = await discoveryEngine.discoverThemes()
      
      if (themes.length > 0) {
        await discoveryEngine.saveThemes(themes)
      }

      return NextResponse.json({ 
        success: true, 
        themes_discovered: themes.length,
        message: `Discovered ${themes.length} themes with strategic scoring`
      })
    }

    if (action === 'analyze_strategic') {
      // Re-analyze all themes for strategic alignment
      const { data: themes } = await supabaseAdmin
        .from('themes')
        .select('*')
        .eq('company_id', company_id)

      if (!themes || themes.length === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'No themes to analyze' 
        })
      }

      const discoveryEngine = createThemeDiscoveryEngine(company_id)
      const strategy = await discoveryEngine.getCurrentStrategy()

      if (!strategy) {
        return NextResponse.json({ 
          error: 'No active strategy found. Please set up strategy first.' 
        }, { status: 400 })
      }

      // Re-analyze each theme
      let analyzedCount = 0
      for (const theme of themes) {
        try {
          const alignment = await discoveryEngine.calculateStrategicAlignment(theme, strategy)
          
          await supabaseAdmin
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
            .eq('id', theme.id)

          analyzedCount++
        } catch (error) {
          console.error(`Error analyzing theme ${theme.id}:`, error)
        }
      }

      return NextResponse.json({ 
        success: true, 
        themes_analyzed: analyzedCount,
        message: `Re-analyzed ${analyzedCount} themes for strategic alignment`
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in themes POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
