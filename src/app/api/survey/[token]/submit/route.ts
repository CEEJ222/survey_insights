import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAIOrchestrator } from '@/lib/ai/orchestrator'

// Use server-side client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    const body = await request.json()
    const { responses } = body

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'Invalid responses' },
        { status: 400 }
      )
    }

    // Find survey link by token
    const { data: surveyLink, error: linkError } = await supabase
      .from('survey_links')
      .select('*, surveys(company_id, enable_ai_analysis)')
      .eq('token', token)
      .single()

    if (linkError || !surveyLink) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      )
    }

    // Check if already completed
    if (surveyLink.status === 'completed') {
      return NextResponse.json(
        { error: 'Survey already completed' },
        { status: 400 }
      )
    }

    // Check if expired
    if (surveyLink.expires_at && new Date(surveyLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This survey has expired' },
        { status: 410 }
      )
    }

    // Get or create customer profile
    let customerId = surveyLink.customer_id
    if (!customerId && surveyLink.respondent_email) {
      // Try to find existing customer by email
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', (surveyLink.surveys as any).company_id)
        .eq('primary_email', surveyLink.respondent_email)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        // Create new customer
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            company_id: (surveyLink.surveys as any).company_id,
            primary_email: surveyLink.respondent_email,
            full_name: surveyLink.respondent_name,
          })
          .select('id')
          .single()

        if (newCustomer) {
          customerId = newCustomer.id

          // Update survey link with customer ID
          await supabase
            .from('survey_links')
            .update({ customer_id: customerId })
            .eq('id', surveyLink.id)
        }
      }
    }

    // Get browser metadata
    const userAgent = request.headers.get('user-agent') || ''
    const metadata = {
      userAgent,
      submittedAt: new Date().toISOString(),
    }

    // Insert survey response
    const { data: response, error: responseError } = await supabase
      .from('survey_responses')
      .insert({
        survey_link_id: surveyLink.id,
        survey_id: surveyLink.survey_id,
        customer_id: customerId,
        responses: responses,
        metadata: metadata,
      })
      .select()
      .single()

    if (responseError) {
      console.error('Error inserting response:', responseError)
      return NextResponse.json(
        { error: 'Failed to submit response' },
        { status: 500 }
      )
    }

    // Update survey link status to completed
    await supabase
      .from('survey_links')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', surveyLink.id)

    // ========================================================================
    // AI ANALYSIS (runs in background)
    // ========================================================================
    
    // Check if AI analysis is enabled for this survey
    const aiEnabled = (surveyLink.surveys as any)?.enable_ai_analysis !== false
    
    if (aiEnabled) {
      // Extract open-ended text responses
      const textResponses = Object.values(responses)
        .filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
        .join('\n\n')

      if (textResponses.length > 10) {
        // Run AI analysis asynchronously (don't wait for it)
        analyzeResponseWithAI(
          response.id,
          textResponses,
          (surveyLink.surveys as any).company_id
        ).catch((error) => {
          console.error('AI analysis failed (non-blocking):', error)
        })
      }
    }

    return NextResponse.json({ success: true, id: response.id })
  } catch (error) {
    console.error('Error submitting survey:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// BACKGROUND AI ANALYSIS
// ============================================================================

async function analyzeResponseWithAI(
  responseId: string,
  text: string,
  companyId: string
) {
  try {
    console.log(`🤖 Running AI analysis for response ${responseId}...`)

    // Create AI orchestrator
    const ai = createAIOrchestrator(companyId)

    // Process survey response with new tag system
    const analysis = await ai.processSurveyResponse(
      text,
      responseId,
      undefined // customerId will be looked up in the processSurveyResponse method
    )

    // Update survey response with AI results (no more ai_tags column)
    await supabase
      .from('survey_responses')
      .update({
        sentiment_score: analysis.sentiment.score,
        priority_score: analysis.priorityScore,
      })
      .eq('id', responseId)

    console.log(`✅ AI analysis complete for response ${responseId}`)
    console.log(`   Sentiment: ${analysis.sentiment.score} (${analysis.sentiment.label})`)
    console.log(`   Tags: ${analysis.normalizedTags.join(', ')}`)
    console.log(`   Priority: ${analysis.priorityScore}/100`)
  } catch (error) {
    console.error('Error in AI analysis:', error)
    throw error
  }
}

