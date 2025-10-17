import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createModelOptimizationEngine } from '@/lib/ai/model-optimization'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const optimizationEngine = createModelOptimizationEngine(companyId)
    const dashboard = await optimizationEngine.getPerformanceDashboardData()

    return NextResponse.json(dashboard)

  } catch (error) {
    console.error('Error getting model performance dashboard:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body

    const optimizationEngine = createModelOptimizationEngine(companyId)

    if (action === 'optimize') {
      const optimizationResults = await optimizationEngine.optimizeModelPerformance()
      
      return NextResponse.json({
        success: true,
        ...optimizationResults
      })
    }

    if (action === 'start_ab_test') {
      const { test_name, request_type, model_a, model_b, traffic_split, duration_days } = body
      
      if (!test_name || !request_type || !model_a || !model_b) {
        return NextResponse.json({ 
          error: 'Missing required fields for A/B test' 
        }, { status: 400 })
      }

      const testId = await optimizationEngine.startABTest({
        test_name,
        request_type,
        model_a,
        model_b,
        traffic_split: traffic_split || 0.5,
        duration_days: duration_days || 14,
        success_metrics: ['accuracy_score', 'response_time_ms', 'cost_per_request']
      })

      return NextResponse.json({
        success: true,
        test_id: testId,
        message: 'A/B test started successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in model performance POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
