import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createDuplicateTagDetector } from '@/lib/ai/duplicate-tag-detector';

// POST - Run duplicate tag detection and merging
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting duplicate tag detection API call');

    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No valid authorization header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Get admin user to get company_id
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser) {
      console.error('❌ Admin user not found:', adminError);
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    console.log('✅ Admin user found, company_id:', (adminUser as any).company_id);

    // Parse request body
    const body = await request.json();
    const { action = 'detect' } = body; // 'detect' or 'merge'

    console.log(`🎯 Action: ${action}`);

    // Create duplicate detector
    const detector = createDuplicateTagDetector((adminUser as any).company_id);

    if (action === 'detect') {
      // Just detect duplicates without merging
      const duplicateGroups = await detector.detectDuplicates();
      
      console.log(`✅ Found ${duplicateGroups.length} duplicate groups`);
      
      return NextResponse.json({
        success: true,
        action: 'detect',
        duplicateGroups,
        message: `Found ${duplicateGroups.length} potential duplicate groups`
      });
    } else if (action === 'merge') {
      // Detect and merge duplicates
      const result = await detector.runDuplicateCleanup();
      
      console.log(`🎉 Merge complete: ${result.merged} tags merged`);
      
      return NextResponse.json({
        success: true,
        action: 'merge',
        result,
        message: `Successfully merged ${result.merged} duplicate tags`
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "detect" or "merge"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Error in duplicate tag detection:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to process duplicate tag detection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Get current duplicate status
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Getting duplicate tag status');

    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get admin user to get company_id
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Get tag count
    const { count: tagCount, error: countError } = await supabaseAdmin
      .from('tags')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', (adminUser as any).company_id)
      .eq('is_active', true);

    if (countError) {
      console.error('Error getting tag count:', countError);
    }

    return NextResponse.json({
      success: true,
      tagCount: tagCount || 0,
      companyId: (adminUser as any).company_id,
      message: `System has ${tagCount || 0} active tags`
    });

  } catch (error) {
    console.error('❌ Error getting duplicate status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get duplicate status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

