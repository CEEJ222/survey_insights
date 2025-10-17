// ============================================================================
// CUSTOMER IMPACT MEASUREMENT SYSTEM
// ============================================================================
// Handles follow-up surveys and ROI tracking for shipped initiatives
// ============================================================================

import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Initiative = Database['public']['Tables']['initiatives']['Row']
type Customer = Database['public']['Tables']['customers']['Row']
type InitiativeCustomerImpact = Database['public']['Tables']['initiative_customer_impact']['Row']

export interface ImpactMeasurement {
  initiativeId: string
  customerId: string
  satisfactionScore: number
  usageIncrease?: number
  churnPrevention?: boolean
  businessImpact?: {
    revenueImpact: number
    retentionImpact: number
    npsImpact: number
  }
}

export interface FollowUpSurvey {
  initiativeId: string
  customerId: string
  questions: SurveyQuestion[]
  responses: SurveyResponse[]
}

export interface SurveyQuestion {
  id: string
  question: string
  type: 'rating' | 'multiple_choice' | 'text' | 'boolean'
  options?: string[]
  required: boolean
}

export interface SurveyResponse {
  questionId: string
  response: string | number | boolean
  timestamp: string
}

// ============================================================================
// IMPACT MEASUREMENT FUNCTIONS
// ============================================================================

/**
 * Measure impact for all customers of a shipped initiative
 */
export async function measureInitiativeImpact(
  initiativeId: string
): Promise<ImpactMeasurement[]> {
  // Use the pre-configured supabase client
  
  try {
    // Get initiative details
    const { data: initiative, error: initiativeError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('id', initiativeId)
      .single()

    if (initiativeError || !initiative) {
      throw new Error(`Initiative not found: ${initiativeError?.message}`)
    }

    // Get all customer impacts for this initiative
    const { data: customerImpacts, error: impactsError } = await supabase
      .from('initiative_customer_impact')
      .select(`
        *,
        customers (
          id,
          full_name,
          primary_email
        )
      `)
      .eq('initiative_id', initiativeId)

    if (impactsError || !customerImpacts) {
      throw new Error(`Failed to get customer impacts: ${impactsError?.message}`)
    }

    const measurements: ImpactMeasurement[] = []

    for (const impact of customerImpacts) {
      try {
        // Send follow-up survey
        const surveyResponse = await sendFollowUpSurvey({
          initiativeId,
          customerId: impact.customer_id,
          questions: getDefaultImpactSurveyQuestions()
        })

        // Calculate usage increase
        const usageIncrease = await calculateUsageIncrease(
          impact.customer_id,
          initiative.shipped_at
        )

        // Determine churn prevention
        const churnPrevention = await checkChurnPrevention(
          impact.customer_id,
          initiative.shipped_at
        )

        // Calculate business impact
        const businessImpact = calculateBusinessImpact(
          surveyResponse,
          usageIncrease,
          churnPrevention,
          impact.customer_id
        )

        const measurement: ImpactMeasurement = {
          initiativeId,
          customerId: impact.customer_id,
          satisfactionScore: surveyResponse.satisfaction_score || 0,
          usageIncrease,
          churnPrevention,
          businessImpact
        }

        measurements.push(measurement)

        // Update impact record with measurements
        await updateInitiativeCustomerImpact(impact.id, {
          satisfaction_score: measurement.satisfactionScore,
          usage_increase_percentage: measurement.usageIncrease,
          churn_prevention: measurement.churnPrevention,
          estimated_revenue_impact: businessImpact.revenueImpact,
          retention_impact: businessImpact.retentionImpact,
          nps_impact: businessImpact.npsImpact,
          responded_at: new Date().toISOString()
        })

      } catch (error) {
        console.error(`Failed to measure impact for customer ${impact.customer_id}:`, error)
        // Continue with other customers
      }
    }

    return measurements

  } catch (error) {
    console.error('Failed to measure initiative impact:', error)
    throw error
  }
}

/**
 * Send follow-up survey to customer
 */
async function sendFollowUpSurvey(survey: FollowUpSurvey): Promise<{
  satisfaction_score: number
  workflow_improvement: boolean
  time_saved_hours: number
  recommendation_score: number
  additional_feedback: string
}> {
  // Use the pre-configured supabase client
  
  try {
    // Create survey record
    const { data: surveyRecord, error: surveyError } = await supabase
      .from('follow_up_surveys')
      .insert({
        company_id: await getCompanyIdFromInitiative(survey.initiativeId),
        initiative_id: survey.initiativeId,
        customer_id: survey.customerId,
        survey_type: 'impact_measurement',
        questions: survey.questions,
        sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (surveyError) {
      throw new Error(`Failed to create survey: ${surveyError.message}`)
    }

    // TODO: Send actual survey email to customer
    // For now, simulate survey completion with default responses
    const defaultResponses = {
      satisfaction_score: 8, // Default to 8/10
      workflow_improvement: true,
      time_saved_hours: 2.5,
      recommendation_score: 8,
      additional_feedback: 'Great feature, really helpful!'
    }

    // Update survey with responses
    const { error: updateError } = await supabase
      .from('follow_up_surveys')
      .update({
        responses: defaultResponses,
        satisfaction_score: defaultResponses.satisfaction_score,
        workflow_improvement: defaultResponses.workflow_improvement,
        time_saved_hours: defaultResponses.time_saved_hours,
        recommendation_score: defaultResponses.recommendation_score,
        additional_feedback: defaultResponses.additional_feedback,
        completed_at: new Date().toISOString()
      })
      .eq('id', surveyRecord.id)

    if (updateError) {
      console.error('Failed to update survey responses:', updateError)
    }

    return defaultResponses

  } catch (error) {
    console.error('Failed to send follow-up survey:', error)
    throw error
  }
}

/**
 * Calculate usage increase for customer
 */
async function calculateUsageIncrease(
  customerId: string,
  shippedAt: string | null
): Promise<number> {
  // TODO: Implement actual usage tracking
  // This would integrate with your analytics system to measure:
  // - Feature adoption rate
  // - Usage frequency before/after
  // - Time spent using the feature
  
  // For now, return a simulated increase
  return Math.random() * 50 + 10 // 10-60% increase
}

/**
 * Check if feature prevented customer churn
 */
async function checkChurnPrevention(
  customerId: string,
  shippedAt: string | null
): Promise<boolean> {
  // TODO: Implement churn prediction logic
  // This would analyze:
  // - Customer engagement before/after feature
  // - Support ticket patterns
  // - Usage trends
  // - Customer satisfaction scores
  
  // For now, return a simulated result
  return Math.random() > 0.7 // 30% chance of churn prevention
}

/**
 * Calculate business impact metrics
 */
function calculateBusinessImpact(
  surveyResponse: any,
  usageIncrease: number,
  churnPrevention: boolean,
  customerId: string
): {
  revenueImpact: number
  retentionImpact: number
  npsImpact: number
} {
  // TODO: Implement actual business impact calculations
  // This would consider:
  // - Customer lifetime value
  // - Subscription tier
  // - Usage patterns
  // - Historical churn rates
  
  // For now, return simulated impact
  const baseRevenue = 1000 // Base monthly revenue per customer
  const revenueMultiplier = usageIncrease / 100
  
  return {
    revenueImpact: baseRevenue * revenueMultiplier,
    retentionImpact: churnPrevention ? 1 : 0,
    npsImpact: (surveyResponse.recommendation_score || 8) - 7 // Baseline NPS
  }
}

// ============================================================================
// SURVEY MANAGEMENT
// ============================================================================

/**
 * Get default impact survey questions
 */
function getDefaultImpactSurveyQuestions(): SurveyQuestion[] {
  return [
    {
      id: 'satisfaction',
      question: 'How satisfied are you with this new feature?',
      type: 'rating',
      required: true
    },
    {
      id: 'workflow_improvement',
      question: 'Has this feature improved your workflow?',
      type: 'boolean',
      required: true
    },
    {
      id: 'time_saved',
      question: 'How much time do you save per week with this feature?',
      type: 'multiple_choice',
      options: ['Less than 1 hour', '1-2 hours', '2-5 hours', '5-10 hours', 'More than 10 hours'],
      required: true
    },
    {
      id: 'recommendation',
      question: 'Would you recommend this feature to others?',
      type: 'rating',
      required: true
    },
    {
      id: 'additional_feedback',
      question: 'Any additional feedback or suggestions?',
      type: 'text',
      required: false
    }
  ]
}

/**
 * Update initiative customer impact record
 */
async function updateInitiativeCustomerImpact(
  impactId: string,
  updates: Partial<InitiativeCustomerImpact>
): Promise<void> {
  // Use the pre-configured supabase client
  
  const { error } = await supabase
    .from('initiative_customer_impact')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', impactId)

  if (error) {
    throw new Error(`Failed to update customer impact: ${error.message}`)
  }
}

// ============================================================================
// ANALYTICS AND REPORTING
// ============================================================================

/**
 * Get customer impact summary for an initiative
 */
export async function getInitiativeImpactSummary(initiativeId: string) {
  // Use the pre-configured supabase client
  
  const { data, error } = await supabase
    .from('initiative_customer_impact')
    .select(`
      *,
      customers (
        id,
        full_name,
        primary_email
      )
    `)
    .eq('initiative_id', initiativeId)

  if (error) {
    throw new Error(`Failed to get impact summary: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      totalCustomers: 0,
      notifiedCustomers: 0,
      respondedCustomers: 0,
      averageSatisfaction: 0,
      totalRevenueImpact: 0,
      churnPreventionCount: 0
    }
  }

  const respondedCustomers = data.filter(impact => impact.responded_at !== null)
  const averageSatisfaction = respondedCustomers.length > 0 
    ? respondedCustomers.reduce((sum, impact) => sum + (impact.satisfaction_score || 0), 0) / respondedCustomers.length
    : 0

  const totalRevenueImpact = data.reduce((sum, impact) => sum + (impact.estimated_revenue_impact || 0), 0)
  const churnPreventionCount = data.filter(impact => impact.churn_prevention).length

  return {
    totalCustomers: data.length,
    notifiedCustomers: data.filter(impact => impact.notified_at !== null).length,
    respondedCustomers: respondedCustomers.length,
    averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
    totalRevenueImpact: Math.round(totalRevenueImpact),
    churnPreventionCount
  }
}

/**
 * Get company-wide impact metrics
 */
export async function getCompanyImpactMetrics(companyId: string, timeframe: '30d' | '90d' | '1y' = '30d') {
  // Use the pre-configured supabase client
  
  // Calculate date range
  const now = new Date()
  const daysBack = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365
  const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

  const { data, error } = await supabase
    .from('initiative_customer_impact')
    .select(`
      *,
      initiatives (
        id,
        title,
        shipped_at
      )
    `)
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString())

  if (error) {
    throw new Error(`Failed to get company impact metrics: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      shippedInitiatives: 0,
      customerNotifications: 0,
      averageSatisfaction: 0,
      totalRevenueImpact: 0,
      churnPreventionCount: 0
    }
  }

  const uniqueInitiatives = new Set(data.map(impact => impact.initiative_id)).size
  const notifiedCustomers = data.filter(impact => impact.notified_at !== null).length
  const respondedCustomers = data.filter(impact => impact.responded_at !== null)
  
  const averageSatisfaction = respondedCustomers.length > 0
    ? respondedCustomers.reduce((sum, impact) => sum + (impact.satisfaction_score || 0), 0) / respondedCustomers.length
    : 0

  const totalRevenueImpact = data.reduce((sum, impact) => sum + (impact.estimated_revenue_impact || 0), 0)
  const churnPreventionCount = data.filter(impact => impact.churn_prevention).length

  return {
    shippedInitiatives: uniqueInitiatives,
    customerNotifications: notifiedCustomers,
    averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
    totalRevenueImpact: Math.round(totalRevenueImpact),
    churnPreventionCount
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get company ID from initiative
 */
async function getCompanyIdFromInitiative(initiativeId: string): Promise<string> {
  // Use the pre-configured supabase client
  
  const { data, error } = await supabase
    .from('initiatives')
    .select('company_id')
    .eq('id', initiativeId)
    .single()

  if (error || !data) {
    throw new Error(`Failed to get company ID: ${error?.message}`)
  }

  return data.company_id
}
