-- ============================================================================
-- MIGRATION: Survey Insights → Unified Feedback Platform
-- ============================================================================
-- This migration safely transforms existing database to customer-centric model
-- Run this INSTEAD of schema_unified_platform.sql if you have existing tables
-- ============================================================================

-- ============================================================================
-- STEP 1: Create NEW tables (that don't exist yet)
-- ============================================================================

-- Customers table (NEW)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Primary identity
    primary_email VARCHAR(255),
    full_name VARCHAR(255),
    
    -- Demographics (optional)
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    location VARCHAR(255),
    
    -- Subscription info
    subscription_tier VARCHAR(50),
    account_status VARCHAR(50) DEFAULT 'active',
    
    -- Tracking
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer identifiers (NEW)
CREATE TABLE IF NOT EXISTS customer_identifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    identifier_type VARCHAR(50) NOT NULL,
    identifier_value VARCHAR(255) NOT NULL,
    confidence_score DECIMAL(3,2),
    verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(identifier_type, identifier_value, customer_id)
);

-- Customer merges (NEW)
CREATE TABLE IF NOT EXISTS customer_merges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_customer_id UUID NOT NULL REFERENCES customers(id),
    merged_customer_id UUID NOT NULL,
    merged_by UUID REFERENCES admin_users(id),
    merge_reason TEXT,
    merged_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback items - polymorphic table (NEW)
CREATE TABLE IF NOT EXISTS feedback_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    source_type VARCHAR(50) NOT NULL,
    source_id UUID NOT NULL,
    source_table VARCHAR(100) NOT NULL,
    
    title VARCHAR(500),
    content TEXT,
    
    sentiment_score DECIMAL(3,2),
    ai_summary TEXT,
    ai_tags TEXT[] DEFAULT '{}',
    themes TEXT[] DEFAULT '{}',
    priority_score INTEGER DEFAULT 50,
    
    status VARCHAR(50) DEFAULT 'new',
    assigned_to UUID REFERENCES admin_users(id),
    
    feedback_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_source_type CHECK (source_type IN ('survey', 'interview', 'review', 'reddit', 'support_ticket'))
);

-- Interviews (NEW)
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    title VARCHAR(500) NOT NULL,
    description TEXT,
    interview_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    interviewer_id UUID REFERENCES admin_users(id),
    participant_name VARCHAR(255),
    participant_email VARCHAR(255),
    
    notes TEXT,
    recording_url TEXT,
    transcript TEXT,
    
    ai_summary TEXT,
    key_quotes JSONB,
    themes TEXT[] DEFAULT '{}',
    sentiment_score DECIMAL(3,2),
    
    status VARCHAR(50) DEFAULT 'scheduled',
    
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews (NEW)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    platform VARCHAR(50) NOT NULL,
    platform_review_id VARCHAR(255),
    review_url TEXT,
    
    title VARCHAR(500),
    content TEXT NOT NULL,
    rating DECIMAL(2,1),
    author_name VARCHAR(255),
    
    sentiment_score DECIMAL(3,2),
    ai_summary TEXT,
    themes TEXT[] DEFAULT '{}',
    ai_tags TEXT[] DEFAULT '{}',
    priority_score INTEGER,
    
    company_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES admin_users(id),
    
    review_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(platform, platform_review_id)
);

-- Reddit mentions (NEW)
CREATE TABLE IF NOT EXISTS reddit_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    reddit_post_id VARCHAR(255) UNIQUE,
    reddit_comment_id VARCHAR(255),
    subreddit VARCHAR(255),
    author VARCHAR(255),
    post_title TEXT,
    content TEXT NOT NULL,
    url TEXT,
    upvotes INTEGER DEFAULT 0,
    
    relevance_score DECIMAL(3,2),
    sentiment_score DECIMAL(3,2),
    ai_summary TEXT,
    themes TEXT[] DEFAULT '{}',
    mentioned_features TEXT[] DEFAULT '{}',
    mentioned_competitors TEXT[] DEFAULT '{}',
    
    post_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI insights (NEW)
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    insight_type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    supporting_feedback_ids UUID[] DEFAULT '{}',
    confidence_score DECIMAL(3,2),
    impact_score INTEGER,
    
    insight_data JSONB,
    
    status VARCHAR(50) DEFAULT 'new',
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- AI cost logs (NEW)
CREATE TABLE IF NOT EXISTS ai_cost_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    
    request_type VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    
    estimated_cost DECIMAL(10,6),
    
    cache_hit BOOLEAN DEFAULT false,
    cache_key VARCHAR(255),
    
    related_table VARCHAR(100),
    related_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer health scores (NEW)
CREATE TABLE IF NOT EXISTS customer_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    health_score INTEGER NOT NULL,
    churn_risk_score INTEGER NOT NULL,
    
    sentiment_trend VARCHAR(50),
    feedback_frequency VARCHAR(50),
    recent_negative_feedback_count INTEGER DEFAULT 0,
    days_since_last_activity INTEGER,
    
    risk_factors JSONB,
    recommendations JSONB,
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_scores CHECK (
        health_score BETWEEN 0 AND 100 AND 
        churn_risk_score BETWEEN 0 AND 100
    )
);

-- Privacy requests (NEW)
CREATE TABLE IF NOT EXISTS privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    request_type VARCHAR(50) NOT NULL,
    requestor_email VARCHAR(255) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'pending',
    
    processed_by UUID REFERENCES admin_users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    
    export_file_url TEXT,
    deletion_confirmation_sent BOOLEAN DEFAULT false,
    
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_request_type CHECK (
        request_type IN ('data_export', 'data_deletion', 'opt_out_sharing', 'correction')
    )
);

-- PII detection logs (NEW)
CREATE TABLE IF NOT EXISTS pii_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    source_table VARCHAR(100) NOT NULL,
    source_id UUID NOT NULL,
    
    detected_pii_types TEXT[] DEFAULT '{}',
    content_snippet TEXT,
    
    action_taken VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STEP 2: Modify EXISTING tables to add new columns
-- ============================================================================

-- Add customer_id to survey_links (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'survey_links' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE survey_links ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add columns to survey_responses (if not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'survey_responses' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE survey_responses ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'survey_responses' AND column_name = 'sentiment_score'
    ) THEN
        ALTER TABLE survey_responses ADD COLUMN sentiment_score DECIMAL(3,2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'survey_responses' AND column_name = 'ai_tags'
    ) THEN
        ALTER TABLE survey_responses ADD COLUMN ai_tags TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'survey_responses' AND column_name = 'priority_score'
    ) THEN
        ALTER TABLE survey_responses ADD COLUMN priority_score INTEGER;
    END IF;
END $$;

-- Add AI columns to surveys (if not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'surveys' AND column_name = 'enable_ai_analysis'
    ) THEN
        ALTER TABLE surveys ADD COLUMN enable_ai_analysis BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'surveys' AND column_name = 'ai_summary_cache_key'
    ) THEN
        ALTER TABLE surveys ADD COLUMN ai_summary_cache_key VARCHAR(255);
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(primary_email);
CREATE INDEX IF NOT EXISTS idx_customers_last_activity ON customers(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_customer_identifiers_customer ON customer_identifiers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_identifiers_value ON customer_identifiers(identifier_value);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_items_customer ON feedback_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_company ON feedback_items(company_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_source ON feedback_items(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_date ON feedback_items(feedback_date DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_items_priority ON feedback_items(priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_survey_responses_customer ON survey_responses(customer_id);
CREATE INDEX IF NOT EXISTS idx_survey_links_customer ON survey_links(customer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_customer ON interviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_platform ON reviews(platform, platform_review_id);

-- AI indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_company ON ai_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);
CREATE INDEX IF NOT EXISTS idx_ai_cost_logs_company ON ai_cost_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_logs_created ON ai_cost_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_health_scores_customer ON customer_health_scores(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_health_scores_risk ON customer_health_scores(churn_risk_score DESC);

-- ============================================================================
-- STEP 4: Enable RLS on new tables
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_detection_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create RLS policies for new tables
-- ============================================================================

-- Customers policies
CREATE POLICY customers_select_own_company ON customers
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY customers_manage_own_company ON customers
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM admin_users 
            WHERE id = auth.uid() 
            AND role IN ('company_admin', 'admin')
            AND is_active = true
        )
    );

-- Feedback items policies
CREATE POLICY feedback_items_select_own_company ON feedback_items
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY feedback_items_manage_own_company ON feedback_items
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM admin_users 
            WHERE id = auth.uid() 
            AND role IN ('company_admin', 'admin')
            AND is_active = true
        )
    );

-- Apply similar policies to other new tables
CREATE POLICY interviews_access_own_company ON interviews
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY reviews_access_own_company ON reviews
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY reddit_mentions_access_own_company ON reddit_mentions
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY ai_insights_access_own_company ON ai_insights
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY ai_cost_logs_access_own_company ON ai_cost_logs
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY customer_health_scores_access_own_company ON customer_health_scores
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

-- ============================================================================
-- STEP 6: Create/update triggers
-- ============================================================================

-- Trigger to update updated_at (apply to new tables)
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_items_updated_at BEFORE UPDATE ON feedback_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reddit_mentions_updated_at BEFORE UPDATE ON reddit_mentions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create feedback_item when survey response is submitted
CREATE OR REPLACE FUNCTION create_feedback_item_from_survey()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO feedback_items (
        customer_id,
        company_id,
        source_type,
        source_id,
        source_table,
        feedback_date
    )
    SELECT 
        NEW.customer_id,
        s.company_id,
        'survey',
        NEW.id,
        'survey_responses',
        NEW.submitted_at
    FROM surveys s
    WHERE s.id = NEW.survey_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS survey_response_create_feedback_item ON survey_responses;
CREATE TRIGGER survey_response_create_feedback_item
    AFTER INSERT ON survey_responses
    FOR EACH ROW
    EXECUTE FUNCTION create_feedback_item_from_survey();

-- Function to update customer last_activity
CREATE OR REPLACE FUNCTION update_customer_last_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE customers
    SET last_activity = NEW.feedback_date
    WHERE id = NEW.customer_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS feedback_item_update_customer_activity ON feedback_items;
CREATE TRIGGER feedback_item_update_customer_activity
    AFTER INSERT ON feedback_items
    FOR EACH ROW
    WHEN (NEW.customer_id IS NOT NULL)
    EXECUTE FUNCTION update_customer_last_activity();

-- ============================================================================
-- STEP 7: Create helpful views
-- ============================================================================

-- Drop view if exists, then create
DROP VIEW IF EXISTS customer_feedback_summary;
CREATE VIEW customer_feedback_summary AS
SELECT 
    c.id AS customer_id,
    c.full_name,
    c.primary_email,
    c.company_id,
    COUNT(fi.id) AS total_feedback_count,
    AVG(fi.sentiment_score) AS avg_sentiment,
    MAX(fi.feedback_date) AS last_feedback_date,
    SUM(CASE WHEN fi.priority_score > 75 THEN 1 ELSE 0 END) AS high_priority_count
FROM customers c
LEFT JOIN feedback_items fi ON fi.customer_id = c.id
GROUP BY c.id, c.full_name, c.primary_email, c.company_id;

-- ============================================================================
-- MIGRATION COMPLETE! ✅
-- ============================================================================

-- To verify:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

