// ============================================================================
// INITIATIVE AUTOMATION SYSTEM
// ============================================================================
// Automatically triggers customer notifications and impact measurement
// ============================================================================

import { supabase } from '@/lib/supabase/client'
import { notifyAllAffectedCustomers } from '@/lib/notifications/customer-impact'
import { measureInitiativeImpact } from '@/lib/analytics/customer-impact'

export interface AutomationConfig {
  autoNotifyCustomers: boolean
  autoMeasureImpact: boolean
  impactMeasurementDelay: number // hours after shipping
  followUpSurveyDelay: number // hours after notification
}

const DEFAULT_CONFIG: AutomationConfig = {
  autoNotifyCustomers: true,
  autoMeasureImpact: true,
  impactMeasurementDelay: 24, // 24 hours after shipping
  followUpSurveyDelay: 72 // 72 hours after notification
}

/**
 * Check for initiatives that need automation triggers
 */
export async function checkInitiativeAutomation(): Promise<void> {
  // Use the pre-configured supabase client
  
  try {
    // Get all shipped initiatives that haven't been processed
    const { data: shippedInitiatives, error: initiativesError } = await supabase
      .from('initiatives')
      .select(`
        *,
        companies (
          id,
          name
        )
      `)
      .eq('status', 'shipped')
      .not('shipped_at', 'is', null)

    if (initiativesError || !shippedInitiatives) {
      console.error('Failed to get shipped initiatives:', initiativesError)
      return
    }

    console.log(`Found ${shippedInitiatives.length} shipped initiatives to process`)

    for (const initiative of shippedInitiatives) {
      await processInitiativeAutomation(initiative, DEFAULT_CONFIG)
    }

  } catch (error) {
    console.error('Failed to check initiative automation:', error)
  }
}

/**
 * Process automation for a specific initiative
 */
async function processInitiativeAutomation(
  initiative: any,
  config: AutomationConfig
): Promise<void> {
  // Use the pre-configured supabase client
  
  try {
    // Check if customers have been notified
    const { data: customerImpacts, error: impactsError } = await supabase
      .from('initiative_customer_impact')
      .select('id, notified_at')
      .eq('initiative_id', initiative.id)

    if (impactsError) {
      console.error(`Failed to check customer impacts for initiative ${initiative.id}:`, impactsError)
      return
    }

    const hasNotifiedCustomers = customerImpacts && customerImpacts.some(impact => impact.notified_at !== null)

    // Auto-notify customers if enabled and not already done
    if (config.autoNotifyCustomers && !hasNotifiedCustomers) {
      console.log(`Auto-notifying customers for initiative: ${initiative.title}`)
      await notifyAllAffectedCustomers(initiative.id)
    }

    // Check if impact measurement is due
    if (config.autoMeasureImpact && hasNotifiedCustomers) {
      const shippedAt = new Date(initiative.shipped_at)
      const now = new Date()
      const hoursSinceShipped = (now.getTime() - shippedAt.getTime()) / (1000 * 60 * 60)

      if (hoursSinceShipped >= config.impactMeasurementDelay) {
        console.log(`Auto-measuring impact for initiative: ${initiative.title}`)
        await measureInitiativeImpact(initiative.id)
      }
    }

  } catch (error) {
    console.error(`Failed to process automation for initiative ${initiative.id}:`, error)
  }
}

/**
 * Schedule follow-up surveys for initiatives
 */
export async function scheduleFollowUpSurveys(): Promise<void> {
  // Use the pre-configured supabase client
  
  try {
    // Get initiatives where customers were notified but follow-up surveys haven't been sent
    const { data: initiatives, error: initiativesError } = await supabase
      .from('initiative_customer_impact')
      .select(`
        *,
        initiatives (
          id,
          title,
          shipped_at
        )
      `)
      .not('notified_at', 'is', null)
      .is('follow_up_survey_completed', null)

    if (initiativesError || !initiatives) {
      console.error('Failed to get initiatives for follow-up surveys:', initiativesError)
      return
    }

    for (const impact of initiatives) {
      if (!impact.initiatives) continue

      const notifiedAt = new Date(impact.notified_at!)
      const now = new Date()
      const hoursSinceNotification = (now.getTime() - notifiedAt.getTime()) / (1000 * 60 * 60)

      // Send follow-up survey after delay
      if (hoursSinceNotification >= DEFAULT_CONFIG.followUpSurveyDelay) {
        console.log(`Sending follow-up survey for initiative: ${impact.initiatives.title}`)
        await sendFollowUpSurvey(impact.initiative_id, impact.customer_id)
      }
    }

  } catch (error) {
    console.error('Failed to schedule follow-up surveys:', error)
  }
}

/**
 * Send follow-up survey to customer
 */
async function sendFollowUpSurvey(initiativeId: string, customerId: string): Promise<void> {
  // Use the pre-configured supabase client
  
  try {
    // Create follow-up survey record
    const { data: survey, error: surveyError } = await supabase
      .from('follow_up_surveys')
      .insert({
        company_id: await getCompanyIdFromInitiative(initiativeId),
        initiative_id: initiativeId,
        customer_id: customerId,
        survey_type: 'impact_measurement',
        questions: getDefaultImpactSurveyQuestions(),
        sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (surveyError) {
      console.error('Failed to create follow-up survey:', surveyError)
      return
    }

    // TODO: Send actual survey email to customer
    // This would integrate with your email service to send the survey
    console.log(`Follow-up survey created for customer ${customerId}, initiative ${initiativeId}`)

    // Mark impact record as having follow-up survey sent
    await supabase
      .from('initiative_customer_impact')
      .update({ follow_up_survey_completed: true })
      .eq('initiative_id', initiativeId)
      .eq('customer_id', customerId)

  } catch (error) {
    console.error('Failed to send follow-up survey:', error)
  }
}

/**
 * Get default impact survey questions
 */
function getDefaultImpactSurveyQuestions() {
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

/**
 * Run all automation checks
 */
export async function runInitiativeAutomation(): Promise<void> {
  console.log('Running initiative automation...')
  
  try {
    // Check for initiatives that need automation
    await checkInitiativeAutomation()
    
    // Schedule follow-up surveys
    await scheduleFollowUpSurveys()
    
    console.log('Initiative automation completed')
  } catch (error) {
    console.error('Failed to run initiative automation:', error)
  }
}
