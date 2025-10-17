import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { calculateAllCustomerHealthScores } from '@/lib/analytics/customer-health'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Customer health calculation API called')
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    console.log('🔑 User authenticated:', user.id, user.email)

    // Get user's company_id from admin_users table
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      console.error('❌ Admin user not found:', adminError)
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    console.log('🏢 Company ID:', (adminUser as any).company_id)

    // Calculate health scores for all customers
    await calculateAllCustomerHealthScores((adminUser as any).company_id)

    return NextResponse.json({
      success: true,
      message: 'Customer health scores calculated successfully'
    })

  } catch (error) {
    console.error('Error in customer health calculation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
