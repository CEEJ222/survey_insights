import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createThemeDiscoveryEngine } from '@/lib/ai/theme-discovery'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_id, theme_ids, batch_id } = body

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

    // Get themes to process
    let query = supabaseAdmin
      .from('themes')
      .select('*')
      .eq('company_id', company_id)

    if (theme_ids && theme_ids.length > 0) {
      query = query.in('id', theme_ids)
    }

    const { data: themes, error: themesError } = await query

    if (themesError) {
      console.error('Error fetching themes:', themesError)
      return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 })
    }

    if (!themes || themes.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0,
        batch_id: batch_id || `batch_${Date.now()}`,
        message: 'No themes to process'
      })
    }

    // Initialize theme discovery engine
    const discoveryEngine = createThemeDiscoveryEngine(company_id)
    
    // Process themes in batches to avoid overwhelming the AI service
    const batchSize = 5
    const results = []
    
    for (let i = 0; i < themes.length; i += batchSize) {
      const batch = themes.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (theme) => {
        try {
          const alignment = await discoveryEngine.calculateStrategicAlignment(theme, strategy)
          
          // Update theme with strategic scoring
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

          return {
            theme_id: theme.id,
            theme_title: theme.title,
            alignment_score: alignment.alignment_score,
            recommendation: alignment.recommendation,
            final_priority_score: Math.round(theme.priority_score * (alignment.alignment_score / 100)),
            status: 'success'
          }
        } catch (error) {
          console.error(`Error processing theme ${theme.id}:`, error)
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

      // Add delay between batches to respect rate limits
      if (i + batchSize < themes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const successful = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'error').length

    // Store batch processing result
    const finalBatchId = batch_id || `batch_${Date.now()}`
    
    return NextResponse.json({
      success: true,
      batch_id: finalBatchId,
      processed: successful,
      failed,
      total: themes.length,
      results: results,
      message: `Processed ${successful}/${themes.length} themes successfully`
    })

  } catch (error) {
    console.error('Error in strategic scoring calculation:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batch_id')

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 })
    }

    // In a real implementation, you might want to store batch processing status
    // For now, we'll return a simple status
    return NextResponse.json({
      batch_id: batchId,
      status: 'completed',
      processed_at: new Date().toISOString(),
      message: 'Batch processing completed'
    })

  } catch (error) {
    console.error('Error getting batch status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
