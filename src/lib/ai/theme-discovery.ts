// ============================================================================
// THEME DISCOVERY ENGINE
// ============================================================================
// AI-powered theme discovery that finds patterns across customer feedback
// ============================================================================

import OpenAI from 'openai';
import { Redis } from '@upstash/redis';
import { supabaseAdmin } from '@/lib/supabase/server';
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
  // Strategic scoring fields
  strategic_alignment_score?: number;
  strategic_reasoning?: string;
  strategic_conflicts?: string[];
  strategic_opportunities?: string[];
  final_priority_score?: number;
  recommendation?: string;
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

export interface StrategicAlignmentResult {
  alignment_score: number;        // 0-100
  reasoning: string;             // Why this score?
  conflicts: string[];           // Which parts of strategy conflict?
  opportunities: string[];       // Which parts of strategy align?
  recommendation: string;        // 'high_priority' | 'medium_priority' | 'low_priority' | 'explore_lightweight' | 'off_strategy'
}

export interface ProductStrategy {
  vision_statement?: string;
  target_customer_description?: string;
  problems_we_solve: string[];
  problems_we_dont_solve: string[];
  how_we_win?: string;
  strategic_keywords: Array<{
    keyword: string;
    weight: number;
    reasoning: string;
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
   * Calculate strategic alignment for a theme
   */
  async calculateStrategicAlignment(
    theme: DiscoveredTheme,
    strategy: ProductStrategy
  ): Promise<StrategicAlignmentResult> {
    const cacheKey = this.getCacheKey('strategic_alignment', `${theme.name}-${JSON.stringify(strategy)}`);
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('📋 Using cached strategic alignment');
      return JSON.parse(cached as string);
    }

    const prompt = `
You are a product strategist. Analyze how well this customer theme aligns with our product strategy.

CURRENT STRATEGY:
Vision: ${strategy.vision_statement || 'Not defined'}
Target Customer: ${strategy.target_customer_description || 'Not defined'}
Problems We Solve: ${strategy.problems_we_solve.join(', ') || 'Not defined'}
Problems We DON'T Solve: ${strategy.problems_we_dont_solve.join(', ') || 'Not defined'}
How We Win: ${strategy.how_we_win || 'Not defined'}

STRATEGIC KEYWORDS:
${strategy.strategic_keywords.map(k => `${k.keyword}: ${k.weight > 0 ? '+' : ''}${k.weight} (${k.reasoning})`).join('\n')}

CUSTOMER THEME:
Name: ${theme.name}
Description: ${theme.description}
Tags: ${theme.related_tag_ids.join(', ')}
Customer Evidence: ${theme.customer_count} customers, ${theme.mention_count} mentions
Sentiment: ${theme.avg_sentiment}

ANALYSIS REQUIRED:
1. Target Customer Alignment (0-1): Does this theme address our target customer?
2. Problems We Solve Match (0-1): Does this address problems we've committed to solving?
3. Problems We Don't Solve Conflict (-1 to 0): Does this conflict with our scope boundaries?
4. Differentiation Support (0-1): Does this support our competitive advantage?
5. Keyword Analysis: Check against strategic keywords and their weights

Provide:
- Overall alignment score (0-100)
- Specific conflicts (if any)
- Strategic opportunities (how this could support strategy)
- Recommendation (high_priority | medium_priority | low_priority | explore_lightweight | off_strategy)
- Reasoning (2-3 sentences explaining the score)
`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert product strategist who analyzes theme alignment with company strategy.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      const alignment: StrategicAlignmentResult = {
        alignment_score: result.alignment_score || 50,
        reasoning: result.reasoning || 'No reasoning provided',
        conflicts: result.conflicts || [],
        opportunities: result.opportunities || [],
        recommendation: result.recommendation || 'needs_review'
      };

      // Cache the result for 7 days
      await redis.set(cacheKey, JSON.stringify(alignment), { ex: 604800 });
      
      // Track cost if enabled
      if (this.enableCostTracking) {
        await this.trackCost('strategic_alignment', response.usage);
      }

      return alignment;
    } catch (error) {
      console.error('Error calculating strategic alignment:', error);
      // Return default alignment if AI fails
      return {
        alignment_score: 50,
        reasoning: 'Unable to analyze strategic alignment',
        conflicts: [],
        opportunities: [],
        recommendation: 'needs_review'
      };
    }
  }

  /**
   * Get current strategy for company
   */
  async getCurrentStrategy(): Promise<ProductStrategy | null> {
    try {
      const { data: strategyData } = await supabaseAdmin
        .from('product_strategy')
        .select('*')
        .eq('company_id', this.companyId)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (!strategyData) {
        console.log('⚠️ No active strategy found for company');
        return null;
      }

      const strategy = strategyData as any;
      return {
        vision_statement: strategy.vision_statement,
        target_customer_description: strategy.target_customer_description,
        problems_we_solve: strategy.problems_we_solve || [],
        problems_we_dont_solve: strategy.problems_we_dont_solve || [],
        how_we_win: strategy.how_we_win,
        strategic_keywords: strategy.strategic_keywords || []
      };
    } catch (error) {
      console.error('Error fetching strategy:', error);
      return null;
    }
  }

  /**
   * Discover themes across all feedback
   * Runs daily as a batch job
   */
  async discoverThemes(): Promise<DiscoveredTheme[]> {
    console.log(`🔍 Starting theme discovery for company: ${this.companyId}`);
    
    // Get current strategy first
    const strategy = await this.getCurrentStrategy();
    if (!strategy) {
      console.log('⚠️ No active strategy found. Running theme discovery without strategic scoring.');
    }
    
    // Get all feedback from last 90 days
    const feedback = await this.getRecentFeedback();
    console.log(`📊 Found ${feedback.length} feedback items to analyze`);
    
    if (feedback.length < 1) {
      console.log('⚠️ Not enough feedback for theme discovery (need at least 1 item)');
      return [];
    }

    // Group by similar tags
    const tagClusters = this.groupByTagSimilarity(feedback);
    console.log(`🎯 Created ${tagClusters.length} tag clusters`);
    
    // Debug: Show cluster details
    tagClusters.forEach((cluster, index) => {
      console.log(`📊 Cluster ${index + 1}: ${cluster.feedback.length} items with tags: ${cluster.commonTags.join(', ')}`);
    });
    
    // For each cluster, use AI to generate theme
    const themes: DiscoveredTheme[] = [];
    
    for (const cluster of tagClusters) {
      if (cluster.feedback.length < 1) { // Reduced minimum from 3 to 1 for testing
        console.log(`⏭️ Skipping cluster with ${cluster.feedback.length} items (need at least 1)`);
        continue;
      }
      
      console.log(`🤖 Generating theme for cluster with ${cluster.feedback.length} items`);
      try {
        const theme = await this.generateTheme(cluster);
        
        // Calculate strategic alignment if strategy exists
        if (strategy) {
          console.log(`🎯 Calculating strategic alignment for theme: ${theme.name}`);
          const alignment = await this.calculateStrategicAlignment(theme, strategy);
          
          // Update theme with strategic scoring
          theme.strategic_alignment_score = alignment.alignment_score;
          theme.strategic_reasoning = alignment.reasoning;
          theme.strategic_conflicts = alignment.conflicts;
          theme.strategic_opportunities = alignment.opportunities;
          theme.recommendation = alignment.recommendation;
          
          // Calculate final priority: Customer Signal × Strategic Alignment
          theme.final_priority_score = Math.round(
            theme.priority_score * (alignment.alignment_score / 100)
          );
        } else {
          // No strategy - use customer signal as final priority
          theme.final_priority_score = theme.priority_score;
          theme.strategic_alignment_score = 50; // Default neutral score
          theme.recommendation = 'needs_review';
        }
        
        themes.push(theme);
      } catch (error) {
        console.error(`❌ Error generating theme for cluster:`, error);
      }
    }
    
    // Sort by final priority if we have strategic scoring
    if (strategy) {
      themes.sort((a, b) => (b.final_priority_score || 0) - (a.final_priority_score || 0));
    }
    
    console.log(`✅ Generated ${themes.length} themes with strategic scoring`);
    return themes;
  }

  /**
   * Get recent feedback for analysis
   */
  private async getRecentFeedback() {
    console.log(`🔍 Looking for feedback data for company: ${this.companyId}`);
    
    try {
      // Get surveys for this company first
      console.log(`🔍 Looking for surveys with company_id: ${this.companyId}`);
      const { data: surveys, error: surveysError } = await supabaseAdmin
        .from('surveys')
        .select('id, title')
        .eq('company_id', this.companyId);

      if (surveysError) {
        console.error('Error fetching surveys:', surveysError);
        throw surveysError;
      }

      console.log(`📊 Raw surveys query result:`, surveys);
      const surveyIds = (surveys as any[])?.map((s: any) => s.id) || [];
      console.log(`📊 Found ${surveyIds.length} surveys for company`);
      
      if (surveyIds.length === 0) {
        console.log('⚠️ No surveys found for company');
        return [];
      }

      // Get survey responses for these surveys
      const { data: surveyData, error: surveyError } = await supabaseAdmin
        .from('survey_responses')
        .select(`
          id,
          responses,
          customer_id,
          sentiment_score,
          submitted_at,
          survey_id,
          customers(
            full_name,
            primary_email
          )
        `)
        .in('survey_id', surveyIds)
        .order('submitted_at', { ascending: false });

      if (surveyError) {
        console.error('Error fetching survey responses:', surveyError);
        throw surveyError;
      }

      console.log(`📊 Survey responses for company: ${surveyData?.length || 0}`);

      // Get tags for each survey response from the tag_usages table
      const actualSurveyResponseIds = (surveyData as any[])?.map((item: any) => item.id) || [];
      let tagUsages: any[] = [];
      
      if (actualSurveyResponseIds.length > 0) {
        const { data: tagUsageData, error: tagError } = await supabaseAdmin
          .from('tag_usages')
          .select(`
            source_id,
            sentiment_score,
            used_at,
            tag_id,
            tags!inner(
              id,
              name,
              normalized_name,
              category
            )
          `)
          .eq('source_type', 'survey_response')
          .in('source_id', actualSurveyResponseIds)
          .eq('company_id', this.companyId);

        if (tagError) {
          console.error('Error fetching tag usages:', tagError);
          throw tagError;
        } else {
          tagUsages = (tagUsageData as any[]) || [];
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
    const feedbackWithTags = ((surveyData as any[]) || [])
      .filter((item: any) => {
        const tags = tagsBySurveyId[item.id] || [];
        return tags.length > 0; // Only include responses that have tags
      })
      .map((item: any) => ({
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
      const { data: feedbackData, error: feedbackError } = await supabaseAdmin
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
        // Don't throw here, just continue without feedback items
      }

      // Get tags for feedback items
      const feedbackItemIds = (feedbackData as any[])?.map((item: any) => item.id) || [];
      let feedbackTagUsages: any[] = [];
      
      if (feedbackItemIds.length > 0) {
        const { data: feedbackTagData, error: feedbackTagError } = await supabaseAdmin
          .from('tag_usages')
          .select(`
            source_id,
            sentiment_score,
            used_at,
            tag_id,
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
          // Don't throw here, just continue without feedback item tags
        } else {
          feedbackTagUsages = (feedbackTagData as any[]) || [];
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
      const feedbackItemsWithTags = ((feedbackData as any[]) || [])
        .filter((item: any) => {
          const tags = tagsByFeedbackId[item.id] || [];
          return tags.length > 0; // Only include items that have tags
        })
        .map((item: any) => ({
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
      
      // Debug: Show sample feedback if we have any
      if (allFeedback.length > 0) {
        console.log('📊 Sample feedback items:');
        allFeedback.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.customer_name} - ${item.ai_tags.join(', ')} - "${item.content.substring(0, 100)}..."`);
        });
      }
      
      // If we have no feedback, let's try a broader search to debug
      if (allFeedback.length === 0) {
        console.log('🔍 No feedback found, running debug queries...');
        await this.debugDataAvailability();
      }
      
      return allFeedback;
    } catch (error) {
      console.error('Error in getRecentFeedback:', error);
      throw error;
    }
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
    
    console.log(`🔍 Grouping ${feedback.length} feedback items by tag similarity...`);
    
    for (const item of feedback) {
      if (!item.ai_tags || item.ai_tags.length === 0) {
        console.log(`⚠️ Skipping item ${item.id} - no tags`);
        continue;
      }
      
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
    
    console.log(`📊 Created ${clusters.size} raw clusters`);
    
    // Show all clusters before filtering
    Array.from(clusters.entries()).forEach(([key, cluster]) => {
      console.log(`  - Cluster "${key}": ${cluster.feedback.length} items`);
    });
    
    // Filter clusters with minimum size - reduced to 1 for testing
    const validClusters = Array.from(clusters.values())
      .filter(cluster => cluster.feedback.length >= 1); // At least 1 mention for testing
    
    console.log(`📈 Found ${validClusters.length} valid clusters (min 1 mention each)`);
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
      
      // Get tag IDs for the common tags - try both name and normalized_name
      const normalizedTags = cluster.commonTags.map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, '_'));
      const { data: tagData } = await supabaseAdmin
        .from('tags')
        .select('id, name, normalized_name')
        .eq('company_id', this.companyId)
        .or(`name.in.(${cluster.commonTags.join(',')}),normalized_name.in.(${normalizedTags.join(',')})`);
      
      const relatedTagIds = (tagData as any[])?.map((tag: any) => tag.id) || [];
      
      console.log(`🔗 Found ${relatedTagIds.length} related tag IDs for cluster tags: ${cluster.commonTags.join(', ')}`);

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
    const sampleFeedback = cluster.feedback.slice(0, 12); // Limit to 12 items for prompt size
    const uniqueCustomers = new Set(cluster.feedback.map(f => f.customer_id).filter(Boolean)).size;
    const avgSentiment = this.calculateAvgSentiment(cluster.feedback);
    const negativeCount = cluster.feedback.filter(f => (f.sentiment_score || 0) < -0.1).length;
    
    return `You are an expert product manager analyzing customer feedback patterns. Analyze this cluster of related feedback and generate a comprehensive theme.

CONTEXT:
- Total feedback items: ${cluster.feedback.length}
- Unique customers affected: ${uniqueCustomers}
- Average sentiment: ${avgSentiment.toFixed(2)} (scale: -1 to +1)
- Negative feedback items: ${negativeCount}
- Common tags: ${cluster.commonTags.join(', ')}

FEEDBACK SAMPLE (showing ${sampleFeedback.length} of ${cluster.feedback.length}):
${sampleFeedback.map((f, i) => `
${i + 1}. Customer: ${f.customer_name || 'Anonymous'}
    Source: ${f.source_type} | Sentiment: ${f.sentiment_score?.toFixed(2) || 'N/A'}
    Tags: ${f.ai_tags.join(', ')}
    Quote: "${f.content.substring(0, 300)}${f.content.length > 300 ? '...' : ''}"
`).join('\n')}

ANALYSIS REQUIREMENTS:
Analyze the patterns and generate a theme that captures the core customer concern or opportunity.

1. **name**: Clear, action-oriented theme name (e.g., "Dashboard Performance Issues", "Mobile App Usability Problems", "Integration Complexity Concerns")

2. **description**: 2-3 sentence summary explaining:
   - What the pattern represents
   - Why it matters to customers
   - Business impact potential

3. **priority_score**: 0-100 based on:
   - Customer volume (${uniqueCustomers} customers affected)
   - Sentiment severity (${avgSentiment.toFixed(2)} average)
   - Business impact keywords (churn, expensive, broken, can't use, frustrated)
   - Urgency indicators (negative sentiment, repeated mentions)

4. **evidence**: Extract 3-5 most compelling customer quotes that best represent the theme:
   - Use exact quotes from the feedback
   - Prioritize quotes that show clear pain points or opportunities
   - Include both positive and negative sentiment if relevant

5. **recommended_action**: Specific, actionable next steps for the product team:
   - Be concrete about what to investigate or build
   - Consider both quick wins and longer-term solutions
   - Focus on customer value

Return JSON with this exact structure:
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

    // Get tag IDs for the tags - try both name and normalized_name
    const { data: tagData } = await supabaseAdmin
      .from('tags')
      .select('id')
      .eq('company_id', this.companyId)
      .or(`name.in.(${tags.join(',')}),normalized_name.in.(${tags.map(t => t.toLowerCase().replace(/[^a-z0-9]/g, '_')).join(',')})`);

    const tagIds = (tagData as any[])?.map((tag: any) => tag.id) || [];
    if (tagIds.length === 0) return 0;

    // Count tag usages this week
    const { count: thisWeekCount } = await supabaseAdmin
      .from('tag_usages')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', this.companyId)
      .in('tag_id', tagIds)
      .gte('used_at', oneWeekAgo.toISOString());

    // Count tag usages last week
    const { count: lastWeekCount } = await supabaseAdmin
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
   * Debug method to check data availability
   */
  private async debugDataAvailability() {
    console.log('🔍 DEBUG: Checking data availability...');
    
    // Check if company exists
    const { data: companyData } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', this.companyId);
    console.log(`🏢 Company exists: ${companyData?.length || 0} found`);
    
    // Check surveys
    const { data: surveysData } = await supabaseAdmin
      .from('surveys')
      .select('id, title')
      .eq('company_id', this.companyId);
    console.log(`📋 Surveys: ${surveysData?.length || 0} found`);
    
    // Check survey responses
    const { data: responsesData } = await supabaseAdmin
      .from('survey_responses')
      .select('id, survey_id, surveys!inner(company_id)')
      .eq('surveys.company_id', this.companyId);
    console.log(`💬 Survey responses: ${responsesData?.length || 0} found`);
    
    // Check tags
    const { data: tagsData } = await supabaseAdmin
      .from('tags')
      .select('id, name, usage_count')
      .eq('company_id', this.companyId)
      .eq('is_active', true);
    console.log(`🏷️ Active tags: ${tagsData?.length || 0} found`);
    
    // Check tag usages
    const { data: tagUsagesData } = await supabaseAdmin
      .from('tag_usages')
      .select('id, source_type, source_id')
      .eq('company_id', this.companyId);
    console.log(`🔗 Tag usages: ${tagUsagesData?.length || 0} found`);
    
    // Show sample data
    if (tagsData && tagsData.length > 0) {
      console.log('📊 Sample tags:', (tagsData as any[]).slice(0, 5).map((t: any) => `${t.name} (${t.usage_count} uses)`));
    }
    
    if (tagUsagesData && tagUsagesData.length > 0) {
      console.log('📊 Sample tag usages:', tagUsagesData.slice(0, 5));
    }
  }

  /**
   * Save discovered themes to database
   */
  async saveThemes(themes: DiscoveredTheme[]): Promise<void> {
    console.log(`💾 Saving ${themes.length} themes to database`);
    
    for (const theme of themes) {
      try {
        const { error } = await (supabaseAdmin as any).rpc('find_or_create_theme', {
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
        const { data: savedTheme } = await supabaseAdmin
          .from('themes')
          .select('id')
          .eq('company_id', this.companyId)
          .eq('name', theme.name)
          .single();

        if (savedTheme) {
          // Update with calculated metrics
          await (supabaseAdmin as any)
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
              // Strategic scoring fields
              strategic_alignment_score: theme.strategic_alignment_score,
              strategic_reasoning: theme.strategic_reasoning,
              strategic_conflicts: theme.strategic_conflicts,
              strategic_opportunities: theme.strategic_opportunities,
              final_priority_score: theme.final_priority_score,
              recommendation: theme.recommendation,
              updated_at: new Date().toISOString(),
            })
            .eq('id', (savedTheme as any).id);

          // Update metrics using the helper function
          await (supabaseAdmin as any).rpc('update_theme_metrics', {
            p_theme_id: (savedTheme as any).id
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

    await (supabaseAdmin as any).from('ai_cost_logs').insert({
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
