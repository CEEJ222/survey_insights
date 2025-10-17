import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createStrategicIntelligenceEngine } from '@/lib/ai/strategic-intelligence'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const intelligenceEngine = createStrategicIntelligenceEngine(companyId)
    const competitiveAnalysis = await intelligenceEngine.analyzeCompetitivePositioning()

    // Sort by threat level
    const sortedAnalysis = competitiveAnalysis.sort((a, b) => {
      const threatOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return threatOrder[b.threat_level] - threatOrder[a.threat_level]
    })

    return NextResponse.json({
      competitive_analysis: sortedAnalysis,
      total: sortedAnalysis.length,
      threat_summary: {
        critical: competitiveAnalysis.filter(c => c.threat_level === 'critical').length,
        high: competitiveAnalysis.filter(c => c.threat_level === 'high').length,
        medium: competitiveAnalysis.filter(c => c.threat_level === 'medium').length,
        low: competitiveAnalysis.filter(c => c.threat_level === 'low').length
      }
    })

  } catch (error) {
    console.error('Error analyzing competitive positioning:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
