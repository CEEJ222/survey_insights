import { NextRequest, NextResponse } from 'next/server'
import { createAIOrchestrator } from '@/lib/ai/orchestrator'

export async function POST(request: NextRequest) {
  try {
    // For testing purposes, use a default company ID
    // In production, you'd want proper authentication here
    const defaultCompanyId = '00000000-0000-0000-0000-000000000000'
    
    console.log('🤖 AI Test API called with company ID:', defaultCompanyId)

    // Get text from request
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || text.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide at least 10 characters of text' },
        { status: 400 }
      )
    }

    console.log('🤖 Testing AI analysis...')

    // Create AI orchestrator
    const ai = createAIOrchestrator(defaultCompanyId)

    // Run analysis
    const result = await ai.analyzeFeedback(text)

    console.log('✅ AI analysis complete')

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in AI test:', error)
    return NextResponse.json(
      { error: error.message || 'AI analysis failed' },
      { status: 500 }
    )
  }
}

