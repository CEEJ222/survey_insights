# 🧪 Phase 2 Testing Guide: Strategic Theme Scoring

**Testing the enhanced theme system with strategic alignment scoring**

---

## 🎯 Testing Overview

This guide covers testing the Phase 2 implementation including:
- ✅ AI Strategic Alignment Scoring
- ✅ Enhanced Theme Dashboard  
- ✅ Strategic Analysis Modal
- ✅ API Endpoints
- ✅ Strategy Health Dashboard

---

## 🚀 Quick Start Testing

### **1. Prerequisites Setup**

```bash
# Ensure you have the latest code
git pull origin main

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your OpenAI API key and Supabase credentials
```

### **2. Database Setup**

```sql
-- Run the migration to ensure strategic columns exist
-- (Already done in minimal_v1_migration.sql)
-- Verify columns exist:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'themes' 
AND column_name LIKE 'strategic_%';
```

### **3. Test Data Setup**

```sql
-- Insert test strategy (if not exists)
INSERT INTO product_strategy (
  company_id, 
  title, 
  target_customer_description,
  problems_we_solve,
  problems_we_dont_solve,
  how_we_win,
  strategic_keywords,
  is_active
) VALUES (
  'your-company-id',
  'Desktop-First Construction Software',
  'Power estimators and takeoff specialists who need desktop accuracy',
  ARRAY['Takeoff accuracy', 'Desktop workflow efficiency', 'Integration with existing tools'],
  ARRAY['Field execution', 'Mobile-first workflows', 'Consumer-grade features'],
  'Best desktop accuracy and workflow efficiency',
  '[{"keyword": "desktop", "weight": 0.8, "reasoning": "Core focus"}, {"keyword": "mobile", "weight": -0.5, "reasoning": "Deprioritizing mobile"}, {"keyword": "integration", "weight": 0.6, "reasoning": "Key differentiator"}]'::jsonb,
  true
) ON CONFLICT (company_id, version) DO NOTHING;
```

---

## 🧪 Manual Testing Scenarios

### **Scenario 1: AI Strategic Alignment Scoring**

**Goal:** Test that themes get scored against strategy automatically

**Steps:**
1. Navigate to `/admin/dashboard/themes`
2. Click "Run Discovery" button
3. Check browser console for AI scoring logs
4. Verify themes show strategic alignment scores
5. Check that final priority = customer signal × strategic alignment

**Expected Results:**
- Themes appear with strategic alignment scores (0-100)
- High-alignment themes show green indicators
- Off-strategy themes show red indicators
- Final priority reflects both customer and strategic factors

**Test Data Examples:**
```javascript
// High alignment theme (should score 80+)
{
  name: "Enhanced Desktop Accuracy Features",
  description: "Customers want better accuracy in takeoff calculations",
  tags: ["accuracy", "desktop", "calculations"]
}

// Off-strategy theme (should score <50)  
{
  name: "Mobile App for Field Workers",
  description: "Field workers need mobile access to view takeoffs",
  tags: ["mobile", "field", "access"]
}
```

### **Scenario 2: Enhanced Theme Dashboard**

**Goal:** Test filtering, sorting, and strategic context display

**Steps:**
1. Open themes dashboard
2. Test sorting options:
   - Strategic Priority (default)
   - Customer Signal
   - Strategic Alignment
3. Test filtering options:
   - All Themes
   - In-Strategy (≥70 alignment)
   - Off-Strategy (<50 alignment)
   - Needs Review
4. Verify strategy health metrics update correctly

**Expected Results:**
- Themes sort correctly by selected criteria
- Filters show appropriate themes only
- Strategy health shows accurate counts
- Strategic context cards display conflicts/opportunities

### **Scenario 3: Strategic Analysis Modal**

**Goal:** Test detailed strategic analysis for individual themes

**Steps:**
1. Click "Analysis" or "View Analysis" on any theme
2. Verify modal opens with comprehensive data
3. Check strategic reasoning is displayed
4. Verify conflicts and opportunities are shown
5. Test approve/decline actions

**Expected Results:**
- Modal shows complete strategic breakdown
- AI reasoning is clear and actionable
- Conflicts highlighted in red
- Opportunities highlighted in green
- Actions work correctly

### **Scenario 4: API Endpoints**

**Goal:** Test all new API endpoints work correctly

**Test Endpoints:**

```bash
# 1. Get themes with strategic scoring
curl -X GET "http://localhost:3000/api/admin/themes?company_id=YOUR_COMPANY_ID&sort=strategic_priority"

# 2. Get strategy health metrics
curl -X GET "http://localhost:3000/api/admin/themes/strategic-health?company_id=YOUR_COMPANY_ID"

# 3. Get individual theme analysis
curl -X GET "http://localhost:3000/api/admin/themes/THEME_ID/strategic-analysis"

# 4. Run theme discovery
curl -X POST "http://localhost:3000/api/admin/themes" \
  -H "Content-Type: application/json" \
  -d '{"company_id": "YOUR_COMPANY_ID", "action": "discover_themes"}'

# 5. Re-analyze strategic alignment
curl -X POST "http://localhost:3000/api/admin/themes" \
  -H "Content-Type: application/json" \
  -d '{"company_id": "YOUR_COMPANY_ID", "action": "analyze_strategic"}'
```

**Expected Results:**
- All endpoints return valid JSON
- Strategic scoring data is included
- Error handling works for invalid requests
- Performance is acceptable (<2s response time)

### **Scenario 5: Strategy Health Dashboard**

**Goal:** Test comprehensive strategy health monitoring

**Steps:**
1. Navigate to `/admin/dashboard/strategy-health`
2. Verify all metrics display correctly
3. Check theme distribution charts
4. Review high priority and off-strategy themes
5. Test refresh functionality

**Expected Results:**
- Strategy health score calculated correctly
- Theme distribution shows accurate percentages
- High priority themes listed with scores
- Off-strategy themes highlighted appropriately
- Customer vs strategy analysis provides insights

---

## 🤖 Automated Testing

### **Unit Tests for AI Functions**

```typescript
// tests/ai/theme-discovery.test.ts
import { createThemeDiscoveryEngine } from '@/lib/ai/theme-discovery'

describe('Strategic Alignment Scoring', () => {
  test('should score high-alignment theme correctly', async () => {
    const engine = createThemeDiscoveryEngine('test-company')
    const strategy = {
      vision_statement: 'Desktop-first construction software',
      target_customer_description: 'Power estimators',
      problems_we_solve: ['Takeoff accuracy'],
      problems_we_dont_solve: ['Field execution'],
      how_we_win: 'Best desktop accuracy',
      strategic_keywords: [
        { keyword: 'desktop', weight: 0.8, reasoning: 'Core focus' }
      ]
    }
    
    const theme = {
      name: 'Enhanced Desktop Accuracy',
      description: 'Better accuracy in takeoff calculations',
      related_tag_ids: ['accuracy', 'desktop'],
      customer_count: 5,
      mention_count: 8,
      avg_sentiment: 0.8
    }
    
    const alignment = await engine.calculateStrategicAlignment(theme, strategy)
    
    expect(alignment.alignment_score).toBeGreaterThan(70)
    expect(alignment.recommendation).toBe('high_priority')
  })
  
  test('should score off-strategy theme correctly', async () => {
    // Test mobile theme against desktop-first strategy
    const alignment = await engine.calculateStrategicAlignment(mobileTheme, strategy)
    
    expect(alignment.alignment_score).toBeLessThan(50)
    expect(alignment.conflicts).toContain('Conflicts with desktop-first strategy')
  })
})
```

### **Integration Tests for API**

```typescript
// tests/api/themes.test.ts
import { createMocks } from 'node-mocks-http'

describe('/api/admin/themes', () => {
  test('GET should return themes with strategic scoring', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { company_id: 'test-company', sort: 'strategic_priority' }
    })
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.themes[0]).toHaveProperty('strategicAlignment')
    expect(data.themes[0]).toHaveProperty('finalPriority')
  })
  
  test('POST discover_themes should run AI scoring', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { company_id: 'test-company', action: 'discover_themes' }
    })
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.themes_discovered).toBeGreaterThan(0)
  })
})
```

### **E2E Tests with Playwright**

```typescript
// tests/e2e/strategic-themes.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Strategic Theme Dashboard', () => {
  test('should display themes with strategic scoring', async ({ page }) => {
    await page.goto('/admin/dashboard/themes')
    
    // Wait for themes to load
    await page.waitForSelector('[data-testid="theme-card"]')
    
    // Check strategic alignment scores are displayed
    const alignmentScores = await page.locator('[data-testid="strategic-alignment"]').all()
    expect(alignmentScores.length).toBeGreaterThan(0)
    
    // Test sorting by strategic priority
    await page.selectOption('[data-testid="sort-select"]', 'strategic_priority')
    await page.waitForLoadState('networkidle')
    
    // Verify themes are sorted correctly
    const priorities = await page.locator('[data-testid="final-priority"]').allTextContents()
    const sortedPriorities = [...priorities].sort((a, b) => parseInt(b) - parseInt(a))
    expect(priorities).toEqual(sortedPriorities)
  })
  
  test('should open strategic analysis modal', async ({ page }) => {
    await page.goto('/admin/dashboard/themes')
    await page.waitForSelector('[data-testid="theme-card"]')
    
    // Click analysis button
    await page.click('[data-testid="analysis-button"]:first-child')
    
    // Verify modal opens
    await expect(page.locator('[data-testid="strategic-modal"]')).toBeVisible()
    
    // Check strategic reasoning is displayed
    await expect(page.locator('[data-testid="strategic-reasoning"]')).toBeVisible()
    
    // Check conflicts/opportunities are shown
    await expect(page.locator('[data-testid="strategic-conflicts"]')).toBeVisible()
    await expect(page.locator('[data-testid="strategic-opportunities"]')).toBeVisible()
  })
})
```

---

## 🔍 Debugging & Troubleshooting

### **Common Issues & Solutions**

**1. AI Scoring Not Working**
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Check console logs for AI errors
# Look for "Error calculating strategic alignment" messages
```

**2. Strategic Columns Missing**
```sql
-- Verify columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'themes' AND column_name LIKE 'strategic_%';

-- If missing, run migration
-- See minimal_v1_migration.sql
```

**3. No Strategy Found**
```sql
-- Check if strategy exists
SELECT * FROM product_strategy 
WHERE company_id = 'your-company-id' AND is_active = true;

-- Create test strategy if needed
```

**4. Performance Issues**
```bash
# Check Redis connection for caching
redis-cli ping

# Monitor AI costs
# Check ai_cost_logs table
```

### **Debug Mode**

```typescript
// Enable debug logging
const DEBUG_AI = process.env.DEBUG_AI === 'true'

if (DEBUG_AI) {
  console.log('🎯 Strategic Analysis:', {
    theme: theme.name,
    strategy: strategy.title,
    alignment: alignment.alignment_score
  })
}
```

---

## 📊 Performance Testing

### **Load Testing**

```bash
# Test API endpoints under load
npx autocannon -c 10 -d 30 http://localhost:3000/api/admin/themes?company_id=test

# Test AI scoring performance
# Should complete within 2-3 seconds per theme
```

### **Memory Usage**

```bash
# Monitor memory usage during AI operations
node --inspect server.js
# Open Chrome DevTools -> Memory tab
```

---

## ✅ Success Criteria

**Phase 2 is working correctly when:**

1. **AI Scoring** ✅
   - Themes get strategic alignment scores (0-100)
   - High-alignment themes score 70+
   - Off-strategy themes score <50
   - Final priority = customer × strategic

2. **Dashboard** ✅
   - Themes sort by strategic priority
   - Filters work correctly
   - Strategy health metrics accurate
   - Strategic context visible

3. **Modal** ✅
   - Detailed analysis displays
   - Conflicts/opportunities shown
   - Actions work correctly

4. **APIs** ✅
   - All endpoints respond correctly
   - Strategic data included
   - Error handling works

5. **Health Dashboard** ✅
   - Metrics calculate correctly
   - Insights are actionable
   - Performance is good

---

## 🚀 Next Steps

Once Phase 2 testing is complete:

1. **Deploy to staging** environment
2. **User acceptance testing** with real data
3. **Performance optimization** if needed
4. **Move to Phase 3** (PM workflow)

---

**Ready to test?** Start with the Quick Start Testing section and work through each scenario systematically!
