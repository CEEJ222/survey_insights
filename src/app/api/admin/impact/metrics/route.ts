// ============================================================================
// IMPACT METRICS API ENDPOINT
// ============================================================================
// Returns company-wide impact metrics for the dashboard
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getAdminUser } from '@/lib/supabase/admin'
import { getCompanyImpactMetrics } from '@/lib/analytics/customer-impact'

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

    // Get company impact metrics
    const metrics = await getCompanyImpactMetrics((adminUser as any).company_id, '30d')

    return NextResponse.json({
      success: true,
      data: metrics
    })

  } catch (error) {
    console.error('Failed to get impact metrics:', error)
    return NextResponse.json({ 
      error: 'Failed to get impact metrics' 
    }, { status: 500 })
  }
}
