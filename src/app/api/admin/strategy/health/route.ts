// ============================================================================
// STRATEGIC HEALTH API ENDPOINT
// ============================================================================
// Returns strategic health metrics and theme alignment analysis
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { getAdminUser } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // Use the pre-configured supabase client
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin user to verify permissions
    const { data: adminUser, error: adminError } = await getAdminUser(user.id)
    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
    }

    // Get all themes for the company
    const { data: themes, error: themesError } = await supabase
      .from('themes')
      .select('*')
      .eq('company_id', adminUser.company_id)
      .order('created_at', { ascending: false })

    if (themesError) {
      return NextResponse.json({ 
        error: 'Failed to get themes' 
      }, { status: 500 })
    }

    if (!themes || themes.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          themesInStrategy: 0,
          themesOffStrategy: 0,
          themesNeedsReview: 0,
          strategyHealthScore: 0,
          recommendation: 'No themes found. Start by analyzing customer feedback to discover themes.'
        }
      })
    }

    // Analyze theme alignment
    let themesInStrategy = 0
    let themesOffStrategy = 0
    let themesNeedsReview = 0

    themes.forEach(theme => {
      if (theme.recommendation === 'approve' || theme.recommendation === 'high_priority') {
        themesInStrategy++
      } else if (theme.recommendation === 'decline' || theme.recommendation === 'low_priority') {
        themesOffStrategy++
      } else {
        themesNeedsReview++
      }
    })

    // Calculate strategy health score
    const totalThemes = themes.length
    const strategyHealthScore = Math.round((themesInStrategy / totalThemes) * 100)

    // Generate recommendation
    let recommendation = ''
    if (strategyHealthScore >= 80) {
      recommendation = 'Excellent strategy alignment! Keep up the great work.'
    } else if (strategyHealthScore >= 60) {
      recommendation = 'Good strategy alignment. Consider reviewing off-strategy themes.'
    } else if (strategyHealthScore >= 40) {
      recommendation = 'Strategy alignment needs improvement. Review and update your strategy.'
    } else {
      recommendation = 'Low strategy alignment. Consider updating your strategy to better align with customer needs.'
    }

    // Add specific recommendations based on theme distribution
    if (themesOffStrategy > themesInStrategy) {
      recommendation += ' Many high-demand themes are currently off-strategy. Consider updating your strategy to address customer needs.'
    }

    if (themesNeedsReview > 0) {
      recommendation += ` ${themesNeedsReview} themes need review. Make decisions to improve strategy alignment.`
    }

    return NextResponse.json({
      success: true,
      data: {
        themesInStrategy,
        themesOffStrategy,
        themesNeedsReview,
        strategyHealthScore,
        recommendation
      }
    })

  } catch (error) {
    console.error('Failed to get strategic health:', error)
    return NextResponse.json({ 
      error: 'Failed to get strategic health' 
    }, { status: 500 })
  }
}
