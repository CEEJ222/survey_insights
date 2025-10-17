// ============================================================================
// JEST E2E SETUP CONFIGURATION
// ============================================================================
// End-to-end testing setup including Playwright configuration,
// test database setup, and environment preparation
// ============================================================================

import { chromium } from 'playwright'

// Global E2E test configuration
global.E2E_CONFIG = {
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
  testAdminEmail: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
  testAdminPassword: process.env.TEST_ADMIN_PASSWORD || 'password123',
  testCompanyId: process.env.TEST_COMPANY_ID || 'test-company-id',
  headless: process.env.CI === 'true',
  slowMo: parseInt(process.env.E2E_SLOW_MO) || 0,
  timeout: parseInt(process.env.E2E_TIMEOUT) || 30000,
}

// Global setup for E2E tests
beforeAll(async () => {
  console.log('🚀 Setting up E2E test environment...')
  
  // Set up test database if needed
  await setupTestDatabase()
  
  // Set up test data
  await setupTestData()
  
  console.log('✅ E2E test environment ready')
})

// Global teardown for E2E tests
afterAll(async () => {
  console.log('🧹 Cleaning up E2E test environment...')
  
  // Clean up test data
  await cleanupTestData()
  
  // Clean up test database if needed
  await cleanupTestDatabase()
  
  console.log('✅ E2E test environment cleaned up')
})

// Setup test database
async function setupTestDatabase() {
  try {
    // If using a test database, set up schema here
    console.log('📊 Setting up test database...')
    
    // Example: Run database migrations for test environment
    // await runDatabaseMigrations('test')
    
    console.log('✅ Test database setup complete')
  } catch (error) {
    console.error('❌ Failed to setup test database:', error)
    throw error
  }
}

// Setup test data
async function setupTestData() {
  try {
    console.log('📝 Setting up test data...')
    
    // Create test company
    await createTestCompany()
    
    // Create test admin user
    await createTestAdminUser()
    
    // Create test themes
    await createTestThemes()
    
    // Create test strategy
    await createTestStrategy()
    
    console.log('✅ Test data setup complete')
  } catch (error) {
    console.error('❌ Failed to setup test data:', error)
    throw error
  }
}

// Create test company
async function createTestCompany() {
  const response = await fetch(`${global.E2E_CONFIG.baseURL}/api/admin/companies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
    },
    body: JSON.stringify({
      name: 'Test Company',
      domain: 'testcompany.com',
      industry: 'Technology',
      size: 'startup'
    })
  })
  
  if (!response.ok && response.status !== 409) { // 409 = already exists
    throw new Error(`Failed to create test company: ${response.statusText}`)
  }
}

// Create test admin user
async function createTestAdminUser() {
  const response = await fetch(`${global.E2E_CONFIG.baseURL}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
    },
    body: JSON.stringify({
      email: global.E2E_CONFIG.testAdminEmail,
      password: global.E2E_CONFIG.testAdminPassword,
      name: 'Test Admin',
      role: 'admin',
      company_id: global.E2E_CONFIG.testCompanyId
    })
  })
  
  if (!response.ok && response.status !== 409) { // 409 = already exists
    throw new Error(`Failed to create test admin user: ${response.statusText}`)
  }
}

// Create test themes
async function createTestThemes() {
  const testThemes = [
    {
      title: 'E2E Test Theme 1',
      description: 'First test theme for E2E testing',
      customer_count: 10,
      mention_count: 15,
      sentiment_score: 0.8,
      priority_score: 85,
      tags: ['innovation', 'user-experience']
    },
    {
      title: 'E2E Test Theme 2',
      description: 'Second test theme for E2E testing',
      customer_count: 8,
      mention_count: 12,
      sentiment_score: 0.7,
      priority_score: 75,
      tags: ['performance', 'reliability']
    },
    {
      title: 'E2E Test Theme 3 - Needs Review',
      description: 'Third test theme that needs review',
      customer_count: 5,
      mention_count: 8,
      sentiment_score: 0.6,
      priority_score: 65,
      tags: ['feature-request'],
      recommendation: 'needs_review'
    }
  ]

  for (const theme of testThemes) {
    const response = await fetch(`${global.E2E_CONFIG.baseURL}/api/admin/themes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
      },
      body: JSON.stringify({
        company_id: global.E2E_CONFIG.testCompanyId,
        ...theme
      })
    })
    
    if (!response.ok && response.status !== 409) { // 409 = already exists
      console.warn(`Failed to create test theme "${theme.title}": ${response.statusText}`)
    }
  }
}

// Create test strategy
async function createTestStrategy() {
  const response = await fetch(`${global.E2E_CONFIG.baseURL}/api/admin/strategy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
    },
    body: JSON.stringify({
      company_id: global.E2E_CONFIG.testCompanyId,
      title: 'E2E Test Strategy',
      description: 'Test strategy for E2E testing',
      target_customer_description: 'Test customers for E2E',
      problems_we_solve: ['Test Problem 1', 'Test Problem 2'],
      problems_we_dont_solve: ['Test Problem 3'],
      how_we_win: 'By solving test problems efficiently',
      strategic_keywords: [
        { keyword: 'innovation', weight: 0.8 },
        { keyword: 'efficiency', weight: 0.6 }
      ],
      competitors: [
        { name: 'Test Competitor', their_strength: 'Speed', our_differentiation: 'Quality' }
      ]
    })
  })
  
  if (!response.ok && response.status !== 409) { // 409 = already exists
    console.warn(`Failed to create test strategy: ${response.statusText}`)
  }
}

// Clean up test data
async function cleanupTestData() {
  try {
    console.log('🗑️ Cleaning up test data...')
    
    // Delete test themes
    await deleteTestThemes()
    
    // Delete test strategy
    await deleteTestStrategy()
    
    // Delete test admin user
    await deleteTestAdminUser()
    
    // Delete test company
    await deleteTestCompany()
    
    console.log('✅ Test data cleanup complete')
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error)
    // Don't throw here as cleanup failures shouldn't fail the test suite
  }
}

// Delete test themes
async function deleteTestThemes() {
  try {
    // Get all test themes
    const response = await fetch(`${global.E2E_CONFIG.baseURL}/api/admin/themes?company_id=${global.E2E_CONFIG.testCompanyId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      const testThemes = data.themes?.filter((theme: any) => 
        theme.name?.includes('E2E Test Theme')
      ) || []
      
      // Delete each test theme
      for (const theme of testThemes) {
        await fetch(`${global.E2E_CONFIG.baseURL}/api/admin/themes/${theme.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
          }
        })
      }
    }
  } catch (error) {
    console.warn('Failed to delete test themes:', error)
  }
}

// Delete test strategy
async function deleteTestStrategy() {
  try {
    await fetch(`${global.E2E_CONFIG.baseURL}/api/admin/strategy`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
      },
      body: JSON.stringify({
        company_id: global.E2E_CONFIG.testCompanyId
      })
    })
  } catch (error) {
    console.warn('Failed to delete test strategy:', error)
  }
}

// Delete test admin user
async function deleteTestAdminUser() {
  try {
    await fetch(`${global.E2E_CONFIG.baseURL}/api/admin/users`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
      },
      body: JSON.stringify({
        email: global.E2E_CONFIG.testAdminEmail
      })
    })
  } catch (error) {
    console.warn('Failed to delete test admin user:', error)
  }
}

// Delete test company
async function deleteTestCompany() {
  try {
    await fetch(`${global.E2E_CONFIG.baseURL}/api/admin/companies`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-token'}`
      },
      body: JSON.stringify({
        company_id: global.E2E_CONFIG.testCompanyId
      })
    })
  } catch (error) {
    console.warn('Failed to delete test company:', error)
  }
}

// Clean up test database
async function cleanupTestDatabase() {
  try {
    console.log('🗑️ Cleaning up test database...')
    
    // If using a test database, clean up here
    // Example: Drop test database or reset schema
    
    console.log('✅ Test database cleanup complete')
  } catch (error) {
    console.error('❌ Failed to cleanup test database:', error)
    // Don't throw here as cleanup failures shouldn't fail the test suite
  }
}

// Helper function to create browser instance for E2E tests
global.createBrowser = async () => {
  return await chromium.launch({
    headless: global.E2E_CONFIG.headless,
    slowMo: global.E2E_CONFIG.slowMo,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // For CI environments
  })
}

// Helper function to create authenticated page
global.createAuthenticatedPage = async (browser) => {
  const page = await browser.newPage()
  
  // Set up console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser Console Error: ${msg.text()}`)
    }
  })
  
  // Set up request/response logging
  page.on('response', response => {
    if (response.status() >= 400) {
      console.error(`HTTP Error: ${response.status()} ${response.url()}`)
    }
  })
  
  // Login
  await page.goto(`${global.E2E_CONFIG.baseURL}/admin/login`)
  await page.fill('[data-testid="email-input"]', global.E2E_CONFIG.testAdminEmail)
  await page.fill('[data-testid="password-input"]', global.E2E_CONFIG.testAdminPassword)
  await page.click('[data-testid="login-button"]')
  await page.waitForURL('**/admin/dashboard**')
  
  return page
}

// Helper function to wait for API responses
global.waitForApiResponse = async (page, urlPattern, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timeout waiting for API response: ${urlPattern}`))
    }, timeout)
    
    page.on('response', response => {
      if (response.url().includes(urlPattern) && response.status() < 400) {
        clearTimeout(timeoutId)
        resolve(response)
      }
    })
  })
}

// Export configuration for use in tests
export default global.E2E_CONFIG
