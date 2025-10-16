// ============================================================================
// AI TAG NORMALIZER
// ============================================================================
// Prevents duplicate tags by normalizing to canonical forms
// Uses company context to learn terminology
// Example: "slow", "sluggish", "lag" → "performance"
// ============================================================================

import OpenAI from 'openai'
import { Redis } from '@upstash/redis'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const redis = Redis.fromEnv()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// INTERFACES
// ============================================================================

export interface TagDuplication {
  canonical: string
  variants: string[]
  confidence: number
  reasoning: string
  affectedCount?: number
}

export interface NormalizationResult {
  originalTags: string[]
  normalizedTags: string[]
  changes: Array<{ from: string; to: string }>
  cached: boolean
}

// ============================================================================
// AI TAG NORMALIZER CLASS
// ============================================================================

export class AITagNormalizer {
  private companyId: string

  constructor(companyId: string) {
    this.companyId = companyId
  }

  // ==========================================================================
  // CORE: TAG NORMALIZATION
  // ==========================================================================

  /**
   * Normalize tags using AI + company context
   * Uses company's historical tags to learn patterns
   */
  async normalizeTags(tags: string[]): Promise<string[]> {
    if (!tags || tags.length === 0) return []

    // Get company's existing tags for context
    const existingTags = await this.getCompanyTagHistory()

    // Generate cache key based on input tags + top existing tags
    const cacheKey = this.getCacheKey(tags, existingTags.slice(0, 50))

    // Check cache first
    const cached = await redis.get(cacheKey)
    if (cached) {
      console.log('✅ Tag normalization cache hit')
      await this.trackCacheHit()
      return JSON.parse(cached as string)
    }

    console.log('🤖 Normalizing tags with AI...')
    console.log(`   Input: ${tags.join(', ')}`)

    // Ask AI to normalize
    const prompt = this.buildNormalizationPrompt(tags, existingTags)

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast + cheap
        messages: [
          {
            role: 'system',
            content:
              'You are a tag normalization expert. Your job is to normalize feedback tags to their canonical form to prevent duplicates.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Very deterministic
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      const normalized: string[] = result.normalized || tags

      console.log(`   Output: ${normalized.join(', ')}`)

      // Remove duplicates (case-insensitive)
      const uniqueNormalized = this.deduplicateTags(normalized)

      // Cache result for 7 days
      await redis.set(cacheKey, JSON.stringify(uniqueNormalized), {
        ex: 604800,
      })

      // Track cost
      await this.trackCost('tag_normalization', response.usage)

      return uniqueNormalized
    } catch (error) {
      console.error('Error normalizing tags:', error)
      // Fallback: return original tags
      return this.deduplicateTags(tags)
    }
  }

  /**
   * Normalize tags with detailed results (for testing/debugging)
   */
  async normalizeTagsDetailed(
    tags: string[]
  ): Promise<NormalizationResult> {
    const originalTags = [...tags]
    const existingTags = await this.getCompanyTagHistory()
    const cacheKey = this.getCacheKey(tags, existingTags.slice(0, 50))
    const cached = await redis.get(cacheKey)

    const normalizedTags = cached
      ? JSON.parse(cached as string)
      : await this.normalizeTags(tags)

    // Identify changes
    const changes: Array<{ from: string; to: string }> = []
    for (let i = 0; i < originalTags.length; i++) {
      if (originalTags[i] !== normalizedTags[i]) {
        changes.push({
          from: originalTags[i],
          to: normalizedTags[i] || 'removed',
        })
      }
    }

    return {
      originalTags,
      normalizedTags,
      changes,
      cached: !!cached,
    }
  }

  // ==========================================================================
  // DUPLICATE DETECTION
  // ==========================================================================

  /**
   * Detect potential duplicate tags in existing data
   * Runs periodically to clean up historical data
   */
  async detectDuplicates(): Promise<TagDuplication[]> {
    console.log('🔍 Detecting duplicate tags...')

    const allTags = await this.getCompanyTagHistory()

    if (allTags.length < 5) {
      console.log('Not enough tags to detect duplicates')
      return []
    }

    const prompt = `Analyze these tags and identify groups that are synonyms/duplicates.

TAGS (${allTags.length} total, showing top 100):
${allTags.slice(0, 100).join(', ')}

Find groups of 2+ tags that mean the same thing or are very similar.

Rules:
1. Group similar concepts (e.g., "slow", "sluggish", "lag" are all performance)
2. Choose the best canonical form (most common or clearest)
3. Only suggest merges you're confident about (>0.80 confidence)
4. Consider context: "bug" and "feature" are NOT duplicates
5. Be conservative: when in doubt, don't merge

Return JSON:
{
  "duplicates": [
    {
      "canonical": "performance",
      "variants": ["slow", "sluggish", "lag"],
      "confidence": 0.95,
      "reasoning": "All refer to speed/performance issues"
    }
  ]
}

Only include high-confidence duplicates (>0.80). Return empty array if none found.`

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Use better model for this
        messages: [
          {
            role: 'system',
            content:
              'You are a tag analysis expert who detects duplicate/synonym tags.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      const duplicates: TagDuplication[] = result.duplicates || []

      console.log(`✅ Found ${duplicates.length} potential duplicate groups`)

      // Add affected count for each duplicate group
      for (const dup of duplicates) {
        dup.affectedCount = await this.countAffectedItems(dup.variants)
      }

      // Track cost
      await this.trackCost('duplicate_detection', response.usage)

      return duplicates
    } catch (error) {
      console.error('Error detecting duplicates:', error)
      return []
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get company's most common tags (for context)
   */
  private async getCompanyTagHistory(): Promise<string[]> {
    const cacheKey = `company:${this.companyId}:top_tags`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached as string)
    }

    try {
      // Call Supabase function
      const { data, error } = await supabase.rpc('get_top_tags', {
        p_company_id: this.companyId,
        p_limit: 100,
      })

      if (error) {
        console.error('Error fetching top tags:', error)
        return []
      }

      const tags = data?.map((row: any) => row.tag) || []

      // Cache for 1 day
      await redis.set(cacheKey, JSON.stringify(tags), { ex: 86400 })

      return tags
    } catch (error) {
      console.error('Error in getCompanyTagHistory:', error)
      return []
    }
  }

  /**
   * Build normalization prompt with context
   */
  private buildNormalizationPrompt(
    tags: string[],
    existingTags: string[]
  ): string {
    return `Normalize these tags to prevent duplicates.

CANDIDATE TAGS TO NORMALIZE:
${tags.map((t) => `- "${t}"`).join('\n')}

EXISTING CANONICAL TAGS IN SYSTEM (use these when possible):
${existingTags.slice(0, 50).join(', ')}

RULES:
1. If a candidate tag is a synonym of an existing tag, use the existing tag
2. If a candidate tag is unique, keep it as-is (lowercase)
3. Merge similar concepts:
   - "slow", "sluggish", "lag", "loading" → "performance"
   - "pricing", "price", "cost", "expensive" → "pricing"
   - "ui", "interface", "design" → "ux"
   - "bug", "error", "broken", "crash" → "bug"
   - "confused", "confusing", "unclear" → "ux"
4. Keep tags atomic (1-2 words max)
5. Use lowercase
6. Be consistent with existing company tags

Examples:
Input: ["slow", "dashboard", "pricing"]
Existing: ["performance", "dashboard", "pricing"]
Output: ["performance", "dashboard", "pricing"]

Return JSON: 
{
  "normalized": ["tag1", "tag2", "tag3"],
  "reasoning": "Brief explanation of changes"
}

IMPORTANT: Return the SAME NUMBER of tags as input (${tags.length} tags).`
  }

  /**
   * Deduplicate tags (case-insensitive)
   */
  private deduplicateTags(tags: string[]): string[] {
    const seen = new Set<string>()
    const result: string[] = []

    for (const tag of tags) {
      const lower = tag.toLowerCase().trim()
      if (lower && !seen.has(lower)) {
        seen.add(lower)
        result.push(lower)
      }
    }

    return result
  }

  /**
   * Count how many feedback items use these tags
   */
  private async countAffectedItems(tags: string[]): Promise<number> {
    try {
      const { count } = await supabase
        .from('feedback_items')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', this.companyId)
        .overlaps('ai_tags', tags)

      return count || 0
    } catch (error) {
      console.error('Error counting affected items:', error)
      return 0
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(tags: string[], context: string[]): string {
    const input = [...tags.sort(), ...context.slice(0, 20).sort()].join('|')
    const hash = crypto.createHash('sha256').update(input).digest('hex')
    return `tag_norm:${this.companyId}:${hash.substring(0, 16)}`
  }

  /**
   * Track AI cost in database
   */
  private async trackCost(requestType: string, usage: any) {
    if (!usage) return

    const estimatedCost =
      (usage.prompt_tokens * 0.15 + usage.completion_tokens * 0.6) / 1_000_000

    try {
      await supabase.from('ai_cost_logs').insert({
        company_id: this.companyId,
        provider: 'openai',
        model: requestType === 'duplicate_detection' ? 'gpt-4o' : 'gpt-4o-mini',
        request_type: requestType,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
        estimated_cost: estimatedCost,
        cache_hit: false,
      })
    } catch (error) {
      console.error('Error tracking cost:', error)
    }
  }

  /**
   * Track cache hit
   */
  private async trackCacheHit() {
    try {
      await supabase.from('ai_cost_logs').insert({
        company_id: this.companyId,
        provider: 'openai',
        model: 'gpt-4o-mini',
        request_type: 'tag_normalization',
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        estimated_cost: 0,
        cache_hit: true,
      })
    } catch (error) {
      // Silent fail for cache hits
    }
  }
}

// ============================================================================
// EXPORT FACTORY FUNCTION
// ============================================================================

export function createTagNormalizer(companyId: string): AITagNormalizer {
  return new AITagNormalizer(companyId)
}



