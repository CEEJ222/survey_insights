// ============================================================================
// INITIATIVE IMPACT API ENDPOINT
// ============================================================================
// Handles impact measurement and ROI tracking for initiatives
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getAdminUser } from '@/lib/supabase/admin'
import { measureInitiativeImpact, getInitiativeImpactSummary } from '@/lib/analytics/customer-impact'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the pre-configured supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user to verify permissions
    const { data: adminUser, error: adminError } = await getAdminUser(user.id)
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    const initiativeId = params.id

    // Verify initiative exists and belongs to user's company
    const { data: initiative, error: initiativeError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('id', initiativeId)
      .eq('company_id', (adminUser as any).company_id)
      .single()

    if (initiativeError || !initiative) {
      return NextResponse.json({ 
        error: 'Initiative not found or access denied' 
      }, { status: 404 })
    }

    // Get impact summary
    const impactSummary = await getInitiativeImpactSummary(initiativeId)

    return NextResponse.json({
      success: true,
      data: {
        initiative: {
          id: (initiative as any).id,
          title: (initiative as any).title,
          status: (initiative as any).status,
          shipped_at: (initiative as any).shipped_at
        },
        impact: impactSummary
      }
    })

  } catch (error) {
    console.error('Failed to get initiative impact:', error)
    return NextResponse.json({ 
      error: 'Failed to get initiative impact' 
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the pre-configured supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user to verify permissions
    const { data: adminUser, error: adminError } = await getAdminUser(user.id)
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    const initiativeId = params.id

    // Verify initiative exists and belongs to user's company
    const { data: initiative, error: initiativeError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('id', initiativeId)
      .eq('company_id', (adminUser as any).company_id)
      .single()

    if (initiativeError || !initiative) {
      return NextResponse.json({ 
        error: 'Initiative not found or access denied' 
      }, { status: 404 })
    }

    // Check if initiative is shipped
    if ((initiative as any).status !== 'shipped') {
      return NextResponse.json({ 
        error: 'Initiative must be shipped to measure impact' 
      }, { status: 400 })
    }

    // Measure impact for all customers
    const measurements = await measureInitiativeImpact(initiativeId)

    return NextResponse.json({
      success: true,
      message: 'Impact measurement completed',
      data: {
        measurementsCount: measurements.length,
        measurements: measurements.map(m => ({
          customerId: m.customerId,
          satisfactionScore: m.satisfactionScore,
          usageIncrease: m.usageIncrease,
          churnPrevention: m.churnPrevention,
          businessImpact: m.businessImpact
        }))
      }
    })

  } catch (error) {
    console.error('Failed to measure initiative impact:', error)
    return NextResponse.json({ 
      error: 'Failed to measure initiative impact' 
    }, { status: 500 })
  }
}
