// ============================================================================
// API TESTING SUITE - THEMES ENDPOINT
// ============================================================================
// Comprehensive tests for themes API endpoints including strategic scoring,
// theme review workflow, and performance testing
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET as themesGET, POST as themesPOST } from '@/app/api/admin/themes/route'
import { GET as themeGET, PATCH as themePATCH } from '@/app/api/admin/themes/[id]/route'
import { POST as reviewPOST } from '@/app/api/admin/themes/[id]/review/route'
import { GET as healthGET } from '@/app/api/admin/themes/strategic-health/route'
import { GET as summaryGET } from '@/app/api/admin/themes/strategic-summary/route'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/ai/theme-discovery')

const mockSupabaseAdmin = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockThemeData,
              error: null
            }))
          }))
        }))
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: mockThemeData,
          error: null
        }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: mockThemeData,
            error: null
          }))
        }))
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        error: null
      }))
    }))
  }))
}

const mockThemeData = {
  id: 'test-theme-id',
  title: 'Test Theme',
  description: 'Test theme description',
  feedback_count: 10,
  sentiment_score: 0.8,
  priority_score: 85,
  strategic_alignment_score: 90,
  strategic_reasoning: 'Strongly aligns with strategy',
  strategic_conflicts: [],
  strategic_opportunities: ['Opportunity 1', 'Opportunity 2'],
  final_priority_score: 76,
  recommendation: 'high_priority',
  pm_notes: null,
  declined_reason: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const mockThemesData = [mockThemeData]

describe('Themes API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mocks to return successful responses by default
    mockSupabaseAdmin.from().select().eq().data = mockThemesData
    mockSupabaseAdmin.from().select().eq().error = null
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET /api/admin/themes', () => {
    it('should return themes with strategic scoring', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company')
      
      const response = await themesGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.themes).toBeDefined()
      expect(Array.isArray(data.themes)).toBe(true)
      expect(data.themes[0]).toHaveProperty('id')
      expect(data.themes[0]).toHaveProperty('name')
      expect(data.themes[0]).toHaveProperty('strategicAlignment')
    })

    it('should handle missing company_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes')
      
      const response = await themesGET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Company ID is required')
    })

    it('should filter themes by strategic alignment', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company&filter=in_strategy')
      
      const response = await themesGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.themes).toBeDefined()
    })

    it('should sort themes by strategic priority', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company&sort=strategic_priority')
      
      const response = await themesGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.themes).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseAdmin.from().select().eq().error = new Error('Database connection failed')
      
      const request = new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company')
      
      const response = await themesGET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch themes')
    })
  })

  describe('POST /api/admin/themes', () => {
    it('should trigger theme discovery', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes', {
        method: 'POST',
        body: JSON.stringify({
          company_id: 'test-company',
          action: 'discover_themes'
        })
      })
      
      const response = await themesPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Discovered')
    })

    it('should trigger strategic analysis', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes', {
        method: 'POST',
        body: JSON.stringify({
          company_id: 'test-company',
          action: 'analyze_strategic'
        })
      })
      
      const response = await themesPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Re-analyzed')
    })

    it('should handle invalid actions', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes', {
        method: 'POST',
        body: JSON.stringify({
          company_id: 'test-company',
          action: 'invalid_action'
        })
      })
      
      const response = await themesPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })
  })

  describe('GET /api/admin/themes/[id]', () => {
    it('should return single theme details', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes/test-theme-id')
      
      const response = await themeGET(request, { params: { id: 'test-theme-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.theme).toBeDefined()
      expect(data.theme.id).toBe('test-theme-id')
    })

    it('should handle theme not found', async () => {
      mockSupabaseAdmin.from().select().eq().single().data = null
      
      const request = new NextRequest('http://localhost:3000/api/admin/themes/non-existent-id')
      
      const response = await themeGET(request, { params: { id: 'non-existent-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Theme not found')
    })
  })

  describe('POST /api/admin/themes/[id]/review', () => {
    it('should handle theme approval', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes/test-theme-id/review', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: 'approve',
          notes: 'This theme aligns well with our strategy'
        })
      })
      
      // Mock auth success
      jest.doMock('@/lib/auth', () => ({
        getAdminUser: jest.fn(() => ({
          data: { company_id: 'test-company' },
          error: null
        }))
      }))
      
      const response = await reviewPOST(request, { params: { id: 'test-theme-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('approved')
    })

    it('should handle theme decline with reason', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes/test-theme-id/review', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: 'decline',
          declined_reason: 'Conflicts with current strategy'
        })
      })
      
      const response = await reviewPOST(request, { params: { id: 'test-theme-id' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('declined')
    })

    it('should validate decision types', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes/test-theme-id/review', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision: 'invalid_decision'
        })
      })
      
      const response = await reviewPOST(request, { params: { id: 'test-theme-id' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid decision')
    })

    it('should handle unauthorized requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes/test-theme-id/review', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'approve'
        })
      })
      
      const response = await reviewPOST(request, { params: { id: 'test-theme-id' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Missing or invalid authorization header')
    })
  })

  describe('GET /api/admin/themes/strategic-health', () => {
    it('should return strategic health metrics', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes/strategic-health?company_id=test-company')
      
      const response = await healthGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('aligned')
      expect(data).toHaveProperty('conflicted')
      expect(data).toHaveProperty('needsReview')
      expect(data).toHaveProperty('strategyHealthScore')
    })

    it('should handle empty themes gracefully', async () => {
      mockSupabaseAdmin.from().select().eq().data = []
      
      const request = new NextRequest('http://localhost:3000/api/admin/themes/strategic-health?company_id=test-company')
      
      const response = await healthGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.total).toBe(0)
      expect(data.strategyHealthScore).toBe(0)
    })
  })

  describe('GET /api/admin/themes/strategic-summary', () => {
    it('should return comprehensive strategic summary', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes/strategic-summary?company_id=test-company')
      
      const response = await summaryGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('summary')
      expect(data).toHaveProperty('metrics')
      expect(data).toHaveProperty('insights')
      expect(data).toHaveProperty('trends')
      expect(data).toHaveProperty('recommendations')
    })

    it('should respect timeframe parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/themes/strategic-summary?company_id=test-company&timeframe=7')
      
      const response = await summaryGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary.period).toBe('7 days')
    })
  })
})

// Performance Tests
describe('Themes API Performance', () => {
  it('should respond to themes list within 2 seconds', async () => {
    const startTime = Date.now()
    
    const request = new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company')
    await themesGET(request)
    
    const responseTime = Date.now() - startTime
    expect(responseTime).toBeLessThan(2000)
  })

  it('should handle large datasets efficiently', async () => {
    // Mock large dataset
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      ...mockThemeData,
      id: `theme-${i}`,
      title: `Theme ${i}`
    }))
    
    mockSupabaseAdmin.from().select().eq().data = largeDataset
    
    const startTime = Date.now()
    
    const request = new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company')
    const response = await themesGET(request)
    const data = await response.json()
    
    const responseTime = Date.now() - startTime
    
    expect(response.status).toBe(200)
    expect(data.themes.length).toBe(1000)
    expect(responseTime).toBeLessThan(3000) // Should handle 1000 themes in under 3 seconds
  })
})

// Integration Tests
describe('Themes API Integration', () => {
  it('should maintain data consistency across operations', async () => {
    // 1. Get initial themes
    const getRequest = new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company')
    const getResponse = await themesGET(getRequest)
    const initialData = await getResponse.json()
    
    // 2. Update a theme
    const updateRequest = new NextRequest('http://localhost:3000/api/admin/themes/test-theme-id', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pm_notes: 'Updated notes'
      })
    })
    
    await themePATCH(updateRequest, { params: { id: 'test-theme-id' } })
    
    // 3. Verify update is reflected
    const updatedRequest = new NextRequest('http://localhost:3000/api/admin/themes/test-theme-id')
    const updatedResponse = await themeGET(updatedRequest, { params: { id: 'test-theme-id' } })
    const updatedData = await updatedResponse.json()
    
    expect(updatedData.theme.pm_notes).toBe('Updated notes')
  })

  it('should handle concurrent requests', async () => {
    const requests = Array.from({ length: 10 }, () => 
      themesGET(new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company'))
    )
    
    const responses = await Promise.all(requests)
    
    responses.forEach(response => {
      expect(response.status).toBe(200)
    })
  })
})

// Error Handling Tests
describe('Themes API Error Handling', () => {
  it('should handle malformed JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/themes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid json'
    })
    
    const response = await themesPOST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Internal server error')
  })

  it('should handle network timeouts gracefully', async () => {
    // Mock timeout
    mockSupabaseAdmin.from().select().eq().error = new Error('Request timeout')
    
    const request = new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company')
    
    const response = await themesGET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch themes')
  })
})

// Security Tests
describe('Themes API Security', () => {
  it('should validate company_id parameter', async () => {
    const maliciousRequest = new NextRequest('http://localhost:3000/api/admin/themes?company_id=<script>alert("xss")</script>')
    
    const response = await themesGET(maliciousRequest)
    const data = await response.json()

    // Should handle gracefully without executing script
    expect(response.status).toBe(400)
    expect(data.error).toBe('Company ID is required')
  })

  it('should prevent SQL injection in filters', async () => {
    const maliciousRequest = new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company&filter=\'; DROP TABLE themes; --')
    
    const response = await themesGET(maliciousRequest)
    
    // Should not crash and should return valid response
    expect(response.status).toBe(200)
  })
})
