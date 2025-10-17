import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createAIOrchestrator } from '@/lib/ai/orchestrator'

// POST - Process a survey response with AI tagging
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting process-survey-response API call');
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      console.error('❌ Invalid token:', authError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.email);

    // Get company_id from the authenticated user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      console.error('❌ Admin user not found:', adminError);
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }

    console.log('✅ Admin user found, company_id:', adminUser.company_id);

    // Parse request body
    const { surveyResponseId } = await request.json()

    if (!surveyResponseId) {
      console.error('❌ surveyResponseId is required');
      return NextResponse.json(
        { error: 'surveyResponseId is required' },
        { status: 400 }
      )
    }

    console.log('✅ Survey response ID:', surveyResponseId);

    // Get the survey response
    console.log('🔍 Fetching survey response from database...');
    const { data: surveyResponse, error: responseError } = await supabaseAdmin
      .from('survey_responses')
      .select(`
        id,
        responses,
        customer_id,
        surveys!inner(
          company_id
        )
      `)
      .eq('id', surveyResponseId)
      .eq('surveys.company_id', adminUser.company_id)
      .single()

    if (responseError || !surveyResponse) {
      console.error('❌ Survey response not found:', responseError);
      return NextResponse.json(
        { error: 'Survey response not found' },
        { status: 404 }
      )
    }

    console.log('✅ Survey response found:', surveyResponse.id);

    // Extract text from responses JSON
    const responseText = extractTextFromResponses(surveyResponse.responses)
    console.log('📝 Extracted response text:', responseText);

    if (!responseText.trim()) {
      console.error('❌ No text content found in survey response');
      return NextResponse.json(
        { error: 'No text content found in survey response' },
        { status: 400 }
      )
    }

    // Process with AI
    console.log('🤖 Creating AI orchestrator...');
    const orchestrator = createAIOrchestrator(adminUser.company_id)
    
    console.log('🧠 Processing survey response with AI...');
    const aiResult = await orchestrator.processSurveyResponse(
      responseText,
      surveyResponseId,
      surveyResponse.customer_id
    )
    
    console.log('✅ AI processing complete:', {
      tagCount: aiResult.normalizedTags.length,
      tags: aiResult.normalizedTags
    });

                // Update the survey response with AI results
                const { error: updateError } = await supabaseAdmin
                  .from('survey_responses')
                  .update({
                    sentiment_score: aiResult.sentiment.score,
                    priority_score: aiResult.priorityScore,
                  })
                  .eq('id', surveyResponseId)

    if (updateError) {
      console.error('Error updating survey response:', updateError)
      return NextResponse.json(
        { error: 'Failed to update survey response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      surveyResponseId,
      aiResult: {
        summary: aiResult.summary,
        sentiment: aiResult.sentiment,
        tagIds: aiResult.tagIds,
        normalizedTags: aiResult.normalizedTags,
        priorityScore: aiResult.priorityScore,
      },
    })

  } catch (error) {
    console.error('❌ Error processing survey response:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Failed to process survey response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to extract text from survey responses JSON
function extractTextFromResponses(responses: any): string {
  if (!responses || typeof responses !== 'object') return ''
  
  const textParts: string[] = []
  
  for (const [key, value] of Object.entries(responses)) {
    if (typeof value === 'string' && value.trim().length > 0) {
      textParts.push(value.trim())
    }
  }
  
  return textParts.join(' ')
}
