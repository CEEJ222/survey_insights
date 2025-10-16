# Tag Normalization Setup Guide

## 🎯 What We Built

An AI-powered tag normalization system that:
- Prevents duplicate tags ("slow" → "performance")
- Learns your company's terminology
- Detects existing duplicates in your data
- Works automatically on every survey submission

---

## 📁 Files Created

### 1. **SQL Functions** (`supabase/tag_management_functions.sql`)
- `get_top_tags()` - Returns most common tags
- `replace_tag_in_array()` - Merges duplicate tags
- `get_tag_trends()` - Shows tag usage over time
- `tag_merge_log` - Audit trail for merges

### 2. **AI Normalizer** (`src/lib/ai/tag-normalizer.ts`)
- `normalizeTags()` - Normalizes tags using AI + company context
- `detectDuplicates()` - Finds duplicate tags in existing data
- Includes caching and cost tracking

### 3. **Integration** (`src/lib/ai/orchestrator.ts`)
- Updated to automatically normalize tags after generation
- Works seamlessly with existing AI analysis

---

## 🚀 Setup Instructions

### Step 1: Add SQL Functions to Supabase

1. Open your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy ALL contents from `supabase/tag_management_functions.sql`
5. Paste and click **"Run"** (or Cmd/Ctrl + Enter)

**Verify it worked:**
```sql
-- Should show function exists
SELECT * FROM pg_proc WHERE proname = 'get_top_tags';
```

### Step 2: Test SQL Functions (Optional)

Replace `'your-company-id-here'` with your actual company ID:

```sql
-- Test: Get top 20 tags
SELECT * FROM get_top_tags('your-company-id-here', 20);

-- Test: Get tag trends for last 30 days
SELECT * FROM get_tag_trends('your-company-id-here', 'dashboard', 30);
```

### Step 3: Verify TypeScript Integration

The tag normalizer is already integrated! Test it:

1. **Submit a test survey** with feedback like:
   - "The dashboard is very slow and sluggish"
   - "The pricing is expensive and unclear"

2. **Check the database:**
   ```sql
   SELECT ai_tags FROM survey_responses ORDER BY submitted_at DESC LIMIT 5;
   ```

3. **Look for normalization:**
   - "slow", "sluggish" should become → "performance"
   - "expensive" should become → "pricing"

### Step 4: Monitor AI Costs

```sql
-- Check AI cost logs
SELECT 
  request_type,
  COUNT(*) as calls,
  SUM(estimated_cost) as total_cost,
  AVG(estimated_cost) as avg_cost,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits
FROM ai_cost_logs
WHERE company_id = 'your-company-id-here'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY request_type
ORDER BY total_cost DESC;
```

---

## 🧪 Testing Tag Normalization

### Method 1: Automated Test

Run the test file (update company ID first):

```typescript
// Edit src/lib/ai/__tests__/tag-normalizer.test.ts
const TEST_COMPANY_ID = 'your-actual-company-id'

// Then run tests
import { runAllTests } from './src/lib/ai/__tests__/tag-normalizer.test'
runAllTests()
```

### Method 2: Manual Test

Create a test API route:

```typescript
// src/app/api/test/tag-normalize/route.ts
import { createTagNormalizer } from '@/lib/ai/tag-normalizer'

export async function POST(req: Request) {
  const { tags, companyId } = await req.json()
  
  const normalizer = createTagNormalizer(companyId)
  const normalized = await normalizer.normalizeTags(tags)
  
  return Response.json({ 
    input: tags,
    output: normalized 
  })
}
```

Then test with curl:
```bash
curl -X POST http://localhost:3000/api/test/tag-normalize \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["slow", "sluggish", "dashboard", "ui"],
    "companyId": "your-company-id"
  }'
```

### Method 3: Submit Real Survey

1. Create a test survey
2. Submit response with text: "The dashboard is slow and the pricing is expensive"
3. Check `survey_responses.ai_tags` - should show normalized tags

---

## 🔍 Finding Duplicates in Existing Data

### Run Duplicate Detection

```typescript
import { createTagNormalizer } from '@/lib/ai/tag-normalizer'

const normalizer = createTagNormalizer('your-company-id')
const duplicates = await normalizer.detectDuplicates()

console.log('Found duplicates:', duplicates)
```

### Example Output:
```json
[
  {
    "canonical": "performance",
    "variants": ["slow", "sluggish", "lag"],
    "confidence": 0.95,
    "reasoning": "All refer to speed/performance issues",
    "affectedCount": 47
  },
  {
    "canonical": "pricing",
    "variants": ["price", "cost", "expensive"],
    "confidence": 0.92,
    "reasoning": "All relate to pricing concerns",
    "affectedCount": 23
  }
]
```

### Merge Duplicates (CAREFUL!)

```sql
-- This will update all feedback items
SELECT * FROM replace_tag_in_array(
  'your-company-id',
  'slow',  -- old tag
  'performance'  -- new tag
);

-- Returns how many rows were affected
```

---

## 📊 Monitoring & Debugging

### Check Normalization is Working

```sql
-- See recent tag generations
SELECT 
  fi.created_at,
  fi.content,
  fi.ai_tags
FROM feedback_items fi
WHERE fi.company_id = 'your-company-id'
ORDER BY fi.created_at DESC
LIMIT 10;
```

### Monitor Cache Hit Rate

```sql
SELECT 
  DATE(created_at) as date,
  SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as cache_hits,
  COUNT(*) as total_calls,
  ROUND(100.0 * SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) / COUNT(*), 1) as hit_rate
FROM ai_cost_logs
WHERE company_id = 'your-company-id'
  AND request_type = 'tag_normalization'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

Target: >80% cache hit rate after initial period

### Check AI Costs

```sql
SELECT 
  SUM(estimated_cost) as total_cost,
  COUNT(*) as total_calls,
  AVG(estimated_cost) as avg_cost_per_call
FROM ai_cost_logs
WHERE company_id = 'your-company-id'
  AND request_type IN ('tagging', 'tag_normalization')
  AND created_at > NOW() - INTERVAL '30 days';
```

Expected: ~$0.0001-0.0002 per normalization

---

## ⚙️ Configuration

### Environment Variables

Make sure these are set in `.env.local`:

```env
# OpenAI API Key (required)
OPENAI_API_KEY=sk-...

# Redis for caching (required)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# AI Configuration
AI_CACHE_TTL=604800  # 7 days in seconds
AI_ENABLE_COST_TRACKING=true
```

### Adjust Normalization Behavior

Edit `src/lib/ai/tag-normalizer.ts`:

```typescript
// Change cache duration
await redis.set(cacheKey, JSON.stringify(uniqueNormalized), {
  ex: 604800, // 7 days (change this)
})

// Change AI model
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini', // or 'gpt-4o' for better quality
  ...
})

// Adjust confidence threshold for duplicates
if (dup.confidence >= 0.80) { // Lower = more suggestions
  // ...
}
```

---

## 🐛 Troubleshooting

### Issue: "Function get_top_tags does not exist"

**Fix:** Run the SQL migrations in Supabase

```sql
-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_top_tags';
```

### Issue: Tags not being normalized

**Debugging:**

1. Check if normalizer is being called:
```typescript
// Add console.log in orchestrator.ts
console.log('Raw tags:', rawTags)
const tags = await normalizer.normalizeTags(rawTags)
console.log('Normalized tags:', tags)
```

2. Check Redis connection:
```bash
# Test Redis
curl -X GET "$UPSTASH_REDIS_REST_URL/get/test" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

3. Check OpenAI API key:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: High AI costs

**Solutions:**

1. Check cache hit rate (should be >80%)
2. Increase cache TTL
3. Review normalization calls in logs

```sql
-- Find expensive operations
SELECT 
  request_type,
  COUNT(*) as calls,
  SUM(estimated_cost) as cost,
  AVG(total_tokens) as avg_tokens
FROM ai_cost_logs
WHERE created_at > NOW() - INTERVAL '1 day'
  AND cache_hit = false
GROUP BY request_type
ORDER BY cost DESC;
```

### Issue: Bad normalizations

**Examples:**
- "bug" being merged with "feature" (they're different!)
- Important domain-specific terms being lost

**Fix:** Update the normalization prompt in `tag-normalizer.ts`:

```typescript
// Add your domain-specific rules
4. NEVER merge these concepts:
   - bug vs feature (keep separate)
   - mobile vs desktop (keep separate)
   - [add your specific terms]
```

---

## ✅ Success Criteria

Tag normalization is working correctly when:

- [ ] New survey submissions have normalized tags
- [ ] Similar tags are merged (slow → performance)
- [ ] Cache hit rate is >80% after initial period
- [ ] AI costs are <$0.0002 per feedback item
- [ ] No unexpected tag merges
- [ ] Duplicate detection finds existing issues

---

## 🎯 Next Steps

After tag normalization is working:

1. **Build Admin UI** (Week 2)
   - Tag analytics dashboard
   - Duplicate review interface
   - One-click merge approval

2. **Weekly Duplicate Detection** (Week 2)
   - Set up cron job
   - Auto-detect duplicates
   - Notify admin team

3. **Move to Themes** (Week 3-4)
   - Use normalized tags for theme discovery
   - Better pattern detection with clean tags

---

## 📞 Need Help?

- **Documentation:** See `TAG_MANAGEMENT_STRATEGY.md`
- **Implementation:** Check `IMPLEMENTATION_CHECKLIST.md`
- **Full System:** See `COMPLETE_SYSTEM_FLOW.md`

---

*Last Updated: December 2024*  
*Status: Tag Normalization - Core Implementation Complete*

