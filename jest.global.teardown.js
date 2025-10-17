// ============================================================================
// JEST GLOBAL TEARDOWN
// ============================================================================
// Global teardown for Jest test suite including cleanup of resources,
// database cleanup, and test artifact removal
// ============================================================================

// Global test teardown
async function globalTeardown() {
  console.log('🧹 Running global Jest teardown...')
  
  // Clean up test database
  await cleanupTestDatabase()
  
  // Clean up test artifacts
  await cleanupTestArtifacts()
  
  // Clean up global mocks
  await cleanupGlobalMocks()
  
  console.log('✅ Global Jest teardown complete')
}

// Clean up test database
async function cleanupTestDatabase() {
  try {
    console.log('🗑️ Cleaning up test database...')
    
    // If using a real test database, clean up here
    // For now, we'll just log since we're using mocks
    
    console.log('✅ Test database cleanup complete')
  } catch (error) {
    console.error('❌ Failed to cleanup test database:', error)
    // Don't throw here as we want teardown to complete even if cleanup fails
  }
}

// Clean up test artifacts
async function cleanupTestArtifacts() {
  try {
    console.log('🗑️ Cleaning up test artifacts...')
    
    // Clean up any temporary files created during tests
    await cleanupTempFiles()
    
    // Clean up any test data that might have been created
    await cleanupTestData()
    
    console.log('✅ Test artifacts cleanup complete')
  } catch (error) {
    console.error('❌ Failed to cleanup test artifacts:', error)
  }
}

// Clean up temporary files
async function cleanupTempFiles() {
  const fs = require('fs')
  const path = require('path')
  
  try {
    // Clean up any temporary test files
    const tempDir = path.join(process.cwd(), 'temp')
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
    
    // Clean up test results directory
    const testResultsDir = path.join(process.cwd(), 'test-results')
    if (fs.existsSync(testResultsDir)) {
      fs.rmSync(testResultsDir, { recursive: true, force: true })
    }
    
    // Clean up coverage directory
    const coverageDir = path.join(process.cwd(), 'coverage')
    if (fs.existsSync(coverageDir)) {
      fs.rmSync(coverageDir, { recursive: true, force: true })
    }
  } catch (error) {
    console.warn('Failed to cleanup temp files:', error)
  }
}

// Clean up test data
async function cleanupTestData() {
  try {
    // If using a real test database, clean up test data here
    // For now, we'll just log since we're using mocks
    
    console.log('🗑️ Test data cleanup complete')
  } catch (error) {
    console.warn('Failed to cleanup test data:', error)
  }
}

// Clean up global mocks
async function cleanupGlobalMocks() {
  try {
    console.log('🎭 Cleaning up global mocks...')
    
    // Reset global mocks
    global.mockSupabaseClient = null
    global.mockOpenAIClient = null
    global.mockRedisClient = null
    
    // Reset global test utilities
    global.generateTestTheme = null
    global.generateTestStrategy = null
    global.generateTestFeedback = null
    global.waitFor = null
    global.mockApiResponse = null
    global.mockApiError = null
    global.TEST_CONSTANTS = null
    
    // Reset global fetch mock
    global.fetch = undefined
    
    console.log('✅ Global mocks cleanup complete')
  } catch (error) {
    console.error('❌ Failed to cleanup global mocks:', error)
  }
}

// Export the teardown function
export default globalTeardown
