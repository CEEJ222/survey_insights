import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createStrategicIntelligenceEngine } from '@/lib/ai/strategic-intelligence'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const insightType = searchParams.get('type') // opportunity, risk, trend, gap

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const intelligenceEngine = createStrategicIntelligenceEngine(companyId)
    const insights = await intelligenceEngine.generateStrategicInsights()

    // Filter by type if specified
    const filteredInsights = insightType 
      ? insights.filter(insight => insight.type === insightType)
      : insights

    // Sort by impact score and confidence
    const sortedInsights = filteredInsights.sort((a, b) => {
      const scoreA = (a.impact_score + a.confidence_score) / 2
      const scoreB = (b.impact_score + b.confidence_score) / 2
      return scoreB - scoreA
    })

    return NextResponse.json({
      insights: sortedInsights,
      total: sortedInsights.length,
      summary: {
        opportunities: insights.filter(i => i.type === 'opportunity').length,
        risks: insights.filter(i => i.type === 'risk').length,
        trends: insights.filter(i => i.type === 'trend').length,
        gaps: insights.filter(i => i.type === 'gap').length
      }
    })

  } catch (error) {
    console.error('Error generating strategic insights:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
