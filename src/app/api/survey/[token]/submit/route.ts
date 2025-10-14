import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

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

    // Get browser metadata
    const userAgent = request.headers.get('user-agent') || ''
    const metadata = {
      userAgent,
      submittedAt: new Date().toISOString(),
    }

    // Insert survey response
    const { data: response, error: responseError } = await (supabase
      .from('survey_responses')
      .insert({
        survey_link_id: surveyLink.id,
        survey_id: surveyLink.survey_id,
        responses: responses,
        metadata: metadata,
      } as any)
      .select()
      .single() as any)

    if (responseError) {
      console.error('Error inserting response:', responseError)
      return NextResponse.json(
        { error: 'Failed to submit response' },
        { status: 500 }
      )
    }

    // Update survey link status to completed
    await (supabase as any)
      .from('survey_links')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', surveyLink.id)

    return NextResponse.json({ success: true, id: response.id })
  } catch (error) {
    console.error('Error submitting survey:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

