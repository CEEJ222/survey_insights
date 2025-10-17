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

    // Get current active vision
    const { data: vision, error: visionError } = await supabase
      .from('company_vision')
      .select('*')
      .eq('company_id', adminUser.company_id)
      .eq('is_active', true)
      .single()

    if (visionError) {
      if (visionError.code === 'PGRST116') {
        // No active vision found
        return NextResponse.json({ vision: null }, { status: 200 })
      }
      return NextResponse.json({ error: 'Failed to fetch vision' }, { status: 500 })
    }

    return NextResponse.json({ vision }, { status: 200 })
  } catch (error) {
    console.error('Error fetching current vision:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
