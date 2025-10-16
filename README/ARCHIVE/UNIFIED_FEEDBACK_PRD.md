# Unified Feedback Platform - Product Requirements Document

## 📋 Executive Summary

**Vision:** A customer-centric, AI-powered feedback intelligence platform that not only collects and analyzes feedback but **directly connects customer insights to product roadmap decisions** - creating a closed loop from customer voice to shipped features.

**Version:** 2.0 - Product Discovery Integration  
**Last Updated:** December 2024  
**Status:** 🚀 **IN DEVELOPMENT**

---

## 🎯 The Complete Value Chain

```
Customer Feedback → AI Analysis → Tags → Themes → Insights → Roadmap Items → Shipped Features
                                                              ↑
                                                    You are here
```

**What makes us different:**
Most feedback tools stop at analysis. We connect feedback **directly to product decisions**.

---

## 🏗️ Core Architecture

### **Current Tech Stack**
- **Frontend:** Next.js 14 (App Router) + TypeScript
- **UI Components:** shadcn/ui + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Supabase)
- **AI Provider:** OpenAI (GPT-4 + Embeddings)
- **Caching:** Upstash Redis
- **Authentication:** Supabase Auth

### **Data Flow: Feedback → Roadmap**

```sql
-- The Complete Data Model

feedback_items (customer feedback)
    ↓ AI generates
ai_tags (atomic labels: "pricing", "slow", "bug")
    ↓ AI discovers patterns
themes (recurring patterns: "Dashboard Performance Issues")
    ↓ AI generates
insights (actionable recommendations with evidence)
    ↓ Teams create
roadmap_items (features/fixes with customer evidence)
    ↓ Teams ship
releases (shipped features)
    ↓ Closes loop
feedback_items (validates the work!)
```

---

## 🎯 Core Features

### 1. **AI-Powered Feedback Analysis** ✅ **COMPLETE**

**Status:** 🟢 **LIVE**

**Features:**
- ✅ Sentiment Analysis (OpenAI GPT-4)
- ✅ Smart Tag Generation (atomic labels)
- ✅ Priority Scoring (0-100)
- ✅ Text Summarization
- ✅ Cost Tracking & Logging
- ✅ Redis Caching (90% cost reduction)

**Cost:** ~$0.00005 per feedback item

---

### 2. **Tag System** ✅ **COMPLETE** + 🔄 **ENHANCING**

**What are Tags?**
- Atomic labels generated per feedback item
- Examples: `pricing`, `slow`, `dashboard`, `bug`, `confused`
- Used for filtering, routing, and quick categorization
- **Generated in real-time** when feedback arrives

**AI Tag Normalization (NEW):**
- AI prevents duplicates ("slow" → "performance")
- Learns company terminology
- Weekly duplicate detection
- One-click merge approval
- No schema changes needed

**See:** `TAG_MANAGEMENT_STRATEGY.md` (coming soon)

---

### 3. **Theme Discovery** 🔄 **IN PROGRESS**

**What are Themes?**
- Higher-level patterns discovered across multiple feedback items
- Examples: "Dashboard Performance Issues", "Onboarding Confusion", "Pricing Concerns"
- **Generated periodically** (daily/weekly batch analysis)
- Each theme links back to supporting feedback

**How Themes are Discovered:**
```typescript
// AI analyzes clusters of feedback
Input: 100 feedback items with tags ["dashboard", "slow", "performance"]

AI Output:
Theme: "Dashboard Performance Issues"
  - Supporting feedback: 47 items
  - Sources: surveys (34), reviews (8), interviews (5)
  - Sentiment: -0.6 (negative)
  - First seen: 2024-12-01
  - Trend: +40% this week
  - Customer impact: 47 unique customers
  - Priority score: 87/100
```

**Technical Implementation:**
```sql
CREATE TABLE themes (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  
  -- Core
  name VARCHAR(255) NOT NULL, -- "Dashboard Performance Issues"
  description TEXT,
  
  -- Evidence
  supporting_feedback_ids UUID[], -- Links to feedback_items
  related_tags TEXT[], -- ["dashboard", "performance", "slow"]
  
  -- Metrics
  customer_count INTEGER, -- How many customers affected
  mention_count INTEGER, -- How many times mentioned
  avg_sentiment DECIMAL(3,2),
  
  -- Sources
  source_breakdown JSONB, -- {survey: 34, review: 8, interview: 5}
  
  -- Trends
  first_seen TIMESTAMP,
  last_seen TIMESTAMP,
  trend VARCHAR(50), -- increasing, stable, decreasing
  week_over_week_change DECIMAL(5,2), -- +40%
  
  -- Priority
  priority_score INTEGER, -- 0-100 (AI calculated)
  
  -- Status
  status VARCHAR(50) DEFAULT 'discovered', -- discovered, reviewing, addressed
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4. **Product Discovery / Roadmapping** ⭐ **NEW - TOP PRIORITY**

**Inspired by:** Atlassian Product Discovery

**Core Concept:** Connect customer feedback (themes) directly to roadmap items

#### **4.1 Roadmap Items (Ideas/Features/Fixes)**

```sql
CREATE TABLE roadmap_items (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  
  -- Core
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(50), -- feature, improvement, bug_fix, technical_debt
  
  -- Customer Evidence (KEY CONNECTION)
  linked_theme_ids UUID[], -- Themes supporting this
  linked_feedback_ids UUID[], -- Direct feedback links
  affected_customer_count INTEGER, -- How many customers want this
  
  -- Prioritization
  impact_score INTEGER, -- Business impact (0-100)
  effort_score INTEGER, -- Engineering effort (0-100, higher = more effort)
  confidence_level VARCHAR(50), -- high, medium, low
  
  -- AI-Generated Insights
  ai_rationale TEXT, -- Why this matters
  ai_customer_quotes JSONB, -- Top quotes supporting this
  ai_competitive_analysis TEXT, -- If competitors have this
  
  -- Status & Workflow
  status VARCHAR(50) DEFAULT 'backlog',
    -- backlog, under_review, prioritized, in_progress, 
    -- shipped, declined, archived
  
  -- Planning
  target_quarter VARCHAR(20), -- "2024-Q1"
  assigned_to UUID REFERENCES admin_users(id),
  estimated_ship_date DATE,
  actual_ship_date DATE,
  
  -- Collaboration
  stakeholders UUID[], -- Array of admin_user IDs
  last_reviewed_at TIMESTAMP,
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0, -- Internal team votes
  
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link roadmap items to themes
CREATE TABLE roadmap_theme_links (
  id UUID PRIMARY KEY,
  roadmap_item_id UUID REFERENCES roadmap_items(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
  
  -- Metadata
  link_strength VARCHAR(50), -- primary, supporting, tangential
  added_by UUID REFERENCES admin_users(id),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(roadmap_item_id, theme_id)
);

-- Track when roadmap items are updated based on feedback
CREATE TABLE roadmap_feedback_events (
  id UUID PRIMARY KEY,
  roadmap_item_id UUID REFERENCES roadmap_items(id),
  event_type VARCHAR(50), -- created, prioritized, shipped, declined
  event_reason TEXT, -- "Customer demand increased 50%"
  triggered_by_theme_id UUID REFERENCES themes(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **4.2 Impact vs Effort Matrix**

**Visual prioritization tool:**

```
High Impact, Low Effort (DO FIRST)  |  High Impact, High Effort (BIG BETS)
    - Quick wins                    |      - Strategic initiatives
    - Fast customer value            |      - Requires planning
                                     |
─────────────────────────────────────┼──────────────────────────────────────
                                     |
Low Impact, Low Effort (FILL-INS)   |  Low Impact, High Effort (AVOID)
    - If time permits                |      - Deprioritize
    - Low risk                       |      - Reconsider need
```

**AI automatically calculates:**
- **Impact Score** (0-100): Customer demand + revenue potential + churn prevention
- **Effort Score** (0-100): Complexity + dependencies + time estimate

#### **4.3 AI-Powered Prioritization**

**Automatic Roadmap Item Generation:**

```typescript
// AI suggests roadmap items from themes
async function generateRoadmapSuggestions(companyId: string) {
  // Get top themes
  const themes = await getTopThemes(companyId, { limit: 20 })
  
  // AI analyzes and suggests roadmap items
  const prompt = `Analyze these customer feedback themes and suggest roadmap items.

THEMES:
${themes.map(t => `
- ${t.name}
  Affected: ${t.customer_count} customers
  Mentions: ${t.mention_count}
  Sentiment: ${t.avg_sentiment}
  Trend: ${t.trend} (${t.week_over_week_change}%)
  Sources: ${JSON.stringify(t.source_breakdown)}
`).join('\n')}

For each theme, suggest:
1. Whether it should become a roadmap item (yes/no)
2. Type (feature, improvement, bug_fix)
3. Title (clear, actionable)
4. Impact score (0-100, based on customer demand)
5. Suggested effort (low/medium/high)
6. Rationale (why this matters)
7. Customer quotes (3 best quotes)

Return JSON array of suggestions.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a product prioritization expert.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  })
  
  return JSON.parse(response.choices[0].message.content).suggestions
}

// Example output:
{
  "suggestions": [
    {
      "should_create": true,
      "type": "improvement",
      "title": "Optimize Dashboard Performance for Large Datasets",
      "impact_score": 87,
      "effort_estimate": "medium",
      "rationale": "Affects 47 customers, trending up 40%, multiple complaints about slowness with enterprise data volumes",
      "customer_quotes": [
        "Dashboard takes 30+ seconds to load with our dataset",
        "Activity feed widget is unusable with lots of data",
        "We're considering alternatives because of performance"
      ],
      "linked_theme_id": "theme-uuid-123"
    }
  ]
}
```

#### **4.4 Customer Evidence Linking**

**Every roadmap item shows:**
```typescript
<RoadmapItem>
  <Header>
    Optimize Dashboard Performance
    <Badge>87 Impact</Badge>
    <Badge>47 Customers</Badge>
  </Header>
  
  <EvidenceSection>
    <ThemeLinks>
      🎯 Primary Theme: "Dashboard Performance Issues"
         - 47 customers affected
         - 67 mentions across all channels
         - Trending up 40% this week
    </ThemeLinks>
    
    <FeedbackBreakdown>
      📊 Evidence Sources:
      - Surveys: 34 mentions
      - Reviews: 8 mentions  
      - Interviews: 5 discussions
      - Reddit: 2 posts
    </FeedbackBreakdown>
    
    <TopQuotes>
      💬 Top Customer Quotes:
      1. "Dashboard takes 30+ seconds with our data" 
         - Enterprise Customer, Survey, Dec 5
      2. "We're evaluating alternatives because of speed issues"
         - High-value Account, Interview, Dec 3
      3. "Activity feed is completely unusable"
         - G2 Review, ⭐⭐, Nov 28
    </TopQuotes>
    
    <ViewAllFeedback>
      → View all 67 related feedback items
    </ViewAllFeedback>
  </EvidenceSection>
  
  <Actions>
    <Button>Move to In Progress</Button>
    <Button>Add to Q1 2024</Button>
  </Actions>
</RoadmapItem>
```

#### **4.5 Roadmap Views**

**Multiple visualization options:**

**A) List View (Default)**
```
Backlog (234 items)
├─ High Impact, Low Effort (12) ⭐ QUICK WINS
├─ High Impact, High Effort (45) 🎯 BIG BETS
├─ Low Impact, Low Effort (89)
└─ Low Impact, High Effort (88) ⚠️ AVOID

In Progress (8 items)
Shipped This Quarter (23 items)
```

**B) Impact vs Effort Matrix**
Visual quadrant chart with drag-and-drop

**C) Timeline View**
Gantt-style roadmap by quarter

**D) Theme-Driven View**
Group by customer themes

#### **4.6 Workflow: Feedback → Roadmap**

**Step 1: Feedback Arrives**
```
Customer submits: "Dashboard is too slow with large datasets"
  → AI tags: ["dashboard", "performance", "data"]
  → Stored in feedback_items
```

**Step 2: Theme Discovery (Daily Batch)**
```
AI analyzes similar feedback:
  → 47 items with ["dashboard", "performance", "slow"]
  → Creates theme: "Dashboard Performance Issues"
  → Priority: 87/100 (high impact)
```

**Step 3: AI Suggests Roadmap Item (Weekly)**
```
AI generates suggestion:
  Title: "Optimize Dashboard Performance"
  Impact: 87/100
  Effort: Medium
  Evidence: 47 customers, 67 mentions
  Status: Suggested → Needs review
```

**Step 4: PM Reviews & Approves**
```
PM sees AI suggestion with full evidence
  → Reviews customer quotes
  → Checks trend (up 40%)
  → Approves and adds to backlog
  → Assigns to engineering team
```

**Step 5: Team Prioritizes**
```
Engineering estimates effort: 3 weeks
PM updates effort score: 60/100
Moves to "Prioritized" for Q1 2024
Notifies stakeholders
```

**Step 6: Development & Shipping**
```
Status: In Progress → Shipped
Actual ship date: 2024-01-15
Release notes generated with customer evidence
```

**Step 7: Close the Loop**
```
Notify affected customers:
"We heard your feedback about dashboard performance.
We've shipped improvements! 47 customers requested this."

Track new feedback to validate:
  → Are performance complaints decreasing?
  → Sentiment improving?
  → Churn risk reduced?
```

---

### 5. **AI-Powered Insights** 🔄 **ENHANCED**

**Insights bridge themes → roadmap items**

```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  
  insight_type VARCHAR(50),
    -- emerging_theme, churn_risk, quick_win, 
    -- competitive_gap, feature_request
  
  title VARCHAR(500),
  description TEXT,
  
  -- Evidence
  supporting_theme_ids UUID[],
  supporting_feedback_ids UUID[],
  confidence_score DECIMAL(3,2),
  
  -- Recommendation
  recommended_action TEXT, -- AI suggestion
  business_impact TEXT, -- Revenue, churn, satisfaction
  urgency VARCHAR(50), -- critical, high, medium, low
  
  -- Roadmap Connection
  suggested_roadmap_item JSONB, -- AI-generated roadmap item
  linked_roadmap_item_id UUID REFERENCES roadmap_items(id),
  
  -- Status
  status VARCHAR(50) DEFAULT 'new',
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP,
  
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

**Example Insight:**
```json
{
  "insight_type": "churn_risk",
  "title": "High churn risk: Dashboard performance complaints up 40%",
  "description": "47 customers complaining about dashboard speed, including 3 enterprise accounts. Sentiment declining, 2 customers mentioned evaluating alternatives.",
  "confidence_score": 0.92,
  "recommended_action": "Prioritize dashboard performance optimization. Quick win: optimize Activity Feed widget (mentioned in 60% of complaints)",
  "business_impact": "Risk: $15K MRR from at-risk accounts. Potential: Reducing complaints could improve NPS by 8 points.",
  "urgency": "high",
  "suggested_roadmap_item": {
    "title": "Optimize Dashboard Performance - Activity Feed Widget",
    "type": "improvement",
    "impact_score": 87,
    "effort_estimate": "low",
    "affected_customers": 47
  }
}
```

---

## 📊 Complete Database Schema

### **Feedback Collection Layer**
```sql
companies
admin_users
customers
customer_identifiers
feedback_items (polymorphic)
surveys, survey_responses, survey_links
interviews
reviews
reddit_mentions
```

### **AI Analysis Layer**
```sql
-- Tags (per-item, real-time)
feedback_items.ai_tags
survey_responses.ai_tags
reviews.ai_tags

-- Themes (cross-item, batch)
themes
theme_feedback_links

-- Insights (actionable)
ai_insights
```

### **Product Discovery Layer** ⭐ **NEW**
```sql
roadmap_items
roadmap_theme_links
roadmap_feedback_events
product_releases
```

### **Infrastructure**
```sql
ai_cost_logs
customer_health_scores
privacy_requests
pii_detection_logs
```

---

## 🎯 Implementation Roadmap

### **Phase 1: Foundation** ✅ **COMPLETE**
- [x] Database migration
- [x] AI integration (tags, sentiment)
- [x] Basic survey functionality

### **Phase 2: Intelligence** 🔄 **IN PROGRESS**
- [x] AI tag generation
- [ ] AI tag normalization
- [ ] Theme discovery engine
- [ ] Insights generation

**Timeline:** 2 weeks

### **Phase 3: Product Discovery** ⭐ **NEW - HIGH PRIORITY**
- [ ] Roadmap item schema
- [ ] Impact vs Effort matrix UI
- [ ] AI roadmap suggestions
- [ ] Theme → Roadmap linking
- [ ] Customer evidence display
- [ ] Prioritization workflow

**Timeline:** 3-4 weeks

### **Phase 4: Closed Loop** 
- [ ] Ship tracking
- [ ] Customer notification on shipped features
- [ ] Feedback validation (did the fix work?)
- [ ] ROI tracking per roadmap item

**Timeline:** 2 weeks

### **Phase 5: Multi-Channel**
- [ ] Interview transcription
- [ ] Review integrations
- [ ] Reddit monitoring

**Timeline:** 4-6 weeks

---

## 🎯 Success Metrics

### **Feedback → Roadmap Metrics**
- **Time to Roadmap**: How fast themes become roadmap items
  - Target: <7 days from theme discovery
- **Evidence Quality**: % of roadmap items with customer evidence
  - Target: 100% of items have linked feedback
- **Customer Impact**: % of shipped features addressing customer themes
  - Target: >80%
- **Validation Rate**: % of shipped features that reduced complaints
  - Target: >70%

### **Product Team Efficiency**
- **Prioritization Confidence**: Survey product team
  - Target: >8/10 confidence in priorities
- **Time Saved**: Hours saved vs manual prioritization
  - Target: 10+ hours/week
- **Alignment**: Stakeholder agreement on priorities
  - Target: >90% agreement

### **Customer Outcomes**
- **Feature Adoption**: % of customers using shipped features
  - Target: >50% adoption within 60 days
- **Sentiment Improvement**: Sentiment change post-ship
  - Target: +0.3 improvement
- **Churn Reduction**: Customers saved by addressing issues
  - Target: 5+ customers/quarter

---

## 💡 Key Differentiators

### **vs Traditional Feedback Tools**
```
Them: Collect feedback → Analyze → End
Us:   Collect feedback → Analyze → Generate themes → 
      Suggest roadmap items → Track shipping → Validate impact
```

### **vs Product Management Tools (Productboard, Aha)**
```
Them: Manual linking of feedback to features
Us:   AI automatically discovers themes and suggests roadmap items
      with full evidence and customer quotes
```

### **vs Atlassian Product Discovery**
```
Similarities:
- Impact vs effort matrix
- Customer evidence linking
- Roadmap visualization

Our Advantages:
- AI theme discovery (they require manual tagging)
- AI-powered prioritization
- Automatic feedback aggregation
- Multi-channel (surveys + reviews + interviews + Reddit)
- Built-in feedback collection (they integrate with others)
```

---

## 🚀 Next Steps

### **Immediate (This Week)**
1. Review and approve this vision
2. Finalize theme discovery algorithm
3. Design roadmap UI mockups

### **Week 1-2: Theme Discovery**
- Build theme generation engine
- Create theme detail pages
- Add theme analytics

### **Week 3-4: Roadmap Foundation**
- Implement roadmap_items schema
- Build impact vs effort matrix
- Create list/kanban views

### **Week 5-6: AI Integration**
- AI roadmap suggestions
- Auto-linking themes to items
- Priority scoring

---

## 📞 Questions to Resolve

1. **Roadmap Privacy:** Should roadmap be visible to all team members or role-restricted?
2. **Customer Visibility:** Should customers see the roadmap (public roadmap)?
3. **Voting:** Should internal team members vote on priorities?
4. **External Stakeholders:** Integration with Jira/Linear for engineering execution?
5. **Release Notes:** Auto-generate from roadmap items with customer evidence?

---

## 📚 Related Documentation

- **`PRODUCT_DISCOVERY_ARCHITECTURE.md`** - Technical deep dive on themes → roadmap
- **`COMPLETE_SYSTEM_FLOW.md`** - Visual guide: feedback → shipped features
- **`TAG_MANAGEMENT_STRATEGY.md`** - AI-first tag normalization (coming soon)

---

*Last Updated: December 2024*  
*Status: 🚀 Vision 2.0 - Product Discovery Integration*
