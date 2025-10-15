# Tag Management Strategy: AI-First Approach

## 📋 Document Overview

**Purpose:** Define clear distinction between tags/themes and design an AI-powered tag management system that minimizes manual work

**Last Updated:** December 2024  
**Status:** Design Document - Ready for Implementation

---

## 🏷️ Tags vs Themes: Clear Definition

### **Tags (Granular, Atomic Labels)**

**What are tags?**
- Short, specific keywords (1-2 words max)
- Atomic units of categorization
- Generated **per feedback item** in real-time
- Used for filtering, routing, and quick categorization

**Examples:**
- `pricing`, `slow`, `dashboard`, `bug`, `confused`, `mobile`, `export`, `onboarding`

**Generation:**
- **When:** Immediately when feedback is received
- **How:** AI analyzes individual feedback item
- **Output:** 3-5 tags per item

**Use Cases:**
- Filter feedback: "Show me all 'pricing' issues"
- Route to teams: Auto-assign 'bug' tags to engineering
- Alert on critical tags: Notify when 'payment' + 'broken' appear
- Quick scan: See what feedback is about at a glance

---

### **Themes (Higher-Level Patterns)**

**What are themes?**
- Conceptual patterns discovered across multiple feedback items
- Descriptive phrases that capture recurring issues/topics
- Generated **across feedback collection** periodically (batch)
- Used for insights, trends, and executive summaries

**Examples:**
- "Onboarding Confusion", "Dashboard Performance Issues", "Pricing Transparency Concerns", "Mobile UX Problems"

**Generation:**
- **When:** Periodically (daily/weekly) or on-demand
- **How:** AI analyzes clusters of feedback with similar tags/content
- **Output:** 5-10 themes per time period

**Use Cases:**
- Executive summaries: "Top 3 themes this month"
- Trend analysis: "Onboarding Confusion" mentions up 40%
- Prioritization: "Dashboard Performance" affects 234 customers
- Cross-channel insights: Theme appears in surveys + reviews + Reddit

---

### **The Relationship**

```
Individual Feedback Item
    ↓
AI generates TAGS: ["dashboard", "slow", "performance"]
    ↓
Multiple feedback items analyzed together
    ↓
AI discovers THEME: "Dashboard Performance Issues"
    ↓
Theme links back to all related feedback items
```

**Example Flow:**

```
Response 1: "The dashboard takes forever to load"
  → Tags: ["dashboard", "slow", "performance"]

Response 2: "Dashboard is really sluggish with large datasets"
  → Tags: ["dashboard", "performance", "data"]

Response 3: "Page hangs when I load my dashboard"
  → Tags: ["dashboard", "hang", "loading"]

Review 1: "Great tool but dashboard needs speed improvements"
  → Tags: ["dashboard", "speed", "positive"]

↓ AI Theme Extraction ↓

THEME: "Dashboard Performance Issues"
  - Confidence: 0.95
  - Supporting feedback: 4 items
  - Sources: survey (3), review (1)
  - Sentiment: -0.6 (negative)
  - First seen: 2024-12-01
  - Trend: Increasing (+40% this week)
```

---

## 🤖 AI-First Tag Management System

### **Philosophy: Minimize Manual Work**

**Core Principles:**
1. **AI does the heavy lifting** - normalization, deduplication, suggestions
2. **Human oversight** - approve/reject AI suggestions
3. **Learn from corrections** - AI improves over time
4. **Proactive, not reactive** - AI detects problems before they multiply

---

## Problem #3: Tag Inconsistency & Management

### **The Challenge**

AI might generate variations of the same concept:
- "slow", "performance", "sluggish", "lag", "speed" all mean similar things
- "pricing", "price", "cost", "expensive" refer to same topic
- "ux", "ui", "interface", "design" are related but not identical

**Without management:**
- Filters become useless (search "pricing" misses "price")
- Analytics fragmented (can't aggregate similar tags)
- Routing fails (rules miss variations)

---

## ✨ Proposed Solution: AI Tag Normalization Engine

### **Architecture: No Schema Changes Needed!**

**Approach:** Keep database simple, let AI handle complexity

```typescript
// Existing schema - NO CHANGES
survey_responses.ai_tags: TEXT[]
feedback_items.ai_tags: TEXT[]

// AI normalizes on-the-fly
// No need for tag_mappings table or complex schema
```

**Why this works:**
- AI is better at fuzzy matching than SQL
- Flexible - can change normalization logic without migrations
- Cost-effective with caching
- Simpler architecture

---

### **How It Works**

#### **Step 1: AI Tag Generation (Current)**
```typescript
// Already implemented
const tags = await ai.generateTags(feedbackText)
// Returns: ["slow", "dashboard", "loading"]
```

#### **Step 2: AI Tag Normalization (NEW)**
```typescript
// NEW: Normalize before storing
const normalizedTags = await ai.normalizeTags(tags)
// Returns: ["performance", "dashboard", "loading"]
//          ↑ "slow" → "performance"
```

#### **Step 3: Store Normalized Tags**
```typescript
// Store in database (no schema change)
await supabase
  .from('survey_responses')
  .update({ ai_tags: normalizedTags })
  .eq('id', responseId)
```

---

### **Implementation: AI Normalization Endpoint**

```typescript
// src/lib/ai/tag-normalizer.ts

export class AITagNormalizer {
  private companyId: string
  
  constructor(companyId: string) {
    this.companyId = companyId
  }
  
  /**
   * Normalize tags using AI + context
   * Uses company's historical tags to learn patterns
   */
  async normalizeTags(tags: string[]): Promise<string[]> {
    // Get company's existing tags for context
    const existingTags = await this.getCompanyTagHistory()
    
    // Check cache first
    const cacheKey = this.getCacheKey(tags, existingTags.slice(0, 50))
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)
    
    // Ask AI to normalize
    const prompt = `You are a tag normalization expert. Normalize these tags to their canonical form.

CANDIDATE TAGS TO NORMALIZE:
${tags.map(t => `- "${t}"`).join('\n')}

EXISTING CANONICAL TAGS IN SYSTEM (use these when possible):
${existingTags.slice(0, 50).join(', ')}

RULES:
1. If a candidate tag is a synonym of an existing tag, use the existing tag
2. If a candidate tag is unique, keep it as-is (lowercase)
3. Merge similar concepts (e.g., "slow" → "performance")
4. Keep tags atomic (1-2 words max)
5. Examples:
   - "slow", "sluggish", "lag" → "performance"
   - "pricing", "price", "cost" → "pricing"
   - "ui", "interface" → "ux"
   - "bug", "error", "broken" → "bug"

Return JSON: {"normalized": ["tag1", "tag2", "tag3"]}

Include "reasoning" field for transparency.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast + cheap
      messages: [
        { role: 'system', content: 'You normalize tags to prevent duplicates.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1 // Deterministic
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    const normalized = result.normalized || tags
    
    // Cache for 7 days
    await redis.set(cacheKey, JSON.stringify(normalized), { ex: 604800 })
    
    // Track cost
    await this.trackCost('tag_normalization', response.usage)
    
    return normalized
  }
  
  /**
   * Get company's most common tags (for context)
   */
  private async getCompanyTagHistory(): Promise<string[]> {
    const cacheKey = `company:${this.companyId}:top_tags`
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)
    
    // Query database for top 100 tags
    const { data } = await supabase.rpc('get_top_tags', {
      p_company_id: this.companyId,
      p_limit: 100
    })
    
    const tags = data?.map((row: any) => row.tag) || []
    
    // Cache for 1 day
    await redis.set(cacheKey, JSON.stringify(tags), { ex: 86400 })
    
    return tags
  }
  
  /**
   * Detect potential duplicates in existing tags
   * Runs periodically to clean up historical data
   */
  async detectDuplicates(): Promise<TagDuplication[]> {
    const allTags = await this.getCompanyTagHistory()
    
    const prompt = `Analyze these tags and identify groups that are synonyms/duplicates.

TAGS:
${allTags.slice(0, 100).join(', ')}

Find groups of 2+ tags that mean the same thing.

Return JSON: {
  "duplicates": [
    {
      "canonical": "performance",
      "variants": ["slow", "sluggish", "lag"],
      "confidence": 0.95,
      "reasoning": "All refer to speed/performance issues"
    }
  ]
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Use better model for this
      messages: [
        { role: 'system', content: 'You detect duplicate/synonym tags.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    })
    
    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result.duplicates || []
  }
}

interface TagDuplication {
  canonical: string
  variants: string[]
  confidence: number
  reasoning: string
  affectedCount?: number // Number of feedback items using these tags
}
```

---

### **Database Query Helper**

```sql
-- Add this SQL function to Supabase
-- Gets top tags for a company

CREATE OR REPLACE FUNCTION get_top_tags(
  p_company_id UUID,
  p_limit INT DEFAULT 100
)
RETURNS TABLE(
  tag TEXT,
  count BIGINT,
  avg_sentiment DECIMAL,
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tag,
    COUNT(*) as count,
    AVG(fi.sentiment_score) as avg_sentiment,
    MIN(fi.created_at) as first_seen,
    MAX(fi.created_at) as last_seen
  FROM feedback_items fi, UNNEST(fi.ai_tags) as t(tag)
  WHERE fi.company_id = p_company_id
  GROUP BY t.tag
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

---

### **Integration with Existing AI Orchestrator**

```typescript
// Update src/lib/ai/orchestrator.ts

async analyzeFeedback(text: string) {
  const [summary, sentiment, rawTags] = await Promise.all([
    this.summarize(text),
    this.analyzeSentiment(text),
    this.generateTags(text), // Existing
  ])
  
  // NEW: Normalize tags before returning
  const normalizer = new AITagNormalizer(this.companyId)
  const tags = await normalizer.normalizeTags(rawTags)
  
  const priorityScore = await this.calculatePriorityScore({
    text,
    sentiment: sentiment.score,
  })
  
  return {
    summary,
    sentiment,
    tags, // Now normalized
    priorityScore,
  }
}
```

---

## 🔍 Tag Duplicate Detection UI

### **Admin Dashboard Feature**

```typescript
// src/app/admin/dashboard/tags/page.tsx

export default async function TagManagementPage() {
  const { user } = await getCurrentUser()
  const companyId = await getCompanyId(user.id)
  
  // Get duplicate suggestions
  const normalizer = new AITagNormalizer(companyId)
  const duplicates = await normalizer.detectDuplicates()
  
  return (
    <div>
      <h1>Tag Management</h1>
      
      {duplicates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔍 Duplicate Tags Detected</CardTitle>
            <p className="text-sm text-gray-600">
              AI found {duplicates.length} groups of similar tags
            </p>
          </CardHeader>
          <CardContent>
            {duplicates.map((dup, i) => (
              <TagDuplicateCard 
                key={i}
                duplicate={dup}
                onMerge={async () => {
                  // Merge tags in database
                  await mergeTagsInDatabase(
                    companyId,
                    dup.variants,
                    dup.canonical
                  )
                }}
              />
            ))}
          </CardContent>
        </Card>
      )}
      
      <TagAnalytics companyId={companyId} />
    </div>
  )
}

// Component
function TagDuplicateCard({ duplicate, onMerge }: Props) {
  const [loading, setLoading] = useState(false)
  
  return (
    <div className="border rounded p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">
            Keep: <span className="text-blue-600">{duplicate.canonical}</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Merge: {duplicate.variants.map(v => (
              <span key={v} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1">
                {v}
              </span>
            ))}
          </p>
          <p className="text-sm mt-2">
            <strong>AI Reasoning:</strong> {duplicate.reasoning}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Confidence: {(duplicate.confidence * 100).toFixed(0)}%
            {duplicate.affectedCount && (
              <> · Affects {duplicate.affectedCount} feedback items</>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* dismiss */}}
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              setLoading(true)
              await onMerge()
              setLoading(false)
            }}
            disabled={loading}
          >
            {loading ? 'Merging...' : 'Merge Tags'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

### **Tag Merge Backend Function**

```typescript
// src/lib/tags/merge.ts

export async function mergeTagsInDatabase(
  companyId: string,
  variants: string[],
  canonical: string
) {
  // Update all feedback_items
  for (const variant of variants) {
    await supabase.rpc('replace_tag_in_array', {
      p_company_id: companyId,
      p_old_tag: variant,
      p_new_tag: canonical
    })
  }
  
  // Log the merge
  await supabase.from('tag_merge_log').insert({
    company_id: companyId,
    canonical_tag: canonical,
    merged_variants: variants,
    performed_at: new Date().toISOString()
  })
}
```

```sql
-- Add to Supabase SQL

-- Function to replace tag in arrays
CREATE OR REPLACE FUNCTION replace_tag_in_array(
  p_company_id UUID,
  p_old_tag TEXT,
  p_new_tag TEXT
)
RETURNS INT AS $$
DECLARE
  affected_count INT;
BEGIN
  -- Update feedback_items
  WITH updated AS (
    UPDATE feedback_items
    SET ai_tags = array_replace(ai_tags, p_old_tag, p_new_tag)
    WHERE company_id = p_company_id
      AND p_old_tag = ANY(ai_tags)
    RETURNING id
  )
  SELECT COUNT(*) INTO affected_count FROM updated;
  
  -- Update survey_responses
  UPDATE survey_responses sr
  SET ai_tags = array_replace(sr.ai_tags, p_old_tag, p_new_tag)
  FROM surveys s
  WHERE sr.survey_id = s.id
    AND s.company_id = p_company_id
    AND p_old_tag = ANY(sr.ai_tags);
  
  -- Update reviews
  UPDATE reviews
  SET ai_tags = array_replace(ai_tags, p_old_tag, p_new_tag)
  WHERE company_id = p_company_id
    AND p_old_tag = ANY(ai_tags);
  
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Optional: Tag merge audit log
CREATE TABLE IF NOT EXISTS tag_merge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  canonical_tag TEXT NOT NULL,
  merged_variants TEXT[] NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  performed_by UUID REFERENCES admin_users(id)
);
```

---

## 📊 Cost Analysis

### **Tag Normalization Costs**

**Per feedback item:**
- Generate tags: $0.0001 (gpt-4o-mini, ~500 tokens)
- Normalize tags: $0.0001 (gpt-4o-mini, ~800 tokens)
- **Total: $0.0002 per feedback item**

**With caching:**
- First occurrence: $0.0002
- Subsequent identical: $0 (cached)
- **Average: $0.00005 per item** (assuming 75% cache hit rate)

**Duplicate detection:**
- Run once per week
- Analyze top 100 tags
- Cost: $0.002 (gpt-4o, ~2K tokens)
- **Monthly cost: $0.008**

**For 1000 feedback items/month:**
- Normalization: $0.05
- Duplicate detection: $0.008
- **Total: $0.058/month** ≈ **$0.70/year**

**Conclusion:** Negligible cost, massive value

---

## 🎯 Implementation Plan

### **Phase 1: Core Normalization (Week 1)**
- [ ] Implement `AITagNormalizer` class
- [ ] Add `get_top_tags()` SQL function
- [ ] Update `AIOrchestrator.analyzeFeedback()` to normalize
- [ ] Test with existing feedback items
- [ ] Deploy and monitor

### **Phase 2: Duplicate Detection (Week 2)**
- [ ] Build duplicate detection algorithm
- [ ] Create admin UI for tag management
- [ ] Implement tag merge functionality
- [ ] Add SQL function for bulk tag replacement
- [ ] Create audit log

### **Phase 3: Advanced Features (Week 3-4)**
- [ ] Tag analytics dashboard
- [ ] Tag trends over time
- [ ] Automatic duplicate detection (cron job)
- [ ] Tag-based routing rules
- [ ] Tag performance metrics

---

## 🔄 Ongoing Maintenance

### **Weekly Tasks**
- [ ] Run duplicate detection
- [ ] Review and merge suggested duplicates
- [ ] Monitor tag usage stats

### **Monthly Tasks**
- [ ] Analyze tag effectiveness
- [ ] Review AI normalization quality
- [ ] Update normalization rules if needed

### **As Needed**
- [ ] Manually merge specific tags
- [ ] Add custom routing rules
- [ ] Refine AI prompts based on performance

---

## ✅ Advantages of This Approach

### **1. No Schema Changes Required** ✅
- Existing `ai_tags: TEXT[]` works perfectly
- No complex joins or mapping tables
- Simple, performant queries

### **2. AI Does the Heavy Lifting** ✅
- Fuzzy matching without complex algorithms
- Learns from company's tag history
- Adapts to each company's terminology

### **3. Cost-Effective** ✅
- ~$0.00005 per feedback item
- Aggressive caching
- Pay only for new patterns

### **4. Human Oversight** ✅
- AI suggests, humans approve
- Audit trail of all merges
- Can override AI decisions

### **5. Self-Improving** ✅
- More feedback = better normalization
- AI learns canonical tags over time
- Reduces duplicates automatically

---

## 🚀 Next Steps

1. **Review this document** - Confirm approach aligns with vision
2. **Implement Phase 1** - Core normalization (1 week)
3. **Test with real data** - Run on existing feedback
4. **Build admin UI** - Tag management dashboard (1 week)
5. **Deploy and monitor** - Track quality and costs

---

## 📝 Summary

**Problem:** AI generates inconsistent tags ("slow" vs "performance")

**Solution:** AI-powered normalization engine that:
- Normalizes tags using company context
- Detects duplicates proactively  
- Requires human approval for merges
- No schema changes needed
- Costs ~$0.00005 per item

**Result:** Consistent, searchable, actionable tags with minimal manual work

---

*Last Updated: December 2024*
*Status: Ready for Implementation*

