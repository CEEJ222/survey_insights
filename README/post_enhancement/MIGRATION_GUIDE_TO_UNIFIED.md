# Migration Guide: Survey Insights → Unified Feedback Platform

## 🎯 Overview

This guide walks you through transforming your existing Survey Insights project into the Unified Feedback Platform as outlined in the PRD.

**Since you have no valuable data in the database**, we can make bold architectural changes without worrying about data migration.

---

## 📋 Pre-Migration Checklist

Before starting:

- [ ] Commit all current changes: `git add . && git commit -m "Pre-migration checkpoint"`
- [ ] Create new branch: `git checkout -b unified-platform-migration`
- [ ] Backup `.env.local` file (just in case)
- [ ] Have your Supabase project open in browser

---

## 🗄️ Step 1: Apply New Database Schema

### 1.1 Run the New Schema

1. Open your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Open `supabase/schema_unified_platform.sql` in your code editor
5. Copy **ALL** the SQL code
6. Paste into Supabase SQL Editor
7. Click **"Run"** (or Cmd/Ctrl + Enter)

This will:
- ✅ Keep existing tables (companies, admin_users, surveys, etc.)
- ✅ Add new customer-centric tables
- ✅ Add AI infrastructure tables
- ✅ Create polymorphic feedback_items table
- ✅ Update RLS policies
- ✅ Add helpful triggers

### 1.2 Verify Tables Created

Go to **Table Editor** in Supabase. You should now see:

**Original tables (preserved):**
- ✅ companies
- ✅ admin_users
- ✅ surveys
- ✅ survey_links
- ✅ survey_responses
- ✅ survey_schedules

**New tables (added):**
- ✅ customers
- ✅ customer_identifiers
- ✅ customer_merges
- ✅ feedback_items
- ✅ interviews
- ✅ reviews
- ✅ reddit_mentions
- ✅ ai_insights
- ✅ ai_cost_logs
- ✅ customer_health_scores
- ✅ privacy_requests
- ✅ pii_detection_logs

**Total: 20 tables** ✨

---

## 📦 Step 2: Install New Dependencies

```bash
# AI SDKs
npm install openai @anthropic-ai/sdk

# Redis for caching
npm install @upstash/redis

# Vercel AI SDK (helpful utilities)
npm install ai

# State management (if needed)
npm install zustand

# Additional utilities
npm install date-fns crypto-js
```

---

## ⚙️ Step 3: Update Environment Variables

Add these to your `.env.local`:

```env
# ==========================================
# EXISTING (Keep these)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email config (if you have it)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# ==========================================
# NEW - AI Providers
# ==========================================
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# ==========================================
# NEW - Redis (Upstash)
# ==========================================
# Sign up at https://upstash.com and create Redis database
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxx...

# ==========================================
# NEW - AI Configuration
# ==========================================
AI_DEFAULT_PROVIDER=openai
AI_CACHE_TTL=86400  # 24 hours in seconds
AI_ENABLE_COST_TRACKING=true
```

### Getting API Keys:

**OpenAI:**
1. Go to https://platform.openai.com
2. Click "API Keys" → "Create new secret key"
3. Copy key and add to `.env.local`

**Anthropic:**
1. Go to https://console.anthropic.com
2. Settings → API Keys → "Create Key"
3. Copy key and add to `.env.local`

**Upstash Redis:**
1. Go to https://console.upstash.com
2. Create account (free tier available)
3. Create Redis database
4. Copy REST URL and Token
5. Add to `.env.local`

---

## 🔧 Step 4: Update TypeScript Types

Replace imports in your code:

**Before:**
```typescript
import { Database } from '@/types/database'
```

**After:**
```typescript
import { Database } from '@/types/database-unified'
// Keep old types file for reference during migration
```

**Or rename files:**
```bash
# Backup old types
mv src/types/database.ts src/types/database-old.ts

# Use new types
mv src/types/database-unified.ts src/types/database.ts
```

---

## 🏗️ Step 5: Create AI Infrastructure

### 5.1 Create AI Services Directory

```bash
mkdir -p src/lib/ai
```

### 5.2 Create AI Orchestrator

Create `src/lib/ai/orchestrator.ts`:

```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const redis = Redis.fromEnv();

export class AIOrchestrator {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Generate cache key from content
   */
  private generateCacheKey(prefix: string, content: string): string {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `${prefix}:${hash.substring(0, 16)}`;
  }

  /**
   * Track AI cost in database
   */
  private async trackCost(params: {
    provider: string;
    model: string;
    requestType: string;
    promptTokens: number;
    completionTokens: number;
    estimatedCost: number;
    cacheHit: boolean;
    cacheKey?: string;
    relatedTable?: string;
    relatedId?: string;
  }) {
    if (process.env.AI_ENABLE_COST_TRACKING === 'true') {
      await supabase.from('ai_cost_logs').insert({
        company_id: this.companyId,
        provider: params.provider,
        model: params.model,
        request_type: params.requestType,
        prompt_tokens: params.promptTokens,
        completion_tokens: params.completionTokens,
        total_tokens: params.promptTokens + params.completionTokens,
        estimated_cost: params.estimatedCost,
        cache_hit: params.cacheHit,
        cache_key: params.cacheKey,
        related_table: params.relatedTable,
        related_id: params.relatedId,
      });
    }
  }

  /**
   * Summarize text using AI
   */
  async summarize(
    text: string,
    options: {
      useCache?: boolean;
      relatedTable?: string;
      relatedId?: string;
    } = {}
  ): Promise<string> {
    const { useCache = true, relatedTable, relatedId } = options;

    // Check cache
    const cacheKey = this.generateCacheKey('summary', text);
    if (useCache) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        await this.trackCost({
          provider: 'openai',
          model: 'gpt-4o-mini',
          requestType: 'summarization',
          promptTokens: 0,
          completionTokens: 0,
          estimatedCost: 0,
          cacheHit: true,
          cacheKey,
          relatedTable,
          relatedId,
        });
        return cached as string;
      }
    }

    // Generate summary with OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cheap model
      messages: [
        {
          role: 'system',
          content: 'You are a feedback analysis expert. Summarize the following feedback concisely, highlighting key points and sentiment.',
        },
        {
          role: 'user',
          content: `Summarize this feedback:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const summary = response.choices[0].message.content || '';

    // Cache result
    const ttl = parseInt(process.env.AI_CACHE_TTL || '86400', 10);
    await redis.set(cacheKey, summary, { ex: ttl });

    // Track cost
    const estimatedCost = this.calculateCost('gpt-4o-mini', response.usage?.total_tokens || 0);
    await this.trackCost({
      provider: 'openai',
      model: 'gpt-4o-mini',
      requestType: 'summarization',
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      estimatedCost,
      cacheHit: false,
      cacheKey,
      relatedTable,
      relatedId,
    });

    return summary;
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<{
    score: number; // -1.0 to 1.0
    label: 'positive' | 'negative' | 'neutral';
  }> {
    const cacheKey = this.generateCacheKey('sentiment', text);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Analyze the sentiment of feedback. Return a JSON object with "score" (number from -1.0 to 1.0) and "label" (positive/negative/neutral).',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    const ttl = parseInt(process.env.AI_CACHE_TTL || '86400', 10);
    await redis.set(cacheKey, JSON.stringify(result), { ex: ttl });

    return result;
  }

  /**
   * Generate tags for feedback
   */
  async generateTags(text: string): Promise<string[]> {
    const cacheKey = this.generateCacheKey('tags', text);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract 3-5 relevant tags from the feedback. Return as JSON array of strings. Examples: ["pricing", "onboarding", "bug_report", "feature_request"]',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"tags": []}');
    const tags = result.tags || [];

    const ttl = parseInt(process.env.AI_CACHE_TTL || '86400', 10);
    await redis.set(cacheKey, JSON.stringify(tags), { ex: ttl });

    return tags;
  }

  /**
   * Calculate priority score for feedback
   */
  async calculatePriorityScore(params: {
    text: string;
    sentiment: number;
    customerTier?: string;
  }): Promise<number> {
    // Simple algorithm (can be enhanced with AI later)
    let score = 50; // Base score

    // Sentiment impact
    if (params.sentiment < -0.5) score += 30; // Very negative
    else if (params.sentiment < 0) score += 15; // Somewhat negative

    // Customer tier impact
    if (params.customerTier === 'enterprise') score += 20;
    else if (params.customerTier === 'pro') score += 10;

    // Check for urgency keywords
    const urgencyKeywords = ['urgent', 'broken', 'down', 'critical', 'immediately', 'asap'];
    const hasUrgency = urgencyKeywords.some(keyword =>
      params.text.toLowerCase().includes(keyword)
    );
    if (hasUrgency) score += 25;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate cost based on model and tokens
   */
  private calculateCost(model: string, tokens: number): number {
    const pricing: Record<string, number> = {
      'gpt-4o-mini': 0.15 / 1_000_000, // $0.15 per 1M tokens
      'gpt-4o': 2.50 / 1_000_000,
      'claude-3-haiku': 0.25 / 1_000_000,
      'claude-3-5-sonnet': 3.00 / 1_000_000,
    };

    return (pricing[model] || 0) * tokens;
  }
}

// Export factory function
export function createAIOrchestrator(companyId: string) {
  return new AIOrchestrator(companyId);
}
```

---

## 📝 Step 6: Update Existing API Routes

### 6.1 Update Survey Submission API

Modify `src/app/api/survey/[token]/submit/route.ts`:

```typescript
import { createAIOrchestrator } from '@/lib/ai/orchestrator';

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  // ... existing code to validate and save survey response ...

  // NEW: After saving response, add AI analysis
  const { data: surveyLink } = await supabase
    .from('survey_links')
    .select('survey_id, customer_id, respondent_email')
    .eq('token', params.token)
    .single();

  if (surveyLink) {
    // Get company_id from survey
    const { data: survey } = await supabase
      .from('surveys')
      .select('company_id')
      .eq('id', surveyLink.survey_id)
      .single();

    if (survey) {
      // Create AI orchestrator
      const ai = createAIOrchestrator(survey.company_id);

      // Combine all open-ended responses
      const openEndedText = Object.values(responses)
        .filter((r) => typeof r === 'string')
        .join('\n\n');

      if (openEndedText) {
        // Analyze in parallel
        const [sentiment, tags, summary] = await Promise.all([
          ai.analyzeSentiment(openEndedText),
          ai.generateTags(openEndedText),
          ai.summarize(openEndedText, {
            relatedTable: 'survey_responses',
            relatedId: surveyResponse.id,
          }),
        ]);

        // Calculate priority
        const priorityScore = await ai.calculatePriorityScore({
          text: openEndedText,
          sentiment: sentiment.score,
        });

        // Update survey response with AI analysis
        await supabase
          .from('survey_responses')
          .update({
            sentiment_score: sentiment.score,
            ai_tags: tags,
            priority_score: priorityScore,
          })
          .eq('id', surveyResponse.id);
      }
    }
  }

  return Response.json({ success: true });
}
```

---

## 🎨 Step 7: Create Customer Pages

### 7.1 Create Customers List Page

Create `src/app/admin/dashboard/customers/page.tsx`:

```typescript
import { supabase } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function CustomersPage() {
  const { user } = await getCurrentUser();
  if (!user) return null;

  // Get admin user's company
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!adminUser) return null;

  // Get customers with feedback summary
  const { data: customers } = await supabase
    .from('customer_feedback_summary')
    .select('*')
    .eq('company_id', adminUser.company_id)
    .order('last_feedback_date', { ascending: false });

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customers</h1>
        <Button asChild>
          <Link href="/admin/dashboard/customers/new">Add Customer</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers?.map((customer) => (
              <Link
                key={customer.customer_id}
                href={`/admin/dashboard/customers/${customer.customer_id}`}
                className="block p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{customer.full_name || 'Unknown'}</h3>
                    <p className="text-sm text-gray-600">{customer.primary_email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {customer.total_feedback_count} feedback items
                    </div>
                    {customer.avg_sentiment && (
                      <div className="text-sm">
                        Sentiment: {(customer.avg_sentiment * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🚀 Step 8: Test the Migration

### 8.1 Start Development Server

```bash
npm run dev
```

### 8.2 Test Checklist

- [ ] Can log in to admin dashboard
- [ ] Can view existing surveys (if you had any test data)
- [ ] Can create new survey
- [ ] Can access new Customers page (`/admin/dashboard/customers`)
- [ ] Submit a test survey response
- [ ] Check if AI analysis runs (check `ai_cost_logs` table in Supabase)
- [ ] Verify feedback_items table populated

### 8.3 Check AI Integration

After submitting a survey:

1. Go to Supabase → Table Editor → `ai_cost_logs`
2. You should see entries showing AI API calls
3. Go to `survey_responses` → check `sentiment_score`, `ai_tags`, `priority_score` populated
4. Go to `feedback_items` → should have entry linking to survey response

---

## 📊 Step 9: Add Navigation Links

Update `src/app/admin/dashboard/layout.tsx`:

```typescript
// Add to navigation links
<Link href="/admin/dashboard/customers" className={linkClass('/admin/dashboard/customers')}>
  Customers
</Link>
<Link href="/admin/dashboard/insights" className={linkClass('/admin/dashboard/insights')}>
  AI Insights
</Link>
<Link href="/admin/dashboard/interviews" className={linkClass('/admin/dashboard/interviews')}>
  Interviews
</Link>
```

---

## 🎯 Next Steps: Build New Features

Now that the foundation is in place, you can build:

### Phase 1: Customer Features (Week 1-2)
- [ ] Customer detail page with feedback timeline
- [ ] Customer profile editing
- [ ] Identity resolution UI
- [ ] Customer health scores display

### Phase 2: Enhanced AI (Week 3-4)
- [ ] AI insights dashboard
- [ ] Cross-channel theme detection
- [ ] Automated alerts for high-priority feedback
- [ ] Cost tracking dashboard

### Phase 3: New Feedback Sources (Week 5-8)
- [ ] Interview management
- [ ] Review integration (start with one platform)
- [ ] Basic Reddit monitoring

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Verify Supabase connection
curl -X GET "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/companies" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

### AI API Not Working
1. Check API keys are set in `.env.local`
2. Restart dev server: `npm run dev`
3. Check Upstash Redis is configured
4. View errors in terminal

### RLS Blocking Queries
If you get "permission denied" errors:
1. Go to Supabase → Authentication → Policies
2. Verify policies exist for all tables
3. Check if user is in `admin_users` table

---

## 🎉 Success!

You've successfully transformed your survey tool into a customer-centric, AI-powered feedback platform!

**What you now have:**
- ✅ Customer-centric database schema
- ✅ AI integration (summarization, sentiment, tagging)
- ✅ Polymorphic feedback system
- ✅ Cost tracking
- ✅ Redis caching
- ✅ Foundation for interviews, reviews, Reddit

**Next: Start building customer pages and AI features!** 🚀

