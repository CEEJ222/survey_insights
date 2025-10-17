// ============================================================================
// AI MODEL OPTIMIZATION & INFRASTRUCTURE
// ============================================================================
// Manages AI model performance, accuracy, A/B testing, and infrastructure concerns
// ============================================================================

import { supabaseAdmin } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export interface ModelPerformanceMetric {
  metric_name: string;
  value: number;
  timestamp: string;
  model_version: string;
  context: string; // e.g., 'strategic_alignment', 'theme_discovery'
}

export interface AIBenchmarkResult {
  model_version: string;
  test_dataset_id: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  latency_ms: number;
  cost_per_inference: number;
  timestamp: string;
}

export class AIModelOptimizationEngine {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * Log model performance metrics
   */
  async logPerformanceMetric(metric: Omit<ModelPerformanceMetric, 'timestamp'>): Promise<void> {
    try {
      await supabaseAdmin.from('ai_model_performance_logs').insert({
        company_id: this.companyId,
        metric_name: metric.metric_name,
        value: metric.value,
        model_version: metric.model_version,
        context: metric.context,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging AI model performance metric:', error);
    }
  }

  /**
   * Record A/B test results for model accuracy
   */
  async recordBenchmarkResult(result: Omit<AIBenchmarkResult, 'timestamp'>): Promise<void> {
    try {
      await supabaseAdmin.from('ai_benchmark_results').insert({
        company_id: this.companyId,
        model_version: result.model_version,
        test_dataset_id: result.test_dataset_id,
        accuracy: result.accuracy,
        precision: result.precision,
        recall: result.recall,
        f1_score: result.f1_score,
        latency_ms: result.latency_ms,
        cost_per_inference: result.cost_per_inference,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error recording AI benchmark result:', error);
    }
  }

  /**
   * Get AI model performance dashboard data
   */
  async getPerformanceDashboardData(): Promise<any> {
    try {
      // Fetch recent performance logs
      const { data: performanceLogs, error: perfError } = await supabaseAdmin
        .from('ai_model_performance_logs')
        .select('*')
        .eq('company_id', this.companyId)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (perfError) throw perfError;

      // Fetch recent benchmark results
      const { data: benchmarkResults, error: benchError } = await supabaseAdmin
        .from('ai_benchmark_results')
        .select('*')
        .eq('company_id', this.companyId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (benchError) throw benchError;

      // Fetch recent AI cost logs
      const { data: costLogs, error: costError } = await supabaseAdmin
        .from('ai_cost_logs')
        .select('*')
        .eq('company_id', this.companyId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (costError) throw costError;

      // Aggregate data for dashboard display
      const totalCostLast30Days = costLogs
        .filter(log => new Date(log.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, log) => sum + (log.estimated_cost || 0), 0);

      const totalTokensLast30Days = costLogs
        .filter(log => new Date(log.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, log) => sum + (log.total_tokens || 0), 0);

      const cacheHitRate = costLogs.length > 0
        ? (costLogs.filter(log => log.cache_hit).length / costLogs.length) * 100
        : 0;

      return {
        latestPerformanceMetrics: performanceLogs,
        latestBenchmarkResults: benchmarkResults,
        costSummary: {
          totalCostLast30Days: totalCostLast30Days.toFixed(4),
          totalTokensLast30Days,
          cacheHitRate: cacheHitRate.toFixed(2),
        },
        // Add more aggregated data as needed for the dashboard
      };
    } catch (error) {
      console.error('Error fetching AI model performance dashboard data:', error);
      return null;
    }
  }

  /**
   * Implement caching strategy (e.g., Redis)
   */
  async setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
  }

  async getCache<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached as string) : null;
  }

  /**
   * Clear cache for a specific key or pattern
   */
  async clearCache(pattern: string): Promise<void> {
    // Note: KEYS command can be slow on large datasets. Use SCAN in production.
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  /**
   * Optimize model performance based on current metrics
   */
  async optimizeModelPerformance(): Promise<any> {
    try {
      // Get current performance data
      const dashboardData = await this.getPerformanceDashboardData();
      
      // Analyze performance and suggest optimizations
      const optimizations = {
        cacheOptimization: dashboardData.costSummary.cacheHitRate < 80 ? 'Increase cache TTL' : 'Cache performance is good',
        costOptimization: parseFloat(dashboardData.costSummary.totalCostLast30Days) > 100 ? 'Consider model downgrade' : 'Cost is within acceptable range',
        performanceOptimization: 'Monitor response times and consider caching strategies',
        recommendations: [
          'Review cache hit rates and adjust TTL settings',
          'Monitor token usage patterns',
          'Consider model version updates',
          'Implement request batching where possible'
        ]
      };

      return {
        success: true,
        optimizations,
        dashboardData
      };
    } catch (error) {
      console.error('Error optimizing model performance:', error);
      return {
        success: false,
        error: 'Failed to optimize model performance'
      };
    }
  }

  /**
   * Start an A/B test for model comparison
   */
  async startABTest(config: {
    test_name: string;
    request_type: string;
    model_a: string;
    model_b: string;
    traffic_split: number;
    success_metrics: string[];
    duration_days: number;
  }): Promise<string> {
    try {
      const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store A/B test configuration
      await supabaseAdmin.from('ai_ab_tests').insert({
        test_id: testId,
        company_id: this.companyId,
        test_name: config.test_name,
        request_type: config.request_type,
        model_a: config.model_a,
        model_b: config.model_b,
        traffic_split: config.traffic_split,
        success_metrics: config.success_metrics,
        duration_days: config.duration_days,
        status: 'active',
        created_at: new Date().toISOString()
      });

      return testId;
    } catch (error) {
      console.error('Error starting A/B test:', error);
      throw new Error('Failed to start A/B test');
    }
  }
}

export function createAIModelOptimizationEngine(companyId: string) {
  return new AIModelOptimizationEngine(companyId);
}

export function createModelOptimizationEngine(companyId: string) {
  return new AIModelOptimizationEngine(companyId);
}