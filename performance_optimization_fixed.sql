-- ============================================================================
-- DATABASE PERFORMANCE OPTIMIZATION - FIXED VERSION
-- ============================================================================
-- Indexes, query optimization, and performance monitoring for the
-- unified feedback platform - CORRECTED for our roadmap schema
-- ============================================================================

-- ============================================================================
-- STRATEGIC QUERY INDEXES
-- ============================================================================

-- Themes table indexes for strategic queries
CREATE INDEX IF NOT EXISTS idx_themes_strategic_alignment 
ON themes(company_id, strategic_alignment_score DESC) 
WHERE strategic_alignment_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_themes_final_priority 
ON themes(company_id, final_priority_score DESC) 
WHERE final_priority_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_themes_recommendation 
ON themes(company_id, recommendation) 
WHERE recommendation IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_themes_created_at 
ON themes(company_id, created_at DESC);

-- NEW: Initiative indexes for roadmap queries
CREATE INDEX IF NOT EXISTS idx_initiatives_timeline_bucket 
ON initiatives(company_id, timeline_bucket, target_quarter);

CREATE INDEX IF NOT EXISTS idx_initiatives_status 
ON initiatives(company_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_initiatives_owner 
ON initiatives(owner_id, status);

CREATE INDEX IF NOT EXISTS idx_initiatives_theme_id 
ON initiatives(theme_id) WHERE theme_id IS NOT NULL;

-- Feedback items indexes for theme discovery
CREATE INDEX IF NOT EXISTS idx_feedback_items_company_created 
ON feedback_items(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_items_sentiment 
ON feedback_items(company_id, sentiment_score) 
WHERE sentiment_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_items_themes 
ON feedback_items USING GIN(themes);

-- Tag usages indexes for clustering
CREATE INDEX IF NOT EXISTS idx_tag_usages_company_source 
ON tag_usages(company_id, source_type, used_at DESC);

CREATE INDEX IF NOT EXISTS idx_tag_usages_tag_source 
ON tag_usages(tag_id, source_type, used_at DESC);

-- Strategic scoring indexes
CREATE INDEX IF NOT EXISTS idx_product_strategy_active 
ON product_strategy(company_id, is_active, version DESC) 
WHERE is_active = true;

-- NEW: Strategic objectives indexes
CREATE INDEX IF NOT EXISTS idx_strategic_objectives_company_quarter 
ON strategic_objectives(company_id, quarter, status);

CREATE INDEX IF NOT EXISTS idx_strategic_objectives_owner 
ON strategic_objectives(owner_id, status);

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- View for monitoring theme discovery performance
CREATE OR REPLACE VIEW theme_discovery_performance AS
SELECT 
    company_id,
    DATE_TRUNC('day', created_at) as discovery_date,
    COUNT(*) as themes_discovered,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds,
    COUNT(*) FILTER (WHERE strategic_alignment_score >= 70) as aligned_themes,
    COUNT(*) FILTER (WHERE strategic_alignment_score < 50) as conflicted_themes
FROM themes
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY company_id, DATE_TRUNC('day', created_at)
ORDER BY discovery_date DESC;

-- View for monitoring AI cost trends
CREATE OR REPLACE VIEW ai_cost_trends AS
SELECT 
    company_id,
    DATE_TRUNC('day', created_at) as cost_date,
    provider,
    model,
    request_type,
    COUNT(*) as request_count,
    SUM(total_tokens) as total_tokens,
    SUM(estimated_cost) as total_cost,
    AVG(estimated_cost) as avg_cost_per_request,
    COUNT(*) FILTER (WHERE cache_hit = true) as cache_hits,
    ROUND(
        COUNT(*) FILTER (WHERE cache_hit = true) * 100.0 / COUNT(*), 2
    ) as cache_hit_rate
FROM ai_cost_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY company_id, DATE_TRUNC('day', created_at), provider, model, request_type
ORDER BY cost_date DESC, total_cost DESC;

-- View for strategic health monitoring
CREATE OR REPLACE VIEW strategic_health_summary AS
SELECT 
    company_id,
    COUNT(*) as total_themes,
    COUNT(*) FILTER (WHERE strategic_alignment_score >= 70) as aligned_themes,
    COUNT(*) FILTER (WHERE strategic_alignment_score < 50) as conflicted_themes,
    COUNT(*) FILTER (WHERE recommendation = 'needs_review') as needs_review,
    ROUND(
        COUNT(*) FILTER (WHERE strategic_alignment_score >= 70) * 100.0 / COUNT(*), 2
    ) as alignment_percentage,
    AVG(strategic_alignment_score) as avg_alignment_score,
    AVG(final_priority_score) as avg_final_priority
FROM themes
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY company_id;

-- NEW: Initiative performance monitoring
CREATE OR REPLACE VIEW initiative_performance AS
SELECT 
    company_id,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as initiatives_created,
    COUNT(*) FILTER (WHERE status = 'shipped') as initiatives_shipped,
    COUNT(*) FILTER (WHERE status = 'in_progress') as initiatives_active,
    AVG(EXTRACT(EPOCH FROM (shipped_at - started_at))/86400) as avg_days_to_ship,
    COUNT(*) FILTER (WHERE timeline_bucket = 'now') as now_bucket,
    COUNT(*) FILTER (WHERE timeline_bucket = 'next') as next_bucket,
    COUNT(*) FILTER (WHERE timeline_bucket = 'later') as later_bucket
FROM initiatives
WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY company_id, DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ============================================================================
-- QUERY OPTIMIZATION FUNCTIONS - CORRECTED
-- ============================================================================

-- FIXED: Function to get themes with strategic scoring efficiently
CREATE OR REPLACE FUNCTION get_themes_with_strategic_scoring(
    p_company_id UUID,
    p_sort_by TEXT DEFAULT 'final_priority',
    p_filter_by TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    mention_count INTEGER,
    avg_sentiment DECIMAL,
    priority_score INTEGER,
    strategic_alignment_score INTEGER,
    strategic_reasoning TEXT,
    strategic_conflicts TEXT[],
    strategic_opportunities TEXT[],
    final_priority_score INTEGER,
    recommendation TEXT,
    pm_notes TEXT,
    declined_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.description,
        t.mention_count,
        t.avg_sentiment,
        t.priority_score,
        t.strategic_alignment_score,
        t.strategic_reasoning,
        t.strategic_conflicts,
        t.strategic_opportunities,
        t.final_priority_score,
        t.recommendation,
        t.pm_notes,
        t.declined_reason,
        t.created_at,
        t.updated_at
    FROM themes t
    WHERE t.company_id = p_company_id
    AND (
        p_filter_by = 'all' OR
        (p_filter_by = 'in_strategy' AND t.strategic_alignment_score >= 70) OR
        (p_filter_by = 'off_strategy' AND t.strategic_alignment_score < 50) OR
        (p_filter_by = 'needs_review' AND t.recommendation = 'needs_review')
    )
    ORDER BY 
        CASE WHEN p_sort_by = 'final_priority' THEN t.final_priority_score END DESC,
        CASE WHEN p_sort_by = 'customer_signal' THEN t.priority_score END DESC,
        CASE WHEN p_sort_by = 'strategic_alignment' THEN t.strategic_alignment_score END DESC,
        CASE WHEN p_sort_by = 'created_at' THEN t.created_at END DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- NEW: Function to get initiatives with theme context
CREATE OR REPLACE FUNCTION get_initiatives_with_theme_context(
    p_company_id UUID,
    p_timeline_bucket TEXT DEFAULT 'all',
    p_status TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    effort TEXT,
    timeline_bucket TEXT,
    target_quarter TEXT,
    progress_percentage INTEGER,
    customer_count INTEGER,
    theme_name TEXT,
    theme_id UUID,
    owner_name TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.title,
        i.description,
        i.status,
        i.effort,
        i.timeline_bucket,
        i.target_quarter,
        CASE 
            WHEN i.status = 'shipped' THEN 100
            WHEN i.status = 'in_progress' THEN 50 -- Could be calculated from milestones
            ELSE 0
        END as progress_percentage,
        COALESCE(t.customer_count, 0) as customer_count,
        t.name as theme_name,
        t.id as theme_id,
        au.full_name as owner_name,
        i.started_at,
        i.shipped_at,
        i.created_at
    FROM initiatives i
    LEFT JOIN themes t ON i.theme_id = t.id
    LEFT JOIN admin_users au ON i.owner_id = au.id
    WHERE i.company_id = p_company_id
    AND (
        p_timeline_bucket = 'all' OR i.timeline_bucket = p_timeline_bucket
    )
    AND (
        p_status = 'all' OR i.status = p_status
    )
    ORDER BY 
        CASE i.timeline_bucket 
            WHEN 'now' THEN 1
            WHEN 'next' THEN 2
            WHEN 'later' THEN 3
            ELSE 4
        END,
        i.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- FIXED: Function to calculate strategic health metrics efficiently
CREATE OR REPLACE FUNCTION calculate_strategic_health_metrics(p_company_id UUID)
RETURNS TABLE (
    total_themes INTEGER,
    aligned_themes INTEGER,
    conflicted_themes INTEGER,
    needs_review INTEGER,
    average_alignment DECIMAL,
    strategy_health_score INTEGER,
    recommendations JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH theme_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE strategic_alignment_score >= 70) as aligned,
            COUNT(*) FILTER (WHERE strategic_alignment_score < 50) as conflicted,
            COUNT(*) FILTER (WHERE recommendation = 'needs_review') as needs_review,
            AVG(strategic_alignment_score) as avg_alignment
        FROM themes
        WHERE company_id = p_company_id
    ),
    recommendation_counts AS (
        SELECT jsonb_object_agg(recommendation, count) as rec_counts
        FROM (
            SELECT recommendation, COUNT(*) as count
            FROM themes
            WHERE company_id = p_company_id
            GROUP BY recommendation
        ) rec_stats
    )
    SELECT 
        ts.total::INTEGER,
        ts.aligned::INTEGER,
        ts.conflicted::INTEGER,
        ts.needs_review::INTEGER,
        COALESCE(ts.avg_alignment, 0),
        CASE 
            WHEN ts.total > 0 THEN ROUND((ts.aligned::DECIMAL / ts.total) * 100)::INTEGER
            ELSE 0
        END,
        COALESCE(rc.rec_counts, '{}'::jsonb)
    FROM theme_stats ts
    CROSS JOIN recommendation_counts rc;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONNECTION POOLING AND RESOURCE MANAGEMENT
-- ============================================================================

-- Function to monitor database connections
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE (
    database_name TEXT,
    active_connections INTEGER,
    max_connections INTEGER,
    connection_utilization DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        current_database()::TEXT,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::INTEGER,
        (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections')::INTEGER,
        ROUND(
            (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::DECIMAL / 
            (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections'), 4
        );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- BACKUP AND RECOVERY PROCEDURES
-- ============================================================================

-- Function to create point-in-time recovery markers
CREATE OR REPLACE FUNCTION create_recovery_point(p_description TEXT DEFAULT 'Manual recovery point')
RETURNS UUID AS $$
DECLARE
    recovery_id UUID;
BEGIN
    recovery_id := gen_random_uuid();
    
    INSERT INTO recovery_points (id, description, created_at)
    VALUES (recovery_id, p_description, CURRENT_TIMESTAMP);
    
    RETURN recovery_id;
END;
$$ LANGUAGE plpgsql;

-- Create recovery points table if it doesn't exist
CREATE TABLE IF NOT EXISTS recovery_points (
    id UUID PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- DATA ARCHIVAL PROCEDURES
-- ============================================================================

-- Function to archive old feedback data
CREATE OR REPLACE FUNCTION archive_old_feedback_data(
    p_company_id UUID,
    p_retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Archive old feedback items
    WITH archived AS (
        DELETE FROM feedback_items
        WHERE company_id = p_company_id
        AND created_at < CURRENT_DATE - (p_retention_days || ' days')::INTERVAL
        RETURNING *
    )
    INSERT INTO feedback_items_archive
    SELECT *, CURRENT_TIMESTAMP as archived_at
    FROM archived;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    -- Archive old AI cost logs
    DELETE FROM ai_cost_logs
    WHERE company_id = p_company_id
    AND created_at < CURRENT_DATE - (p_retention_days || ' days')::INTERVAL;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Create archive table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback_items_archive (LIKE feedback_items INCLUDING ALL);
ALTER TABLE feedback_items_archive ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- PERFORMANCE MONITORING ALERTS
-- ============================================================================

-- Function to check for performance issues
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS TABLE (
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check for slow queries
    RETURN QUERY
    SELECT 
        'slow_query'::TEXT,
        'warning'::TEXT,
        'Slow queries detected in the last hour'::TEXT,
        'Consider optimizing query performance or adding indexes'::TEXT
    WHERE EXISTS (
        SELECT 1 FROM pg_stat_statements 
        WHERE mean_exec_time > 1000 -- 1 second
        AND calls > 10
    );
    
    -- Check for high connection usage
    RETURN QUERY
    SELECT 
        'high_connections'::TEXT,
        'critical'::TEXT,
        'Database connection usage is high'::TEXT,
        'Consider scaling or optimizing connection pooling'::TEXT
    WHERE (
        SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
    ) > (
        SELECT setting::INTEGER * 0.8 FROM pg_settings WHERE name = 'max_connections'
    );
    
    -- Check for low cache hit rates
    RETURN QUERY
    SELECT 
        'low_cache_hit_rate'::TEXT,
        'warning'::TEXT,
        'AI cache hit rate is below optimal'::TEXT,
        'Consider optimizing caching strategy'::TEXT
    WHERE (
        SELECT COALESCE(
            SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 0
        )
        FROM ai_cost_logs
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 day'
    ) < 50; -- Less than 50% cache hit rate
    
    -- NEW: Check for themes without strategic scoring
    RETURN QUERY
    SELECT 
        'themes_without_strategic_scoring'::TEXT,
        'warning'::TEXT,
        'Some themes lack strategic alignment scoring'::TEXT,
        'Run strategic analysis to score all themes'::TEXT
    WHERE (
        SELECT COUNT(*) FROM themes 
        WHERE strategic_alignment_score IS NULL 
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    ) > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEX MAINTENANCE
-- ============================================================================

-- Function to analyze and suggest index improvements
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    index_scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT,
    usage_ratio DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        i.indexname::TEXT,
        pg_size_pretty(pg_relation_size(i.indexrelid))::TEXT,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        CASE 
            WHEN s.idx_scan > 0 THEN 
                ROUND(s.idx_tup_fetch::DECIMAL / s.idx_tup_read, 4)
            ELSE 0
        END
    FROM pg_tables t
    JOIN pg_indexes i ON t.tablename = i.tablename
    JOIN pg_stat_user_indexes s ON i.indexname = s.indexrelname
    WHERE t.schemaname = 'public'
    AND t.tablename IN ('themes', 'feedback_items', 'tag_usages', 'ai_cost_logs', 'initiatives', 'strategic_objectives')
    ORDER BY pg_relation_size(i.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECURITY AND COMPLIANCE
-- ============================================================================

-- Function to audit data access
CREATE OR REPLACE FUNCTION audit_data_access(
    p_user_id UUID,
    p_table_name TEXT,
    p_operation TEXT,
    p_record_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO data_access_audit (
        user_id,
        table_name,
        operation,
        record_id,
        accessed_at,
        ip_address
    ) VALUES (
        p_user_id,
        p_table_name,
        p_operation,
        p_record_id,
        CURRENT_TIMESTAMP,
        inet_client_addr()
    );
END;
$$ LANGUAGE plpgsql;

-- Create audit table if it doesn't exist
CREATE TABLE IF NOT EXISTS data_access_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET
);

-- ============================================================================
-- MONITORING AND METRICS - ENHANCED
-- ============================================================================

-- Create a comprehensive monitoring view
CREATE OR REPLACE VIEW system_health_dashboard AS
SELECT 
    'database_size' as metric_type,
    pg_size_pretty(pg_database_size(current_database())) as current_value,
    'Database size' as description
UNION ALL
SELECT 
    'active_connections',
    (SELECT count(*)::TEXT FROM pg_stat_activity WHERE state = 'active'),
    'Currently active database connections'
UNION ALL
SELECT 
    'cache_hit_rate',
    ROUND(
        (SELECT COALESCE(
            SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 0
        )
        FROM ai_cost_logs
        WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 day'), 2
    )::TEXT || '%',
    'AI cache hit rate (last 24 hours)'
UNION ALL
SELECT 
    'themes_processed_today',
    (SELECT count(*)::TEXT FROM themes WHERE created_at >= CURRENT_DATE),
    'Themes processed today'
UNION ALL
SELECT 
    'strategic_alignment_avg',
    ROUND(
        (SELECT AVG(strategic_alignment_score) FROM themes 
         WHERE created_at >= CURRENT_DATE AND strategic_alignment_score IS NOT NULL), 2
    )::TEXT,
    'Average strategic alignment score (today)'
UNION ALL
SELECT 
    'initiatives_active',
    (SELECT count(*)::TEXT FROM initiatives WHERE status = 'in_progress'),
    'Currently active initiatives'
UNION ALL
SELECT 
    'initiatives_shipped_this_month',
    (SELECT count(*)::TEXT FROM initiatives 
     WHERE status = 'shipped' AND shipped_at >= DATE_TRUNC('month', CURRENT_DATE)),
    'Initiatives shipped this month';

-- Grant necessary permissions
GRANT SELECT ON theme_discovery_performance TO authenticated;
GRANT SELECT ON ai_cost_trends TO authenticated;
GRANT SELECT ON strategic_health_summary TO authenticated;
GRANT SELECT ON initiative_performance TO authenticated;
GRANT SELECT ON system_health_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_themes_with_strategic_scoring TO authenticated;
GRANT EXECUTE ON FUNCTION get_initiatives_with_theme_context TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_strategic_health_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_stats TO authenticated;
GRANT EXECUTE ON FUNCTION check_performance_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_index_usage TO authenticated;
