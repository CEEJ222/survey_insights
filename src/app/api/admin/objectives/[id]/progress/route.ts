import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { UpdateOKRProgressRequest } from '@/types/database'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Use the pre-configured supabase client
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user to find company_id
    const { data: adminUser, error: adminError } = await getAdminUser(user.id)
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    const body: UpdateOKRProgressRequest = await request.json()
    const { key_results } = body

    // Get current OKR to merge progress updates
    const { data: currentObjective, error: getError } = await supabase
      .from('strategic_objectives')
      .select('key_results')
      .eq('id', params.id)
      .eq('company_id', adminUser.company_id)
      .single()

    if (getError || !currentObjective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 })
    }

    // Merge current key results with progress updates
    const currentKeyResults = currentObjective.key_results as any[] || []
    const updatedKeyResults = currentKeyResults.map((kr: any) => {
      const progressUpdate = key_results.find((pr) => pr.metric === kr.metric)
      if (progressUpdate) {
        return {
          ...kr,
          current: progressUpdate.current,
          updated_at: progressUpdate.updated_at
        }
      }
      return kr
    })

    // Update OKR with new progress
    const { data: updatedObjective, error: updateError } = await supabase
      .from('strategic_objectives')
      .update({
        key_results: updatedKeyResults as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', adminUser.company_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating objective progress:', updateError)
      return NextResponse.json({ error: 'Failed to update objective progress' }, { status: 500 })
    }

    return NextResponse.json({ objective: updatedObjective }, { status: 200 })
  } catch (error) {
    console.error('Error updating objective progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
