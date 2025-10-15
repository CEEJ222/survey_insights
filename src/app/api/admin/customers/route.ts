import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
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
        email,
        full_name,
        created_at,
        updated_at,
        last_activity_at,
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

    // Add search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }

    // Add health filter
    if (healthFilter) {
      query = query.eq('customer_health_scores.health_score', healthFilter)
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1).order('last_activity_at', { ascending: false })

    const { data: customers, error } = await query

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact', head: true })

    // Transform the data to include calculated fields
    const transformedCustomers = customers?.map(customer => {
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
        email: customer.email,
        fullName: customer.full_name,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
        lastActivityAt: customer.last_activity_at,
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

    return NextResponse.json({
      customers: transformedCustomers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
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
