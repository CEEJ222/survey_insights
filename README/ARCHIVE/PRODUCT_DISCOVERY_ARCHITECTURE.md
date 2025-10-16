# Product Discovery Architecture: Feedback → Roadmap

## 🎯 Vision

**Close the loop:** Customer feedback directly drives product decisions with AI-powered insights and full traceability.

```
Customer Voice → AI Analysis → Strategic Decisions → Shipped Features → Validated Impact
```

---

## 📊 The Complete Data Flow

### **Level 1: Individual Feedback (Real-Time)**
```
Customer submits feedback
    ↓
AI generates TAGS: ["dashboard", "slow", "performance"]
    ↓
Stored in feedback_items with:
  - sentiment_score: -0.7
  - priority_score: 75/100
  - customer_id: linked
```

### **Level 2: Theme Discovery (Daily Batch)**
```
AI analyzes all feedback with similar tags
    ↓
Discovers THEME: "Dashboard Performance Issues"
    ↓
Links to 47 supporting feedback items
    ↓
Calculates metrics:
  - customer_count: 47
  - mention_count: 67
  - avg_sentiment: -0.6
  - trend: +40% week-over-week
  - priority_score: 87/100
```

### **Level 3: Insight Generation (Weekly)**
```
AI analyzes themes
    ↓
Generates INSIGHT: "High churn risk from performance issues"
    ↓
Includes:
  - Business impact: $15K MRR at risk
  - Urgency: HIGH
  - Recommended action: Optimize dashboard
  - Suggested roadmap item (with AI-generated details)
```

### **Level 4: Roadmap Item (PM Action)**
```
PM reviews AI suggestion
    ↓
Creates ROADMAP ITEM: "Optimize Dashboard Performance"
    ↓
Includes:
  - Linked theme (automatic)
  - Impact score: 87/100
  - Effort score: 60/100 (engineering estimates)
  - Target quarter: Q1 2024
  - Evidence: 47 customers, 67 mentions
  - Top quotes: 3 most impactful customer quotes
```

### **Level 5: Execution & Shipping**
```
Engineering builds feature
    ↓
Ships on Jan 15, 2024
    ↓
Automatically:
  - Updates roadmap item status → "Shipped"
  - Generates release notes with customer evidence
  - Notifies affected customers
  - Tracks feedback post-ship (validation)
```

### **Level 6: Impact Validation (Continuous)**
```
Monitor feedback post-ship
    ↓
AI tracks:
  - Are "dashboard performance" complaints decreasing?
  - Sentiment improving?
  - At-risk customers now healthy?
    ↓
Reports ROI: "Reduced performance complaints by 78%, 
             saved 3 enterprise accounts ($18K MRR)"
```

---

## 🗄️ Complete Database Schema

### **✅ IMPLEMENTED: Enhanced Tags System**

We have successfully implemented the foundational tags system that enables the complete product discovery flow:

```sql
-- ✅ COMPLETED: Tags Table with full metadata
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'feature', 'sentiment', 'topic', 'industry', 'custom'
  color VARCHAR(7),
  usage_count INTEGER DEFAULT 0,
  avg_sentiment DECIMAL(3,2),
  first_used TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE,
  is_system_tag BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ✅ COMPLETED: Tag Usage Tracking
CREATE TABLE tag_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  source_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  sentiment_score DECIMAL(3,2),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### **✅ IMPLEMENTED: AI Tag Normalization**

The AI system now automatically:
- **Creates normalized tags** when survey responses are submitted
- **Links tags to specific feedback** via tag_usages table
- **Prevents duplicates** using AI-powered normalization
- **Tracks usage statistics** automatically via database triggers

### **🔄 NEXT: Schema Addition for Product Discovery**

The following schema builds on our implemented tags system:

```sql
-- ============================================================================
-- THEMES: Discovered patterns across feedback
-- ============================================================================

CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Core Identity
  name VARCHAR(255) NOT NULL, -- "Dashboard Performance Issues"
  description TEXT, -- AI-generated description
  slug VARCHAR(255) NOT NULL, -- "dashboard-performance-issues"
  
  -- Related Tags (that led to this theme)
  related_tags TEXT[] DEFAULT '{}', -- ["dashboard", "performance", "slow"]
  
  -- Evidence
  supporting_feedback_ids UUID[] DEFAULT '{}', -- Links to feedback_items
  
  -- Metrics
  customer_count INTEGER DEFAULT 0, -- Unique customers affected
  mention_count INTEGER DEFAULT 0, -- Total mentions
  avg_sentiment DECIMAL(3,2), -- Average sentiment of related feedback
  
  -- Source Breakdown
  source_breakdown JSONB, -- {"survey": 34, "review": 8, "interview": 5}
  
  -- Trend Analysis
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  peak_date TIMESTAMP WITH TIME ZONE, -- When mentions were highest
  trend VARCHAR(50), -- increasing, stable, decreasing, spiking
  week_over_week_change DECIMAL(5,2), -- +40.5 (percentage)
  month_over_month_change DECIMAL(5,2),
  
  -- Priority (AI-calculated)
  priority_score INTEGER DEFAULT 50, -- 0-100
  priority_factors JSONB, -- What contributed to the score
  
  -- Competitive Intelligence
  competitor_has_solution BOOLEAN, -- Do competitors solve this?
  competitor_analysis TEXT, -- AI-generated competitive insight
  
  -- Status & Lifecycle
  status VARCHAR(50) DEFAULT 'discovered',
    -- discovered: AI just found it
    -- reviewing: Team is reviewing
    -- validated: Team confirmed it's real
    -- addressed: Linked to roadmap item
    -- resolved: Shipped fix/feature
    -- dismissed: Not actionable
  
  -- Roadmap Connection
  linked_roadmap_item_id UUID, -- References roadmap_items(id)
  addressed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  discovered_by VARCHAR(50) DEFAULT 'ai', -- ai or manual
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT, -- Manual notes from team
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, slug)
);

-- Index for fast lookups
CREATE INDEX idx_themes_company ON themes(company_id);
CREATE INDEX idx_themes_status ON themes(status);
CREATE INDEX idx_themes_priority ON themes(priority_score DESC);
CREATE INDEX idx_themes_trend ON themes(trend);

-- ============================================================================
-- ROADMAP ITEMS: Features, improvements, bug fixes
-- ============================================================================

CREATE TABLE roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Core Identity
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
    -- feature: New functionality
    -- improvement: Enhancement to existing feature
    -- bug_fix: Fix an issue
    -- technical_debt: Internal improvement
    -- research: Discovery/investigation
  
  -- Customer Evidence (THE KEY CONNECTION)
  linked_theme_ids UUID[] DEFAULT '{}', -- Primary themes
  linked_feedback_ids UUID[] DEFAULT '{}', -- Direct feedback links
  affected_customer_count INTEGER DEFAULT 0, -- Unique customers
  
  -- Prioritization Scores
  impact_score INTEGER, -- 0-100 (business impact)
  effort_score INTEGER, -- 0-100 (higher = more effort/complexity)
  confidence_level VARCHAR(50) DEFAULT 'medium', -- high, medium, low
  
  -- Impact Breakdown (AI-generated)
  impact_factors JSONB,
    /* Example:
    {
      "customer_demand": 87,
      "revenue_potential": 75,
      "churn_prevention": 90,
      "strategic_alignment": 80,
      "competitive_parity": 60
    }
    */
  
  -- Effort Breakdown (Engineering input)
  effort_factors JSONB,
    /* Example:
    {
      "complexity": 70,
      "dependencies": 60,
      "technical_debt": 40,
      "team_availability": 50,
      "estimated_weeks": 3
    }
    */
  
  -- AI-Generated Content
  ai_rationale TEXT, -- Why this matters (for stakeholders)
  ai_customer_quotes JSONB, -- Top 3-5 quotes
  ai_competitive_analysis TEXT, -- What competitors do
  ai_suggested_solution TEXT, -- High-level approach
  
  -- Status & Workflow
  status VARCHAR(50) DEFAULT 'backlog',
    -- backlog: Not started
    -- under_review: Being evaluated
    -- prioritized: Approved, waiting to start
    -- in_progress: Currently being built
    -- in_testing: QA/testing phase
    -- shipped: Deployed to production
    -- declined: Decided not to do
    -- archived: Old/no longer relevant
  
  status_changed_at TIMESTAMP WITH TIME ZONE,
  status_changed_by UUID REFERENCES admin_users(id),
  
  -- Planning & Scheduling
  target_quarter VARCHAR(20), -- "2024-Q1"
  target_sprint VARCHAR(50), -- "Sprint 23"
  estimated_ship_date DATE,
  actual_ship_date DATE,
  
  -- Team & Ownership
  owner_id UUID REFERENCES admin_users(id), -- PM owner
  assigned_team VARCHAR(100), -- "engineering", "design", etc.
  stakeholders UUID[] DEFAULT '{}', -- Array of admin_user IDs
  
  -- External Integration
  external_ticket_id VARCHAR(255), -- Jira/Linear ticket ID
  external_ticket_url TEXT, -- Link to external system
  
  -- Collaboration & Engagement
  view_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0, -- Internal team votes
  comment_count INTEGER DEFAULT 0,
  
  -- Validation (Post-Ship)
  validation_status VARCHAR(50),
    -- pending: Not yet validated
    -- validated_positive: Confirmed it helped
    -- validated_negative: Didn't solve the problem
    -- validation_mixed: Partial success
  
  validation_notes TEXT,
  validation_metrics JSONB,
    /* Example:
    {
      "complaints_reduced": "78%",
      "sentiment_improved": 0.4,
      "adoption_rate": "65%",
      "customers_saved": 3
    }
    */
  
  -- Metadata
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_roadmap_items_company ON roadmap_items(company_id);
CREATE INDEX idx_roadmap_items_status ON roadmap_items(status);
CREATE INDEX idx_roadmap_items_priority ON roadmap_items(impact_score DESC, effort_score ASC);
CREATE INDEX idx_roadmap_items_owner ON roadmap_items(owner_id);
CREATE INDEX idx_roadmap_items_quarter ON roadmap_items(target_quarter);

-- ============================================================================
-- ROADMAP THEME LINKS: Connect roadmap items to themes
-- ============================================================================

CREATE TABLE roadmap_theme_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  
  -- Relationship strength
  link_type VARCHAR(50) DEFAULT 'supporting',
    -- primary: Main theme this addresses
    -- supporting: Related theme
    -- tangential: Loosely related
  
  -- Metadata
  added_by UUID REFERENCES admin_users(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT, -- Why this link exists
  
  UNIQUE(roadmap_item_id, theme_id)
);

CREATE INDEX idx_roadmap_theme_links_roadmap ON roadmap_theme_links(roadmap_item_id);
CREATE INDEX idx_roadmap_theme_links_theme ON roadmap_theme_links(theme_id);

-- ============================================================================
-- ROADMAP ACTIVITY LOG: Audit trail of changes
-- ============================================================================

CREATE TABLE roadmap_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  
  activity_type VARCHAR(50) NOT NULL,
    -- created, status_changed, prioritized, shipped, 
    -- evidence_added, commented, upvoted
  
  description TEXT, -- Human-readable description
  
  -- Change Details
  old_value JSONB,
  new_value JSONB,
  
  -- Context
  triggered_by_theme_id UUID REFERENCES themes(id),
  triggered_by_insight_id UUID REFERENCES ai_insights(id),
  
  -- User
  performed_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roadmap_activity_log_item ON roadmap_activity_log(roadmap_item_id);
CREATE INDEX idx_roadmap_activity_log_created ON roadmap_activity_log(created_at DESC);

-- ============================================================================
-- PRODUCT RELEASES: Track what shipped when
-- ============================================================================

CREATE TABLE product_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Release Info
  version VARCHAR(50), -- "v2.3.0"
  release_name VARCHAR(255), -- "Performance Improvements"
  release_date DATE NOT NULL,
  release_type VARCHAR(50), -- major, minor, patch, hotfix
  
  -- Content
  description TEXT,
  release_notes TEXT, -- Markdown formatted
  
  -- Roadmap Items Shipped
  shipped_roadmap_item_ids UUID[] DEFAULT '{}',
  
  -- Customer Communication
  notified_customers UUID[] DEFAULT '{}', -- Customers notified
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_releases_company ON product_releases(company_id);
CREATE INDEX idx_product_releases_date ON product_releases(release_date DESC);

-- ============================================================================
-- ROADMAP COMMENTS: Team collaboration
-- ============================================================================

CREATE TABLE roadmap_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  
  comment_text TEXT NOT NULL,
  
  -- User
  author_id UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  is_internal BOOLEAN DEFAULT true, -- vs customer-facing
  mentioned_users UUID[] DEFAULT '{}' -- @mentions
);

CREATE INDEX idx_roadmap_comments_item ON roadmap_comments(roadmap_item_id);
CREATE INDEX idx_roadmap_comments_created ON roadmap_comments(created_at DESC);

-- ============================================================================
-- ROADMAP UPVOTES: Internal team prioritization
-- ============================================================================

CREATE TABLE roadmap_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id UUID NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(roadmap_item_id, user_id)
);

CREATE INDEX idx_roadmap_upvotes_item ON roadmap_upvotes(roadmap_item_id);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Roadmap items with full context
CREATE OR REPLACE VIEW roadmap_items_enriched AS
SELECT 
  ri.*,
  
  -- Theme data
  ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.id IS NOT NULL) as theme_names,
  
  -- Counts
  COUNT(DISTINCT rtl.theme_id) as linked_theme_count,
  COUNT(DISTINCT rc.id) as comment_count,
  COUNT(DISTINCT ru.id) as upvote_count,
  
  -- Owner info
  owner.full_name as owner_name,
  owner.email as owner_email
  
FROM roadmap_items ri
LEFT JOIN roadmap_theme_links rtl ON rtl.roadmap_item_id = ri.id
LEFT JOIN themes t ON t.id = rtl.theme_id
LEFT JOIN roadmap_comments rc ON rc.roadmap_item_id = ri.id
LEFT JOIN roadmap_upvotes ru ON ru.roadmap_item_id = ri.id
LEFT JOIN admin_users owner ON owner.id = ri.owner_id
GROUP BY ri.id, owner.full_name, owner.email;

-- View: Themes with roadmap status
CREATE OR REPLACE VIEW themes_with_roadmap_status AS
SELECT 
  t.*,
  ri.id as roadmap_item_id,
  ri.title as roadmap_item_title,
  ri.status as roadmap_item_status,
  ri.impact_score,
  ri.effort_score
FROM themes t
LEFT JOIN roadmap_items ri ON ri.id = t.linked_roadmap_item_id;
```

---

## 🚀 Implementation Status & Next Steps

### **✅ COMPLETED (Ready for Production)**

1. **Tags Management System**
   - ✅ Database schema with proper relationships
   - ✅ AI tag normalization and deduplication
   - ✅ Tag usage tracking and statistics
   - ✅ Admin UI for tag management
   - ✅ Integration with existing survey responses

2. **AI Tag Processing**
   - ✅ Enhanced tag normalizer with database integration
   - ✅ Automatic tag creation from survey responses
   - ✅ Tag categorization and metadata
   - ✅ Usage statistics and sentiment tracking

### **🔄 READY FOR IMPLEMENTATION**

**Phase 1: Theme Discovery (1-2 weeks)**
- Create `themes` table from schema above
- Build `ThemeDiscoveryEngine` class
- Implement daily batch job for theme discovery
- Add theme management UI to Tags & Themes page

**Phase 2: Roadmap Integration (2-3 weeks)**
- Create `roadmap_items` table and related tables
- Build `RoadmapItemGenerator` class
- Implement Impact vs Effort matrix UI
- Add roadmap management to admin dashboard

**Phase 3: Automated Workflows (1-2 weeks)**
- Set up cron jobs for theme discovery
- Implement weekly roadmap suggestions
- Build post-ship validation system
- Add notification system for product team

### **🎯 Immediate Next Action**

The foundation is solid. We can now proceed with **Theme Discovery** since we have:
- ✅ Rich tag data with proper categorization
- ✅ Tag usage tracking across all feedback
- ✅ AI normalization preventing duplicates
- ✅ Real sentiment and usage statistics

**Recommended next step:** Implement the `themes` table and `ThemeDiscoveryEngine` to start discovering patterns across your existing tag data.

---

## 🤖 AI Services for Product Discovery

### **1. Theme Discovery Engine**

```typescript
// src/lib/ai/theme-discovery.ts

export class ThemeDiscoveryEngine {
  private companyId: string
  
  constructor(companyId: string) {
    this.companyId = companyId
  }
  
  /**
   * Discover themes across all feedback
   * Runs daily as a batch job
   */
  async discoverThemes(): Promise<DiscoveredTheme[]> {
    // Get all feedback from last 90 days
    const feedback = await this.getRecentFeedback()
    
    // Group by similar tags
    const tagClusters = this.groupByTagSimilarity(feedback)
    
    // For each cluster, use AI to generate theme
    const themes: DiscoveredTheme[] = []
    
    for (const cluster of tagClusters) {
      if (cluster.feedback.length < 5) continue // Need min 5 mentions
      
      const theme = await this.generateTheme(cluster)
      themes.push(theme)
    }
    
    return themes
  }
  
  /**
   * Generate a theme from a cluster of feedback
   */
  private async generateTheme(cluster: FeedbackCluster): Promise<DiscoveredTheme> {
    const prompt = `Analyze this cluster of customer feedback and generate a theme.

FEEDBACK ITEMS (${cluster.feedback.length} items):
${cluster.feedback.slice(0, 20).map(f => `
- Customer: ${f.customer_name || 'Anonymous'}
  Source: ${f.source_type}
  Tags: ${f.ai_tags.join(', ')}
  Sentiment: ${f.sentiment_score}
  Text: "${f.content.substring(0, 200)}..."
`).join('\n')}

Common tags in cluster: ${cluster.commonTags.join(', ')}

Generate a theme with:
1. name: Clear, descriptive name (e.g., "Dashboard Performance Issues")
2. description: 2-3 sentence summary of the pattern
3. priority_score: 0-100 based on:
   - Number of customers affected
   - Sentiment negativity
   - Trend (if increasing)
   - Business impact keywords (churn, expensive, broken)
4. evidence: List the 3-5 most compelling quotes
5. recommended_action: What should the product team do?

Return JSON.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You discover patterns in customer feedback.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    
    return {
      ...result,
      related_tags: cluster.commonTags,
      supporting_feedback_ids: cluster.feedback.map(f => f.id),
      customer_count: new Set(cluster.feedback.map(f => f.customer_id)).size,
      mention_count: cluster.feedback.length,
      avg_sentiment: this.calculateAvgSentiment(cluster.feedback),
      source_breakdown: this.calculateSourceBreakdown(cluster.feedback),
      trend: await this.calculateTrend(cluster.commonTags),
    }
  }
  
  /**
   * Calculate trend for a set of tags
   */
  private async calculateTrend(tags: string[]): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable' | 'spiking',
    week_over_week_change: number
  }> {
    // Query feedback mentions over time
    const thisWeek = await this.countMentions(tags, 'this_week')
    const lastWeek = await this.countMentions(tags, 'last_week')
    const twoWeeksAgo = await this.countMentions(tags, 'two_weeks_ago')
    
    const change = ((thisWeek - lastWeek) / lastWeek) * 100
    
    let trend: 'increasing' | 'decreasing' | 'stable' | 'spiking'
    if (Math.abs(change) < 10) {
      trend = 'stable'
    } else if (change > 50) {
      trend = 'spiking'
    } else if (change > 0) {
      trend = 'increasing'
    } else {
      trend = 'decreasing'
    }
    
    return { trend, week_over_week_change: change }
  }
}

interface DiscoveredTheme {
  name: string
  description: string
  related_tags: string[]
  supporting_feedback_ids: string[]
  customer_count: number
  mention_count: number
  avg_sentiment: number
  source_breakdown: Record<string, number>
  trend: string
  week_over_week_change: number
  priority_score: number
  evidence: string[]
  recommended_action: string
}
```

### **2. Roadmap Item Generator**

```typescript
// src/lib/ai/roadmap-generator.ts

export class RoadmapItemGenerator {
  private companyId: string
  
  constructor(companyId: string) {
    this.companyId = companyId
  }
  
  /**
   * Generate roadmap item suggestions from themes
   */
  async generateSuggestions(themes: Theme[]): Promise<RoadmapSuggestion[]> {
    const prompt = `You are a product prioritization expert. Analyze these customer feedback themes and suggest roadmap items.

THEMES:
${themes.map(t => `
─────────────────────────────────────
THEME: "${t.name}"
Description: ${t.description}
Affected: ${t.customer_count} customers
Mentions: ${t.mention_count} times
Sentiment: ${t.avg_sentiment} (${t.avg_sentiment < -0.3 ? 'NEGATIVE' : 'neutral'})
Trend: ${t.trend} (${t.week_over_week_change > 0 ? '+' : ''}${t.week_over_week_change.toFixed(1)}%)
Sources: ${JSON.stringify(t.source_breakdown)}
Tags: ${t.related_tags.join(', ')}

Top Evidence:
${t.evidence?.slice(0, 3).map((e, i) => `${i+1}. "${e}"`).join('\n')}
`).join('\n\n')}

For EACH theme that should become a roadmap item, provide:

1. should_create (boolean): Should this become a roadmap item?
2. reasoning: Why or why not?
3. title: Clear, actionable title (if creating)
4. type: "feature", "improvement", or "bug_fix"
5. description: 2-3 sentences explaining the work
6. impact_score (0-100): Business impact based on:
   - Customer demand (how many affected)
   - Sentiment (how negative)
   - Trend (is it growing)
   - Strategic importance (churn risk, revenue, competitive)
7. effort_estimate: "low", "medium", "high"
8. impact_factors: Breakdown of impact score
9. customer_quotes: Top 3-5 quotes to include as evidence
10. recommended_priority: "critical", "high", "medium", "low"

Return JSON array of suggestions.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a product prioritization expert with deep understanding of SaaS business metrics.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result.suggestions || []
  }
  
  /**
   * Validate and enrich a roadmap suggestion before creating
   */
  async enrichSuggestion(suggestion: RoadmapSuggestion, theme: Theme): Promise<EnrichedRoadmapItem> {
    // Add competitive analysis
    const competitiveAnalysis = await this.analyzeCompetitive(suggestion.title, theme)
    
    // Convert effort estimate to score
    const effortScore = this.convertEffortToScore(suggestion.effort_estimate)
    
    return {
      ...suggestion,
      linked_theme_ids: [theme.id],
      linked_feedback_ids: theme.supporting_feedback_ids,
      affected_customer_count: theme.customer_count,
      effort_score: effortScore,
      confidence_level: this.calculateConfidence(theme),
      ai_competitive_analysis: competitiveAnalysis,
      ai_customer_quotes: this.formatQuotes(suggestion.customer_quotes, theme),
      status: 'backlog',
      created_by: 'ai', // AI-generated suggestion
    }
  }
  
  /**
   * Analyze what competitors are doing
   */
  private async analyzeCompetitive(feature: string, theme: Theme): Promise<string> {
    // Check if Reddit mentions competitors
    const redditMentions = await this.getRedditCompetitorMentions(theme.related_tags)
    
    if (redditMentions.length === 0) {
      return "No competitive intelligence available."
    }
    
    const prompt = `Analyze competitive mentions related to: "${feature}"

REDDIT MENTIONS:
${redditMentions.map(m => `- "${m.content}"`).join('\n')}

Summarize:
1. Do competitors have this feature?
2. What are users saying about competitors' implementations?
3. What's the competitive risk of NOT building this?

Keep it concise (2-3 sentences).`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    })
    
    return response.choices[0].message.content || ""
  }
}
```

---

## 🎨 UI Components

### **1. Impact vs Effort Matrix**

```typescript
// src/components/roadmap/ImpactEffortMatrix.tsx

export function ImpactEffortMatrix({ items }: { items: RoadmapItem[] }) {
  // Group items by quadrant
  const quadrants = {
    quickWins: items.filter(i => i.impact_score >= 70 && i.effort_score <= 40),
    bigBets: items.filter(i => i.impact_score >= 70 && i.effort_score > 40),
    fillIns: items.filter(i => i.impact_score < 70 && i.effort_score <= 40),
    avoid: items.filter(i => i.impact_score < 70 && i.effort_score > 40),
  }
  
  return (
    <div className="grid grid-cols-2 gap-4 h-[600px]">
      {/* Top Left: Quick Wins */}
      <Quadrant
        title="Quick Wins ⭐"
        subtitle="High Impact, Low Effort"
        items={quadrants.quickWins}
        className="bg-green-50 border-green-200"
        priority="DO FIRST"
      />
      
      {/* Top Right: Big Bets */}
      <Quadrant
        title="Big Bets 🎯"
        subtitle="High Impact, High Effort"
        items={quadrants.bigBets}
        className="bg-blue-50 border-blue-200"
        priority="STRATEGIC"
      />
      
      {/* Bottom Left: Fill-Ins */}
      <Quadrant
        title="Fill-Ins"
        subtitle="Low Impact, Low Effort"
        items={quadrants.fillIns}
        className="bg-gray-50 border-gray-200"
        priority="IF TIME PERMITS"
      />
      
      {/* Bottom Right: Avoid */}
      <Quadrant
        title="Time Sinks ⚠️"
        subtitle="Low Impact, High Effort"
        items={quadrants.avoid}
        className="bg-red-50 border-red-200"
        priority="RECONSIDER"
      />
    </div>
  )
}

function Quadrant({ title, subtitle, items, className, priority }: QuadrantProps) {
  return (
    <div className={`border-2 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
        <Badge className="mt-2">{priority}</Badge>
      </div>
      
      <div className="space-y-2 overflow-y-auto max-h-[450px]">
        {items.map(item => (
          <RoadmapCard key={item.id} item={item} compact />
        ))}
      </div>
      
      <div className="mt-2 text-sm text-gray-500">
        {items.length} items
      </div>
    </div>
  )
}
```

### **2. Roadmap Item Card with Evidence**

```typescript
// src/components/roadmap/RoadmapItemCard.tsx

export function RoadmapItemCard({ item }: { item: RoadmapItem }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{item.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge>{item.type}</Badge>
              <Badge variant="outline">{item.status}</Badge>
              {item.target_quarter && (
                <Badge variant="secondary">{item.target_quarter}</Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {item.impact_score}
            </div>
            <div className="text-xs text-gray-500">Impact</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-700 mb-4">{item.description}</p>
        
        {/* Customer Evidence */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Customer Evidence
          </h4>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <MetricCard
              label="Customers Affected"
              value={item.affected_customer_count}
              icon={<Users />}
            />
            <MetricCard
              label="Linked Themes"
              value={item.linked_theme_ids.length}
              icon={<Tag />}
            />
            <MetricCard
              label="Feedback Items"
              value={item.linked_feedback_ids.length}
              icon={<MessageSquare />}
            />
          </div>
          
          {/* Top Quotes */}
          {item.ai_customer_quotes && (
            <div className="bg-gray-50 rounded p-3 mb-4">
              <h5 className="font-medium text-sm mb-2">💬 Top Customer Quotes:</h5>
              {item.ai_customer_quotes.slice(0, 3).map((quote: any, i: number) => (
                <div key={i} className="text-sm mb-2 pl-3 border-l-2 border-gray-300">
                  <p className="text-gray-700 italic">"{quote.text}"</p>
                  <p className="text-xs text-gray-500 mt-1">
                    — {quote.customer_name}, {quote.source}, {quote.date}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          {/* Linked Themes */}
          <div className="mb-4">
            <h5 className="font-medium text-sm mb-2">🎯 Related Themes:</h5>
            <div className="flex flex-wrap gap-2">
              {item.theme_names?.map((theme: string) => (
                <Badge key={theme} variant="outline">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* AI Rationale */}
          {item.ai_rationale && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> AI Rationale:
              </h5>
              <p className="text-sm text-gray-700">{item.ai_rationale}</p>
            </div>
          )}
          
          {/* Competitive Analysis */}
          {item.ai_competitive_analysis && (
            <div className="text-sm text-gray-600 mb-4">
              <strong>Competitive Intel:</strong> {item.ai_competitive_analysis}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button size="sm">Move to In Progress</Button>
          <Button size="sm" variant="outline">View All Feedback</Button>
          <Button size="sm" variant="ghost">
            <ExternalLink className="w-4 h-4 mr-1" />
            Create Jira Ticket
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 🔄 Automated Workflows

### **1. Daily Theme Discovery Job**

```typescript
// Run via cron: 0 2 * * * (2am daily)

export async function dailyThemeDiscovery() {
  const companies = await getAllActiveCompanies()
  
  for (const company of companies) {
    console.log(`Discovering themes for company: ${company.name}`)
    
    const engine = new ThemeDiscoveryEngine(company.id)
    const discoveredThemes = await engine.discoverThemes()
    
    for (const theme of discoveredThemes) {
      // Check if theme already exists
      const existing = await findExistingTheme(company.id, theme.name)
      
      if (existing) {
        // Update metrics
        await updateTheme(existing.id, {
          mention_count: theme.mention_count,
          customer_count: theme.customer_count,
          trend: theme.trend,
          week_over_week_change: theme.week_over_week_change,
          last_seen: new Date(),
        })
      } else {
        // Create new theme
        await createTheme(company.id, theme)
      }
    }
    
    console.log(`✅ Discovered ${discoveredThemes.length} themes`)
  }
}
```

### **2. Weekly Roadmap Suggestions**

```typescript
// Run via cron: 0 9 * * 1 (9am Mondays)

export async function weeklyRoadmapSuggestions() {
  const companies = await getAllActiveCompanies()
  
  for (const company of companies) {
    console.log(`Generating roadmap suggestions for: ${company.name}`)
    
    // Get high-priority themes without roadmap items
    const themes = await getUnaddressedThemes(company.id, {
      minPriorityScore: 70,
      minCustomerCount: 10,
    })
    
    if (themes.length === 0) continue
    
    // Generate suggestions
    const generator = new RoadmapItemGenerator(company.id)
    const suggestions = await generator.generateSuggestions(themes)
    
    // Create roadmap items in "under_review" status
    for (const suggestion of suggestions) {
      if (!suggestion.should_create) continue
      
      const theme = themes.find(t => t.id === suggestion.theme_id)
      const enriched = await generator.enrichSuggestion(suggestion, theme)
      
      await createRoadmapItem(company.id, {
        ...enriched,
        status: 'under_review', // Requires PM approval
      })
    }
    
    // Notify product team
    await notifyProductTeam(company.id, {
      message: `${suggestions.length} new roadmap suggestions ready for review`,
      suggestions,
    })
    
    console.log(`✅ Generated ${suggestions.length} suggestions`)
  }
}
```

### **3. Post-Ship Validation**

```typescript
// Run via cron: 0 10 * * * (10am daily)

export async function validateShippedFeatures() {
  // Get items shipped in last 30 days
  const recentShipped = await getRecentlyShippedItems(30)
  
  for (const item of recentShipped) {
    // Get themes it addressed
    const themes = await getLinkedThemes(item.id)
    
    // Check if complaints decreased
    const validation = await validateImpact(item, themes)
    
    // Update roadmap item
    await updateRoadmapItem(item.id, {
      validation_status: validation.status,
      validation_metrics: validation.metrics,
      validation_notes: validation.notes,
    })
    
    // Notify owner
    if (validation.status === 'validated_positive') {
      await notifyItemOwner(item, {
        message: `Great news! "${item.title}" successfully reduced complaints by ${validation.metrics.complaints_reduced}`,
      })
    }
  }
}
```

---

## 📊 Success Metrics

### **Feedback → Roadmap Efficiency**
- Average time from theme discovery to roadmap item: **<7 days**
- % of roadmap items with customer evidence: **100%**
- % of themes that become roadmap items: **60-70%**

### **Product Team Productivity**
- Time saved on prioritization: **10+ hours/week**
- Confidence in priorities (survey): **8+/10**
- Stakeholder alignment: **>90%**

### **Customer Impact**
- % of shipped features addressing themes: **>80%**
- Validation rate (features that helped): **>70%**
- Feature adoption within 60 days: **>50%**
- Customers saved from churn: **5+ per quarter**

---

## 🎉 What This Enables

### **For Product Managers**
✅ AI surfaces what matters most  
✅ Full customer evidence at your fingertips  
✅ Confident prioritization decisions  
✅ Stakeholder alignment with data  
✅ Closed-loop validation

### **For Engineering**
✅ Clear "why" behind every feature  
✅ Real customer quotes for context  
✅ Impact tracking post-ship  
✅ Connect code to customer outcomes

### **For Leadership**
✅ Data-driven product strategy  
✅ Visibility into customer priorities  
✅ ROI tracking per feature  
✅ Churn prevention metrics

### **For Customers**
✅ Their voice directly influences the product  
✅ Faster responses to issues  
✅ Transparency into what's being built  
✅ Validation that their feedback mattered

---

*Last Updated: December 2024*  
*Status: Architecture Design Complete - Ready for Implementation*

