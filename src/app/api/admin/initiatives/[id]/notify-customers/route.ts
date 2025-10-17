// ============================================================================
// NOTIFY CUSTOMERS API ENDPOINT
// ============================================================================
// Triggers customer notifications when an initiative ships
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getAdminUser } from '@/lib/supabase/admin'
import { notifyAllAffectedCustomers } from '@/lib/notifications/customer-impact'

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
        error: 'Initiative must be shipped to notify customers' 
      }, { status: 400 })
    }

    // Check if customers have already been notified
    const { data: existingImpacts, error: impactsError } = await supabase
      .from('initiative_customer_impact')
      .select('id')
      .eq('initiative_id', initiativeId)
      .not('notified_at', 'is', null)

    if (impactsError) {
      return NextResponse.json({ 
        error: 'Failed to check notification status' 
      }, { status: 500 })
    }

    if (existingImpacts && existingImpacts.length > 0) {
      return NextResponse.json({ 
        error: 'Customers have already been notified for this initiative' 
      }, { status: 400 })
    }

    // Trigger customer notifications
    await notifyAllAffectedCustomers(initiativeId)

    return NextResponse.json({ 
      success: true,
      message: 'Customer notifications sent successfully'
    })

  } catch (error) {
    console.error('Failed to notify customers:', error)
    return NextResponse.json({ 
      error: 'Failed to notify customers' 
    }, { status: 500 })
  }
}
