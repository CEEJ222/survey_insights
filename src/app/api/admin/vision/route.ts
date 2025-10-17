import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { CreateVisionRequest } from '@/types/database'

export async function POST(request: NextRequest) {
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

    const body: CreateVisionRequest = await request.json()
    const { vision_statement, mission_statement } = body

    // Get current vision version to increment
    const { data: currentVision } = await supabase
      .from('company_vision')
      .select('version')
      .eq('company_id', adminUser.company_id)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = currentVision ? currentVision.version + 1 : 1

    // Deactivate current vision if exists
    if (currentVision) {
      await supabase
        .from('company_vision')
        .update({ 
          is_active: false,
          active_until: new Date().toISOString()
        })
        .eq('company_id', adminUser.company_id)
        .eq('is_active', true)
    }

    // Create new vision version
    const { data: newVision, error: createError } = await supabase
      .from('company_vision')
      .insert({
        company_id: adminUser.company_id,
        vision_statement,
        mission_statement,
        version: nextVersion,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating vision:', createError)
      return NextResponse.json({ error: 'Failed to create vision' }, { status: 500 })
    }

    return NextResponse.json({ vision: newVision }, { status: 201 })
  } catch (error) {
    console.error('Error creating vision:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
