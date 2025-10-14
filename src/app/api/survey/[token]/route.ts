import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Find survey link by token
    const { data: surveyLink, error: linkError } = (await supabase
      .from('survey_links')
      .select('*')
      .eq('token', token)
      .single()) as any

    if (linkError || !surveyLink) {
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
      questions: survey.questions,
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

