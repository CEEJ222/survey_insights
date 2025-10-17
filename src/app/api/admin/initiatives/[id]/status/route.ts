import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { notifyAllAffectedCustomers } from '@/lib/notifications/customer-impact'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the pre-configured supabase client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user to find company_id
    const { data: adminUser, error: adminError } = await getAdminUser(user.id)
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    const body = await request.json()
    const { status, started_at, shipped_at, actual_impact, retrospective_url } = body

    // Validation
    if (!status || !['backlog', 'planned', 'in_progress', 'shipped', 'cancelled'].includes(status)) {
      return NextResponse.json({ 
        error: 'Status must be one of: backlog, planned, in_progress, shipped, cancelled' 
      }, { status: 400 })
    }

    // Build update object
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Set timestamps based on status
    if (status === 'in_progress' && !started_at) {
      updateData.started_at = new Date().toISOString()
    } else if (started_at) {
      updateData.started_at = started_at
    }

    if (status === 'shipped' && !shipped_at) {
      updateData.shipped_at = new Date().toISOString()
    } else if (shipped_at) {
      updateData.shipped_at = shipped_at
    }

    if (actual_impact !== undefined) {
      updateData.actual_impact = actual_impact || null
    }

    if (retrospective_url !== undefined) {
      updateData.retrospective_url = retrospective_url || null
    }

    // Update initiative status
    const { data: updatedInitiative, error: updateError } = await (supabaseAdmin as any)
      .from('initiatives')
      .update(updateData)
      .eq('id', params.id)
      .eq('company_id', (adminUser as any).company_id)
      .select(`
        *,
        themes!initiatives_theme_id_fkey(
          id,
          name,
          description,
          customer_count,
          mention_count,
          priority_score,
          strategic_alignment_score,
          final_priority_score,
          recommendation
        ),
        strategic_objectives!initiatives_objective_id_fkey(
          id,
          objective,
          quarter,
          status
        ),
        admin_users!initiatives_owner_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating initiative status:', updateError)
      return NextResponse.json({ error: 'Failed to update initiative status' }, { status: 500 })
    }

    if (!updatedInitiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 })
    }

    // If initiative was just shipped, trigger customer notifications
    if (status === 'shipped' && updateData.shipped_at) {
      try {
        console.log(`Initiative ${params.id} shipped, triggering customer notifications...`)
        await notifyAllAffectedCustomers(params.id)
        console.log(`Customer notifications sent for initiative ${params.id}`)
      } catch (error) {
        console.error(`Failed to notify customers for initiative ${params.id}:`, error)
        // Don't fail the status update if notifications fail
      }
    }

    return NextResponse.json({ 
      initiative: updatedInitiative,
      message: 'Initiative status updated successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Error updating initiative status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
