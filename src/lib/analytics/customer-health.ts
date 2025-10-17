import { supabaseAdmin } from '@/lib/supabase/server'

interface CustomerHealthCalculation {
  customerId: string
  companyId: string
  healthScore: number
  churnRiskScore: number
  sentimentTrend: 'improving' | 'declining' | 'stable'
  feedbackFrequency: 'increasing' | 'decreasing' | 'stable'
  recentNegativeFeedbackCount: number
  daysSinceLastActivity: number
  riskFactors: Array<{
    factor: string
    weight: number
    description: string
  }>
  recommendations: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    expectedImpact: string
  }>
}

export async function calculateCustomerHealthScore(
  customerId: string,
  companyId: string
): Promise<CustomerHealthCalculation> {
  // Get customer feedback data
  const { data: feedbackItems, error: feedbackError } = await supabaseAdmin
    .from('feedback_items')
    .select(`
      sentiment_score,
      priority_score,
      created_at,
      source_type
    `)
    .eq('customer_id', customerId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (feedbackError) {
    throw new Error(`Failed to fetch feedback: ${feedbackError.message}`)
  }

  // Get customer data
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('last_activity, created_at')
    .eq('id', customerId)
    .single()

  if (customerError) {
    throw new Error(`Failed to fetch customer: ${customerError.message}`)
  }

  // Calculate metrics
  const now = new Date()
  const lastActivity = customer.last_activity ? new Date(customer.last_activity) : null
  const daysSinceLastActivity = lastActivity 
    ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    : Math.floor((now.getTime() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24))

  // Calculate sentiment metrics
  const sentimentScores = feedbackItems
    .filter(item => item.sentiment_score !== null)
    .map(item => item.sentiment_score)

  const avgSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
    : 0

  // Calculate sentiment trend (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  const recentSentiment = feedbackItems
    .filter(item => new Date(item.created_at) >= thirtyDaysAgo)
    .map(item => item.sentiment_score)
    .filter(score => score !== null)

  const previousSentiment = feedbackItems
    .filter(item => {
      const date = new Date(item.created_at)
      return date >= sixtyDaysAgo && date < thirtyDaysAgo
    })
    .map(item => item.sentiment_score)
    .filter(score => score !== null)

  const recentAvg = recentSentiment.length > 0
    ? recentSentiment.reduce((sum, score) => sum + score, 0) / recentSentiment.length
    : 0

  const previousAvg = previousSentiment.length > 0
    ? previousSentiment.reduce((sum, score) => sum + score, 0) / previousSentiment.length
    : 0

  const sentimentTrend = recentAvg > previousAvg + 0.1 ? 'improving'
    : recentAvg < previousAvg - 0.1 ? 'declining'
    : 'stable'

  // Calculate feedback frequency
  const feedbackCountLast30Days = feedbackItems.filter(
    item => new Date(item.created_at) >= thirtyDaysAgo
  ).length

  const feedbackCountPrevious30Days = feedbackItems.filter(item => {
    const date = new Date(item.created_at)
    return date >= sixtyDaysAgo && date < thirtyDaysAgo
  }).length

  const feedbackFrequency = feedbackCountLast30Days > feedbackCountPrevious30Days ? 'increasing'
    : feedbackCountLast30Days < feedbackCountPrevious30Days ? 'decreasing'
    : 'stable'

  // Count recent negative feedback
  const recentNegativeFeedbackCount = feedbackItems.filter(
    item => new Date(item.created_at) >= thirtyDaysAgo && item.sentiment_score < -0.3
  ).length

  // Calculate health score (0-100)
  let healthScore = 50 // Base score

  // Sentiment impact (+/- 20 points)
  if (avgSentiment > 0.5) healthScore += 20
  else if (avgSentiment > 0.2) healthScore += 10
  else if (avgSentiment < -0.5) healthScore -= 20
  else if (avgSentiment < -0.2) healthScore -= 10

  // Activity impact (+/- 15 points)
  if (daysSinceLastActivity <= 7) healthScore += 15
  else if (daysSinceLastActivity <= 30) healthScore += 5
  else if (daysSinceLastActivity > 90) healthScore -= 15
  else if (daysSinceLastActivity > 60) healthScore -= 10

  // Feedback frequency impact (+/- 10 points)
  if (feedbackFrequency === 'increasing') healthScore += 10
  else if (feedbackFrequency === 'decreasing') healthScore -= 10

  // Negative feedback impact (-5 points per recent negative feedback)
  healthScore -= Math.min(recentNegativeFeedbackCount * 5, 25)

  // Ensure score is within bounds
  healthScore = Math.max(0, Math.min(100, healthScore))

  // Calculate churn risk (inverse of health score with additional factors)
  let churnRiskScore = 100 - healthScore

  // Additional risk factors
  if (daysSinceLastActivity > 60) churnRiskScore += 15
  if (recentNegativeFeedbackCount > 2) churnRiskScore += 10
  if (avgSentiment < -0.3) churnRiskScore += 10

  churnRiskScore = Math.max(0, Math.min(100, churnRiskScore))

  // Generate risk factors
  const riskFactors = []
  if (daysSinceLastActivity > 30) {
    riskFactors.push({
      factor: 'Low Activity',
      weight: Math.min(daysSinceLastActivity / 30, 3),
      description: `Last activity ${daysSinceLastActivity} days ago`
    })
  }
  if (recentNegativeFeedbackCount > 0) {
    riskFactors.push({
      factor: 'Negative Feedback',
      weight: recentNegativeFeedbackCount,
      description: `${recentNegativeFeedbackCount} negative feedback items in last 30 days`
    })
  }
  if (avgSentiment < -0.2) {
    riskFactors.push({
      factor: 'Low Sentiment',
      weight: Math.abs(avgSentiment) * 2,
      description: `Average sentiment: ${avgSentiment.toFixed(2)}`
    })
  }

  // Generate recommendations
  const recommendations = []
  if (daysSinceLastActivity > 30) {
    recommendations.push({
      action: 'Re-engagement Campaign',
      priority: 'high' as const,
      expectedImpact: 'Increase activity and reduce churn risk'
    })
  }
  if (recentNegativeFeedbackCount > 0) {
    recommendations.push({
      action: 'Address Negative Feedback',
      priority: 'high' as const,
      expectedImpact: 'Improve satisfaction and reduce complaints'
    })
  }
  if (avgSentiment < 0) {
    recommendations.push({
      action: 'Sentiment Improvement',
      priority: 'medium' as const,
      expectedImpact: 'Boost overall customer satisfaction'
    })
  }

  return {
    customerId,
    companyId,
    healthScore: Math.round(healthScore),
    churnRiskScore: Math.round(churnRiskScore),
    sentimentTrend,
    feedbackFrequency,
    recentNegativeFeedbackCount,
    daysSinceLastActivity,
    riskFactors,
    recommendations
  }
}

export async function updateCustomerHealthScore(
  customerId: string,
  companyId: string
): Promise<void> {
  const healthData = await calculateCustomerHealthScore(customerId, companyId)

  // Upsert health score
  const { error } = await supabaseAdmin
    .from('customer_health_scores')
    .upsert({
      customer_id: customerId,
      company_id: companyId,
      health_score: healthData.healthScore,
      churn_risk_score: healthData.churnRiskScore,
      sentiment_trend: healthData.sentimentTrend,
      feedback_frequency: healthData.feedbackFrequency,
      recent_negative_feedback_count: healthData.recentNegativeFeedbackCount,
      days_since_last_activity: healthData.daysSinceLastActivity,
      risk_factors: healthData.riskFactors,
      recommendations: healthData.recommendations,
      calculated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expire in 7 days
    })

  if (error) {
    throw new Error(`Failed to update health score: ${error.message}`)
  }
}

export async function calculateAllCustomerHealthScores(
  companyId: string
): Promise<void> {
  // Get all customers for the company
  const { data: customers, error } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('company_id', companyId)

  if (error) {
    throw new Error(`Failed to fetch customers: ${error.message}`)
  }

  // Calculate health scores for each customer
  for (const customer of customers || []) {
    try {
      await updateCustomerHealthScore(customer.id, companyId)
    } catch (error) {
      console.error(`Failed to calculate health score for customer ${customer.id}:`, error)
    }
  }
}
