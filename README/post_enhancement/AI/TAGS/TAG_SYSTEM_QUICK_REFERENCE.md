# Tag System Quick Reference

## 🎯 The Core Concept

### Tags = Atomic Labels (Real-Time)
```
Feedback: "The dashboard loads really slowly"
    ↓ AI Analysis
Tags: ["dashboard", "performance", "slow"]
```

### Themes = Discovered Patterns (Batch)
```
100 feedback items with tags: ["dashboard", "slow", "performance", "lag"]
    ↓ AI Theme Discovery
Theme: "Dashboard Performance Issues" (affects 45 customers)
```

---

## 🔄 How It Works

### Step 1: User Submits Feedback
```
"The pricing page is confusing and I can't find the export button"
```

### Step 2: AI Generates Raw Tags
```typescript
rawTags = ["pricing", "confused", "export", "cant find"]
```

### Step 3: AI Normalizes Tags ✨ **NEW**
```typescript
// AI looks at company's existing tags
// Existing tags: ["pricing", "ux", "export", ...]

// AI normalizes:
// - "confused" → "ux" (similar to existing "ux" patterns)
// - "cant find" → "ux" (same concept)
// - "pricing" → "pricing" (already canonical)
// - "export" → "export" (already canonical)

normalizedTags = ["pricing", "ux", "export"]
```

### Step 4: Store in Database
```sql
INSERT INTO feedback_items (ai_tags, ...) 
VALUES ('{pricing,ux,export}', ...)
```

---

## 🤖 AI Tag Normalizer

### What It Does
- Prevents duplicates ("slow" vs "performance" vs "lag")
- Uses company context (learns your terminology)
- Runs in real-time before storing
- Caches results (90% hit rate)

### How It Normalizes
```
AI Prompt:
"Normalize these tags: ['slow', 'sluggish', 'lag']

Company's existing tags: 
- performance (used 234 times)
- pricing (used 189 times)
- ux (used 156 times)
...

Rules:
1. Use existing tags when possible
2. Merge synonyms
3. Keep atomic (1-2 words)

Output: ['performance']"
```

---

## 🔍 Duplicate Detection

### Weekly AI Scan
```typescript
// AI analyzes all company tags
allTags = ["slow", "performance", "sluggish", "lag", "speed", ...]

// AI suggests merges
{
  canonical: "performance",
  variants: ["slow", "sluggish", "lag"],
  confidence: 0.95,
  reasoning: "All refer to speed/performance",
  affectedCount: 47 feedback items
}
```

### Admin Approves
```
✅ Merge "slow", "sluggish", "lag" → "performance"
   This will update 47 feedback items
   
   [Approve] [Dismiss]
```

### Database Updated
```sql
-- All instances automatically updated
-- Old: ["slow", "dashboard"]
-- New: ["performance", "dashboard"]
```

---

## 💾 No Schema Changes Needed!

### Current Schema (Works Perfect)
```sql
feedback_items
  - ai_tags: TEXT[]  ← Simple array, no joins

survey_responses
  - ai_tags: TEXT[]  ← Simple array, no joins
```

### Why This Works
- **AI handles complexity** - No need for mapping tables
- **Fast queries** - Simple array operations
- **PostgreSQL native** - Built-in array support
- **Flexible** - Can change logic without migrations

---

## 📊 Cost Breakdown

### Per Feedback Item
```
Generate tags:   $0.0001 (gpt-4o-mini)
Normalize tags:  $0.0001 (gpt-4o-mini)
Total:           $0.0002

With caching (75% hit rate):
Average:         $0.00005 per item
```

### 1000 Feedback Items/Month
```
Normalization:        $0.05
Duplicate detection:  $0.008 (weekly scan)
Total:                $0.058/month
Annual:               $0.70/year
```

**Result:** Basically free! 🎉

---

## 🎯 What You Get

### Before (Without Normalization)
```
Tags in database:
- "slow" (23 items)
- "performance" (45 items)  
- "sluggish" (12 items)
- "lag" (8 items)

Problem: Fragmented, hard to filter
```

### After (With AI Normalization)
```
Tags in database:
- "performance" (88 items)  ← All merged

Benefit: Clean, consistent, searchable
```

---

## 🚀 Implementation Steps

### Phase 1 (Week 1) - Core Normalization
```typescript
// 1. Create AITagNormalizer class
const normalizer = new AITagNormalizer(companyId)

// 2. Update analyzeFeedback flow
const rawTags = await ai.generateTags(text)
const tags = await normalizer.normalizeTags(rawTags) // ← NEW

// 3. Store normalized tags
await supabase.from('feedback_items').insert({ ai_tags: tags })
```

### Phase 2 (Week 2) - Duplicate Detection
```typescript
// 1. Detect duplicates
const duplicates = await normalizer.detectDuplicates()

// 2. Show in admin UI
<TagManagement duplicates={duplicates} />

// 3. Let admin approve merges
await mergeTagsInDatabase(variants, canonical)
```

### Phase 3 (Week 3-4) - Advanced Features
```typescript
// Tag analytics
const topTags = await getTopTags(companyId)

// Tag trends
const trends = await getTagTrends(companyId, dateRange)

// Auto-routing
if (tags.includes('bug')) {
  notifyTeam('engineering')
}
```

---

## 💡 Key Insights

### 1. AI > Static Rules ✅
```javascript
// ❌ Static synonym dictionary (breaks easily)
const SYNONYMS = {
  performance: ['slow', 'sluggish', 'lag']
}

// ✅ AI-powered (learns your terminology)
const normalized = await ai.normalizeTags(tags, companyContext)
```

### 2. Company Context Matters ✅
```
Company A: "slow" → "performance"
Company B: "slow" → "speed" 
           (because they use "speed" as canonical)

AI adapts to each company!
```

### 3. Human Oversight ✅
```
AI suggests: Merge "price" and "cost" → "pricing"
Human: ✅ Approve (makes sense)

AI suggests: Merge "bug" and "feature" → "issue"  
Human: ❌ Reject (these are different!)

AI learns from rejection
```

---

## 🎉 Why This Is Awesome

| Without AI Normalization | With AI Normalization |
|-------------------------|----------------------|
| Manual tag cleanup | Automatic normalization |
| Inconsistent tags | Clean, canonical tags |
| Fragmented analytics | Accurate aggregations |
| Poor filtering | Precise filtering |
| Hours of work | Minimal human oversight |
| Static rules | Context-aware AI |
| Break over time | Self-improving |

---

## 📞 Questions?

**Q: What if AI normalizes incorrectly?**
A: Human reviews duplicates before merging. You have full control.

**Q: Can I override AI decisions?**
A: Yes! Manual tag editing is always available.

**Q: What about existing feedback?**
A: AI scans existing tags weekly and suggests merges. One-click to update.

**Q: Is this expensive?**
A: ~$0.00005 per item. For 1000 items/month = $0.05/month.

**Q: Do I need to change my database?**
A: Nope! Works with existing `ai_tags: TEXT[]` columns.

**Q: What if my company uses different terminology?**
A: AI learns YOUR tags and adapts. Each company gets custom normalization.

---

## 🔗 Related Docs

- **`TAG_MANAGEMENT_STRATEGY.md`** - Full technical spec
- **`UNIFIED_FEEDBACK_PRD.md`** - Project overview
- **`AI_INTEGRATION_GUIDE.md`** - AI implementation details

---

*Last Updated: December 2024*

