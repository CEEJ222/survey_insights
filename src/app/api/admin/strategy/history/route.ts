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

    // Get strategy history (all versions, ordered by version desc)
    const { data: strategies, error: strategiesError } = await supabase
      .from('product_strategy')
      .select(`
        *,
        company_vision!inner(
          id,
          vision_statement,
          mission_statement,
          version
        )
      `)
      .eq('company_id', adminUser.company_id)
      .order('version', { ascending: false })

    if (strategiesError) {
      console.error('Error fetching strategy history:', strategiesError)
      return NextResponse.json({ error: 'Failed to fetch strategy history' }, { status: 500 })
    }

    return NextResponse.json({ strategies: strategies || [] }, { status: 200 })
  } catch (error) {
    console.error('Error fetching strategy history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
