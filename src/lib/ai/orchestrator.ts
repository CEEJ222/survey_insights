// ============================================================================
// AI ORCHESTRATOR - Core AI Integration
// ============================================================================
// Handles all AI operations: summarization, sentiment, tagging, embeddings
// Uses OpenAI with Redis caching for 90% cost reduction
// ============================================================================

import OpenAI from 'openai';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createEnhancedTagNormalizer } from './enhanced-tag-normalizer';

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redis = Redis.fromEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// TYPES
// ============================================================================

export interface SentimentResult {
  score: number; // -1.0 (negative) to 1.0 (positive)
  label: 'positive' | 'negative' | 'neutral';
}

export interface AIAnalysisResult {
  summary: string;
  sentiment: SentimentResult;
  tags: string[];
  tagIds?: string[]; // New: actual tag IDs from the tags table
  priorityScore: number;
}

// ============================================================================
// AI ORCHESTRATOR CLASS
// ============================================================================

export class AIOrchestrator {
  private companyId: string;
  private enableCostTracking: boolean;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.enableCostTracking = process.env.AI_ENABLE_COST_TRACKING === 'true';
  }

  // ==========================================================================
  // MAIN API: Analyze Complete Feedback
  // ==========================================================================

  /**
   * Complete analysis of feedback text
   * Returns summary, sentiment, tags, and priority score
   */
  async analyzeFeedback(text: string): Promise<AIAnalysisResult> {
    // Run all analyses in parallel for speed
    const [summary, sentiment, rawTags] = await Promise.all([
      this.summarize(text),
      this.analyzeSentiment(text),
      this.generateTags(text),
    ]);

    // NEW: Process tags with context and get tag IDs
    const tagResult = await this.processTagsWithContext(rawTags, {
      sourceType: 'feedback_item',
      sourceId: crypto.randomUUID(), // Generate temp ID for this analysis
      sentimentScore: sentiment.score,
      usedAt: new Date(),
    });

    // Calculate priority score based on sentiment and content
    const priorityScore = this.calculatePriorityScore({
      text,
      sentiment: sentiment.score,
    });

    return {
      summary,
      sentiment,
      tags: tagResult.normalizedTags,
      tagIds: tagResult.tagIds,
      priorityScore,
    };
  }

  /**
   * Process tags with context (for survey responses, reviews, etc.)
   * This creates actual tags in the tags table and usage records
   */
  async processTagsWithContext(
    rawTags: string[],
    context: {
      sourceType: 'survey_response' | 'feedback_item' | 'review' | 'interview';
      sourceId: string;
      customerId?: string;
      sentimentScore?: number;
      usedAt?: Date;
    }
  ): Promise<{ tagIds: string[]; normalizedTags: string[] }> {
    const normalizer = createEnhancedTagNormalizer(this.companyId);
    return await normalizer.processTags(rawTags, context);
  }

  /**
   * Process a survey response with automatic AI tagging
   * This is the main method called when a survey response is submitted
   */
  async processSurveyResponse(
    responseText: string,
    surveyResponseId: string,
    customerId?: string
  ): Promise<{
    summary: string;
    sentiment: SentimentResult;
    tagIds: string[];
    normalizedTags: string[];
    priorityScore: number;
  }> {
    console.log(`🤖 Processing survey response ${surveyResponseId} with AI`);

    // Run all analyses in parallel for speed
    const [summary, sentiment, rawTags] = await Promise.all([
      this.summarize(responseText),
      this.analyzeSentiment(responseText),
      this.generateTags(responseText),
    ]);

    // Process tags with context - this creates tags in the tags table
    const tagResult = await this.processTagsWithContext(rawTags, {
      sourceType: 'survey_response',
      sourceId: surveyResponseId,
      customerId,
      sentimentScore: sentiment.score,
      usedAt: new Date(),
    });

    // Calculate priority score
    const priorityScore = this.calculatePriorityScore({
      text: responseText,
      sentiment: sentiment.score,
    });

    console.log(`✅ Processed survey response: ${tagResult.normalizedTags.length} tags created`);

    return {
      summary,
      sentiment,
      tagIds: tagResult.tagIds,
      normalizedTags: tagResult.normalizedTags,
      priorityScore,
    };
  }

  // ==========================================================================
  // TEXT GENERATION
  // ==========================================================================

  /**
   * Summarize feedback text
   */
  async summarize(text: string): Promise<string> {
    const cacheKey = this.getCacheKey('summary', text);

    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === 'string') {
      await this.trackCacheHit('summarization');
      return cached;
    }

    // Generate with OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a feedback analysis expert. Summarize the following feedback concisely in 1-2 sentences, highlighting the key point and sentiment.',
        },
        {
          role: 'user',
          content: `Summarize this feedback:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const summary = response.choices[0].message.content || 'No summary available.';

    // Cache result for 24 hours
    const ttl = parseInt(process.env.AI_CACHE_TTL || '86400', 10);
    await redis.set(cacheKey, summary, { ex: ttl });

    // Track cost
    await this.trackCost({
      requestType: 'summarization',
      model: 'gpt-4o-mini',
      usage: response.usage,
    });

    return summary;
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const cacheKey = this.getCacheKey('sentiment', text);

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === 'string') {
      try {
        await this.trackCacheHit('sentiment');
        return JSON.parse(cached);
      } catch (error) {
        console.warn('Invalid cached sentiment data, ignoring cache:', error);
      }
    }

    // Generate with OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze the sentiment of the feedback. Return JSON with:
- "score": a number from -1.0 (very negative) to 1.0 (very positive)
- "label": "positive", "negative", or "neutral"

Examples:
- "This is terrible!" → {"score": -0.9, "label": "negative"}
- "It's okay, nothing special" → {"score": 0.1, "label": "neutral"}
- "Amazing product, love it!" → {"score": 0.9, "label": "positive"}`,
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
    const sentiment: SentimentResult = {
      score: result.score || 0,
      label: result.label || 'neutral',
    };

    // Cache result
    const ttl = parseInt(process.env.AI_CACHE_TTL || '86400', 10);
    await redis.set(cacheKey, JSON.stringify(sentiment), { ex: ttl });

    // Track cost
    await this.trackCost({
      requestType: 'sentiment',
      model: 'gpt-4o-mini',
      usage: response.usage,
    });

    return sentiment;
  }

  /**
   * Generate tags for feedback
   */
  async generateTags(text: string): Promise<string[]> {
    const cacheKey = this.getCacheKey('tags', text);

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === 'string') {
      try {
        await this.trackCacheHit('tagging');
        return JSON.parse(cached);
      } catch (error) {
        console.warn('Invalid cached tags data, ignoring cache:', error);
      }
    }

    // Generate with OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract 3-5 relevant tags from the feedback. Tags should be:
- Lowercase
- Single words or short phrases (max 2 words)
- ALWAYS use hyphens for multi-word tags (e.g., "user-friendly", "performance-issue")
- NEVER use underscores - use spaces or hyphens only
- Categories like: feature names, issue types, emotions, topics

Examples:
- "The dashboard is slow" → ["dashboard", "performance", "slow"]
- "Love the new pricing page!" → ["pricing", "positive", "user-friendly"]
- "Can't find the export button" → ["export", "ux", "confusion"]
- "User friendly interface" → ["user-friendly", "interface", "positive"]

Return JSON: {"tags": ["tag1", "tag2", "tag3"]}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"tags":[]}');
    const tags: string[] = result.tags || [];

    // Cache result
    const ttl = parseInt(process.env.AI_CACHE_TTL || '86400', 10);
    await redis.set(cacheKey, JSON.stringify(tags), { ex: ttl });

    // Track cost
    await this.trackCost({
      requestType: 'tagging',
      model: 'gpt-4o-mini',
      usage: response.usage,
    });

    return tags;
  }

  // ==========================================================================
  // EMBEDDINGS
  // ==========================================================================

  /**
   * Create embedding vector for text
   * Used for semantic search and duplicate detection
   */
  async createEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    // Track cost
    await this.trackCost({
      requestType: 'embedding',
      model: 'text-embedding-3-small',
      usage: response.usage,
    });

    return response.data[0].embedding;
  }

  // ==========================================================================
  // PRIORITY SCORING
  // ==========================================================================

  /**
   * Calculate priority score (0-100) for feedback
   * Higher score = more urgent
   */
  calculatePriorityScore(params: {
    text: string;
    sentiment: number;
    customerTier?: string;
  }): number {
    let score = 50; // Base score

    // Sentiment impact (negative feedback is higher priority)
    if (params.sentiment < -0.7) {
      score += 35; // Very negative
    } else if (params.sentiment < -0.3) {
      score += 20; // Negative
    } else if (params.sentiment < 0) {
      score += 10; // Slightly negative
    }

    // Customer tier impact
    if (params.customerTier === 'enterprise') {
      score += 20;
    } else if (params.customerTier === 'pro') {
      score += 10;
    }

    // Urgency keywords
    const urgencyKeywords = [
      'urgent',
      'critical',
      'broken',
      'down',
      'not working',
      'immediately',
      'asap',
      'blocker',
      'emergency',
    ];
    const hasUrgency = urgencyKeywords.some((keyword) =>
      params.text.toLowerCase().includes(keyword)
    );
    if (hasUrgency) {
      score += 25;
    }

    // Keep within bounds
    return Math.min(100, Math.max(0, score));
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Generate cache key for AI results
   */
  private getCacheKey(type: string, text: string): string {
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    return `ai:${this.companyId}:${type}:${hash.substring(0, 16)}`;
  }

  /**
   * Track AI cost in database
   */
  private async trackCost(params: {
    requestType: string;
    model: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  }) {
    if (!this.enableCostTracking || !params.usage) return;

    // Calculate cost based on model
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
      'text-embedding-3-small': { input: 0.02 / 1_000_000, output: 0 },
    };

    const modelCost = costs[params.model] || costs['gpt-4o-mini'];
    const inputCost = (params.usage.prompt_tokens || 0) * modelCost.input;
    const outputCost = (params.usage.completion_tokens || 0) * modelCost.output;
    const totalCost = inputCost + outputCost;

    try {
      await supabase.from('ai_cost_logs').insert({
        company_id: this.companyId,
        provider: 'openai',
        model: params.model,
        request_type: params.requestType,
        prompt_tokens: params.usage.prompt_tokens || 0,
        completion_tokens: params.usage.completion_tokens || 0,
        total_tokens: params.usage.total_tokens || 0,
        estimated_cost: totalCost,
        cache_hit: false,
      });
    } catch (error) {
      console.error('Error tracking AI cost:', error);
      // Don't fail the request if cost tracking fails
    }
  }

  /**
   * Track cache hit (for monitoring cache effectiveness)
   */
  private async trackCacheHit(requestType: string) {
    if (!this.enableCostTracking) return;

    try {
      await supabase.from('ai_cost_logs').insert({
        company_id: this.companyId,
        provider: 'openai',
        model: 'cache',
        request_type: requestType,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        estimated_cost: 0,
        cache_hit: true,
      });
    } catch (error) {
      console.error('Error tracking cache hit:', error);
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an AI orchestrator instance for a company
 */
export function createAIOrchestrator(companyId: string): AIOrchestrator {
  return new AIOrchestrator(companyId);
}

