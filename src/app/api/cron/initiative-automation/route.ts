// ============================================================================
// INITIATIVE AUTOMATION CRON JOB
// ============================================================================
// Runs automation checks for shipped initiatives
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { runInitiativeAutomation } from '@/lib/automation/initiative-automation'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting initiative automation cron job...')
    
    // Run automation
    await runInitiativeAutomation()
    
    return NextResponse.json({
      success: true,
      message: 'Initiative automation completed',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Initiative automation cron job failed:', error)
    return NextResponse.json({ 
      error: 'Initiative automation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Allow POST as well for different cron services
export async function POST(request: NextRequest) {
  return GET(request)
}
