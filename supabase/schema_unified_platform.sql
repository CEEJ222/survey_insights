-- ============================================================================
-- UNIFIED FEEDBACK PLATFORM - COMPLETE SCHEMA
-- ============================================================================
-- This schema transforms Survey Insights into a customer-centric,
-- AI-powered feedback platform as outlined in the PRD.
--
-- Key Changes from Original:
-- 1. Customer-centric (not survey-centric)
-- 2. Polymorphic feedback_items table (all sources)
-- 3. AI infrastructure (insights, cost tracking, caching metadata)
-- 4. Identity resolution for customer matching
-- 5. Advanced features (health scores, interviews, reviews)
-- ============================================================================

-- ============================================================================
-- CORE TABLES (Keep from original with minor updates)
-- ============================================================================

-- Companies table (unchanged)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table (keep with role management)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin', -- company_admin, admin, user
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_role CHECK (role IN ('company_admin', 'admin', 'user'))
);

-- ============================================================================
-- CUSTOMER PROFILES (NEW - Core of customer-centric model)
-- ============================================================================

-- Main customer table - unified profile for all feedback sources
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
    account_status VARCHAR(50) DEFAULT 'active', -- active, churned, at_risk
    
    -- Tracking
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    custom_fields JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alternative identifiers for fuzzy matching
CREATE TABLE IF NOT EXISTS customer_identifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    identifier_type VARCHAR(50) NOT NULL, -- email, phone, external_id, username
    identifier_value VARCHAR(255) NOT NULL,
    
    -- For AI-assisted matching
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(identifier_type, identifier_value, customer_id)
);

-- Audit trail for customer merges
CREATE TABLE IF NOT EXISTS customer_merges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_customer_id UUID NOT NULL REFERENCES customers(id),
    merged_customer_id UUID NOT NULL, -- Historical ID (no FK - record deleted)
    merged_by UUID REFERENCES admin_users(id),
    merge_reason TEXT,
    merged_data JSONB, -- Store merged customer's data for audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FEEDBACK ITEMS (NEW - Polymorphic table for ALL feedback sources)
-- ============================================================================

-- Polymorphic table linking all feedback to customers
CREATE TABLE IF NOT EXISTS feedback_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Source tracking
    source_type VARCHAR(50) NOT NULL, -- survey, interview, review, reddit, support_ticket
    source_id UUID NOT NULL, -- Points to specific record in source table
    source_table VARCHAR(100) NOT NULL, -- Table name for reference
    
    -- Core content
    title VARCHAR(500),
    content TEXT,
    
    -- AI-generated metadata
    sentiment_score DECIMAL(3,2), -- -1.00 (negative) to 1.00 (positive)
    ai_summary TEXT,
    ai_tags TEXT[] DEFAULT '{}',
    themes TEXT[] DEFAULT '{}',
    priority_score INTEGER DEFAULT 50, -- 0-100, AI-calculated urgency
    
    -- Status
    status VARCHAR(50) DEFAULT 'new', -- new, reviewed, in_progress, resolved, archived
    assigned_to UUID REFERENCES admin_users(id),
    
    -- Timestamps
    feedback_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for fast lookup
    CONSTRAINT valid_source_type CHECK (source_type IN ('survey', 'interview', 'review', 'reddit', 'support_ticket'))
);

-- ============================================================================
-- SURVEYS (Updated - now links to customers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL, -- Array of questions [{id, text, type, order}]
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed
    
    -- AI features
    enable_ai_analysis BOOLEAN DEFAULT true,
    ai_summary_cache_key VARCHAR(255), -- For Redis cache lookup
    
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Survey links (mostly unchanged, but now connects to customers)
CREATE TABLE IF NOT EXISTS survey_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- Link to customer
    
    token VARCHAR(255) NOT NULL UNIQUE,
    respondent_email VARCHAR(255),
    respondent_name VARCHAR(255),
    respondent_metadata JSONB,
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, opened, completed, expired
    opened_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Survey responses (now links to customers)
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_link_id UUID NOT NULL REFERENCES survey_links(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- Link to customer
    
    responses JSONB NOT NULL, -- {questionId: answer}
    metadata JSONB,
    
    -- AI analysis for this response
    sentiment_score DECIMAL(3,2),
    ai_tags TEXT[] DEFAULT '{}',
    priority_score INTEGER,
    
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Survey schedules (unchanged)
CREATE TABLE IF NOT EXISTS survey_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL, -- one_time, recurring, trigger_based
    schedule_config JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_send_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INTERVIEWS (NEW - Phase 2 feature)
-- ============================================================================

CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    title VARCHAR(500) NOT NULL,
    description TEXT,
    interview_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    -- Participants
    interviewer_id UUID REFERENCES admin_users(id),
    participant_name VARCHAR(255),
    participant_email VARCHAR(255),
    
    -- Content
    notes TEXT,
    recording_url TEXT,
    transcript TEXT, -- AI-generated transcript
    
    -- AI analysis
    ai_summary TEXT,
    key_quotes JSONB, -- [{quote, timestamp, theme}]
    themes TEXT[] DEFAULT '{}',
    sentiment_score DECIMAL(3,2),
    
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled
    
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- REVIEWS (NEW - Phase 3 feature)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Source
    platform VARCHAR(50) NOT NULL, -- trustpilot, g2, google, yelp, app_store, etc.
    platform_review_id VARCHAR(255), -- External ID from platform
    review_url TEXT,
    
    -- Content
    title VARCHAR(500),
    content TEXT NOT NULL,
    rating DECIMAL(2,1), -- 1.0 to 5.0 (normalized)
    author_name VARCHAR(255),
    
    -- AI analysis
    sentiment_score DECIMAL(3,2),
    ai_summary TEXT,
    themes TEXT[] DEFAULT '{}',
    ai_tags TEXT[] DEFAULT '{}',
    priority_score INTEGER,
    
    -- Response
    company_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES admin_users(id),
    
    review_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(platform, platform_review_id)
);

-- ============================================================================
-- REDDIT MENTIONS (NEW - Phase 3 feature)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reddit_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL, -- Usually anonymous
    
    -- Reddit data
    reddit_post_id VARCHAR(255) UNIQUE,
    reddit_comment_id VARCHAR(255),
    subreddit VARCHAR(255),
    author VARCHAR(255),
    post_title TEXT,
    content TEXT NOT NULL,
    url TEXT,
    upvotes INTEGER DEFAULT 0,
    
    -- AI analysis
    relevance_score DECIMAL(3,2), -- How relevant to our product
    sentiment_score DECIMAL(3,2),
    ai_summary TEXT,
    themes TEXT[] DEFAULT '{}',
    mentioned_features TEXT[] DEFAULT '{}',
    mentioned_competitors TEXT[] DEFAULT '{}',
    
    post_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AI INFRASTRUCTURE TABLES (NEW)
-- ============================================================================

-- AI-generated insights (cross-channel analysis)
CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    insight_type VARCHAR(50) NOT NULL, -- theme, trend, anomaly, recommendation
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Evidence
    supporting_feedback_ids UUID[] DEFAULT '{}', -- Array of feedback_item IDs
    confidence_score DECIMAL(3,2),
    impact_score INTEGER, -- Business impact estimate (0-100)
    
    -- Content
    insight_data JSONB, -- Flexible structure for different insight types
    
    -- Status
    status VARCHAR(50) DEFAULT 'new', -- new, reviewed, acting_on, resolved, dismissed
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE -- Insights can be time-sensitive
);

-- AI cost tracking
CREATE TABLE IF NOT EXISTS ai_cost_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Provider info
    provider VARCHAR(50) NOT NULL, -- openai, anthropic, aws_bedrock
    model VARCHAR(100) NOT NULL, -- gpt-4o-mini, claude-3-haiku, etc.
    
    -- Request details
    request_type VARCHAR(100), -- summarization, sentiment_analysis, tagging, etc.
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    
    -- Cost
    estimated_cost DECIMAL(10,6), -- In USD
    
    -- Cache
    cache_hit BOOLEAN DEFAULT false,
    cache_key VARCHAR(255),
    
    -- Context
    related_table VARCHAR(100), -- Which table triggered this
    related_id UUID, -- ID of the record
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer health scores (AI-calculated)
CREATE TABLE IF NOT EXISTS customer_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Scores
    health_score INTEGER NOT NULL, -- 0-100
    churn_risk_score INTEGER NOT NULL, -- 0-100 (higher = more risk)
    
    -- Contributing factors
    sentiment_trend VARCHAR(50), -- improving, declining, stable
    feedback_frequency VARCHAR(50), -- increasing, decreasing, stable
    recent_negative_feedback_count INTEGER DEFAULT 0,
    days_since_last_activity INTEGER,
    
    -- AI reasoning
    risk_factors JSONB, -- [{factor, weight, description}]
    recommendations JSONB, -- [{action, priority, expected_impact}]
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- Recalculate after this
    
    CONSTRAINT valid_scores CHECK (
        health_score BETWEEN 0 AND 100 AND 
        churn_risk_score BETWEEN 0 AND 100
    )
);

-- ============================================================================
-- PRIVACY & COMPLIANCE (CCPA/CPRA)
-- ============================================================================

-- Privacy requests (CCPA/CPRA compliance)
CREATE TABLE IF NOT EXISTS privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    request_type VARCHAR(50) NOT NULL, -- data_export, data_deletion, opt_out_sharing, correction
    requestor_email VARCHAR(255) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, rejected
    
    -- Processing
    processed_by UUID REFERENCES admin_users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    
    -- Data
    export_file_url TEXT, -- For data export requests
    deletion_confirmation_sent BOOLEAN DEFAULT false,
    
    -- Audit
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_request_type CHECK (
        request_type IN ('data_export', 'data_deletion', 'opt_out_sharing', 'correction')
    )
);

-- PII detection log (for compliance)
CREATE TABLE IF NOT EXISTS pii_detection_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    source_table VARCHAR(100) NOT NULL,
    source_id UUID NOT NULL,
    
    detected_pii_types TEXT[] DEFAULT '{}', -- email, phone, ssn, credit_card, etc.
    content_snippet TEXT, -- Masked snippet for audit
    
    action_taken VARCHAR(50), -- masked, redacted, flagged, allowed
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Existing indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_company ON admin_users(company_id);
CREATE INDEX IF NOT EXISTS idx_surveys_company ON surveys(company_id);
CREATE INDEX IF NOT EXISTS idx_survey_links_survey ON survey_links(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_links_token ON survey_links(token);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_link ON survey_responses(survey_link_id);
CREATE INDEX IF NOT EXISTS idx_survey_schedules_survey ON survey_schedules(survey_id);

-- New indexes for customer-centric queries
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(primary_email);
CREATE INDEX IF NOT EXISTS idx_customers_last_activity ON customers(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_customer_identifiers_customer ON customer_identifiers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_identifiers_value ON customer_identifiers(identifier_value);

CREATE INDEX IF NOT EXISTS idx_feedback_items_customer ON feedback_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_company ON feedback_items(company_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_source ON feedback_items(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_date ON feedback_items(feedback_date DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_items_priority ON feedback_items(priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_survey_responses_customer ON survey_responses(customer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_customer ON interviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_platform ON reviews(platform, platform_review_id);

CREATE INDEX IF NOT EXISTS idx_ai_insights_company ON ai_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);

CREATE INDEX IF NOT EXISTS idx_ai_cost_logs_company ON ai_cost_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_logs_created ON ai_cost_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_health_scores_customer ON customer_health_scores(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_health_scores_risk ON customer_health_scores(churn_risk_score DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reddit_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_detection_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS admin_users_select_own_company ON admin_users;
DROP POLICY IF EXISTS admin_users_insert_company_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_update_company_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_delete_company_admin ON admin_users;
DROP POLICY IF EXISTS surveys_select_own_company ON surveys;
DROP POLICY IF EXISTS surveys_manage_company_admin ON surveys;
DROP POLICY IF EXISTS survey_links_select_own_company ON survey_links;
DROP POLICY IF EXISTS survey_links_manage_company_admin ON survey_links;
DROP POLICY IF EXISTS survey_links_public_access ON survey_links;
DROP POLICY IF EXISTS survey_responses_select_own_company ON survey_responses;
DROP POLICY IF EXISTS survey_responses_public_insert ON survey_responses;

-- Admin users policies (unchanged)
CREATE POLICY admin_users_select_own_company ON admin_users
    FOR SELECT
    USING (
        id = auth.uid()
        OR
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid()
        )
    );

CREATE POLICY admin_users_insert_company_admin ON admin_users
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM admin_users 
            WHERE id = auth.uid() AND role = 'company_admin'
        )
    );

CREATE POLICY admin_users_update_company_admin ON admin_users
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM admin_users 
            WHERE id = auth.uid() AND role = 'company_admin'
        )
    );

CREATE POLICY admin_users_delete_company_admin ON admin_users
    FOR DELETE
    USING (
        id != auth.uid() AND
        company_id IN (
            SELECT company_id FROM admin_users 
            WHERE id = auth.uid() AND role = 'company_admin'
        )
    );

-- Customer policies
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

-- Survey policies (updated)
CREATE POLICY surveys_select_own_company ON surveys
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY surveys_manage_company_admin ON surveys
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM admin_users 
            WHERE id = auth.uid() 
            AND role IN ('company_admin', 'admin')
            AND is_active = true
        )
    );

-- Survey links policies
CREATE POLICY survey_links_select_own_company ON survey_links
    FOR SELECT
    USING (
        survey_id IN (
            SELECT id FROM surveys WHERE company_id IN (
                SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
            )
        )
    );

CREATE POLICY survey_links_manage_company_admin ON survey_links
    FOR ALL
    USING (
        survey_id IN (
            SELECT id FROM surveys WHERE company_id IN (
                SELECT company_id FROM admin_users 
                WHERE id = auth.uid() 
                AND role IN ('company_admin', 'admin')
                AND is_active = true
            )
        )
    );

-- Public access for survey respondents
CREATE POLICY survey_links_public_access ON survey_links
    FOR SELECT
    USING (true);

CREATE POLICY survey_responses_public_insert ON survey_responses
    FOR INSERT
    WITH CHECK (true);

-- Survey responses policies
CREATE POLICY survey_responses_select_own_company ON survey_responses
    FOR SELECT
    USING (
        survey_id IN (
            SELECT id FROM surveys WHERE company_id IN (
                SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
            )
        )
    );

-- Apply similar policies to new tables (interviews, reviews, etc.)
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
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
DROP TRIGGER IF EXISTS update_survey_schedules_updated_at ON survey_schedules;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_items_updated_at BEFORE UPDATE ON feedback_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_schedules_updated_at BEFORE UPDATE ON survey_schedules
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

-- Trigger to auto-create feedback_item
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

-- Trigger to update customer activity
CREATE TRIGGER feedback_item_update_customer_activity
    AFTER INSERT ON feedback_items
    FOR EACH ROW
    WHEN (NEW.customer_id IS NOT NULL)
    EXECUTE FUNCTION update_customer_last_activity();

-- ============================================================================
-- HELPER VIEWS (Optional - for easier querying)
-- ============================================================================

-- View: Customer feedback summary
CREATE OR REPLACE VIEW customer_feedback_summary AS
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
-- SEED DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to create a test company and admin
/*
INSERT INTO companies (name) VALUES ('Test Company')
RETURNING id;

-- Note: You'll need to create the auth.users entry through Supabase Auth
-- Then link it here with admin_users
*/

