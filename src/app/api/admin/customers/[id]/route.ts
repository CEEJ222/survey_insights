import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id
    
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

    // Get customer details
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select(`
        id,
        primary_email,
        full_name,
        company_name,
        job_title,
        industry,
        company_size,
        location,
        subscription_tier,
        account_status,
        created_at,
        updated_at,
        last_activity,
        tags
      `)
      .eq('id', customerId)
      .eq('company_id', (adminUser as any).company_id)
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
        source_table,
        title,
        content,
        sentiment_score,
        priority_score,
        created_at,
        updated_at,
        feedback_date
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
      ? (feedbackItems as any[]).reduce((sum, item) => sum + (item.sentiment_score || 0), 0) / totalFeedback
      : 0
    
    const sentimentDistribution = {
      positive: (feedbackItems as any[])?.filter(item => (item.sentiment_score || 0) > 0.3).length || 0,
      neutral: (feedbackItems as any[])?.filter(item => (item.sentiment_score || 0) >= -0.3 && (item.sentiment_score || 0) <= 0.3).length || 0,
      negative: (feedbackItems as any[])?.filter(item => (item.sentiment_score || 0) < -0.3).length || 0
    }

    const highPriorityCount = (feedbackItems as any[])?.filter(item => (item.priority_score || 0) > 70).length || 0
    
    const sourceTypeDistribution = (feedbackItems as any[])?.reduce((acc, item) => {
      acc[item.source_type] = (acc[item.source_type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get tags from the new tag system for this customer
    const { data: customerTags, error: tagsError } = await supabaseAdmin
      .from('tag_usages')
      .select(`
        tags!inner (
          id,
          name,
          category,
          color
        )
      `)
      .eq('source_type', 'customer')
      .eq('source_id', customerId)

    // Process tag frequency
    const tagFrequency = (customerTags as any[])?.reduce((acc, usage) => {
      const tagName = usage.tags?.name
      if (tagName) {
        acc[tagName] = (acc[tagName] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    // Sort tags by frequency
    const topTags = Object.entries(tagFrequency)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    // Create sentiment trend data (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentFeedback = (feedbackItems as any[])?.filter(item => 
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
        count: (data as any).total,
        avgSentiment: (data as any).sum / (data as any).count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Transform feedback items for display and fetch additional content
    const transformedFeedback = await Promise.all(
      (feedbackItems as any[])?.map(async (item) => {
        let sourceData = null
        let enrichedContent = item.content
        
        // Create source data based on the source_type and available fields
        switch (item.source_type) {
          case 'survey':
          case 'survey_response':
            // For surveys, fetch the actual survey response content if content is missing
            if (!item.content || item.content.trim() === '') {
              try {
                const { data: surveyResponse } = await supabaseAdmin
                  .from('survey_responses')
                  .select(`
                    responses,
                    surveys!inner (
                      title,
                      questions
                    )
                  `)
                  .eq('id', item.source_id)
                  .single()
                
                if (surveyResponse) {
                  // Create a formatted content from survey responses
                  const responses = (surveyResponse as any).responses || {}
                  const questions = (surveyResponse as any).surveys?.questions
                  
                  if (questions && Array.isArray(questions) && questions.length > 0) {
                    enrichedContent = questions.map((q: any) => {
                      const answer = responses[q.id] || 'No answer provided'
                      return `Q: ${q.question || q.text}\nA: ${answer}`
                    }).join('\n\n')
                  } else {
                    // If no questions available, format the responses in a more readable way
                    enrichedContent = Object.entries(responses)
                      .map(([key, value]) => {
                        // Try to make question IDs more readable
                        const questionNumber = key.replace('q', 'Question ')
                        return `${questionNumber}:\n${value}`
                      })
                      .join('\n\n')
                  }
                  
                  sourceData = {
                    type: item.source_type,
                    title: (surveyResponse as any).surveys?.title || item.title || 'Survey',
                    id: item.source_id
                  }
                } else {
                  sourceData = {
                    type: item.source_type,
                    title: item.title || 'Survey',
                    id: item.source_id
                  }
                }
              } catch (error) {
                console.error('Error fetching survey response:', error)
                sourceData = {
                  type: item.source_type,
                  title: item.title || 'Survey',
                  id: item.source_id
                }
              }
            } else {
              // Content already exists, just set source data
              sourceData = {
                type: item.source_type,
                title: item.title || 'Survey',
                id: item.source_id
              }
            }
            break
          case 'interview':
            sourceData = {
              type: 'interview',
              title: item.title || 'Interview',
              id: item.source_id
            }
            break
          case 'review':
            sourceData = {
              type: 'review',
              title: item.title || 'Review',
              id: item.source_id
            }
            break
          case 'reddit':
            sourceData = {
              type: 'reddit',
              title: item.title || 'Reddit Mention',
              id: item.source_id
            }
            break
          case 'support_ticket':
            sourceData = {
              type: 'support_ticket',
              title: item.title || 'Support Ticket',
              id: item.source_id
            }
            break
          default:
            sourceData = {
              type: item.source_type,
              title: item.title || item.source_type,
              id: item.source_id
            }
        }

        const result = {
          id: item.id,
          sourceType: item.source_type,
          content: enrichedContent,
          sentimentScore: item.sentiment_score,
          priorityScore: item.priority_score,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          sourceData
        }
        
        return result
      }) || []
    )

    return NextResponse.json({
      customer: {
        id: (customer as any).id,
        email: (customer as any).primary_email,
        fullName: (customer as any).full_name,
        companyName: (customer as any).company_name,
        jobTitle: (customer as any).job_title,
        industry: (customer as any).industry,
        companySize: (customer as any).company_size,
        location: (customer as any).location,
        subscriptionTier: (customer as any).subscription_tier,
        accountStatus: (customer as any).account_status,
        createdAt: (customer as any).created_at,
        updatedAt: (customer as any).updated_at,
        lastActivityAt: (customer as any).last_activity,
        tags: (customer as any).tags || [],
        healthScore: 50 // Default value since we removed the join
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


