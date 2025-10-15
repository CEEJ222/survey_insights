import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id

    // Get customer details
    const { data: customer, error: customerError } = await supabaseAdmin
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
        customer_identifiers (
          identifier_type,
          identifier_value
        )
      `)
      .eq('id', customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get all feedback items for this customer
    const { data: feedbackItems, error: feedbackError } = await supabaseAdmin
      .from('feedback_items')
      .select(`
        id,
        source_type,
        source_id,
        content,
        sentiment_score,
        priority_score,
        ai_tags,
        created_at,
        updated_at,
        surveys (
          title,
          id
        ),
        survey_responses (
          responses,
          metadata
        ),
        interviews (
          title,
          transcript
        ),
        reviews (
          platform,
          rating,
          content
        ),
        reddit_mentions (
          subreddit,
          post_title,
          content
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (feedbackError) {
      console.error('Error fetching feedback items:', feedbackError)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    // Calculate analytics
    const totalFeedback = feedbackItems?.length || 0
    const avgSentiment = totalFeedback > 0 
      ? feedbackItems.reduce((sum, item) => sum + (item.sentiment_score || 0), 0) / totalFeedback
      : 0
    
    const sentimentDistribution = {
      positive: feedbackItems?.filter(item => (item.sentiment_score || 0) > 0.3).length || 0,
      neutral: feedbackItems?.filter(item => (item.sentiment_score || 0) >= -0.3 && (item.sentiment_score || 0) <= 0.3).length || 0,
      negative: feedbackItems?.filter(item => (item.sentiment_score || 0) < -0.3).length || 0
    }

    const highPriorityCount = feedbackItems?.filter(item => (item.priority_score || 0) > 70).length || 0
    
    const sourceTypeDistribution = feedbackItems?.reduce((acc, item) => {
      acc[item.source_type] = (acc[item.source_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get all unique tags
    const allTags = feedbackItems?.flatMap(item => item.ai_tags || []) || []
    const tagFrequency = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Sort tags by frequency
    const topTags = Object.entries(tagFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    // Create sentiment trend data (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentFeedback = feedbackItems?.filter(item => 
      new Date(item.created_at) >= thirtyDaysAgo
    ) || []

    const sentimentTrend = recentFeedback.reduce((acc, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { total: 0, sum: 0, count: 0 }
      }
      acc[date].total += 1
      acc[date].sum += item.sentiment_score || 0
      acc[date].count += 1
      return acc
    }, {} as Record<string, { total: number, sum: number, count: number }>)

    const sentimentTrendData = Object.entries(sentimentTrend)
      .map(([date, data]) => ({
        date,
        count: data.total,
        avgSentiment: data.sum / data.count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Transform feedback items for display
    const transformedFeedback = feedbackItems?.map(item => {
      let sourceData = null
      
      switch (item.source_type) {
        case 'survey':
          sourceData = {
            type: 'survey',
            title: item.surveys?.title || 'Survey',
            id: item.source_id
          }
          break
        case 'survey_response':
          sourceData = {
            type: 'survey_response',
            title: item.surveys?.title || 'Survey Response',
            id: item.source_id
          }
          break
        case 'interview':
          sourceData = {
            type: 'interview',
            title: item.interviews?.title || 'Interview',
            id: item.source_id
          }
          break
        case 'review':
          sourceData = {
            type: 'review',
            title: `${item.reviews?.platform || 'Review'} (${item.reviews?.rating || 'N/A'} stars)`,
            id: item.source_id
          }
          break
        case 'reddit_mention':
          sourceData = {
            type: 'reddit_mention',
            title: `Reddit: ${item.reddit_mentions?.subreddit || 'Unknown'}`,
            id: item.source_id
          }
          break
      }

      return {
        id: item.id,
        sourceType: item.source_type,
        content: item.content,
        sentimentScore: item.sentiment_score,
        priorityScore: item.priority_score,
        aiTags: item.ai_tags || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        sourceData
      }
    }) || []

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.full_name,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
        lastActivityAt: customer.last_activity_at,
        healthScore: customer.customer_health_scores?.[0]?.health_score || 50,
        identifiers: customer.customer_identifiers || []
      },
      analytics: {
        totalFeedback,
        avgSentiment: Math.round(avgSentiment * 100) / 100,
        sentimentDistribution,
        highPriorityCount,
        sourceTypeDistribution,
        topTags
      },
      sentimentTrend: sentimentTrendData,
      feedback: transformedFeedback
    })

  } catch (error) {
    console.error('Error in customer profile API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
