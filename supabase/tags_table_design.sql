-- ============================================================================
-- ENHANCED TAGS SYSTEM DESIGN
-- ============================================================================
-- This adds a proper tags table with metadata and relationships
-- while keeping the existing array-based approach for performance
-- ============================================================================

-- ============================================================================
-- TAGS TABLE (NEW - Centralized tag management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Core tag info
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL, -- lowercase, trimmed for matching
    description TEXT,
    
    -- Metadata
    category VARCHAR(50), -- 'feature', 'sentiment', 'topic', 'industry', etc.
    color VARCHAR(7), -- hex color for UI
    icon VARCHAR(50), -- icon name for UI
    
    -- Usage stats (cached for performance)
    usage_count INTEGER DEFAULT 0,
    first_used TIMESTAMP WITH TIME ZONE,
    last_used TIMESTAMP WITH TIME ZONE,
    avg_sentiment DECIMAL(3,2),
    
    -- Management
    is_system_tag BOOLEAN DEFAULT false, -- AI-generated vs manual
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES admin_users(id),
    
    -- Relationships
    parent_tag_id UUID REFERENCES tags(id), -- for tag hierarchies
    aliases TEXT[] DEFAULT '{}', -- alternative names
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(company_id, normalized_name),
    CONSTRAINT valid_category CHECK (category IN ('feature', 'sentiment', 'topic', 'industry', 'custom'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_company_name ON tags(company_id, normalized_name);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(company_id, category);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(company_id, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_tags_active ON tags(company_id, is_active) WHERE is_active = true;

-- ============================================================================
-- TAG USAGE TRACKING (NEW - Junction table for detailed tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tag_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Source tracking
    source_type VARCHAR(50) NOT NULL, -- 'feedback_item', 'survey_response', 'review'
    source_id UUID NOT NULL,
    
    -- Context
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    sentiment_score DECIMAL(3,2),
    
    -- Metadata
    confidence_score DECIMAL(3,2), -- AI confidence in tag assignment
    is_manual BOOLEAN DEFAULT false, -- manually added vs AI-generated
    
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(tag_id, source_type, source_id),
    CONSTRAINT valid_source_type CHECK (source_type IN ('feedback_item', 'survey_response', 'review', 'interview'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tag_usages_tag ON tag_usages(tag_id);
CREATE INDEX IF NOT EXISTS idx_tag_usages_source ON tag_usages(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_tag_usages_customer ON tag_usages(customer_id);
CREATE INDEX IF NOT EXISTS idx_tag_usages_company ON tag_usages(company_id);

-- ============================================================================
-- TAG RELATIONSHIPS (NEW - For tag hierarchies and related tags)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tag_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    source_tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    target_tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    
    relationship_type VARCHAR(50) NOT NULL, -- 'parent', 'child', 'related', 'synonym', 'antonym'
    strength DECIMAL(3,2) DEFAULT 0.5, -- relationship strength 0.0 to 1.0
    
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(source_tag_id, target_tag_id, relationship_type),
    CONSTRAINT valid_relationship CHECK (relationship_type IN ('parent', 'child', 'related', 'synonym', 'antonym')),
    CONSTRAINT no_self_reference CHECK (source_tag_id != target_tag_id)
);

-- ============================================================================
-- FUNCTIONS FOR TAG MANAGEMENT
-- ============================================================================

-- Function to normalize tag names
CREATE OR REPLACE FUNCTION normalize_tag_name(tag_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(TRIM(tag_name));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find or create a tag
CREATE OR REPLACE FUNCTION find_or_create_tag(
    p_company_id UUID,
    p_tag_name TEXT,
    p_category VARCHAR(50) DEFAULT 'topic',
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_tag_id UUID;
    v_normalized_name TEXT;
BEGIN
    v_normalized_name := normalize_tag_name(p_tag_name);
    
    -- Try to find existing tag
    SELECT id INTO v_tag_id
    FROM tags
    WHERE company_id = p_company_id 
      AND normalized_name = v_normalized_name
      AND is_active = true;
    
    -- Create if not found
    IF v_tag_id IS NULL THEN
        INSERT INTO tags (
            company_id,
            name,
            normalized_name,
            category,
            is_system_tag,
            created_by
        ) VALUES (
            p_company_id,
            p_tag_name,
            v_normalized_name,
            p_category,
            p_created_by IS NULL, -- system tag if no created_by
            p_created_by
        ) RETURNING id INTO v_tag_id;
    END IF;
    
    RETURN v_tag_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update tag usage statistics
CREATE OR REPLACE FUNCTION update_tag_usage_stats(p_tag_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE tags SET
        usage_count = (
            SELECT COUNT(*) 
            FROM tag_usages 
            WHERE tag_id = p_tag_id
        ),
        first_used = (
            SELECT MIN(used_at) 
            FROM tag_usages 
            WHERE tag_id = p_tag_id
        ),
        last_used = (
            SELECT MAX(used_at) 
            FROM tag_usages 
            WHERE tag_id = p_tag_id
        ),
        avg_sentiment = (
            SELECT AVG(sentiment_score) 
            FROM tag_usages 
            WHERE tag_id = p_tag_id 
              AND sentiment_score IS NOT NULL
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_tag_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC STATS UPDATES
-- ============================================================================

-- Trigger to update tag stats when usage is added
CREATE OR REPLACE FUNCTION trigger_update_tag_stats()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_tag_usage_stats(NEW.tag_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tag_usage_update_stats
    AFTER INSERT OR UPDATE OR DELETE ON tag_usages
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_tag_stats();

-- ============================================================================
-- ENHANCED GET_TOP_TAGS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_top_tags_enhanced(
    p_company_id UUID,
    p_limit INT DEFAULT 100,
    p_category VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE(
    tag_id UUID,
    name TEXT,
    normalized_name TEXT,
    description TEXT,
    category VARCHAR(50),
    color VARCHAR(7),
    usage_count BIGINT,
    avg_sentiment DECIMAL(5,2),
    first_seen TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE,
    sources JSONB,
    related_tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.normalized_name,
        t.description,
        t.category,
        t.color,
        t.usage_count,
        t.avg_sentiment,
        t.first_used as first_seen,
        t.last_used as last_seen,
        -- Source breakdown
        (
            SELECT jsonb_object_agg(source_type, source_count)
            FROM (
                SELECT 
                    tu.source_type,
                    COUNT(*) as source_count
                FROM tag_usages tu
                WHERE tu.tag_id = t.id
                GROUP BY tu.source_type
            ) source_stats
        ) as sources,
        -- Related tags (first 5)
        (
            SELECT array_agg(related_tag.name ORDER BY tr.strength DESC)
            FROM tag_relationships tr
            JOIN tags related_tag ON related_tag.id = tr.target_tag_id
            WHERE tr.source_tag_id = t.id
              AND tr.relationship_type = 'related'
            LIMIT 5
        ) as related_tags
    FROM tags t
    WHERE t.company_id = p_company_id
      AND t.is_active = true
      AND (p_category IS NULL OR t.category = p_category)
    ORDER BY t.usage_count DESC, t.last_used DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION FUNCTIONS
-- ============================================================================

-- Function to migrate existing array-based tags to the new system
CREATE OR REPLACE FUNCTION migrate_existing_tags(p_company_id UUID)
RETURNS TABLE(
    migrated_count INT,
    created_tags INT
) AS $$
DECLARE
    v_migrated_count INT := 0;
    v_created_tags INT := 0;
    tag_record RECORD;
BEGIN
    -- Migrate from feedback_items
    FOR tag_record IN
        SELECT DISTINCT UNNEST(ai_tags) as tag_name, 'feedback_item' as source_type, id as source_id, customer_id, sentiment_score, created_at
        FROM feedback_items
        WHERE company_id = p_company_id
          AND ai_tags IS NOT NULL
          AND array_length(ai_tags, 1) > 0
    LOOP
        -- Create tag if it doesn't exist
        INSERT INTO tags (company_id, name, normalized_name, category, is_system_tag, created_by)
        VALUES (p_company_id, tag_record.tag_name, normalize_tag_name(tag_record.tag_name), 'topic', true, NULL)
        ON CONFLICT (company_id, normalized_name) DO NOTHING;
        
        -- Record usage
        INSERT INTO tag_usages (tag_id, company_id, source_type, source_id, customer_id, sentiment_score, used_at)
        SELECT t.id, p_company_id, tag_record.source_type, tag_record.source_id, tag_record.customer_id, tag_record.sentiment_score, tag_record.created_at
        FROM tags t
        WHERE t.company_id = p_company_id 
          AND t.normalized_name = normalize_tag_name(tag_record.tag_name)
        ON CONFLICT (tag_id, source_type, source_id) DO NOTHING;
        
        v_migrated_count := v_migrated_count + 1;
    END LOOP;
    
    -- Update tag statistics
    UPDATE tags SET
        usage_count = (
            SELECT COUNT(*) 
            FROM tag_usages 
            WHERE tag_id = tags.id
        ),
        first_used = (
            SELECT MIN(used_at) 
            FROM tag_usages 
            WHERE tag_id = tags.id
        ),
        last_used = (
            SELECT MAX(used_at) 
            FROM tag_usages 
            WHERE tag_id = tags.id
        ),
        avg_sentiment = (
            SELECT AVG(sentiment_score) 
            FROM tag_usages 
            WHERE tag_id = tags.id 
              AND sentiment_score IS NOT NULL
        )
    WHERE company_id = p_company_id;
    
    -- Count created tags
    SELECT COUNT(*) INTO v_created_tags
    FROM tags
    WHERE company_id = p_company_id;
    
    RETURN QUERY SELECT v_migrated_count, v_created_tags;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR EASIER QUERYING
-- ============================================================================

-- View: Company tags with usage stats
CREATE OR REPLACE VIEW company_tags_summary AS
SELECT 
    t.id,
    t.company_id,
    t.name,
    t.normalized_name,
    t.description,
    t.category,
    t.color,
    t.usage_count,
    t.avg_sentiment,
    t.first_used,
    t.last_used,
    t.is_system_tag,
    t.is_active,
    -- Recent usage trend (last 30 days)
    (
        SELECT COUNT(*)
        FROM tag_usages tu
        WHERE tu.tag_id = t.id
          AND tu.used_at >= CURRENT_DATE - INTERVAL '30 days'
    ) as recent_usage_count
FROM tags t
WHERE t.is_active = true;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert some sample tags for testing
INSERT INTO tags (company_id, name, normalized_name, description, category, color, is_system_tag) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Takeoff', 'takeoff', 'Digital takeoff and measurement features', 'feature', '#3B82F6', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'AI', 'ai', 'Artificial intelligence and automation features', 'feature', '#8B5CF6', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Performance', 'performance', 'System performance and speed issues', 'topic', '#EF4444', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Integration', 'integration', 'Third-party integrations and APIs', 'feature', '#10B981', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'User Experience', 'user experience', 'UI/UX and usability feedback', 'topic', '#F59E0B', true)
ON CONFLICT (company_id, normalized_name) DO NOTHING;
