-- ============================================================================
-- TAG MANAGEMENT SQL FUNCTIONS
-- ============================================================================
-- Helper functions for tag normalization and management
-- Run these in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- FUNCTION: Get Top Tags for a Company
-- ============================================================================
-- Returns the most frequently used tags with metrics
-- Used by AI normalizer to learn company terminology

CREATE OR REPLACE FUNCTION get_top_tags(
  p_company_id UUID,
  p_limit INT DEFAULT 100
)
RETURNS TABLE(
  tag TEXT,
  count BIGINT,
  avg_sentiment DECIMAL(5,2),
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  sources JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH tag_stats AS (
    -- Aggregate tags from feedback_items
    SELECT 
      t.tag,
      fi.sentiment_score,
      fi.source_type,
      fi.created_at
    FROM feedback_items fi, UNNEST(fi.ai_tags) as t(tag)
    WHERE fi.company_id = p_company_id
    
    UNION ALL
    
    -- Aggregate tags from survey_responses
    SELECT 
      t.tag,
      sr.sentiment_score,
      'survey' as source_type,
      sr.submitted_at as created_at
    FROM survey_responses sr
    JOIN surveys s ON s.id = sr.survey_id
    CROSS JOIN UNNEST(sr.ai_tags) as t(tag)
    WHERE s.company_id = p_company_id
    
    UNION ALL
    
    -- Aggregate tags from reviews (if any exist)
    SELECT 
      t.tag,
      r.sentiment_score,
      'review' as source_type,
      r.created_at
    FROM reviews r, UNNEST(r.ai_tags) as t(tag)
    WHERE r.company_id = p_company_id
  ),
  tag_aggregates AS (
    SELECT 
      ts.tag,
      COUNT(*) as total_count,
      ROUND(AVG(ts.sentiment_score)::NUMERIC, 2) as avg_sentiment,
      MIN(ts.created_at) as first_seen,
      MAX(ts.created_at) as last_seen
    FROM tag_stats ts
    GROUP BY ts.tag
  ),
  tag_sources AS (
    SELECT 
      ts.tag,
      ts.source_type,
      COUNT(*) as source_count
    FROM tag_stats ts
    GROUP BY ts.tag, ts.source_type
  )
  SELECT 
    ta.tag,
    ta.total_count as count,
    ta.avg_sentiment,
    ta.first_seen,
    ta.last_seen,
    COALESCE(
      jsonb_object_agg(
        ts.source_type, 
        ts.source_count
      ) FILTER (WHERE ts.source_type IS NOT NULL),
      '{}'::jsonb
    ) as sources
  FROM tag_aggregates ta
  LEFT JOIN tag_sources ts ON ta.tag = ts.tag
  GROUP BY ta.tag, ta.total_count, ta.avg_sentiment, ta.first_seen, ta.last_seen
  ORDER BY ta.total_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Replace Tag in Arrays
-- ============================================================================
-- Replaces old tag with new tag across all feedback tables
-- Used when merging duplicate tags

CREATE OR REPLACE FUNCTION replace_tag_in_array(
  p_company_id UUID,
  p_old_tag TEXT,
  p_new_tag TEXT
)
RETURNS TABLE(
  table_name TEXT,
  rows_affected INT
) AS $$
DECLARE
  v_feedback_count INT;
  v_survey_count INT;
  v_review_count INT;
BEGIN
  -- Update feedback_items
  WITH updated_feedback AS (
    UPDATE feedback_items
    SET ai_tags = array_replace(ai_tags, p_old_tag, p_new_tag)
    WHERE company_id = p_company_id
      AND p_old_tag = ANY(ai_tags)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_feedback_count FROM updated_feedback;
  
  -- Update survey_responses
  WITH updated_surveys AS (
    UPDATE survey_responses sr
    SET ai_tags = array_replace(sr.ai_tags, p_old_tag, p_new_tag)
    FROM surveys s
    WHERE sr.survey_id = s.id
      AND s.company_id = p_company_id
      AND p_old_tag = ANY(sr.ai_tags)
    RETURNING sr.id
  )
  SELECT COUNT(*) INTO v_survey_count FROM updated_surveys;
  
  -- Update reviews (if table exists and has data)
  BEGIN
    WITH updated_reviews AS (
      UPDATE reviews
      SET ai_tags = array_replace(ai_tags, p_old_tag, p_new_tag)
      WHERE company_id = p_company_id
        AND p_old_tag = ANY(ai_tags)
      RETURNING id
    )
    SELECT COUNT(*) INTO v_review_count FROM updated_reviews;
  EXCEPTION
    WHEN undefined_table THEN
      v_review_count := 0;
  END;
  
  -- Return results
  RETURN QUERY
  SELECT 'feedback_items'::TEXT, v_feedback_count
  UNION ALL
  SELECT 'survey_responses'::TEXT, v_survey_count
  UNION ALL
  SELECT 'reviews'::TEXT, v_review_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Tag Usage by Date Range
-- ============================================================================
-- Returns tag frequency over time for trend analysis

CREATE OR REPLACE FUNCTION get_tag_trends(
  p_company_id UUID,
  p_tag TEXT,
  p_days_back INT DEFAULT 90
)
RETURNS TABLE(
  date DATE,
  mention_count BIGINT,
  avg_sentiment DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH tag_mentions AS (
    SELECT 
      DATE(fi.created_at) as mention_date,
      fi.sentiment_score
    FROM feedback_items fi, UNNEST(fi.ai_tags) as t(tag)
    WHERE fi.company_id = p_company_id
      AND t.tag = p_tag
      AND fi.created_at >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
    
    UNION ALL
    
    SELECT 
      DATE(sr.submitted_at) as mention_date,
      sr.sentiment_score
    FROM survey_responses sr
    JOIN surveys s ON s.id = sr.survey_id
    CROSS JOIN UNNEST(sr.ai_tags) as t(tag)
    WHERE s.company_id = p_company_id
      AND t.tag = p_tag
      AND sr.submitted_at >= CURRENT_DATE - INTERVAL '1 day' * p_days_back
  )
  SELECT 
    tm.mention_date::DATE,
    COUNT(*)::BIGINT as mention_count,
    ROUND(AVG(tm.sentiment_score)::NUMERIC, 2) as avg_sentiment
  FROM tag_mentions tm
  GROUP BY tm.mention_date
  ORDER BY tm.mention_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: Tag Merge Audit Log (Optional)
-- ============================================================================
-- Tracks tag merge history for auditing

CREATE TABLE IF NOT EXISTS tag_merge_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  canonical_tag TEXT NOT NULL,
  merged_variants TEXT[] NOT NULL,
  rows_affected INT,
  performed_by UUID REFERENCES admin_users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_tag_merge_log_company 
  ON tag_merge_log(company_id);
CREATE INDEX IF NOT EXISTS idx_tag_merge_log_performed 
  ON tag_merge_log(performed_at DESC);

-- ============================================================================
-- TESTING QUERIES (Comment these out after testing)
-- ============================================================================

-- Test get_top_tags function
-- SELECT * FROM get_top_tags('your-company-id-here', 20);

-- Test tag trends
-- SELECT * FROM get_tag_trends('your-company-id-here', 'dashboard', 30);

-- Test tag replacement (BE CAREFUL - this modifies data)
-- SELECT * FROM replace_tag_in_array(
--   'your-company-id-here',
--   'slow',
--   'performance'
-- );

-- ============================================================================
-- CLEANUP (Optional - if you need to remove these functions)
-- ============================================================================

-- DROP FUNCTION IF EXISTS get_top_tags(UUID, INT);
-- DROP FUNCTION IF EXISTS replace_tag_in_array(UUID, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS get_tag_trends(UUID, TEXT, INT);
-- DROP TABLE IF EXISTS tag_merge_log;



