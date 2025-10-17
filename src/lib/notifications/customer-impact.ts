// ============================================================================
// CUSTOMER IMPACT NOTIFICATION SYSTEM
// ============================================================================
// Handles automated customer notifications when initiatives ship
// ============================================================================

import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Initiative = Database['public']['Tables']['initiatives']['Row']
type Customer = Database['public']['Tables']['customers']['Row']
type Theme = Database['public']['Tables']['themes']['Row']
type FeedbackItem = Database['public']['Tables']['feedback_items']['Row']

export interface CustomerImpactNotification {
  initiativeId: string
  customerId: string
  impactType: 'feature_request_addressed' | 'improvement' | 'bug_fix'
  personalMessage?: string
}

export interface EmailContent {
  to: string
  subject: string
  template: string
  data: {
    customerName: string
    initiativeTitle: string
    initiativeDescription: string
    originalFeedback: string[]
    impactType: string
    personalMessage?: string
    productUrl: string
    companyName: string
  }
}

// ============================================================================
// CORE NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Notify a single customer about a shipped initiative
 */
export async function notifyCustomerOfShippedInitiative(
  notification: CustomerImpactNotification
): Promise<void> {
  // Use the pre-configured supabase client
  
  try {
    // Get initiative details
    const { data: initiative, error: initiativeError } = await supabase
      .from('initiatives')
      .select(`
        *,
        themes (
          id,
          title,
          description
        )
      `)
      .eq('id', notification.initiativeId)
      .single()

    if (initiativeError || !initiative) {
      throw new Error(`Initiative not found: ${initiativeError?.message}`)
    }

    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', notification.customerId)
      .single()

    if (customerError || !customer) {
      throw new Error(`Customer not found: ${customerError?.message}`)
    }

    // Get customer's original feedback that led to this initiative
    const { data: customerFeedback, error: feedbackError } = await supabase
      .from('feedback_items')
      .select('content, feedback_date')
      .eq('customer_id', notification.customerId)
      .contains('themes', [initiative.themes?.title])
      .order('feedback_date', { ascending: false })
      .limit(3)

    if (feedbackError) {
      console.warn('Could not fetch customer feedback:', feedbackError.message)
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name')
      .eq('id', initiative.company_id)
      .single()

    if (companyError || !company) {
      throw new Error(`Company not found: ${companyError?.message}`)
    }

    // Prepare email content
    const emailContent: EmailContent = {
      to: customer.primary_email || '',
      subject: `Your feedback helped shape our product! 🎉`,
      template: 'customer-impact-notification',
      data: {
        customerName: customer.full_name || 'Valued Customer',
        initiativeTitle: initiative.title,
        initiativeDescription: initiative.description || '',
        originalFeedback: customerFeedback?.map(f => f.content) || [],
        impactType: notification.impactType,
        personalMessage: notification.personalMessage,
        productUrl: `${process.env.NEXT_PUBLIC_APP_URL}/features/${initiative.id}`,
        companyName: company.name
      }
    }

    // Send email notification
    await sendEmailNotification(emailContent)

    // Create customer impact record
    const { error: impactError } = await supabase
      .from('initiative_customer_impact')
      .insert({
        company_id: initiative.company_id,
        initiative_id: initiative.id,
        customer_id: customer.id,
        impact_type: notification.impactType,
        notified_at: new Date().toISOString()
      })

    if (impactError) {
      console.error('Failed to create customer impact record:', impactError)
    }

    // Log notification
    await logCustomerNotification({
      companyId: initiative.company_id,
      customerId: customer.id,
      initiativeId: initiative.id,
      notificationType: 'initiative_shipped',
      subject: emailContent.subject,
      content: JSON.stringify(emailContent.data),
      templateUsed: emailContent.template
    })

  } catch (error) {
    console.error('Failed to notify customer:', error)
    throw error
  }
}

/**
 * Notify all affected customers when an initiative ships
 */
export async function notifyAllAffectedCustomers(initiativeId: string): Promise<void> {
  // Use the pre-configured supabase client
  
  try {
    // Get initiative and theme details
    const { data: initiative, error: initiativeError } = await supabase
      .from('initiatives')
      .select(`
        *,
        themes (
          id,
          title,
          description
        )
      `)
      .eq('id', initiativeId)
      .single()

    if (initiativeError || !initiative) {
      throw new Error(`Initiative not found: ${initiativeError?.message}`)
    }

    if (!initiative.themes) {
      console.warn('No theme associated with initiative:', initiativeId)
      return
    }

    // Get all customers who provided feedback for this theme
    const { data: affectedCustomers, error: customersError } = await supabase
      .rpc('get_customers_for_theme', { theme_uuid: initiative.themes.id })

    if (customersError || !affectedCustomers) {
      console.warn('Could not fetch affected customers:', customersError?.message)
      return
    }

    console.log(`Found ${affectedCustomers.length} affected customers for initiative ${initiativeId}`)

    // Send notifications in batches to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < affectedCustomers.length; i += batchSize) {
      const batch = affectedCustomers.slice(i, i + batchSize)
      
      await Promise.all(
        batch.map(customer => 
          notifyCustomerOfShippedInitiative({
            initiativeId,
            customerId: customer.customer_id,
            impactType: 'feature_request_addressed'
          })
        )
      )
      
      // Rate limiting - wait 1 second between batches
      if (i + batchSize < affectedCustomers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`Successfully notified ${affectedCustomers.length} customers`)

  } catch (error) {
    console.error('Failed to notify all affected customers:', error)
    throw error
  }
}

// ============================================================================
// EMAIL NOTIFICATION SYSTEM
// ============================================================================

/**
 * Send email notification (placeholder - integrate with your email service)
 */
async function sendEmailNotification(emailContent: EmailContent): Promise<void> {
  // TODO: Integrate with your email service (SendGrid, Resend, etc.)
  console.log('Sending email notification:', {
    to: emailContent.to,
    subject: emailContent.subject,
    template: emailContent.template
  })

  // For now, just log the email content
  // In production, you would integrate with an email service like:
  // - SendGrid
  // - Resend
  // - AWS SES
  // - Postmark
  
  // Example integration with Resend:
  /*
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  await resend.emails.send({
    from: 'noreply@yourcompany.com',
    to: emailContent.to,
    subject: emailContent.subject,
    html: renderEmailTemplate(emailContent.template, emailContent.data)
  })
  */
}

/**
 * Render email template (placeholder)
 */
function renderEmailTemplate(template: string, data: any): string {
  // TODO: Implement email template rendering
  // You could use a template engine like Handlebars, Mustache, or React Email
  
  if (template === 'customer-impact-notification') {
    return `
      <html>
        <body>
          <h1>Hi ${data.customerName}!</h1>
          <p>Great news! We've shipped a new feature based on your feedback.</p>
          <h2>🚀 What's New: ${data.initiativeTitle}</h2>
          <p>${data.initiativeDescription}</p>
          ${data.originalFeedback.length > 0 ? `
            <h3>📝 Your Original Feedback:</h3>
            <ul>
              ${data.originalFeedback.map((feedback: string) => `<li>"${feedback}"</li>`).join('')}
            </ul>
          ` : ''}
          <p><a href="${data.productUrl}">Try it out!</a></p>
          <p>Thanks for helping us build a better product!</p>
          <p>Best regards,<br>The ${data.companyName} Team</p>
        </body>
      </html>
    `
  }
  
  return '<p>Email template not found</p>'
}

// ============================================================================
// NOTIFICATION LOGGING
// ============================================================================

/**
 * Log customer notification for tracking
 */
async function logCustomerNotification(notification: {
  companyId: string
  customerId: string
  initiativeId: string
  notificationType: string
  subject: string
  content: string
  templateUsed: string
}): Promise<void> {
  // Use the pre-configured supabase client
  
  const { error } = await supabase
    .from('customer_notifications')
    .insert({
      company_id: notification.companyId,
      customer_id: notification.customerId,
      initiative_id: notification.initiativeId,
      notification_type: notification.notificationType,
      subject: notification.subject,
      content: notification.content,
      template_used: notification.templateUsed,
      sent_at: new Date().toISOString()
    })

  if (error) {
    console.error('Failed to log customer notification:', error)
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get customer impact summary for an initiative
 */
export async function getInitiativeCustomerImpact(initiativeId: string) {
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
    throw new Error(`Failed to get customer impact: ${error.message}`)
  }

  return data
}

/**
 * Check if customers have been notified for an initiative
 */
export async function checkCustomerNotificationStatus(initiativeId: string): Promise<{
  totalCustomers: number
  notifiedCustomers: number
  pendingCustomers: number
}> {
  // Use the pre-configured supabase client
  
  // Get total affected customers
  const { data: initiative, error: initiativeError } = await supabase
    .from('initiatives')
    .select(`
      *,
      themes (id)
    `)
    .eq('id', initiativeId)
    .single()

  if (initiativeError || !initiative || !initiative.themes) {
    return { totalCustomers: 0, notifiedCustomers: 0, pendingCustomers: 0 }
  }

  const { data: affectedCustomers, error: customersError } = await supabase
    .rpc('get_customers_for_theme', { theme_uuid: initiative.themes.id })

  if (customersError || !affectedCustomers) {
    return { totalCustomers: 0, notifiedCustomers: 0, pendingCustomers: 0 }
  }

  // Get notified customers
  const { data: notifiedCustomers, error: notifiedError } = await supabase
    .from('initiative_customer_impact')
    .select('customer_id')
    .eq('initiative_id', initiativeId)
    .not('notified_at', 'is', null)

  if (notifiedError) {
    console.error('Failed to get notified customers:', notifiedError)
    return { totalCustomers: 0, notifiedCustomers: 0, pendingCustomers: 0 }
  }

  const notifiedCount = notifiedCustomers?.length || 0
  const totalCount = affectedCustomers.length

  return {
    totalCustomers: totalCount,
    notifiedCustomers: notifiedCount,
    pendingCustomers: totalCount - notifiedCount
  }
}
