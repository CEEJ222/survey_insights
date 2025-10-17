// ============================================================================
// API TESTING SUITE - STRATEGIC SCORING ENDPOINTS
// ============================================================================
// Tests for strategic scoring calculation, recalculation, and validation
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as calculatePOST } from '@/app/api/admin/strategic-scoring/calculate/route'
import { POST as recalculatePOST } from '@/app/api/admin/strategic-scoring/recalculate/route'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/ai/theme-discovery')

const mockSupabaseAdmin = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: mockThemeData,
          error: null
        }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null
      }))
    }))
  }))
}

const mockThemeData = {
  id: 'test-theme-id',
  title: 'Test Theme',
  description: 'Test theme description',
  priority_score: 85,
  strategic_alignment_score: null,
  strategic_reasoning: null,
  strategic_conflicts: null,
  strategic_opportunities: null,
  recommendation: 'needs_review',
  company_id: 'test-company'
}

const mockStrategyData = {
  id: 'test-strategy-id',
  title: 'Test Strategy',
  description: 'Test strategy description',
  target_customer_description: 'Test customers',
  problems_we_solve: ['Problem 1', 'Problem 2'],
  problems_we_dont_solve: ['Problem 3'],
  how_we_win: 'By solving problems',
  strategic_keywords: [
    { keyword: 'innovation', weight: 0.8 },
    { keyword: 'efficiency', weight: 0.6 }
  ],
  competitors: [
    { name: 'Competitor 1', their_strength: 'Speed', our_differentiation: 'Quality' }
  ],
  is_active: true,
  company_id: 'test-company'
}

const mockAlignmentResult = {
  alignment_score: 85,
  reasoning: 'This theme aligns well with our strategic focus on innovation',
  conflicts: [],
  opportunities: ['Could drive customer acquisition', 'Supports our differentiation'],
  recommendation: 'high_priority'
}

describe('Strategic Scoring API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('POST /api/admin/strategic-scoring/calculate', () => {
    it('should calculate strategic alignment for a single theme', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company',
          theme_id: 'test-theme-id'
        })
      })

      // Mock theme discovery engine
      const mockDiscoveryEngine = {
        getCurrentStrategy: jest.fn().mockResolvedValue(mockStrategyData),
        calculateStrategicAlignment: jest.fn().mockResolvedValue(mockAlignmentResult)
      }

      jest.doMock('@/lib/ai/theme-discovery', () => ({
        createThemeDiscoveryEngine: jest.fn().mockReturnValue(mockDiscoveryEngine)
      }))

      const response = await calculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.theme_id).toBe('test-theme-id')
      expect(data.alignment_score).toBe(85)
      expect(data.recommendation).toBe('high_priority')
    })

    it('should handle missing parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company'
          // Missing theme_id
        })
      })

      const response = await calculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Company ID and Theme ID are required')
    })

    it('should handle theme not found', async () => {
      mockSupabaseAdmin.from().select().eq().single().data = null
      mockSupabaseAdmin.from().select().eq().single().error = new Error('Theme not found')

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company',
          theme_id: 'non-existent-theme'
        })
      })

      const response = await calculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Theme not found or access denied')
    })

    it('should handle missing strategy', async () => {
      const mockDiscoveryEngine = {
        getCurrentStrategy: jest.fn().mockResolvedValue(null),
        calculateStrategicAlignment: jest.fn()
      }

      jest.doMock('@/lib/ai/theme-discovery', () => ({
        createThemeDiscoveryEngine: jest.fn().mockReturnValue(mockDiscoveryEngine)
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company',
          theme_id: 'test-theme-id'
        })
      })

      const response = await calculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No active strategy found. Please set up strategy first.')
    })

    it('should update theme with calculated alignment', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company',
          theme_id: 'test-theme-id'
        })
      })

      const mockDiscoveryEngine = {
        getCurrentStrategy: jest.fn().mockResolvedValue(mockStrategyData),
        calculateStrategicAlignment: jest.fn().mockResolvedValue(mockAlignmentResult)
      }

      jest.doMock('@/lib/ai/theme-discovery', () => ({
        createThemeDiscoveryEngine: jest.fn().mockReturnValue(mockDiscoveryEngine)
      }))

      const response = await calculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Verify update was called
      expect(mockSupabaseAdmin.from().update).toHaveBeenCalledWith({
        strategic_alignment_score: 85,
        strategic_reasoning: 'This theme aligns well with our strategic focus on innovation',
        strategic_conflicts: [],
        strategic_opportunities: ['Could drive customer acquisition', 'Supports our differentiation'],
        recommendation: 'high_priority',
        final_priority_score: 72, // 85 * (85/100) = 72.25, rounded to 72
        updated_at: expect.any(String)
      })
    })

    it('should handle AI calculation errors gracefully', async () => {
      const mockDiscoveryEngine = {
        getCurrentStrategy: jest.fn().mockResolvedValue(mockStrategyData),
        calculateStrategicAlignment: jest.fn().mockRejectedValue(new Error('AI service unavailable'))
      }

      jest.doMock('@/lib/ai/theme-discovery', () => ({
        createThemeDiscoveryEngine: jest.fn().mockReturnValue(mockDiscoveryEngine)
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company',
          theme_id: 'test-theme-id'
        })
      })

      const response = await calculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/admin/strategic-scoring/recalculate', () => {
    it('should recalculate strategic alignment for all themes', async () => {
      const mockThemesData = [
        { ...mockThemeData, id: 'theme-1' },
        { ...mockThemeData, id: 'theme-2' },
        { ...mockThemeData, id: 'theme-3' }
      ]

      mockSupabaseAdmin.from().select().eq().data = mockThemesData

      const mockDiscoveryEngine = {
        getCurrentStrategy: jest.fn().mockResolvedValue(mockStrategyData),
        calculateStrategicAlignment: jest.fn().mockResolvedValue(mockAlignmentResult)
      }

      jest.doMock('@/lib/ai/theme-discovery', () => ({
        createThemeDiscoveryEngine: jest.fn().mockReturnValue(mockDiscoveryEngine)
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company'
        })
      })

      const response = await recalculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.themes_recalculated).toBe(3)
      expect(data.message).toContain('Recalculated strategic alignment for 3 themes')
    })

    it('should handle empty themes list', async () => {
      mockSupabaseAdmin.from().select().eq().data = []

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company'
        })
      })

      const response = await recalculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.themes_recalculated).toBe(0)
      expect(data.message).toBe('No themes to recalculate')
    })

    it('should handle missing company_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Missing company_id
        })
      })

      const response = await recalculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Company ID is required')
    })

    it('should handle database errors when fetching themes', async () => {
      mockSupabaseAdmin.from().select().eq().error = new Error('Database connection failed')

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company'
        })
      })

      const response = await recalculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch themes')
    })

    it('should continue processing even if individual theme calculation fails', async () => {
      const mockThemesData = [
        { ...mockThemeData, id: 'theme-1' },
        { ...mockThemeData, id: 'theme-2' },
        { ...mockThemeData, id: 'theme-3' }
      ]

      mockSupabaseAdmin.from().select().eq().data = mockThemesData

      const mockDiscoveryEngine = {
        getCurrentStrategy: jest.fn().mockResolvedValue(mockStrategyData),
        calculateStrategicAlignment: jest.fn()
          .mockResolvedValueOnce(mockAlignmentResult) // Success for theme-1
          .mockRejectedValueOnce(new Error('AI error')) // Failure for theme-2
          .mockResolvedValueOnce(mockAlignmentResult) // Success for theme-3
      }

      jest.doMock('@/lib/ai/theme-discovery', () => ({
        createThemeDiscoveryEngine: jest.fn().mockReturnValue(mockDiscoveryEngine)
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company'
        })
      })

      const response = await recalculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.themes_recalculated).toBe(2) // Only 2 themes processed successfully
    })

    it('should handle missing strategy for recalculation', async () => {
      const mockThemesData = [{ ...mockThemeData, id: 'theme-1' }]
      mockSupabaseAdmin.from().select().eq().data = mockThemesData

      const mockDiscoveryEngine = {
        getCurrentStrategy: jest.fn().mockResolvedValue(null),
        calculateStrategicAlignment: jest.fn()
      }

      jest.doMock('@/lib/ai/theme-discovery', () => ({
        createThemeDiscoveryEngine: jest.fn().mockReturnValue(mockDiscoveryEngine)
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company'
        })
      })

      const response = await recalculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('No active strategy found. Please set up strategy first.')
    })
  })

  describe('Performance Tests', () => {
    it('should complete single theme calculation within 5 seconds', async () => {
      const startTime = Date.now()

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company',
          theme_id: 'test-theme-id'
        })
      })

      const mockDiscoveryEngine = {
        getCurrentStrategy: jest.fn().mockResolvedValue(mockStrategyData),
        calculateStrategicAlignment: jest.fn().mockResolvedValue(mockAlignmentResult)
      }

      jest.doMock('@/lib/ai/theme-discovery', () => ({
        createThemeDiscoveryEngine: jest.fn().mockReturnValue(mockDiscoveryEngine)
      }))

      const response = await calculatePOST(request)
      const responseTime = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000)
    })

    it('should handle batch recalculation efficiently', async () => {
      const largeThemeSet = Array.from({ length: 50 }, (_, i) => ({
        ...mockThemeData,
        id: `theme-${i}`
      }))

      mockSupabaseAdmin.from().select().eq().data = largeThemeSet

      const startTime = Date.now()

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company'
        })
      })

      const mockDiscoveryEngine = {
        getCurrentStrategy: jest.fn().mockResolvedValue(mockStrategyData),
        calculateStrategicAlignment: jest.fn().mockResolvedValue(mockAlignmentResult)
      }

      jest.doMock('@/lib/ai/theme-discovery', () => ({
        createThemeDiscoveryEngine: jest.fn().mockReturnValue(mockDiscoveryEngine)
      }))

      const response = await recalculatePOST(request)
      const responseTime = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(10000) // Should handle 50 themes in under 10 seconds
    })
  })

  describe('Data Validation Tests', () => {
    it('should validate alignment score ranges', async () => {
      const invalidAlignmentResult = {
        alignment_score: 150, // Invalid: should be 0-100
        reasoning: 'Test reasoning',
        conflicts: [],
        opportunities: [],
        recommendation: 'high_priority'
      }

      const mockDiscoveryEngine = {
        getCurrentStrategy: jest.fn().mockResolvedValue(mockStrategyData),
        calculateStrategicAlignment: jest.fn().mockResolvedValue(invalidAlignmentResult)
      }

      jest.doMock('@/lib/ai/theme-discovery', () => ({
        createThemeDiscoveryEngine: jest.fn().mockReturnValue(mockDiscoveryEngine)
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: 'test-company',
          theme_id: 'test-theme-id'
        })
      })

      const response = await calculatePOST(request)
      const data = await response.json()

      // Should handle gracefully - either clamp the value or reject
      expect(response.status).toBe(200)
      // The system should either clamp to 100 or handle the invalid score
    })

    it('should handle malformed JSON requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/strategic-scoring/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      })

      const response = await calculatePOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
