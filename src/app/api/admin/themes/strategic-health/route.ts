import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    // Get all themes for the company
    const { data: themes, error } = await supabaseAdmin
      .from('themes')
      .select(`
        id,
        strategic_alignment_score,
        recommendation,
        final_priority_score,
        priority_score
      `)
      .eq('company_id', companyId)

    if (error) {
      console.error('Error fetching themes for strategic health:', error)
      return NextResponse.json({ error: 'Failed to fetch themes' }, { status: 500 })
    }

    if (!themes || themes.length === 0) {
      return NextResponse.json({
        total: 0,
        aligned: 0,
        conflicted: 0,
        needsReview: 0,
        averageAlignment: 0,
        strategyHealthScore: 0,
        recommendations: {
          high_priority: 0,
          medium_priority: 0,
          low_priority: 0,
          explore_lightweight: 0,
          off_strategy: 0,
          needs_review: 0
        }
      })
    }

    // Calculate metrics
    const total = themes.length
    const aligned = themes.filter(t => (t.strategic_alignment_score || 0) >= 70).length
    const conflicted = themes.filter(t => (t.strategic_alignment_score || 0) < 50).length
    const needsReview = themes.filter(t => t.recommendation === 'needs_review').length
    
    const averageAlignment = themes.reduce((sum, t) => sum + (t.strategic_alignment_score || 50), 0) / total
    
    // Calculate strategy health score (0-100)
    const strategyHealthScore = Math.round((aligned / total) * 100)
    
    // Count recommendations
    const recommendations = themes.reduce((acc, theme) => {
      const rec = theme.recommendation || 'needs_review'
      acc[rec] = (acc[rec] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get themes with highest strategic priority
    const highPriorityThemes = themes
      .filter(t => (t.final_priority_score || 0) >= 80)
      .sort((a, b) => (b.final_priority_score || 0) - (a.final_priority_score || 0))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        name: t.title,
        finalPriority: t.final_priority_score || 0,
        strategicAlignment: t.strategic_alignment_score || 0,
        recommendation: t.recommendation
      }))

    // Get off-strategy themes that need attention
    const offStrategyThemes = themes
      .filter(t => (t.strategic_alignment_score || 0) < 50)
      .sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        name: t.title,
        customerSignal: t.priority_score || 0,
        strategicAlignment: t.strategic_alignment_score || 0,
        recommendation: t.recommendation
      }))

    return NextResponse.json({
      total,
      aligned,
      conflicted,
      needsReview,
      averageAlignment: Math.round(averageAlignment),
      strategyHealthScore,
      recommendations,
      insights: {
        highPriorityThemes,
        offStrategyThemes,
        strategyAlignment: aligned > conflicted ? 'good' : 'needs_attention',
        customerVsStrategy: {
          highCustomerLowStrategy: themes.filter(t => 
            (t.priority_score || 0) >= 80 && (t.strategic_alignment_score || 0) < 50
          ).length,
          highStrategyLowCustomer: themes.filter(t => 
            (t.strategic_alignment_score || 0) >= 80 && (t.priority_score || 0) < 50
          ).length
        }
      }
    })
  } catch (error) {
    console.error('Error in strategic health GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
