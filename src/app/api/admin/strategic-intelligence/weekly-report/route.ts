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
    const weeklyReport = await intelligenceEngine.generateWeeklyStrategicReport()

    return NextResponse.json({
      report: weeklyReport,
      generated_at: new Date().toISOString(),
      company_id: companyId
    })

  } catch (error) {
    console.error('Error generating weekly strategic report:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
