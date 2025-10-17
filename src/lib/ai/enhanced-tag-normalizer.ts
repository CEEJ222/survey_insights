// ============================================================================
// ENHANCED TAG NORMALIZER - Integrated with new tags table system
// ============================================================================
// This version creates actual tags in the tags table and tag_usages records
// ============================================================================

import OpenAI from 'openai';
import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redis = Redis.fromEnv();

// Create Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TagUsageContext {
  sourceType: 'survey_response' | 'feedback_item' | 'review' | 'interview';
  sourceId: string;
  customerId?: string;
  sentimentScore?: number;
  usedAt?: Date;
}

export class EnhancedTagNormalizer {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  private getCacheKey(prefix: string, content: string): string {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `${prefix}:${this.companyId}:${hash.substring(0, 16)}`;
  }

  /**
   * Process raw tags and create/update tags in the new system
   */
  async processTags(
    rawTags: string[], 
    context: TagUsageContext
  ): Promise<{ tagIds: string[]; normalizedTags: string[] }> {
    if (!rawTags || rawTags.length === 0) {
      return { tagIds: [], normalizedTags: [] };
    }

    console.log(`🏷️ Processing raw tags: ${rawTags.join(', ')}`);

    // 1. AI-powered normalization: detect duplicates and normalize
    const normalizedTags = await this.normalizeTags(rawTags);
    console.log(`✨ Normalized tags: ${normalizedTags.join(', ')}`);

    // 2. Create or find tags in the database
    const tagIds: string[] = [];
    
    for (const tagName of normalizedTags) {
      console.log(`🔍 Finding/creating tag: ${tagName}`);
      try {
        const tagId = await this.findOrCreateTag(tagName);
        console.log(`✅ Tag created/found: ${tagName} -> ${tagId}`);
        tagIds.push(tagId);
      } catch (error) {
        console.error(`❌ Error with tag ${tagName}:`, error);
        throw error;
      }
    }

    // 3. Create tag usage records
    console.log(`📊 Creating tag usages for ${tagIds.length} tags`);
    try {
      await this.createTagUsages(tagIds, context);
      console.log(`✅ Tag usages created successfully`);
    } catch (error: any) {
      if (error.code === '23505' && error.message.includes('tag_usages_tag_id_source_type_source_id_key')) {
        console.warn(`⚠️ Some tag usages already exist, skipping duplicate creation`);
      } else {
        throw error;
      }
    }

    return { tagIds, normalizedTags };
  }


  /**
   * Normalize tags using AI (same logic as before)
   */
  private async normalizeTags(rawTags: string[]): Promise<string[]> {
    const inputString = rawTags.sort().join(', ');
    const cacheKey = this.getCacheKey('normalized_tags', inputString);

    console.log(`🔍 Checking cache for normalization: ${inputString}`);

    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === 'string') {
      try {
        console.log(`♻️ Using cached normalization result: ${cached}`);
        return JSON.parse(cached);
      } catch (error) {
        console.warn('Invalid cached normalization data, ignoring cache:', error);
      }
    }

    console.log(`🤖 Calling AI for tag normalization...`);

    const existingTags = await this.getCompanyTagHistory();
    const companyTagsContext = existingTags.length > 0 ? `\n\nCompany's existing tags: ${existingTags.join(', ')}` : '';

    const prompt = `You are an expert in categorizing and normalizing product feedback tags.
Given a list of raw tags, your task is to:
1. Identify and merge synonymous tags into a single, canonical tag.
2. Ensure all tags are lowercase and use spaces for multi-word tags (e.g., "feature request").
3. Prioritize using existing company tags if a synonym exists.${companyTagsContext}
4. Merge similar concepts intelligently - use your AI knowledge to identify semantic duplicates.
5. Keep the list concise, aiming for 3-5 normalized tags.

Raw tags: ${rawTags.join(', ')}

Return a JSON object with a "normalized" array of tags. Example: {"normalized": ["performance", "dashboard", "pricing-issue"]}`;

    console.log(`📝 AI Prompt: ${prompt}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: `Normalize these tags: ${rawTags.join(', ')}` },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const aiResponse = response.choices[0].message.content || '{"normalized":[]}';
    console.log(`🤖 AI Response: ${aiResponse}`);

    const result = JSON.parse(aiResponse);
    const normalized = result.normalized || [];
    console.log(`✨ Parsed normalized tags: ${normalized.join(', ')}`);

    // Cache result
    const ttl = parseInt(process.env.AI_CACHE_TTL || '86400', 10);
    await redis.set(cacheKey, JSON.stringify(normalized), { ex: ttl });

    return normalized;
  }

  /**
   * Find existing tag or create new one
   */
  private async findOrCreateTag(tagName: string): Promise<string> {
    const normalizedName = tagName.toLowerCase().trim();
    console.log(`🔍 Looking for tag with normalized name: "${normalizedName}"`);

    // Try to find existing tag
    const { data: existingTag, error: findError } = await supabase
      .from('tags')
      .select('id')
      .eq('company_id', this.companyId)
      .eq('normalized_name', normalizedName)
      .eq('is_active', true)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error finding existing tag:', findError);
      throw findError;
    }

    if (existingTag) {
      console.log(`♻️ Found existing tag: ${tagName} -> ${existingTag.id}`);
      return existingTag.id;
    }

    // Create new tag
    const category = this.categorizeTag(tagName);
    const color = this.getTagColor(category);
    console.log(`🆕 Creating new tag: ${tagName} (${category}, ${color})`);

    const { data: newTag, error } = await supabase
      .from('tags')
      .insert({
        company_id: this.companyId,
        name: tagName,
        normalized_name: normalizedName,
        description: `AI-generated tag from feedback analysis`,
        category,
        color,
        is_system_tag: true,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating tag:', error);
      throw error;
    }

    console.log(`✅ Created new tag: ${tagName} -> ${newTag.id}`);
    return newTag.id;
  }

  /**
   * Create tag usage records
   */
  private async createTagUsages(tagIds: string[], context: TagUsageContext): Promise<void> {
    const usageRecords = tagIds.map(tagId => ({
      tag_id: tagId,
      company_id: this.companyId,
      source_type: context.sourceType,
      source_id: context.sourceId,
      customer_id: context.customerId,
      sentiment_score: context.sentimentScore,
      used_at: context.usedAt?.toISOString() || new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('tag_usages')
      .insert(usageRecords);

    if (error) {
      console.error('Error creating tag usages:', error);
      throw error;
    }
  }

  /**
   * Get company's existing tag names for AI context
   */
  private async getCompanyTagHistory(): Promise<string[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('normalized_name')
      .eq('company_id', this.companyId)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching company tag history:', error);
      return [];
    }

    return data?.map(row => row.normalized_name) || [];
  }

  /**
   * Categorize a tag based on its name
   */
  private categorizeTag(tagName: string): string {
    const name = tagName.toLowerCase();
    
    if (name.includes('excellent') || name.includes('great') || name.includes('love') || name.includes('awesome')) {
      return 'sentiment';
    }
    if (name.includes('feature') || name.includes('notification') || name.includes('automated') || name.includes('tracking')) {
      return 'feature';
    }
    if (name.includes('interface') || name.includes('ui') || name.includes('ux') || name.includes('design')) {
      return 'topic';
    }
    if (name.includes('performance') || name.includes('slow') || name.includes('fast') || name.includes('bug')) {
      return 'topic';
    }
    
    return 'topic'; // Default
  }

  /**
   * Get color for tag based on category
   */
  private getTagColor(category: string): string {
    const colors = {
      feature: '#3B82F6',
      sentiment: '#10B981',
      topic: '#F59E0B',
      industry: '#8B5CF6',
      custom: '#6B7280',
    };
    return colors[category as keyof typeof colors] || '#6B7280';
  }
}

export function createEnhancedTagNormalizer(companyId: string) {
  return new EnhancedTagNormalizer(companyId);
}
