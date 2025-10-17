import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use server-side client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    console.log('🔍 Looking for survey link with token:', token)

    // Find survey link by token
    const { data: surveyLink, error: linkError } = (await supabase
      .from('survey_links')
      .select('*')
      .eq('token', token)
      .single()) as any

    console.log('📋 Survey link result:', { surveyLink, linkError })

    if (linkError || !surveyLink) {
      console.log('❌ Survey link not found:', linkError)
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (surveyLink.expires_at && new Date(surveyLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This survey has expired' },
        { status: 410 }
      )
    }

    // Get survey details
    const { data: survey, error: surveyError } = (await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyLink.survey_id)
      .single()) as any

    if (surveyError || !survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      )
    }

    // Check if survey is active
    if (survey.status !== 'active') {
      return NextResponse.json(
        { error: 'This survey is no longer available' },
        { status: 410 }
      )
    }

    // Mark survey link as opened if not already
    if (surveyLink.status === 'pending') {
      await (supabase as any)
        .from('survey_links')
        .update({ 
          status: 'opened', 
          opened_at: new Date().toISOString() 
        })
        .eq('id', surveyLink.id)
    }

    return NextResponse.json({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      questions: survey.questions, // This should already be the nested structure from the database
      surveyLinkId: surveyLink.id,
      surveyLinkStatus: surveyLink.status,
    })
  } catch (error) {
    console.error('Error fetching survey:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

