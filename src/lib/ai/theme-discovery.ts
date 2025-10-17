// ============================================================================
// THEME DISCOVERY ENGINE
// ============================================================================
// AI-powered theme discovery that finds patterns across customer feedback
// ============================================================================

import OpenAI from 'openai';
import { Redis } from '@upstash/redis';
import { supabase } from '@/lib/supabase/client';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redis = Redis.fromEnv();

export interface DiscoveredTheme {
  name: string;
  description: string;
  related_tag_ids: string[];
  supporting_survey_response_ids: string[];
  supporting_feedback_item_ids: string[];
  customer_count: number;
  mention_count: number;
  avg_sentiment: number;
  source_breakdown_data: Record<string, number>;
  trend: string;
  week_over_week_change: number;
  priority_score: number;
  evidence: string[];
  recommended_action: string;
}

export interface FeedbackCluster {
  commonTags: string[];
  feedback: Array<{
    id: string;
    content: string;
    customer_name?: string;
    source_type: string;
    ai_tags: string[];
    sentiment_score: number;
    customer_id?: string;
    created_at: string;
  }>;
}

export class ThemeDiscoveryEngine {
  private companyId: string;
  private enableCostTracking: boolean;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.enableCostTracking = process.env.AI_ENABLE_COST_TRACKING === 'true';
  }

  /**
   * Discover themes across all feedback
   * Runs daily as a batch job
   */
  async discoverThemes(): Promise<DiscoveredTheme[]> {
    console.log(`🔍 Starting theme discovery for company: ${this.companyId}`);
    
    // Get all feedback from last 90 days
    const feedback = await this.getRecentFeedback();
    console.log(`📊 Found ${feedback.length} feedback items to analyze`);
    
    if (feedback.length < 5) {
      console.log('⚠️ Not enough feedback for theme discovery (need at least 5 items)');
      return [];
    }

    // Group by similar tags
    const tagClusters = this.groupByTagSimilarity(feedback);
    console.log(`🎯 Created ${tagClusters.length} tag clusters`);
    
    // For each cluster, use AI to generate theme
    const themes: DiscoveredTheme[] = [];
    
    for (const cluster of tagClusters) {
      if (cluster.feedback.length < 5) continue; // Need min 5 mentions
      
      console.log(`🤖 Generating theme for cluster with ${cluster.feedback.length} items`);
      const theme = await this.generateTheme(cluster);
      themes.push(theme);
    }
    
    console.log(`✅ Generated ${themes.length} themes`);
    return themes;
  }

  /**
   * Get recent feedback for analysis
   */
  private async getRecentFeedback() {
    console.log(`🔍 Looking for feedback data for company: ${this.companyId}`);
    
    // Get all survey responses for this company (with their tags from tag_usages)
    const { data: surveyData, error: surveyError } = await supabase
      .from('survey_responses')
      .select(`
        id,
        responses,
        customer_id,
        sentiment_score,
        submitted_at,
        survey_id,
        surveys!inner(
          id,
          company_id
        ),
        customers(
          full_name,
          primary_email
        )
      `)
      .eq('surveys.company_id', this.companyId)
      .gte('submitted_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
      .order('submitted_at', { ascending: false });

    if (surveyError) {
      console.error('Error fetching survey responses:', surveyError);
    }

    console.log(`📊 Survey responses for company: ${surveyData?.length || 0}`);

    // Get tags for each survey response from the tag_usages table
    const surveyIds = surveyData?.map(item => item.id) || [];
    let tagUsages: any[] = [];
    
    if (surveyIds.length > 0) {
      const { data: tagUsageData, error: tagError } = await supabase
        .from('tag_usages')
        .select(`
          source_id,
          sentiment_score,
          used_at,
          tags!inner(
            id,
            name,
            normalized_name,
            category
          )
        `)
        .eq('source_type', 'survey_response')
        .in('source_id', surveyIds)
        .eq('company_id', this.companyId);

      if (tagError) {
        console.error('Error fetching tag usages:', tagError);
      } else {
        tagUsages = tagUsageData || [];
      }
    }

    console.log(`📊 Tag usages found: ${tagUsages.length}`);

    // Group tags by survey response ID
    const tagsBySurveyId = tagUsages.reduce((acc, usage) => {
      if (!acc[usage.source_id]) {
        acc[usage.source_id] = [];
      }
      acc[usage.source_id].push(usage.tags.name);
      return acc;
    }, {} as Record<string, string[]>);

    // Combine survey data with tags
    const feedbackWithTags = (surveyData || [])
      .filter(item => {
        const tags = tagsBySurveyId[item.id] || [];
        return tags.length > 0; // Only include responses that have tags
      })
      .map(item => ({
        id: item.id,
        content: this.extractTextFromResponses(item.responses) || '',
        customer_name: item.customers?.full_name || 'Anonymous',
        customer_id: item.customer_id,
        source_type: 'survey',
        ai_tags: tagsBySurveyId[item.id] || [],
        sentiment_score: item.sentiment_score || 0,
        created_at: item.submitted_at,
      }));

    console.log(`📊 Survey responses with tags: ${feedbackWithTags.length}`);

    // Also get from feedback_items if they exist
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback_items')
      .select(`
        id,
        content,
        customer_id,
        source_type,
        sentiment_score,
        created_at,
        customers(
          full_name,
          primary_email
        )
      `)
      .eq('company_id', this.companyId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
      .order('created_at', { ascending: false });

    if (feedbackError) {
      console.error('Error fetching feedback items:', feedbackError);
    }

    // Get tags for feedback items
    const feedbackItemIds = feedbackData?.map(item => item.id) || [];
    let feedbackTagUsages: any[] = [];
    
    if (feedbackItemIds.length > 0) {
      const { data: feedbackTagData, error: feedbackTagError } = await supabase
        .from('tag_usages')
        .select(`
          source_id,
          sentiment_score,
          used_at,
          tags!inner(
            id,
            name,
            normalized_name,
            category
          )
        `)
        .eq('source_type', 'feedback_item')
        .in('source_id', feedbackItemIds)
        .eq('company_id', this.companyId);

      if (feedbackTagError) {
        console.error('Error fetching feedback tag usages:', feedbackTagError);
      } else {
        feedbackTagUsages = feedbackTagData || [];
      }
    }

    // Group tags by feedback item ID
    const tagsByFeedbackId = feedbackTagUsages.reduce((acc, usage) => {
      if (!acc[usage.source_id]) {
        acc[usage.source_id] = [];
      }
      acc[usage.source_id].push(usage.tags.name);
      return acc;
    }, {} as Record<string, string[]>);

    // Combine feedback data with tags
    const feedbackItemsWithTags = (feedbackData || [])
      .filter(item => {
        const tags = tagsByFeedbackId[item.id] || [];
        return tags.length > 0; // Only include items that have tags
      })
      .map(item => ({
        id: item.id,
        content: item.content || '',
        customer_name: item.customers?.full_name || 'Anonymous',
        customer_id: item.customer_id,
        source_type: item.source_type,
        ai_tags: tagsByFeedbackId[item.id] || [],
        sentiment_score: item.sentiment_score || 0,
        created_at: item.created_at,
      }));

    console.log(`📊 Feedback items with tags: ${feedbackItemsWithTags.length}`);

    // Combine both data sources
    const allFeedback = [...feedbackWithTags, ...feedbackItemsWithTags];

    console.log(`📊 Final result: ${allFeedback.length} total feedback items with tags`);
    return allFeedback;
  }

  /**
   * Extract text content from survey responses JSON
   */
  private extractTextFromResponses(responses: any): string {
    if (!responses || typeof responses !== 'object') return '';
    
    const textParts: string[] = [];
    
    for (const [key, value] of Object.entries(responses)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        textParts.push(value.trim());
      }
    }
    
    return textParts.join(' ');
  }

  /**
   * Group feedback by tag similarity
   */
  private groupByTagSimilarity(feedback: any[]): FeedbackCluster[] {
    const clusters: Map<string, FeedbackCluster> = new Map();
    
    for (const item of feedback) {
      if (!item.ai_tags || item.ai_tags.length === 0) continue;
      
      // Create cluster key from sorted tags
      const sortedTags = [...item.ai_tags].sort();
      const clusterKey = sortedTags.join('|');
      
      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, {
          commonTags: sortedTags,
          feedback: []
        });
      }
      
      clusters.get(clusterKey)!.feedback.push(item);
    }
    
    // Filter clusters with minimum size
    const validClusters = Array.from(clusters.values())
      .filter(cluster => cluster.feedback.length >= 3); // At least 3 mentions
    
    console.log(`📈 Found ${validClusters.length} valid clusters (min 3 mentions each)`);
    return validClusters;
  }

  /**
   * Generate a theme from a cluster of feedback
   */
  private async generateTheme(cluster: FeedbackCluster): Promise<DiscoveredTheme> {
    const cacheKey = this.getCacheKey('theme_generation', cluster.commonTags.join(','));
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('📋 Using cached theme generation');
      return JSON.parse(cached as string);
    }

    const prompt = this.buildThemeGenerationPrompt(cluster);
    
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert product manager who discovers patterns in customer feedback and generates actionable themes.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // More deterministic for theme generation
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Get tag IDs for the common tags
      const { data: tagData } = await supabase
        .from('tags')
        .select('id, normalized_name')
        .eq('company_id', this.companyId)
        .in('normalized_name', cluster.commonTags.map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, '_')));
      
      const relatedTagIds = tagData?.map(tag => tag.id) || [];

      // Separate survey responses from feedback items
      const surveyResponseIds: string[] = [];
      const feedbackItemIds: string[] = [];
      
      for (const item of cluster.feedback) {
        if (item.source_type === 'survey') {
          surveyResponseIds.push(item.id);
        } else {
          feedbackItemIds.push(item.id);
        }
      }

      const theme: DiscoveredTheme = {
        name: result.name || 'Unnamed Theme',
        description: result.description || 'No description provided',
        related_tag_ids: relatedTagIds,
        supporting_survey_response_ids: surveyResponseIds,
        supporting_feedback_item_ids: feedbackItemIds,
        customer_count: new Set(cluster.feedback.map(f => f.customer_id).filter(Boolean)).size,
        mention_count: cluster.feedback.length,
        avg_sentiment: this.calculateAvgSentiment(cluster.feedback),
        source_breakdown_data: this.calculateSourceBreakdown(cluster.feedback),
        trend: await this.calculateTrend(cluster.commonTags),
        week_over_week_change: await this.calculateWeekOverWeekChange(cluster.commonTags),
        priority_score: result.priority_score || 50,
        evidence: result.evidence || [],
        recommended_action: result.recommended_action || 'Review and prioritize based on business impact',
      };

      // Cache the result for 7 days
      await redis.set(cacheKey, JSON.stringify(theme), { ex: 604800 });
      
      // Track cost if enabled
      if (this.enableCostTracking) {
        await this.trackCost('theme_generation', response.usage);
      }

      return theme;
    } catch (error) {
      console.error('Error generating theme:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for theme generation
   */
  private buildThemeGenerationPrompt(cluster: FeedbackCluster): string {
    const sampleFeedback = cluster.feedback.slice(0, 15); // Limit to 15 items for prompt size
    
    return `Analyze this cluster of customer feedback and generate a theme.

FEEDBACK ITEMS (${cluster.feedback.length} total, showing ${sampleFeedback.length}):
${sampleFeedback.map(f => `
- Customer: ${f.customer_name || 'Anonymous'}
  Source: ${f.source_type}
  Tags: ${f.ai_tags.join(', ')}
  Sentiment: ${f.sentiment_score?.toFixed(2) || 'N/A'}
  Text: "${f.content.substring(0, 200)}${f.content.length > 200 ? '...' : ''}"
`).join('\n')}

Common tags in cluster: ${cluster.commonTags.join(', ')}

Generate a theme with:
1. name: Clear, descriptive name (e.g., "Dashboard Performance Issues", "Mobile App Usability Problems")
2. description: 2-3 sentence summary of the pattern and its impact
3. priority_score: 0-100 based on:
   - Number of customers affected (more = higher score)
   - Sentiment negativity (more negative = higher score)
   - Business impact keywords (churn, expensive, broken, can't use)
   - Trend direction (if mentions are increasing)
4. evidence: List the 3-5 most compelling customer quotes (exact quotes)
5. recommended_action: What should the product team do? Be specific.

Return JSON with this structure:
{
  "name": "Theme Name",
  "description": "Theme description...",
  "priority_score": 75,
  "evidence": [
    "\"Exact customer quote 1\"",
    "\"Exact customer quote 2\"",
    "\"Exact customer quote 3\""
  ],
  "recommended_action": "Specific action for product team..."
}`;
  }

  /**
   * Calculate average sentiment for feedback
   */
  private calculateAvgSentiment(feedback: any[]): number {
    const sentiments = feedback
      .map(f => f.sentiment_score)
      .filter(s => s !== null && s !== undefined);
    
    if (sentiments.length === 0) return 0;
    return sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  }

  /**
   * Calculate source breakdown
   */
  private calculateSourceBreakdown(feedback: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const item of feedback) {
      breakdown[item.source_type] = (breakdown[item.source_type] || 0) + 1;
    }
    
    return breakdown;
  }

  /**
   * Calculate trend for a set of tags
   */
  private async calculateTrend(tags: string[]): Promise<string> {
    const weekOverWeekChange = await this.calculateWeekOverWeekChange(tags);
    
    if (Math.abs(weekOverWeekChange) < 10) return 'stable';
    if (weekOverWeekChange > 50) return 'spiking';
    if (weekOverWeekChange > 0) return 'increasing';
    return 'decreasing';
  }

  /**
   * Calculate week-over-week change percentage
   */
  private async calculateWeekOverWeekChange(tags: string[]): Promise<number> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get tag IDs for the tags
    const { data: tagData } = await supabase
      .from('tags')
      .select('id')
      .eq('company_id', this.companyId)
      .in('name', tags);

    const tagIds = tagData?.map(tag => tag.id) || [];
    if (tagIds.length === 0) return 0;

    // Count tag usages this week
    const { count: thisWeekCount } = await supabase
      .from('tag_usages')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', this.companyId)
      .in('tag_id', tagIds)
      .gte('used_at', oneWeekAgo.toISOString());

    // Count tag usages last week
    const { count: lastWeekCount } = await supabase
      .from('tag_usages')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', this.companyId)
      .in('tag_id', tagIds)
      .gte('used_at', twoWeeksAgo.toISOString())
      .lt('used_at', oneWeekAgo.toISOString());

    const thisWeek = thisWeekCount || 0;
    const lastWeek = lastWeekCount || 0;

    if (!lastWeek || lastWeek === 0) return 0;
    
    return (thisWeek - lastWeek) / lastWeek * 100;
  }

  /**
   * Save discovered themes to database
   */
  async saveThemes(themes: DiscoveredTheme[]): Promise<void> {
    console.log(`💾 Saving ${themes.length} themes to database`);
    
    for (const theme of themes) {
      try {
        const { error } = await supabase.rpc('find_or_create_theme', {
          p_company_id: this.companyId,
          p_name: theme.name,
          p_description: theme.description,
          p_related_tag_ids: theme.related_tag_ids,
          p_discovered_by: 'ai'
        });

        if (error) {
          console.error('Error saving theme:', error);
          continue;
        }

        // Update theme metrics
        const { data: savedTheme } = await supabase
          .from('themes')
          .select('id')
          .eq('company_id', this.companyId)
          .eq('name', theme.name)
          .single();

        if (savedTheme) {
          // Update with calculated metrics
          await supabase
            .from('themes')
            .update({
              supporting_survey_response_ids: theme.supporting_survey_response_ids,
              supporting_feedback_item_ids: theme.supporting_feedback_item_ids,
              customer_count: theme.customer_count,
              mention_count: theme.mention_count,
              avg_sentiment: theme.avg_sentiment,
              source_breakdown_data: theme.source_breakdown_data,
              trend: theme.trend,
              week_over_week_change: theme.week_over_week_change,
              priority_score: theme.priority_score,
              updated_at: new Date().toISOString(),
            })
            .eq('id', savedTheme.id);

          // Update metrics using the helper function
          await supabase.rpc('update_theme_metrics', {
            p_theme_id: savedTheme.id
          });
        }
      } catch (error) {
        console.error('Error processing theme:', error);
      }
    }
    
    console.log('✅ Themes saved successfully');
  }

  /**
   * Get cache key for theme generation
   */
  private getCacheKey(prefix: string, content: string): string {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `${prefix}:${this.companyId}:${hash.substring(0, 16)}`;
  }

  /**
   * Track AI costs
   */
  private async trackCost(requestType: string, usage: any) {
    if (!this.enableCostTracking || !usage) return;

    const estimatedCost = this.calculateCost('gpt-4o', usage.total_tokens || 0);

    await supabase.from('ai_cost_logs').insert({
      company_id: this.companyId,
      provider: 'openai',
      model: 'gpt-4o',
      request_type: requestType,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      estimated_cost: estimatedCost,
      cache_hit: false,
      related_table: 'themes',
      related_id: null,
    });
  }

  /**
   * Calculate estimated cost
   */
  private calculateCost(model: string, tokens: number): number {
    const pricing: Record<string, number> = {
      'gpt-4o': 2.50 / 1_000_000, // $2.50 per 1M tokens
      'gpt-4o-mini': 0.15 / 1_000_000,
    };
    return (pricing[model] || 0) * tokens;
  }
}

export function createThemeDiscoveryEngine(companyId: string) {
  return new ThemeDiscoveryEngine(companyId);
}
