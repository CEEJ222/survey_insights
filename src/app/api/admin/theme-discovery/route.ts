import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { createThemeDiscoveryEngine } from '@/lib/ai/theme-discovery'

// POST - Run theme discovery
export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get company_id from the authenticated user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }

    console.log(`🚀 Starting theme discovery for company: ${adminUser.company_id}`)

    // Create theme discovery engine
    const engine = createThemeDiscoveryEngine(adminUser.company_id)

    // Discover themes
    const discoveredThemes = await engine.discoverThemes()
    console.log(`✅ Discovered ${discoveredThemes.length} themes`)

    // Save themes to database
    await engine.saveThemes(discoveredThemes)

    return NextResponse.json({
      success: true,
      themes_discovered: discoveredThemes.length,
      themes: discoveredThemes.map(theme => ({
        name: theme.name,
        description: theme.description,
        customer_count: theme.customer_count,
        mention_count: theme.mention_count,
        priority_score: theme.priority_score,
        trend: theme.trend,
        related_tag_ids: theme.related_tag_ids,
      })),
    })

  } catch (error) {
    console.error('Error in theme discovery:', error)
    return NextResponse.json(
      { 
        error: 'Failed to discover themes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET - Get existing themes
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get company_id from the authenticated user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }

    // Get existing themes
    const { data: themes, error: themesError } = await supabaseAdmin
      .from('themes')
      .select(`
        id,
        name,
        description,
        related_tag_ids,
        customer_count,
        mention_count,
        avg_sentiment,
        priority_score,
        trend,
        week_over_week_change,
        status,
        created_at,
        updated_at
      `)
      .eq('company_id', adminUser.company_id)
      .order('priority_score', { ascending: false })

    if (themesError) {
      console.error('Error fetching themes:', themesError)
      return NextResponse.json(
        { error: 'Failed to fetch themes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      themes: themes || [],
      count: themes?.length || 0,
    })

  } catch (error) {
    console.error('Error fetching themes:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch themes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
