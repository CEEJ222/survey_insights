import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
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

    // Get all initiatives for the company
    const { data: initiatives, error } = await supabase
      .from('initiatives')
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
      .eq('company_id', adminUser.company_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching initiatives for timeline:', error)
      return NextResponse.json({ error: 'Failed to fetch initiatives' }, { status: 500 })
    }

    // Group initiatives by timeline bucket
    const timeline = {
      now: initiatives?.filter(i => i.timeline_bucket === 'now') || [],
      next: initiatives?.filter(i => i.timeline_bucket === 'next') || [],
      later: initiatives?.filter(i => i.timeline_bucket === 'later') || []
    }

    // Calculate summary statistics
    const summary = {
      total: initiatives?.length || 0,
      now: timeline.now.length,
      next: timeline.next.length,
      later: timeline.later.length,
      in_progress: initiatives?.filter(i => i.status === 'in_progress').length || 0,
      planned: initiatives?.filter(i => i.status === 'planned').length || 0,
      shipped: initiatives?.filter(i => i.status === 'shipped').length || 0
    }

    return NextResponse.json({ 
      timeline,
      summary,
      initiatives: initiatives || []
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
