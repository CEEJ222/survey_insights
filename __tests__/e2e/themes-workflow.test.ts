// ============================================================================
// END-TO-END TESTING SUITE - THEMES WORKFLOW
// ============================================================================
// Comprehensive E2E tests for the complete themes workflow from discovery
// to strategic analysis to PM review and approval
// ============================================================================

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { chromium, Browser, Page } from 'playwright'

describe('Themes Workflow E2E Tests', () => {
  let browser: Browser
  let page: Page
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.CI === 'true', // Run headless in CI
      slowMo: 100 // Slow down for debugging if needed
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    
    // Set up console logging for debugging
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
  })

  describe('Authentication Flow', () => {
    it('should redirect to login when not authenticated', async () => {
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      
      // Should redirect to login page
      await page.waitForURL('**/admin/login**')
      expect(page.url()).toContain('/admin/login')
    })

    it('should allow login with valid credentials', async () => {
      await page.goto(`${baseURL}/admin/login`)
      
      await page.fill('[data-testid="email-input"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com')
      await page.fill('[data-testid="password-input"]', process.env.TEST_ADMIN_PASSWORD || 'password123')
      await page.click('[data-testid="login-button"]')
      
      // Should redirect to dashboard after successful login
      await page.waitForURL('**/admin/dashboard**')
      expect(page.url()).toContain('/admin/dashboard')
    })
  })

  describe('Themes Dashboard', () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto(`${baseURL}/admin/login`)
      await page.fill('[data-testid="email-input"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com')
      await page.fill('[data-testid="password-input"]', process.env.TEST_ADMIN_PASSWORD || 'password123')
      await page.click('[data-testid="login-button"]')
      await page.waitForURL('**/admin/dashboard**')
    })

    it('should load themes dashboard successfully', async () => {
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      
      // Wait for page to load
      await page.waitForSelector('[data-testid="themes-dashboard"]')
      
      // Check for key elements
      expect(await page.isVisible('[data-testid="themes-dashboard"]')).toBe(true)
      expect(await page.isVisible('[data-testid="sort-select"]')).toBe(true)
      expect(await page.isVisible('[data-testid="filter-select"]')).toBe(true)
      expect(await page.isVisible('[data-testid="run-discovery-button"]')).toBe(true)
      expect(await page.isVisible('[data-testid="analyze-strategic-button"]')).toBe(true)
    })

    it('should display themes list with proper data', async () => {
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      
      // Wait for themes to load
      await page.waitForSelector('[data-testid="theme-card"]', { timeout: 10000 })
      
      // Check that themes are displayed
      const themeCards = await page.locator('[data-testid="theme-card"]').count()
      expect(themeCards).toBeGreaterThan(0)
      
      // Check theme card structure
      const firstTheme = page.locator('[data-testid="theme-card"]').first()
      await expect(firstTheme.locator('[data-testid="theme-name"]')).toBeVisible()
      await expect(firstTheme.locator('[data-testid="theme-description"]')).toBeVisible()
      await expect(firstTheme.locator('[data-testid="strategic-alignment"]')).toBeVisible()
      await expect(firstTheme.locator('[data-testid="final-priority"]')).toBeVisible()
    })

    it('should handle sorting functionality', async () => {
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      
      // Wait for themes to load
      await page.waitForSelector('[data-testid="theme-card"]')
      
      // Test sorting by strategic priority
      await page.selectOption('[data-testid="sort-select"]', 'strategic_priority')
      await page.waitForTimeout(1000) // Wait for re-sort
      
      // Verify themes are still displayed after sorting
      const themeCards = await page.locator('[data-testid="theme-card"]').count()
      expect(themeCards).toBeGreaterThan(0)
    })

    it('should handle filtering functionality', async () => {
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      
      // Wait for themes to load
      await page.waitForSelector('[data-testid="theme-card"]')
      
      // Test filtering by aligned themes
      await page.selectOption('[data-testid="filter-select"]', 'in_strategy')
      await page.waitForTimeout(1000) // Wait for re-filter
      
      // Verify themes are still displayed after filtering
      const themeCards = await page.locator('[data-testid="theme-card"]').count()
      expect(themeCards).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Theme Discovery Workflow', () => {
    beforeEach(async () => {
      // Login and navigate to themes
      await page.goto(`${baseURL}/admin/login`)
      await page.fill('[data-testid="email-input"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com')
      await page.fill('[data-testid="password-input"]', process.env.TEST_ADMIN_PASSWORD || 'password123')
      await page.click('[data-testid="login-button"]')
      await page.waitForURL('**/admin/dashboard**')
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      await page.waitForSelector('[data-testid="themes-dashboard"]')
    })

    it('should run theme discovery successfully', async () => {
      // Click run discovery button
      await page.click('[data-testid="run-discovery-button"]')
      
      // Wait for loading state
      await page.waitForSelector('[data-testid="discovery-loading"]', { timeout: 5000 })
      
      // Wait for completion (with longer timeout for AI processing)
      await page.waitForSelector('[data-testid="discovery-complete"]', { timeout: 30000 })
      
      // Verify success message
      const successMessage = await page.textContent('[data-testid="discovery-success"]')
      expect(successMessage).toContain('discovered')
    })

    it('should handle discovery errors gracefully', async () => {
      // Mock API error by intercepting the request
      await page.route('**/api/admin/themes', route => {
        if (route.request().method() === 'POST') {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Discovery failed' })
          })
        } else {
          route.continue()
        }
      })
      
      await page.click('[data-testid="run-discovery-button"]')
      
      // Wait for error message
      await page.waitForSelector('[data-testid="discovery-error"]', { timeout: 10000 })
      
      // Verify error is displayed
      const errorMessage = await page.textContent('[data-testid="discovery-error"]')
      expect(errorMessage).toContain('error')
    })
  })

  describe('Strategic Analysis Workflow', () => {
    beforeEach(async () => {
      // Login and navigate to themes
      await page.goto(`${baseURL}/admin/login`)
      await page.fill('[data-testid="email-input"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com')
      await page.fill('[data-testid="password-input"]', process.env.TEST_ADMIN_PASSWORD || 'password123')
      await page.click('[data-testid="login-button"]')
      await page.waitForURL('**/admin/dashboard**')
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      await page.waitForSelector('[data-testid="themes-dashboard"]')
    })

    it('should run strategic analysis successfully', async () => {
      // Click analyze strategic button
      await page.click('[data-testid="analyze-strategic-button"]')
      
      // Wait for loading state
      await page.waitForSelector('[data-testid="analysis-loading"]', { timeout: 5000 })
      
      // Wait for completion (with longer timeout for AI processing)
      await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: 30000 })
      
      // Verify success message
      const successMessage = await page.textContent('[data-testid="analysis-success"]')
      expect(successMessage).toContain('analyzed')
    })

    it('should update theme cards with new strategic scores', async () => {
      // Get initial strategic alignment score
      const initialScore = await page.textContent('[data-testid="strategic-alignment"]')
      
      // Run strategic analysis
      await page.click('[data-testid="analyze-strategic-button"]')
      await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: 30000 })
      
      // Refresh the page to see updated scores
      await page.reload()
      await page.waitForSelector('[data-testid="theme-card"]')
      
      // Check that strategic alignment is displayed
      const updatedScore = await page.textContent('[data-testid="strategic-alignment"]')
      expect(updatedScore).toBeTruthy()
    })
  })

  describe('Strategic Analysis Modal', () => {
    beforeEach(async () => {
      // Login and navigate to themes
      await page.goto(`${baseURL}/admin/login`)
      await page.fill('[data-testid="email-input"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com')
      await page.fill('[data-testid="password-input"]', process.env.TEST_ADMIN_PASSWORD || 'password123')
      await page.click('[data-testid="login-button"]')
      await page.waitForURL('**/admin/dashboard**')
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      await page.waitForSelector('[data-testid="themes-dashboard"]')
    })

    it('should open strategic analysis modal when theme is clicked', async () => {
      // Wait for themes to load
      await page.waitForSelector('[data-testid="theme-card"]')
      
      // Click on first theme
      await page.click('[data-testid="theme-card"]:first-child')
      
      // Wait for modal to open
      await page.waitForSelector('[data-testid="strategic-analysis-modal"]')
      
      // Verify modal content
      expect(await page.isVisible('[data-testid="strategic-analysis-modal"]')).toBe(true)
      expect(await page.isVisible('[data-testid="modal-theme-name"]')).toBe(true)
      expect(await page.isVisible('[data-testid="modal-theme-description"]')).toBe(true)
      expect(await page.isVisible('[data-testid="modal-strategic-reasoning"]')).toBe(true)
    })

    it('should close modal when close button is clicked', async () => {
      // Open modal
      await page.waitForSelector('[data-testid="theme-card"]')
      await page.click('[data-testid="theme-card"]:first-child')
      await page.waitForSelector('[data-testid="strategic-analysis-modal"]')
      
      // Close modal
      await page.click('[data-testid="modal-close-button"]')
      
      // Verify modal is closed
      await page.waitForSelector('[data-testid="strategic-analysis-modal"]', { state: 'hidden' })
    })

    it('should display theme review form for themes needing review', async () => {
      // Wait for themes to load
      await page.waitForSelector('[data-testid="theme-card"]')
      
      // Find a theme that needs review (if any)
      const needsReviewTheme = page.locator('[data-testid="theme-card"]:has([data-testid="recommendation"]:text-is("Needs Review"))').first()
      
      if (await needsReviewTheme.count() > 0) {
        await needsReviewTheme.click()
        await page.waitForSelector('[data-testid="strategic-analysis-modal"]')
        
        // Check for review form
        expect(await page.isVisible('[data-testid="review-decision-select"]')).toBe(true)
        expect(await page.isVisible('[data-testid="review-notes-textarea"]')).toBe(true)
        expect(await page.isVisible('[data-testid="submit-review-button"]')).toBe(true)
      }
    })

    it('should submit theme review successfully', async () => {
      // Wait for themes to load
      await page.waitForSelector('[data-testid="theme-card"]')
      
      // Find a theme that needs review
      const needsReviewTheme = page.locator('[data-testid="theme-card"]:has([data-testid="recommendation"]:text-is("Needs Review"))').first()
      
      if (await needsReviewTheme.count() > 0) {
        await needsReviewTheme.click()
        await page.waitForSelector('[data-testid="strategic-analysis-modal"]')
        
        // Fill out review form
        await page.selectOption('[data-testid="review-decision-select"]', 'approve')
        await page.fill('[data-testid="review-notes-textarea"]', 'This theme aligns well with our strategy')
        
        // Submit review
        await page.click('[data-testid="submit-review-button"]')
        
        // Wait for success message
        await page.waitForSelector('[data-testid="review-success"]', { timeout: 10000 })
        
        // Verify success
        const successMessage = await page.textContent('[data-testid="review-success"]')
        expect(successMessage).toContain('reviewed')
      }
    })
  })

  describe('Theme Comparison Tool', () => {
    beforeEach(async () => {
      // Login and navigate to themes
      await page.goto(`${baseURL}/admin/login`)
      await page.fill('[data-testid="email-input"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com')
      await page.fill('[data-testid="password-input"]', process.env.TEST_ADMIN_PASSWORD || 'password123')
      await page.click('[data-testid="login-button"]')
      await page.waitForURL('**/admin/dashboard**')
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      await page.waitForSelector('[data-testid="themes-dashboard"]')
    })

    it('should open theme comparison tool', async () => {
      // Wait for themes to load
      await page.waitForSelector('[data-testid="theme-card"]')
      
      // Click compare themes button
      await page.click('[data-testid="compare-themes-button"]')
      
      // Wait for comparison modal to open
      await page.waitForSelector('[data-testid="theme-comparison-modal"]')
      
      // Verify modal content
      expect(await page.isVisible('[data-testid="theme-comparison-modal"]')).toBe(true)
      expect(await page.isVisible('[data-testid="theme1-select"]')).toBe(true)
      expect(await page.isVisible('[data-testid="theme2-select"]')).toBe(true)
    })

    it('should allow theme selection and comparison', async () => {
      // Open comparison tool
      await page.waitForSelector('[data-testid="theme-card"]')
      await page.click('[data-testid="compare-themes-button"]')
      await page.waitForSelector('[data-testid="theme-comparison-modal"]')
      
      // Select first theme
      await page.selectOption('[data-testid="theme1-select"]', { index: 1 })
      await page.waitForTimeout(500)
      
      // Select second theme
      await page.selectOption('[data-testid="theme2-select"]', { index: 2 })
      await page.waitForTimeout(500)
      
      // Verify comparison cards are displayed
      expect(await page.isVisible('[data-testid="comparison-theme1-card"]')).toBe(true)
      expect(await page.isVisible('[data-testid="comparison-theme2-card"]')).toBe(true)
    })
  })

  describe('Performance Tests', () => {
    beforeEach(async () => {
      // Login
      await page.goto(`${baseURL}/admin/login`)
      await page.fill('[data-testid="email-input"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com')
      await page.fill('[data-testid="password-input"]', process.env.TEST_ADMIN_PASSWORD || 'password123')
      await page.click('[data-testid="login-button"]')
      await page.waitForURL('**/admin/dashboard**')
    })

    it('should load themes dashboard within acceptable time', async () => {
      const startTime = Date.now()
      
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      await page.waitForSelector('[data-testid="themes-dashboard"]')
      
      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
    })

    it('should handle large datasets efficiently', async () => {
      // Mock large dataset response
      await page.route('**/api/admin/themes*', route => {
        if (route.request().method() === 'GET') {
          const mockThemes = Array.from({ length: 100 }, (_, i) => ({
            id: `theme-${i}`,
            name: `Theme ${i}`,
            description: `Description for theme ${i}`,
            customerCount: 10 + i,
            mentionCount: 15 + i,
            sentiment: 0.7 + (i % 30) / 100,
            priority: 70 + (i % 30),
            finalPriority: 65 + (i % 30),
            strategicAlignment: 75 + (i % 25),
            strategicReasoning: `Strategic reasoning for theme ${i}`,
            strategicConflicts: [],
            strategicOpportunities: [`Opportunity ${i}`],
            recommendation: ['high_priority', 'medium_priority', 'low_priority', 'needs_review'][i % 4],
            pmNotes: null,
            declinedReason: null,
            tags: [`tag-${i % 5}`]
          }))
          
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ themes: mockThemes })
          })
        } else {
          route.continue()
        }
      })
      
      const startTime = Date.now()
      
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      await page.waitForSelector('[data-testid="theme-card"]')
      
      const loadTime = Date.now() - startTime
      const themeCount = await page.locator('[data-testid="theme-card"]').count()
      
      expect(themeCount).toBe(100)
      expect(loadTime).toBeLessThan(10000) // Should handle 100 themes within 10 seconds
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      // Login
      await page.goto(`${baseURL}/admin/login`)
      await page.fill('[data-testid="email-input"]', process.env.TEST_ADMIN_EMAIL || 'admin@test.com')
      await page.fill('[data-testid="password-input"]', process.env.TEST_ADMIN_PASSWORD || 'password123')
      await page.click('[data-testid="login-button"]')
      await page.waitForURL('**/admin/dashboard**')
    })

    it('should handle API errors gracefully', async () => {
      // Mock API error
      await page.route('**/api/admin/themes*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })
      
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      
      // Should show error message
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 })
      
      const errorMessage = await page.textContent('[data-testid="error-message"]')
      expect(errorMessage).toContain('error')
    })

    it('should handle network timeouts gracefully', async () => {
      // Mock network timeout
      await page.route('**/api/admin/themes*', route => {
        // Simulate timeout by not responding
        setTimeout(() => {
          route.fulfill({
            status: 408,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Request timeout' })
          })
        }, 5000)
      })
      
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      
      // Should show timeout error
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 15000 })
      
      const errorMessage = await page.textContent('[data-testid="error-message"]')
      expect(errorMessage).toContain('timeout')
    })

    it('should handle malformed API responses', async () => {
      // Mock malformed response
      await page.route('**/api/admin/themes*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json'
        })
      })
      
      await page.goto(`${baseURL}/admin/dashboard/themes`)
      
      // Should show error message
      await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 })
      
      const errorMessage = await page.textContent('[data-testid="error-message"]')
      expect(errorMessage).toContain('error')
    })
  })
})
