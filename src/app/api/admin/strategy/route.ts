import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth'
import { CreateStrategyRequest } from '@/types/database'

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

    const body: CreateStrategyRequest = await request.json()
    const {
      title,
      description,
      target_customer_description,
      target_customer_segments = [],
      problems_we_solve = [],
      problems_we_dont_solve = [],
      how_we_win,
      strategic_keywords = [],
      competitors = [],
      update_reason,
      what_we_learned
    } = body

    // Enhanced validation
    if (!title || title.trim().length < 5) {
      return NextResponse.json({ 
        error: 'Strategy title is required and must be at least 5 characters' 
      }, { status: 400 })
    }

    if (!target_customer_description || target_customer_description.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Target customer description is required and must be at least 10 characters' 
      }, { status: 400 })
    }

    if (problems_we_solve.length === 0) {
      return NextResponse.json({ 
        error: 'At least one problem we solve must be specified' 
      }, { status: 400 })
    }

    if (!update_reason || update_reason.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Update reason is required and must be at least 10 characters' 
      }, { status: 400 })
    }

    // Get current strategy version to increment
    const { data: currentStrategy } = await supabase
      .from('product_strategy')
      .select('version')
      .eq('company_id', adminUser.company_id)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = currentStrategy ? currentStrategy.version + 1 : 1

    // Deactivate current strategy if exists
    if (currentStrategy) {
      await supabase
        .from('product_strategy')
        .update({ 
          is_active: false,
          active_until: new Date().toISOString()
        })
        .eq('company_id', adminUser.company_id)
        .eq('is_active', true)
    }

    // Create new strategy version
    const { data: newStrategy, error: createError } = await supabase
      .from('product_strategy')
      .insert({
        company_id: adminUser.company_id,
        title,
        description,
        target_customer_description,
        target_customer_segments,
        problems_we_solve,
        problems_we_dont_solve,
        how_we_win,
        strategic_keywords: strategic_keywords as any,
        competitors: competitors as any,
        version: nextVersion,
        is_active: true,
        update_reason,
        what_we_learned,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating strategy:', createError)
      return NextResponse.json({ error: 'Failed to create strategy' }, { status: 500 })
    }

    // Log successful strategy creation for monitoring
    console.log(`Strategy created successfully for company ${adminUser.company_id}:`, {
      strategy_id: newStrategy.id,
      version: newStrategy.version,
      title: newStrategy.title,
      created_by: user.id,
      created_at: newStrategy.created_at
    })

    return NextResponse.json({ 
      strategy: newStrategy,
      message: `Strategy version ${newStrategy.version} created successfully`
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating strategy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
