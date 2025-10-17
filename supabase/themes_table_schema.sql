-- ============================================================================
-- THEMES TABLE: Discovered patterns across feedback
-- ============================================================================
-- This table stores AI-discovered themes that group related feedback together
-- ============================================================================

CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Core Identity
  name VARCHAR(255) NOT NULL, -- "Dashboard Performance Issues"
  description TEXT, -- AI-generated description
  slug VARCHAR(255) NOT NULL, -- "dashboard-performance-issues"
  
  -- Related Tags (that led to this theme) - references the tags table
  related_tag_ids UUID[] DEFAULT '{}', -- Array of tag IDs from tags table
  
  -- Evidence - links to existing feedback sources
  supporting_survey_response_ids UUID[] DEFAULT '{}', -- Links to survey_responses
  supporting_feedback_item_ids UUID[] DEFAULT '{}', -- Links to feedback_items
  
  -- Metrics
  customer_count INTEGER DEFAULT 0, -- Unique customers affected
  mention_count INTEGER DEFAULT 0, -- Total mentions
  avg_sentiment DECIMAL(3,2), -- Average sentiment of related feedback
  
  -- Source Breakdown (computed from supporting IDs)
  source_breakdown_data JSONB, -- {"survey": 34, "review": 8, "interview": 5}
  
  -- Trend Analysis
  first_seen TIMESTAMP WITH TIME ZONE,
  last_seen TIMESTAMP WITH TIME ZONE,
  peak_date TIMESTAMP WITH TIME ZONE, -- When mentions were highest
  trend VARCHAR(50), -- increasing, stable, decreasing, spiking
  week_over_week_change DECIMAL(5,2), -- +40.5 (percentage)
  month_over_month_change DECIMAL(5,2),
  
  -- Priority (AI-calculated)
  priority_score INTEGER DEFAULT 50, -- 0-100
  priority_factors JSONB, -- What contributed to the score
  
  -- Competitive Intelligence
  competitor_has_solution BOOLEAN, -- Do competitors solve this?
  competitor_analysis TEXT, -- AI-generated competitive insight
  
  -- Status & Lifecycle
  status VARCHAR(50) DEFAULT 'discovered',
    -- discovered: AI just found it
    -- reviewing: Team is reviewing
    -- validated: Team confirmed it's real
    -- addressed: Linked to roadmap item
    -- resolved: Shipped fix/feature
    -- dismissed: Not actionable
  
  -- Roadmap Connection
  linked_roadmap_item_id UUID, -- References roadmap_items(id) (future)
  addressed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  discovered_by VARCHAR(50) DEFAULT 'ai', -- ai or manual
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT, -- Manual notes from team
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(company_id, slug)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_themes_company ON themes(company_id);
CREATE INDEX IF NOT EXISTS idx_themes_status ON themes(status);
CREATE INDEX IF NOT EXISTS idx_themes_priority ON themes(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_themes_trend ON themes(trend);
CREATE INDEX IF NOT EXISTS idx_themes_created ON themes(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS FOR THEME MANAGEMENT
-- ============================================================================

-- Function to generate a slug from a theme name
CREATE OR REPLACE FUNCTION generate_theme_slug(theme_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(theme_name, '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find or create a theme
CREATE OR REPLACE FUNCTION find_or_create_theme(
  p_company_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_related_tag_ids UUID[] DEFAULT '{}',
  p_discovered_by VARCHAR(50) DEFAULT 'ai'
)
RETURNS UUID AS $$
DECLARE
  v_theme_id UUID;
  v_slug TEXT;
BEGIN
  v_slug := generate_theme_slug(p_name);
  
  -- Try to find existing theme
  SELECT id INTO v_theme_id
  FROM themes
  WHERE company_id = p_company_id 
    AND slug = v_slug;
  
  -- Create if not found
  IF v_theme_id IS NULL THEN
    INSERT INTO themes (
      company_id,
      name,
      description,
      slug,
      related_tag_ids,
      discovered_by
    ) VALUES (
      p_company_id,
      p_name,
      p_description,
      v_slug,
      p_related_tag_ids,
      p_discovered_by
    ) RETURNING id INTO v_theme_id;
  END IF;
  
  RETURN v_theme_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update theme metrics
CREATE OR REPLACE FUNCTION update_theme_metrics(p_theme_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE themes SET
    mention_count = (
      SELECT 
        COALESCE(
          (SELECT COUNT(*) FROM survey_responses sr WHERE sr.id = ANY(themes.supporting_survey_response_ids)), 0
        ) +
        COALESCE(
          (SELECT COUNT(*) FROM feedback_items fi WHERE fi.id = ANY(themes.supporting_feedback_item_ids)), 0
        )
    ),
    customer_count = (
      SELECT COUNT(DISTINCT customer_id)
      FROM (
        SELECT sr.customer_id FROM survey_responses sr WHERE sr.id = ANY(themes.supporting_survey_response_ids)
        UNION
        SELECT fi.customer_id FROM feedback_items fi WHERE fi.id = ANY(themes.supporting_feedback_item_ids)
      ) all_customers
      WHERE customer_id IS NOT NULL
    ),
    avg_sentiment = (
      SELECT AVG(sentiment_score)
      FROM (
        SELECT sr.sentiment_score FROM survey_responses sr WHERE sr.id = ANY(themes.supporting_survey_response_ids) AND sr.sentiment_score IS NOT NULL
        UNION ALL
        SELECT fi.sentiment_score FROM feedback_items fi WHERE fi.id = ANY(themes.supporting_feedback_item_ids) AND fi.sentiment_score IS NOT NULL
      ) all_sentiments
    ),
    first_seen = (
      SELECT MIN(created_date)
      FROM (
        SELECT sr.submitted_at as created_date FROM survey_responses sr WHERE sr.id = ANY(themes.supporting_survey_response_ids)
        UNION
        SELECT fi.created_at as created_date FROM feedback_items fi WHERE fi.id = ANY(themes.supporting_feedback_item_ids)
      ) all_dates
    ),
    last_seen = (
      SELECT MAX(created_date)
      FROM (
        SELECT sr.submitted_at as created_date FROM survey_responses sr WHERE sr.id = ANY(themes.supporting_survey_response_ids)
        UNION
        SELECT fi.created_at as created_date FROM feedback_items fi WHERE fi.id = ANY(themes.supporting_feedback_item_ids)
      ) all_dates
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_theme_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Themes with enhanced data
-- ============================================================================

CREATE OR REPLACE VIEW themes_enriched AS
SELECT 
  t.*,
  -- Recent activity (last 30 days)
  (
    SELECT 
      COALESCE(
        (SELECT COUNT(*) FROM survey_responses sr WHERE sr.id = ANY(t.supporting_survey_response_ids) AND sr.submitted_at >= CURRENT_DATE - INTERVAL '30 days'), 0
      ) +
      COALESCE(
        (SELECT COUNT(*) FROM feedback_items fi WHERE fi.id = ANY(t.supporting_feedback_item_ids) AND fi.created_at >= CURRENT_DATE - INTERVAL '30 days'), 0
      )
  ) as recent_activity_count,
  
  -- Tag names from related tag IDs
  (
    SELECT array_agg(tag.name ORDER BY tag.name)
    FROM tags tag
    WHERE tag.id = ANY(t.related_tag_ids)
  ) as related_tag_names,
  
  -- Source breakdown
  (
    SELECT jsonb_object_agg(source_type, source_count)
    FROM (
      SELECT 'survey' as source_type, COUNT(*) as source_count
      FROM survey_responses sr
      WHERE sr.id = ANY(t.supporting_survey_response_ids)
      UNION ALL
      SELECT fi.source_type, COUNT(*) as source_count
      FROM feedback_items fi
      WHERE fi.id = ANY(t.supporting_feedback_item_ids)
      GROUP BY fi.source_type
    ) source_stats
  ) as source_breakdown_view

FROM themes t;
