import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// PATCH - Update theme (archive, edit, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const themeId = params.id
    const body = await request.json()

    // Validate that the theme belongs to the user's company
    const { data: existingTheme, error: themeError } = await supabaseAdmin
      .from('themes')
      .select('id, company_id')
      .eq('id', themeId)
      .eq('company_id', adminUser.company_id)
      .single()

    if (themeError || !existingTheme) {
      return NextResponse.json(
        { error: 'Theme not found or access denied' },
        { status: 404 }
      )
    }

    // Update the theme
    const { data: updatedTheme, error: updateError } = await supabaseAdmin
      .from('themes')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', themeId)
      .eq('company_id', adminUser.company_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating theme:', updateError)
      return NextResponse.json(
        { error: 'Failed to update theme' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      theme: updatedTheme,
    })

  } catch (error) {
    console.error('Error in theme update:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update theme',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete theme
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const themeId = params.id

    // Validate that the theme belongs to the user's company
    const { data: existingTheme, error: themeError } = await supabaseAdmin
      .from('themes')
      .select('id, company_id')
      .eq('id', themeId)
      .eq('company_id', adminUser.company_id)
      .single()

    if (themeError || !existingTheme) {
      return NextResponse.json(
        { error: 'Theme not found or access denied' },
        { status: 404 }
      )
    }

    // Delete the theme
    const { error: deleteError } = await supabaseAdmin
      .from('themes')
      .delete()
      .eq('id', themeId)
      .eq('company_id', adminUser.company_id)

    if (deleteError) {
      console.error('Error deleting theme:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete theme' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Theme deleted successfully',
    })

  } catch (error) {
    console.error('Error in theme deletion:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete theme',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
