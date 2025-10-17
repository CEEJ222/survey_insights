// ============================================================================
// RECENT INITIATIVES IMPACT API ENDPOINT
// ============================================================================
// Returns recently shipped initiatives with their impact data
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getAdminUser } from '@/lib/supabase/admin'
import { getInitiativeImpactSummary } from '@/lib/analytics/customer-impact'

export async function GET(request: NextRequest) {
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

    // Get recent shipped initiatives
    const { data: initiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('company_id', adminUser.company_id)
      .eq('status', 'shipped')
      .not('shipped_at', 'is', null)
      .order('shipped_at', { ascending: false })
      .limit(10)

    if (initiativesError) {
      return NextResponse.json({ 
        error: 'Failed to get initiatives' 
      }, { status: 500 })
    }

    if (!initiatives || initiatives.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Get impact data for each initiative
    const initiativesWithImpact = await Promise.all(
      initiatives.map(async (initiative) => {
        try {
          const impactSummary = await getInitiativeImpactSummary(initiative.id)
          return {
            id: initiative.id,
            title: initiative.title,
            shipped_at: initiative.shipped_at,
            impact: impactSummary
          }
        } catch (error) {
          console.error(`Failed to get impact for initiative ${initiative.id}:`, error)
          return {
            id: initiative.id,
            title: initiative.title,
            shipped_at: initiative.shipped_at,
            impact: {
              totalCustomers: 0,
              notifiedCustomers: 0,
              respondedCustomers: 0,
              averageSatisfaction: 0,
              totalRevenueImpact: 0,
              churnPreventionCount: 0
            }
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: initiativesWithImpact
    })

  } catch (error) {
    console.error('Failed to get recent initiatives impact:', error)
    return NextResponse.json({ 
      error: 'Failed to get recent initiatives impact' 
    }, { status: 500 })
  }
}
