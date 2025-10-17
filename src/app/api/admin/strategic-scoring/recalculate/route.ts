import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createThemeDiscoveryEngine } from '@/lib/ai/theme-discovery'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_id, force_recalculate } = body

    if (!company_id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Get current strategy
    const { data: strategy } = await supabaseAdmin
      .from('product_strategy')
      .select('*')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .single()

    if (!strategy) {
      return NextResponse.json({ 
        error: 'No active strategy found. Please set up strategy first.' 
      }, { status: 400 })
    }

    // Get all themes for recalculation
    let query = supabaseAdmin
      .from('themes')
      .select('*')
      .eq('company_id', company_id)

    // If not forcing recalculation, only process themes that haven't been scored recently
    if (!force_recalculate) {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      query = query.or(`updated_at.lt.${oneWeekAgo.toISOString()},strategic_alignment_score.is.null`)
    }

    const { data: themes, error: themesError } = await query

    if (themesError) {
      console.error('Error fetching themes:', themesError)
      return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 })
    }

    if (!themes || themes.length === 0) {
      return NextResponse.json({ 
        success: true, 
        recalculated: 0,
        message: 'No themes need recalculation'
      })
    }

    // Initialize theme discovery engine
    const discoveryEngine = createThemeDiscoveryEngine(company_id)
    
    // Process themes in smaller batches for better performance
    const batchSize = 3
    const results = []
    let processedCount = 0
    
    for (let i = 0; i < themes.length; i += batchSize) {
      const batch = themes.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (theme) => {
        try {
          const alignment = await discoveryEngine.calculateStrategicAlignment(theme, strategy)
          
          // Update theme with new strategic scoring
          const { error: updateError } = await supabaseAdmin
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

          if (updateError) {
            throw new Error(`Failed to update theme ${theme.id}: ${updateError.message}`)
          }

          processedCount++

          return {
            theme_id: theme.id,
            theme_title: theme.title,
            old_alignment_score: theme.strategic_alignment_score,
            new_alignment_score: alignment.alignment_score,
            recommendation: alignment.recommendation,
            status: 'success'
          }
        } catch (error) {
          console.error(`Error recalculating theme ${theme.id}:`, error)
          return {
            theme_id: theme.id,
            theme_title: theme.title,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add delay between batches to respect AI service rate limits
      if (i + batchSize < themes.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'error').length

    // Log the recalculation for audit purposes
    console.log(`Strategic scoring recalculation completed for company ${company_id}: ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      recalculated: successful,
      failed,
      total: themes.length,
      results: results,
      message: `Recalculated strategic scoring for ${successful}/${themes.length} themes`
    })

  } catch (error) {
    console.error('Error in strategic scoring recalculation:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
