// ============================================================================
// STRATEGIC INTELLIGENCE ENGINE
// ============================================================================
// Advanced AI features for strategic analysis, opportunity identification,
// and predictive strategic impact modeling
// ============================================================================

import OpenAI from 'openai';
import { Redis } from '@upstash/redis';
import { supabaseAdmin } from '@/lib/supabase/server';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redis = Redis.fromEnv();

export interface StrategicInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'competitor' | 'gap';
  title: string;
  description: string;
  confidence_score: number;
  impact_score: number;
  supporting_evidence: string[];
  recommended_actions: string[];
  timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  strategic_keywords: string[];
  related_themes: string[];
  created_at: string;
}

export interface CompetitiveAnalysis {
  competitor: string;
  their_strength: string;
  our_differentiation: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  opportunities: string[];
  defensive_actions: string[];
}

export interface StrategicGap {
  gap_type: 'feature' | 'market' | 'customer_segment' | 'capability';
  description: string;
  customer_impact: number;
  competitive_risk: number;
  implementation_effort: 'low' | 'medium' | 'high';
  recommended_solution: string;
  supporting_evidence: string[];
}

export interface PredictiveImpact {
  scenario: string;
  probability: number;
  impact_score: number;
  timeframe: string;
  key_factors: string[];
  recommended_monitoring: string[];
}

export class StrategicIntelligenceEngine {
  private companyId: string;
  private enableCostTracking: boolean;

  constructor(companyId: string) {
    this.companyId = companyId;
    this.enableCostTracking = process.env.AI_ENABLE_COST_TRACKING === 'true';
  }

  /**
   * Generate strategic insights from themes and feedback patterns
   */
  async generateStrategicInsights(): Promise<StrategicInsight[]> {
    console.log(`🧠 Generating strategic insights for company: ${this.companyId}`);
    
    const cacheKey = this.getCacheKey('strategic_insights', 'all');
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('📋 Using cached strategic insights');
      return JSON.parse(cached as string);
    }

    try {
      // Get current strategy and themes
      const [strategy, themes, feedback] = await Promise.all([
        this.getCurrentStrategy(),
        this.getRecentThemes(),
        this.getRecentFeedback()
      ]);

      if (!strategy) {
        console.log('⚠️ No active strategy found for strategic insights');
        return [];
      }

      const insights: StrategicInsight[] = [];

      // Generate different types of insights
      const insightTypes = [
        { type: 'opportunity', prompt: this.buildOpportunityPrompt(strategy, themes, feedback) },
        { type: 'risk', prompt: this.buildRiskPrompt(strategy, themes, feedback) },
        { type: 'trend', prompt: this.buildTrendPrompt(strategy, themes, feedback) },
        { type: 'gap', prompt: this.buildGapPrompt(strategy, themes, feedback) }
      ];

      for (const { type, prompt } of insightTypes) {
        try {
          const insight = await this.generateInsight(type, prompt);
          if (insight) {
            insights.push(insight);
          }
        } catch (error) {
          console.error(`Error generating ${type} insight:`, error);
        }
      }

      // Cache insights for 24 hours
      await redis.set(cacheKey, JSON.stringify(insights), { ex: 86400 });

      console.log(`✅ Generated ${insights.length} strategic insights`);
      return insights;

    } catch (error) {
      console.error('Error generating strategic insights:', error);
      return [];
    }
  }

  /**
   * Analyze competitive positioning
   */
  async analyzeCompetitivePositioning(): Promise<CompetitiveAnalysis[]> {
    console.log(`🏆 Analyzing competitive positioning for company: ${this.companyId}`);
    
    const cacheKey = this.getCacheKey('competitive_analysis', 'all');
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('📋 Using cached competitive analysis');
      return JSON.parse(cached as string);
    }

    try {
      const [strategy, themes, feedback] = await Promise.all([
        this.getCurrentStrategy(),
        this.getRecentThemes(),
        this.getRecentFeedback()
      ]);

      if (!strategy) {
        console.log('⚠️ No active strategy found for competitive analysis');
        return [];
      }

      const prompt = `
You are a competitive intelligence analyst. Analyze our competitive positioning based on customer feedback and strategic context.

CURRENT STRATEGY:
${JSON.stringify(strategy, null, 2)}

RECENT THEMES:
${themes.map(t => `- ${t.title}: ${t.description} (${t.customerCount} customers, ${t.sentiment} sentiment)`).join('\n')}

CUSTOMER FEEDBACK SAMPLE:
${feedback.slice(0, 20).map(f => `- "${f.content.substring(0, 200)}..." (${f.sentiment_score} sentiment)`).join('\n')}

ANALYSIS REQUIRED:
1. Identify 3-5 key competitors mentioned in feedback or implied by customer needs
2. For each competitor, analyze:
   - Their apparent strengths (what customers like about them)
   - Our differentiation opportunities
   - Threat level based on customer mentions and sentiment
   - Strategic opportunities to counter them
   - Defensive actions to protect our position

Return JSON array with this structure:
[
  {
    "competitor": "Competitor Name",
    "their_strength": "What they do well according to customers",
    "our_differentiation": "How we can differentiate",
    "threat_level": "low|medium|high|critical",
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "defensive_actions": ["Action 1", "Action 2"]
  }
]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert competitive intelligence analyst who identifies strategic opportunities and threats.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const analyses: CompetitiveAnalysis[] = result.analyses || [];

      // Cache for 7 days
      await redis.set(cacheKey, JSON.stringify(analyses), { ex: 604800 });

      // Track cost
      if (this.enableCostTracking) {
        await this.trackCost('competitive_analysis', response.usage);
      }

      console.log(`✅ Generated ${analyses.length} competitive analyses`);
      return analyses;

    } catch (error) {
      console.error('Error analyzing competitive positioning:', error);
      return [];
    }
  }

  /**
   * Identify strategic gaps
   */
  async identifyStrategicGaps(): Promise<StrategicGap[]> {
    console.log(`🔍 Identifying strategic gaps for company: ${this.companyId}`);
    
    const cacheKey = this.getCacheKey('strategic_gaps', 'all');
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('📋 Using cached strategic gaps');
      return JSON.parse(cached as string);
    }

    try {
      const [strategy, themes, feedback] = await Promise.all([
        this.getCurrentStrategy(),
        this.getRecentThemes(),
        this.getRecentFeedback()
      ]);

      if (!strategy) {
        console.log('⚠️ No active strategy found for gap analysis');
        return [];
      }

      const prompt = `
You are a strategic analyst identifying gaps between customer needs and current capabilities.

CURRENT STRATEGY:
${JSON.stringify(strategy, null, 2)}

RECENT THEMES:
${themes.map(t => `- ${t.title}: ${t.description} (${t.customerCount} customers)`).join('\n')}

CUSTOMER FEEDBACK:
${feedback.slice(0, 30).map(f => `- "${f.content}"`).join('\n')}

ANALYSIS REQUIRED:
Identify strategic gaps where:
1. Customers have clear needs we're not addressing
2. Our strategy doesn't cover important customer segments
3. We lack capabilities that competitors have
4. Market trends indicate future needs we should prepare for

For each gap, provide:
- Gap type (feature, market, customer_segment, capability)
- Clear description of the gap
- Customer impact (1-10 scale)
- Competitive risk (1-10 scale)
- Implementation effort (low/medium/high)
- Recommended solution approach
- Supporting evidence from customer feedback

Return JSON array with this structure:
[
  {
    "gap_type": "feature|market|customer_segment|capability",
    "description": "Clear description of the gap",
    "customer_impact": 8,
    "competitive_risk": 6,
    "implementation_effort": "medium",
    "recommended_solution": "Specific solution approach",
    "supporting_evidence": ["Evidence 1", "Evidence 2"]
  }
]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert strategic analyst who identifies gaps between customer needs and current capabilities.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const gaps: StrategicGap[] = result.gaps || [];

      // Cache for 7 days
      await redis.set(cacheKey, JSON.stringify(gaps), { ex: 604800 });

      // Track cost
      if (this.enableCostTracking) {
        await this.trackCost('strategic_gaps', response.usage);
      }

      console.log(`✅ Identified ${gaps.length} strategic gaps`);
      return gaps;

    } catch (error) {
      console.error('Error identifying strategic gaps:', error);
      return [];
    }
  }

  /**
   * Generate predictive strategic impact modeling
   */
  async generatePredictiveImpact(): Promise<PredictiveImpact[]> {
    console.log(`🔮 Generating predictive strategic impact for company: ${this.companyId}`);
    
    const cacheKey = this.getCacheKey('predictive_impact', 'all');
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('📋 Using cached predictive impact');
      return JSON.parse(cached as string);
    }

    try {
      const [strategy, themes, feedback] = await Promise.all([
        this.getCurrentStrategy(),
        this.getRecentThemes(),
        this.getRecentFeedback()
      ]);

      if (!strategy) {
        console.log('⚠️ No active strategy found for predictive analysis');
        return [];
      }

      const prompt = `
You are a strategic foresight analyst predicting future scenarios and their impacts.

CURRENT STRATEGY:
${JSON.stringify(strategy, null, 2)}

RECENT THEMES & TRENDS:
${themes.map(t => `- ${t.title}: ${t.trend || 'stable'} trend, ${t.customerCount} customers`).join('\n')}

CUSTOMER FEEDBACK TRENDS:
${feedback.slice(0, 25).map(f => `- "${f.content.substring(0, 150)}..." (${f.sentiment_score} sentiment)`).join('\n')}

PREDICTIVE ANALYSIS REQUIRED:
Based on current themes, customer feedback patterns, and strategic direction, predict:

1. **Scenario 1**: What happens if we continue current strategy without changes?
2. **Scenario 2**: What happens if we prioritize high-customer-signal themes?
3. **Scenario 3**: What happens if we focus only on strategic alignment?
4. **Scenario 4**: What happens if we address the biggest gaps first?

For each scenario, provide:
- Clear scenario description
- Probability of occurrence (0-1)
- Strategic impact score (1-10)
- Expected timeframe
- Key factors driving the scenario
- Recommended monitoring indicators

Return JSON array with this structure:
[
  {
    "scenario": "Clear scenario description",
    "probability": 0.7,
    "impact_score": 8,
    "timeframe": "6-12 months",
    "key_factors": ["Factor 1", "Factor 2"],
    "recommended_monitoring": ["Metric 1", "Metric 2"]
  }
]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert strategic foresight analyst who predicts future scenarios and their impacts.' 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const predictions: PredictiveImpact[] = result.scenarios || [];

      // Cache for 3 days
      await redis.set(cacheKey, JSON.stringify(predictions), { ex: 259200 });

      // Track cost
      if (this.enableCostTracking) {
        await this.trackCost('predictive_impact', response.usage);
      }

      console.log(`✅ Generated ${predictions.length} predictive scenarios`);
      return predictions;

    } catch (error) {
      console.error('Error generating predictive impact:', error);
      return [];
    }
  }

  /**
   * Generate weekly strategic health report
   */
  async generateWeeklyStrategicReport(): Promise<string> {
    console.log(`📊 Generating weekly strategic health report for company: ${this.companyId}`);
    
    const cacheKey = this.getCacheKey('weekly_report', new Date().toISOString().split('T')[0]);
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('📋 Using cached weekly report');
      return cached as string;
    }

    try {
      const [insights, gaps, predictions, themes] = await Promise.all([
        this.generateStrategicInsights(),
        this.identifyStrategicGaps(),
        this.generatePredictiveImpact(),
        this.getRecentThemes()
      ]);

      const report = `
# Weekly Strategic Health Report
**Generated:** ${new Date().toLocaleDateString()}

## Executive Summary
- **Total Themes:** ${themes.length}
- **Strategic Insights:** ${insights.length}
- **Identified Gaps:** ${gaps.length}
- **Predictive Scenarios:** ${predictions.length}

## Key Strategic Insights
${insights.slice(0, 3).map(insight => `
### ${insight.title}
- **Type:** ${insight.type}
- **Confidence:** ${insight.confidence_score}/10
- **Impact:** ${insight.impact_score}/10
- **Timeline:** ${insight.timeline}
- **Description:** ${insight.description}
- **Actions:** ${insight.recommended_actions.join(', ')}
`).join('\n')}

## Critical Gaps
${gaps.slice(0, 3).map(gap => `
### ${gap.description}
- **Type:** ${gap.gap_type}
- **Customer Impact:** ${gap.customer_impact}/10
- **Competitive Risk:** ${gap.competitive_risk}/10
- **Effort:** ${gap.implementation_effort}
- **Solution:** ${gap.recommended_solution}
`).join('\n')}

## Predictive Scenarios
${predictions.slice(0, 2).map(pred => `
### ${pred.scenario}
- **Probability:** ${Math.round(pred.probability * 100)}%
- **Impact:** ${pred.impact_score}/10
- **Timeframe:** ${pred.timeframe}
- **Key Factors:** ${pred.key_factors.join(', ')}
`).join('\n')}

## Recommendations
1. **Immediate Actions:** Address high-impact gaps with low implementation effort
2. **Strategic Focus:** Prioritize themes with strong customer signal and strategic alignment
3. **Monitoring:** Track key indicators for predictive scenarios
4. **Competitive Position:** Review and strengthen differentiation against key competitors

---
*Report generated by Strategic Intelligence Engine*
`;

      // Cache for 24 hours
      await redis.set(cacheKey, report, { ex: 86400 });

      console.log('✅ Generated weekly strategic health report');
      return report;

    } catch (error) {
      console.error('Error generating weekly report:', error);
      return 'Error generating strategic health report. Please try again.';
    }
  }

  // Helper methods
  private async generateInsight(type: string, prompt: string): Promise<StrategicInsight | null> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: `You are an expert strategic analyst generating ${type} insights.` 
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        id: crypto.randomUUID(),
        type: type as any,
        title: result.title || 'Strategic Insight',
        description: result.description || 'No description',
        confidence_score: result.confidence_score || 5,
        impact_score: result.impact_score || 5,
        supporting_evidence: result.supporting_evidence || [],
        recommended_actions: result.recommended_actions || [],
        timeline: result.timeline || 'medium_term',
        strategic_keywords: result.strategic_keywords || [],
        related_themes: result.related_themes || [],
        created_at: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error generating ${type} insight:`, error);
      return null;
    }
  }

  private buildOpportunityPrompt(strategy: any, themes: any[], feedback: any[]): string {
    return `Identify strategic opportunities based on customer feedback and current strategy.

STRATEGY: ${JSON.stringify(strategy, null, 2)}
THEMES: ${themes.map(t => `${t.title}: ${t.description}`).join('\n')}
FEEDBACK: ${feedback.slice(0, 15).map(f => f.content).join('\n')}

Find opportunities where:
1. Customer demand exceeds current capability
2. Market trends align with our strengths
3. Competitive gaps we can exploit
4. Emerging customer needs we can address

Return JSON with: title, description, confidence_score (1-10), impact_score (1-10), supporting_evidence, recommended_actions, timeline, strategic_keywords, related_themes`;
  }

  private buildRiskPrompt(strategy: any, themes: any[], feedback: any[]): string {
    return `Identify strategic risks based on customer feedback and market context.

STRATEGY: ${JSON.stringify(strategy, null, 2)}
THEMES: ${themes.map(t => `${t.title}: ${t.description}`).join('\n')}
FEEDBACK: ${feedback.slice(0, 15).map(f => f.content).join('\n')}

Find risks where:
1. Customer satisfaction declining
2. Competitive threats emerging
3. Strategy misalignment with market needs
4. Capability gaps exposing vulnerabilities

Return JSON with: title, description, confidence_score (1-10), impact_score (1-10), supporting_evidence, recommended_actions, timeline, strategic_keywords, related_themes`;
  }

  private buildTrendPrompt(strategy: any, themes: any[], feedback: any[]): string {
    return `Identify emerging trends from customer feedback patterns.

STRATEGY: ${JSON.stringify(strategy, null, 2)}
THEMES: ${themes.map(t => `${t.title}: ${t.trend || 'stable'}`).join('\n')}
FEEDBACK: ${feedback.slice(0, 20).map(f => f.content).join('\n')}

Find trends in:
1. Customer behavior changes
2. Feature request patterns
3. Sentiment shifts
4. Market direction indicators

Return JSON with: title, description, confidence_score (1-10), impact_score (1-10), supporting_evidence, recommended_actions, timeline, strategic_keywords, related_themes`;
  }

  private buildGapPrompt(strategy: any, themes: any[], feedback: any[]): string {
    return `Identify strategic gaps between customer needs and current capabilities.

STRATEGY: ${JSON.stringify(strategy, null, 2)}
THEMES: ${themes.map(t => `${t.title}: ${t.description}`).join('\n')}
FEEDBACK: ${feedback.slice(0, 15).map(f => f.content).join('\n')}

Find gaps in:
1. Feature completeness
2. Customer segment coverage
3. Market positioning
4. Capability development

Return JSON with: title, description, confidence_score (1-10), impact_score (1-10), supporting_evidence, recommended_actions, timeline, strategic_keywords, related_themes`;
  }

  private async getCurrentStrategy(): Promise<any> {
    const { data } = await supabaseAdmin
      .from('product_strategy')
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single();
    
    return data;
  }

  private async getRecentThemes(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('themes')
      .select('*')
      .eq('company_id', this.companyId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    return data || [];
  }

  private async getRecentFeedback(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('feedback_items')
      .select('*')
      .eq('company_id', this.companyId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    
    return data || [];
  }

  private getCacheKey(prefix: string, content: string): string {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `strategic_intelligence:${this.companyId}:${prefix}:${hash.substring(0, 16)}`;
  }

  private async trackCost(requestType: string, usage: any) {
    if (!this.enableCostTracking || !usage) return;

    const estimatedCost = this.calculateCost('gpt-4o', usage.total_tokens || 0);

    await supabaseAdmin.from('ai_cost_logs').insert({
      company_id: this.companyId,
      provider: 'openai',
      model: 'gpt-4o',
      request_type: requestType,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || 0,
      estimated_cost: estimatedCost,
      cache_hit: false,
      related_table: 'strategic_insights',
      related_id: null,
    } as any);
  }

  private calculateCost(model: string, tokens: number): number {
    const pricing: Record<string, number> = {
      'gpt-4o': 2.50 / 1_000_000,
      'gpt-4o-mini': 0.15 / 1_000_000,
    };
    return (pricing[model] || 0) * tokens;
  }
}

export function createStrategicIntelligenceEngine(companyId: string) {
  return new StrategicIntelligenceEngine(companyId);
}
