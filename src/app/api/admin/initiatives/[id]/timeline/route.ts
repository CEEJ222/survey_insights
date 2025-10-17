import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Use the pre-configured supabaseAdmin client
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
    const { timeline_bucket, target_quarter } = body

    // Validation
    if (!timeline_bucket || !['now', 'next', 'later'].includes(timeline_bucket)) {
      return NextResponse.json({ 
        error: 'Timeline bucket must be one of: now, next, later' 
      }, { status: 400 })
    }

    // Build update object
    const updateData: any = {
      timeline_bucket,
      updated_at: new Date().toISOString()
    }

    if (target_quarter !== undefined) {
      updateData.target_quarter = target_quarter || null
    }

    // Update initiative timeline
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
      console.error('Error updating initiative timeline:', updateError)
      return NextResponse.json({ error: 'Failed to update initiative timeline' }, { status: 500 })
    }

    if (!updatedInitiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      initiative: updatedInitiative,
      message: 'Initiative timeline updated successfully'
    }, { status: 200 })
  } catch (error) {
    console.error('Error updating initiative timeline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
