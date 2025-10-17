import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const timeframe = searchParams.get('timeframe') || '30' // days

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeframe))

    // Get comprehensive theme data
    const { data: themes, error: themesError } = await supabaseAdmin
      .from('themes')
      .select(`
        id,
        title,
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
      .gte('created_at', startDate.toISOString())

    if (themesError) {
      console.error('Error fetching themes for strategic summary:', themesError)
      return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 })
    }

    if (!themes || themes.length === 0) {
      return NextResponse.json({
        summary: {
          total_themes: 0,
          period: `${timeframe} days`,
          strategy_health_score: 0
        },
        metrics: {
          alignment_distribution: {},
          recommendation_breakdown: {},
          priority_distribution: {}
        },
        insights: {
          top_strategic_themes: [],
          off_strategy_alerts: [],
          customer_vs_strategy_gaps: []
        },
        trends: {
          alignment_trend: 'stable',
          theme_velocity: 0,
          review_completion_rate: 0
        }
      })
    }

    // Calculate comprehensive metrics
    const totalThemes = themes.length
    const alignedThemes = themes.filter(t => (t.strategic_alignment_score || 0) >= 70).length
    const conflictedThemes = themes.filter(t => (t.strategic_alignment_score || 0) < 50).length
    const reviewedThemes = themes.filter(t => t.recommendation !== 'needs_review').length
    
    // Strategy health score (0-100)
    const strategyHealthScore = Math.round((alignedThemes / totalThemes) * 100)
    
    // Alignment distribution
    const alignmentDistribution = {
      high_alignment: themes.filter(t => (t.strategic_alignment_score || 0) >= 80).length,
      medium_alignment: themes.filter(t => (t.strategic_alignment_score || 0) >= 60 && (t.strategic_alignment_score || 0) < 80).length,
      low_alignment: themes.filter(t => (t.strategic_alignment_score || 0) < 60).length
    }

    // Recommendation breakdown
    const recommendationBreakdown = themes.reduce((acc, theme) => {
      const rec = theme.recommendation || 'needs_review'
      acc[rec] = (acc[rec] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Priority distribution
    const priorityDistribution = {
      high_priority: themes.filter(t => (t.final_priority_score || 0) >= 80).length,
      medium_priority: themes.filter(t => (t.final_priority_score || 0) >= 60 && (t.final_priority_score || 0) < 80).length,
      low_priority: themes.filter(t => (t.final_priority_score || 0) < 60).length
    }

    // Top strategic themes (highest final priority score)
    const topStrategicThemes = themes
      .filter(t => (t.final_priority_score || 0) >= 70)
      .sort((a, b) => (b.final_priority_score || 0) - (a.final_priority_score || 0))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        final_priority_score: t.final_priority_score || 0,
        strategic_alignment_score: t.strategic_alignment_score || 0,
        customer_signal: t.priority_score || 0,
        recommendation: t.recommendation,
        reasoning: t.strategic_reasoning
      }))

    // Off-strategy alerts (high customer signal, low strategic alignment)
    const offStrategyAlerts = themes
      .filter(t => (t.priority_score || 0) >= 70 && (t.strategic_alignment_score || 0) < 50)
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        title: t.title,
        customer_signal: t.priority_score || 0,
        strategic_alignment_score: t.strategic_alignment_score || 0,
        gap_size: (t.priority_score || 0) - (t.strategic_alignment_score || 0),
        recommendation: t.recommendation,
        conflicts: t.strategic_conflicts || []
      }))

    // Customer vs Strategy gaps
    const customerVsStrategyGaps = {
      high_customer_low_strategy: themes.filter(t => 
        (t.priority_score || 0) >= 80 && (t.strategic_alignment_score || 0) < 50
      ).length,
      high_strategy_low_customer: themes.filter(t => 
        (t.strategic_alignment_score || 0) >= 80 && (t.priority_score || 0) < 50
      ).length,
      well_aligned: themes.filter(t => 
        Math.abs((t.priority_score || 0) - (t.strategic_alignment_score || 0)) <= 20
      ).length
    }

    // Calculate trends (simplified - in production you'd want more sophisticated trend analysis)
    const averageAlignment = themes.reduce((sum, t) => sum + (t.strategic_alignment_score || 50), 0) / totalThemes
    const alignmentTrend = averageAlignment >= 70 ? 'improving' : averageAlignment >= 50 ? 'stable' : 'declining'
    
    const reviewCompletionRate = Math.round((reviewedThemes / totalThemes) * 100)
    
    // Theme velocity (themes created per week)
    const daysInPeriod = parseInt(timeframe)
    const themeVelocity = Math.round((totalThemes / daysInPeriod) * 7)

    return NextResponse.json({
      summary: {
        total_themes: totalThemes,
        period: `${timeframe} days`,
        strategy_health_score: strategyHealthScore,
        alignment_rate: Math.round((alignedThemes / totalThemes) * 100),
        conflict_rate: Math.round((conflictedThemes / totalThemes) * 100),
        review_completion_rate: reviewCompletionRate
      },
      metrics: {
        alignment_distribution: alignmentDistribution,
        recommendation_breakdown: recommendationBreakdown,
        priority_distribution: priorityDistribution
      },
      insights: {
        top_strategic_themes: topStrategicThemes,
        off_strategy_alerts: offStrategyAlerts,
        customer_vs_strategy_gaps: customerVsStrategyGaps
      },
      trends: {
        alignment_trend: alignmentTrend,
        theme_velocity: themeVelocity,
        review_completion_rate: reviewCompletionRate,
        average_alignment_score: Math.round(averageAlignment)
      },
      recommendations: {
        immediate_actions: offStrategyAlerts.length > 0 ? [
          `Review ${offStrategyAlerts.length} high-signal themes with low strategic alignment`,
          'Consider strategy updates for frequently requested features'
        ] : [],
        strategic_focus: topStrategicThemes.length > 0 ? [
          `Prioritize development of ${topStrategicThemes.length} high-strategic-value themes`,
          'Monitor customer feedback for strategic theme validation'
        ] : [],
        process_improvements: reviewCompletionRate < 80 ? [
          'Increase theme review frequency',
          'Consider batch review processes'
        ] : []
      }
    })

  } catch (error) {
    console.error('Error in strategic summary GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
