// ============================================================================
// JEST GLOBAL SETUP
// ============================================================================
// Global setup for Jest test suite including environment preparation,
// database setup, and global test utilities
// ============================================================================

// Global test setup
async function globalSetup() {
  console.log('🌍 Running global Jest setup...')
  
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token'
  process.env.AI_ENABLE_COST_TRACKING = 'false'
  
  // Set up test database if needed
  await setupTestDatabase()
  
  // Set up global mocks
  await setupGlobalMocks()
  
  console.log('✅ Global Jest setup complete')
}

// Set up test database
async function setupTestDatabase() {
  try {
    console.log('📊 Setting up test database...')
    
    // If using a real test database, set up schema here
    // For now, we'll use mocks, but this is where you'd:
    // 1. Create test database
    // 2. Run migrations
    // 3. Seed test data
    
    console.log('✅ Test database setup complete')
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    // Don't throw here as we want tests to run even if database setup fails
  }
}

// Set up global mocks
async function setupGlobalMocks() {
  try {
    console.log('🎭 Setting up global mocks...')
    
    // Mock external services
    await mockExternalServices()
    
    // Set up global test utilities
    await setupGlobalTestUtilities()
    
    console.log('✅ Global mocks setup complete')
  } catch (error) {
    console.error('❌ Failed to setup global mocks:', error)
    throw error
  }
}

// Mock external services
async function mockExternalServices() {
  // Mock Supabase client
  global.mockSupabaseClient = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              data: [],
              error: null
            }))
          }))
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
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
    })),
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    }
  }
  
  // Mock OpenAI client
  global.mockOpenAIClient = {
    chat: {
      completions: {
        create: jest.fn(() => ({
          choices: [{
            message: {
              content: JSON.stringify({
                themes: [],
                alignment_score: 75,
                reasoning: 'Test reasoning',
                conflicts: [],
                opportunities: [],
                recommendation: 'medium_priority'
              })
            }
          }],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300
          }
        }))
      }
    }
  }
  
  // Mock Redis client
  global.mockRedisClient = {
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1))
  }
}

// Set up global test utilities
async function setupGlobalTestUtilities() {
  // Global test data generators
  global.generateTestTheme = (overrides = {}) => ({
    id: `theme-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Theme',
    description: 'Test theme description',
    customerCount: 10,
    mentionCount: 15,
    sentiment: 0.8,
    priority: 85,
    finalPriority: 76,
    strategicAlignment: 90,
    strategicReasoning: 'This theme strongly aligns with our strategy',
    strategicConflicts: [],
    strategicOpportunities: ['Opportunity 1', 'Opportunity 2'],
    recommendation: 'high_priority',
    pmNotes: null,
    declinedReason: null,
    tags: ['innovation', 'customer-experience'],
    ...overrides
  })
  
  global.generateTestStrategy = (overrides = {}) => ({
    id: `strategy-${Math.random().toString(36).substr(2, 9)}`,
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
    company_id: 'test-company',
    ...overrides
  })
  
  global.generateTestFeedback = (overrides = {}) => ({
    id: `feedback-${Math.random().toString(36).substr(2, 9)}`,
    content: 'This is test feedback',
    themes: ['innovation', 'user-experience'],
    ai_tags: ['positive', 'feature-request'],
    priority_score: 80,
    sentiment_score: 0.8,
    ...overrides
  })
  
  // Global test helpers
  global.waitFor = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms))
  
  global.mockApiResponse = (data, status = 200) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data)
    })
  }
  
  global.mockApiError = (message = 'API Error', status = 500) => {
    global.fetch = jest.fn().mockRejectedValue(new Error(message))
  }
  
  // Global test constants
  global.TEST_CONSTANTS = {
    COMPANY_ID: 'test-company-id',
    USER_ID: 'test-user-id',
    THEME_ID: 'test-theme-id',
    STRATEGY_ID: 'test-strategy-id',
    FEEDBACK_ID: 'test-feedback-id'
  }
}

// Export the setup function
export default globalSetup
