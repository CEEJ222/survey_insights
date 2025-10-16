import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Customers API called')
    
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const healthFilter = searchParams.get('health') || ''
    
    const offset = (page - 1) * limit

    // Build the base query
    let query = supabaseAdmin
      .from('customers')
      .select(`
        id,
        primary_email,
        full_name,
        created_at,
        updated_at,
        last_activity,
        customer_health_scores (
          health_score,
          calculated_at
        ),
        feedback_items (
          id,
          source_type,
          sentiment_score,
          priority_score,
          created_at
        )
      `)
      .eq('company_id', (adminUser as any).company_id)

    // Add search filter
    if (search) {
      query = query.or(`primary_email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Add health filter - we'll apply this after getting the data since Supabase filtering on joins can be tricky

    // Remove pagination from query since we'll filter first, then paginate
    query = query.order('created_at', { ascending: false })

    const { data: customers, error } = await query

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    // Transform the data to include calculated fields
    let transformedCustomers = (customers as any[])?.map(customer => {
      const feedbackItems = customer.feedback_items || []
      const healthScore = customer.customer_health_scores?.[0]?.health_score || 50
      
      // Calculate metrics
      const totalFeedback = feedbackItems.length
      const avgSentiment = feedbackItems.length > 0 
        ? feedbackItems.reduce((sum: number, item: any) => sum + (item.sentiment_score || 0), 0) / feedbackItems.length
        : 0
      const highPriorityCount = feedbackItems.filter((item: any) => (item.priority_score || 0) > 70).length

      return {
        id: customer.id,
        email: customer.primary_email,
        fullName: customer.full_name,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
        lastActivityAt: customer.last_activity,
        healthScore,
        totalFeedback,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        highPriorityCount,
        recentFeedback: feedbackItems.slice(0, 3).map((item: any) => ({
          id: item.id,
          sourceType: item.source_type,
          sentimentScore: item.sentiment_score,
          priorityScore: item.priority_score,
          createdAt: item.created_at
        }))
      }
    }) || []

    // Apply health filter after data transformation
    if (healthFilter) {
      const healthScore = parseInt(healthFilter)
      transformedCustomers = transformedCustomers.filter(customer => {
        if (healthScore === 80) {
          // Excellent (80+)
          return customer.healthScore >= 80
        } else if (healthScore === 60) {
          // Good (60-79)
          return customer.healthScore >= 60 && customer.healthScore < 80
        } else if (healthScore === 40) {
          // Fair (40-59)
          return customer.healthScore >= 40 && customer.healthScore < 60
        } else if (healthScore === 20) {
          // Poor (20-39)
          return customer.healthScore >= 20 && customer.healthScore < 40
        } else if (healthScore === 0) {
          // Critical (0-19)
          return customer.healthScore >= 0 && customer.healthScore < 20
        }
        return true
      })
    }

    // Apply pagination after filtering
    const totalFiltered = transformedCustomers.length
    const startIndex = offset
    const endIndex = startIndex + limit
    const paginatedCustomers = transformedCustomers.slice(startIndex, endIndex)

    return NextResponse.json({
      customers: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit)
      }
    })

  } catch (error) {
    console.error('Error in customers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
