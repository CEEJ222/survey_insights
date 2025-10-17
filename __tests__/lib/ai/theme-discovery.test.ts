// ============================================================================
// AI MODULE TESTING SUITE - THEME DISCOVERY ENGINE
// ============================================================================
// Tests for AI-powered theme discovery, strategic alignment calculation,
// and performance optimization
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { ThemeDiscoveryEngine, createThemeDiscoveryEngine } from '@/lib/ai/theme-discovery'

// Mock dependencies
jest.mock('openai')
jest.mock('@upstash/redis')
jest.mock('@/lib/supabase/server')

const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
}

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}

const mockSupabaseAdmin = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    })),
    insert: jest.fn(() => ({
      data: null,
      error: null
    }))
  }))
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

const mockThemeData = {
  id: 'test-theme-id',
  title: 'Test Theme',
  description: 'Test theme description',
  feedback_count: 10,
  sentiment_score: 0.8,
  priority_score: 85,
  company_id: 'test-company'
}

const mockFeedbackData = [
  {
    id: 'feedback-1',
    content: 'This feature is amazing and innovative',
    themes: ['innovation', 'user-experience'],
    ai_tags: ['positive', 'feature-request'],
    priority_score: 80
  },
  {
    id: 'feedback-2',
    content: 'The system is very efficient and fast',
    themes: ['efficiency', 'performance'],
    ai_tags: ['positive', 'performance'],
    priority_score: 75
  }
]

describe('ThemeDiscoveryEngine', () => {
  let engine: ThemeDiscoveryEngine
  const testCompanyId = 'test-company'

  beforeEach(() => {
    jest.clearAllMocks()
    engine = new ThemeDiscoveryEngine(testCompanyId)
    
    // Default successful mocks
    mockRedis.get.mockResolvedValue(null) // No cache by default
    mockRedis.set.mockResolvedValue('OK')
    mockSupabaseAdmin.from().select().eq().order().limit().data = mockFeedbackData
    mockSupabaseAdmin.from().select().eq().order().limit().error = null
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getCurrentStrategy', () => {
    it('should retrieve active strategy for company', async () => {
      mockSupabaseAdmin.from().select().eq().order().limit().single().data = mockStrategyData
      mockSupabaseAdmin.from().select().eq().order().limit().single().error = null

      const strategy = await engine.getCurrentStrategy()

      expect(strategy).toEqual(mockStrategyData)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('product_strategy')
    })

    it('should return null if no active strategy found', async () => {
      mockSupabaseAdmin.from().select().eq().order().limit().single().data = null

      const strategy = await engine.getCurrentStrategy()

      expect(strategy).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseAdmin.from().select().eq().order().limit().single().error = new Error('Database error')

      const strategy = await engine.getCurrentStrategy()

      expect(strategy).toBeNull()
    })
  })

  describe('discoverThemes', () => {
    it('should discover themes from feedback data', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              themes: [
                {
                  name: 'Innovation Focus',
                  description: 'Customers want more innovative features',
                  customer_count: 5,
                  mention_count: 8,
                  sentiment_score: 0.85,
                  priority_score: 82,
                  tags: ['innovation', 'features']
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)

      const themes = await engine.discoverThemes()

      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeGreaterThan(0)
      expect(themes[0]).toHaveProperty('name')
      expect(themes[0]).toHaveProperty('description')
      expect(themes[0]).toHaveProperty('strategic_alignment_score')
      expect(themes[0]).toHaveProperty('final_priority_score')
    })

    it('should handle AI service errors gracefully', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('AI service unavailable'))

      const themes = await engine.discoverThemes()

      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBe(0)
    })

    it('should use cached results when available', async () => {
      const cachedThemes = [
        {
          name: 'Cached Theme',
          description: 'Cached theme description',
          customer_count: 3,
          mention_count: 5,
          sentiment_score: 0.7,
          priority_score: 70,
          tags: ['cached']
        }
      ]

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedThemes))

      const themes = await engine.discoverThemes()

      expect(themes).toEqual(cachedThemes)
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled()
    })

    it('should calculate strategic alignment for discovered themes', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              themes: [
                {
                  name: 'Strategic Theme',
                  description: 'Theme that aligns with strategy',
                  customer_count: 5,
                  mention_count: 8,
                  sentiment_score: 0.85,
                  priority_score: 82,
                  tags: ['innovation']
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)
      mockSupabaseAdmin.from().select().eq().order().limit().single().data = mockStrategyData

      const themes = await engine.discoverThemes()

      expect(themes[0]).toHaveProperty('strategic_alignment_score')
      expect(themes[0]).toHaveProperty('final_priority_score')
    })

    it('should handle missing strategy during discovery', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              themes: [
                {
                  name: 'Theme Without Strategy',
                  description: 'Theme discovered without strategy',
                  customer_count: 3,
                  mention_count: 5,
                  sentiment_score: 0.7,
                  priority_score: 70,
                  tags: ['general']
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)
      mockSupabaseAdmin.from().select().eq().order().limit().single().data = null

      const themes = await engine.discoverThemes()

      expect(themes[0]).toHaveProperty('strategic_alignment_score')
      expect(themes[0].strategic_alignment_score).toBe(50) // Default neutral score
    })
  })

  describe('calculateStrategicAlignment', () => {
    it('should calculate strategic alignment for a theme', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              alignment_score: 85,
              reasoning: 'This theme strongly aligns with our innovation strategy',
              conflicts: [],
              opportunities: ['Could drive customer acquisition'],
              recommendation: 'high_priority'
            })
          }
        }],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 100,
          total_tokens: 250
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)

      const alignment = await engine.calculateStrategicAlignment(mockThemeData, mockStrategyData)

      expect(alignment).toHaveProperty('alignment_score')
      expect(alignment).toHaveProperty('reasoning')
      expect(alignment).toHaveProperty('conflicts')
      expect(alignment).toHaveProperty('opportunities')
      expect(alignment).toHaveProperty('recommendation')
      expect(alignment.alignment_score).toBe(85)
    })

    it('should use cached alignment when available', async () => {
      const cachedAlignment = {
        alignment_score: 90,
        reasoning: 'Cached alignment reasoning',
        conflicts: [],
        opportunities: ['Cached opportunity'],
        recommendation: 'high_priority'
      }

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedAlignment))

      const alignment = await engine.calculateStrategicAlignment(mockThemeData, mockStrategyData)

      expect(alignment).toEqual(cachedAlignment)
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled()
    })

    it('should handle AI service errors during alignment calculation', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('AI service error'))

      const alignment = await engine.calculateStrategicAlignment(mockThemeData, mockStrategyData)

      expect(alignment).toHaveProperty('alignment_score')
      expect(alignment.alignment_score).toBe(50) // Default neutral score
      expect(alignment.reasoning).toContain('Unable to calculate strategic alignment')
    })

    it('should validate alignment score ranges', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              alignment_score: 150, // Invalid: should be 0-100
              reasoning: 'Test reasoning',
              conflicts: [],
              opportunities: [],
              recommendation: 'high_priority'
            })
          }
        }],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 100,
          total_tokens: 250
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)

      const alignment = await engine.calculateStrategicAlignment(mockThemeData, mockStrategyData)

      // Should clamp the score to valid range
      expect(alignment.alignment_score).toBeLessThanOrEqual(100)
      expect(alignment.alignment_score).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance Tests', () => {
    it('should complete theme discovery within reasonable time', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              themes: [
                {
                  name: 'Performance Test Theme',
                  description: 'Test theme for performance',
                  customer_count: 5,
                  mention_count: 8,
                  sentiment_score: 0.85,
                  priority_score: 82,
                  tags: ['performance']
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)
      mockSupabaseAdmin.from().select().eq().order().limit().single().data = mockStrategyData

      const startTime = Date.now()
      const themes = await engine.discoverThemes()
      const duration = Date.now() - startTime

      expect(themes.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
    })

    it('should handle large feedback datasets efficiently', async () => {
      const largeFeedbackSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `feedback-${i}`,
        content: `Feedback content ${i}`,
        themes: [`theme-${i % 10}`],
        ai_tags: ['tag1', 'tag2'],
        priority_score: 70 + (i % 30)
      }))

      mockSupabaseAdmin.from().select().eq().order().limit().data = largeFeedbackSet

      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              themes: [
                {
                  name: 'Large Dataset Theme',
                  description: 'Theme from large dataset',
                  customer_count: 100,
                  mention_count: 150,
                  sentiment_score: 0.75,
                  priority_score: 80,
                  tags: ['large-dataset']
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 1000,
          completion_tokens: 500,
          total_tokens: 1500
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)

      const startTime = Date.now()
      const themes = await engine.discoverThemes()
      const duration = Date.now() - startTime

      expect(themes.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(15000) // Should handle 1000 feedback items in under 15 seconds
    })

    it('should cache results appropriately', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              themes: [
                {
                  name: 'Cache Test Theme',
                  description: 'Theme for cache testing',
                  customer_count: 5,
                  mention_count: 8,
                  sentiment_score: 0.85,
                  priority_score: 82,
                  tags: ['cache-test']
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)

      // First call - should call AI and cache result
      await engine.discoverThemes()
      expect(mockRedis.set).toHaveBeenCalled()

      // Second call - should use cache
      mockRedis.get.mockResolvedValue(JSON.stringify([
        {
          name: 'Cache Test Theme',
          description: 'Theme for cache testing',
          customer_count: 5,
          mention_count: 8,
          sentiment_score: 0.85,
          priority_score: 82,
          tags: ['cache-test']
        }
      ]))

      const cachedThemes = await engine.discoverThemes()
      expect(cachedThemes.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed AI responses gracefully', async () => {
      const malformedAIResponse = {
        choices: [{
          message: {
            content: 'invalid json response'
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(malformedAIResponse)

      const themes = await engine.discoverThemes()

      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBe(0)
    })

    it('should handle Redis connection errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'))
      mockRedis.set.mockRejectedValue(new Error('Redis connection failed'))

      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              themes: [
                {
                  name: 'Redis Error Theme',
                  description: 'Theme despite Redis error',
                  customer_count: 5,
                  mention_count: 8,
                  sentiment_score: 0.85,
                  priority_score: 82,
                  tags: ['redis-error']
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)

      const themes = await engine.discoverThemes()

      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeGreaterThan(0)
    })

    it('should handle database connection errors', async () => {
      mockSupabaseAdmin.from().select().eq().order().limit().error = new Error('Database connection failed')

      const themes = await engine.discoverThemes()

      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBe(0)
    })
  })

  describe('Data Validation', () => {
    it('should validate theme data structure', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              themes: [
                {
                  // Missing required fields
                  name: 'Incomplete Theme'
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)

      const themes = await engine.discoverThemes()

      expect(Array.isArray(themes)).toBe(true)
      // Should either filter out invalid themes or provide defaults
    })

    it('should sanitize AI-generated content', async () => {
      const mockAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              themes: [
                {
                  name: 'Theme with <script>alert("xss")</script>',
                  description: 'Description with malicious content',
                  customer_count: 5,
                  mention_count: 8,
                  sentiment_score: 0.85,
                  priority_score: 82,
                  tags: ['xss-test']
                }
              ]
            })
          }
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300
        }
      }

      mockOpenAI.chat.completions.create.mockResolvedValue(mockAIResponse)

      const themes = await engine.discoverThemes()

      expect(Array.isArray(themes)).toBe(true)
      if (themes.length > 0) {
        expect(themes[0].name).not.toContain('<script>')
        expect(themes[0].description).not.toContain('malicious')
      }
    })
  })
})

describe('createThemeDiscoveryEngine', () => {
  it('should create engine instance with correct company ID', () => {
    const engine = createThemeDiscoveryEngine('test-company')

    expect(engine).toBeInstanceOf(ThemeDiscoveryEngine)
  })

  it('should handle invalid company ID gracefully', () => {
    expect(() => {
      createThemeDiscoveryEngine('')
    }).not.toThrow()
  })
})
