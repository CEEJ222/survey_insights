// ============================================================================
// JEST SETUP CONFIGURATION
// ============================================================================
// Global test setup including mocks, environment variables, and test utilities
// ============================================================================

import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.UPSTASH_REDIS_REST_URL = 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-redis-token'
process.env.AI_ENABLE_COST_TRACKING = 'false'
process.env.NODE_ENV = 'test'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />
  },
}))

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock crypto for browser compatibility
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }
  }
})

// Mock fetch globally
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()
  
  // Mock console.error and console.warn to reduce noise
  console.error = jest.fn()
  console.warn = jest.fn()
  
  // Reset fetch mock
  fetch.mockClear()
})

afterEach(() => {
  // Restore original console methods
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Global test utilities
global.testUtils = {
  // Helper to create mock theme data
  createMockTheme: (overrides = {}) => ({
    id: 'test-theme-id',
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
  }),

  // Helper to create mock strategy data
  createMockStrategy: (overrides = {}) => ({
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
    company_id: 'test-company',
    ...overrides
  }),

  // Helper to create mock feedback data
  createMockFeedback: (overrides = {}) => ({
    id: 'test-feedback-id',
    content: 'This is test feedback',
    themes: ['innovation', 'user-experience'],
    ai_tags: ['positive', 'feature-request'],
    priority_score: 80,
    sentiment_score: 0.8,
    ...overrides
  }),

  // Helper to wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to mock API responses
  mockApiResponse: (data, status = 200) => {
    fetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data)
    })
  },

  // Helper to mock API errors
  mockApiError: (message = 'API Error', status = 500) => {
    fetch.mockRejectedValueOnce(new Error(message))
  }
}

// Setup for testing environment
beforeAll(() => {
  // Set up any global test setup here
  process.env.NODE_ENV = 'test'
})

afterAll(() => {
  // Clean up any global test setup here
})

// Extend Jest matchers
expect.extend({
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime())
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      }
    }
  },
  
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const pass = typeof received === 'string' && uuidRegex.test(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      }
    }
  }
})
