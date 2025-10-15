-- Survey Insights Database Schema
-- This schema file is idempotent and safe to run multiple times
-- Note: If tables already exist, you may need to use ALTER TABLE to add new columns/constraints

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table (linked to Supabase auth)
-- Roles: company_admin (full access + user management), admin (manage surveys), user (view only)
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

-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL, -- Array of questions [{id, text, order}]
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Survey links (unique links for each respondent)
CREATE TABLE IF NOT EXISTS survey_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    respondent_email VARCHAR(255),
    respondent_name VARCHAR(255),
    respondent_metadata JSONB, -- Additional respondent info
    status VARCHAR(50) DEFAULT 'pending', -- pending, opened, completed, expired
    opened_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Survey responses table
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_link_id UUID NOT NULL REFERENCES survey_links(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    responses JSONB NOT NULL, -- {questionId: answer}
    metadata JSONB, -- Browser info, IP, etc.
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Survey sending schedules
CREATE TABLE IF NOT EXISTS survey_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL, -- one_time, recurring, trigger_based
    schedule_config JSONB NOT NULL, -- Configuration for schedule
    status VARCHAR(50) DEFAULT 'active', -- active, paused, completed
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_send_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_company ON admin_users(company_id);
CREATE INDEX IF NOT EXISTS idx_surveys_company ON surveys(company_id);
CREATE INDEX IF NOT EXISTS idx_survey_links_survey ON survey_links(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_links_token ON survey_links(token);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_link ON survey_responses(survey_link_id);
CREATE INDEX IF NOT EXISTS idx_survey_schedules_survey ON survey_schedules(survey_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make this script idempotent)
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

-- Admin users can access their company's data
CREATE POLICY admin_users_select_own_company ON admin_users
    FOR SELECT
    USING (
        -- User can always read their own record
        id = auth.uid()
        OR
        -- User can read other users in their company
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid()
        )
    );

-- Company admins can insert new users to their company
CREATE POLICY admin_users_insert_company_admin ON admin_users
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM admin_users 
            WHERE id = auth.uid() AND role = 'company_admin'
        )
    );

-- Company admins can update users in their company
CREATE POLICY admin_users_update_company_admin ON admin_users
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM admin_users 
            WHERE id = auth.uid() AND role = 'company_admin'
        )
    );

-- Company admins can delete users in their company (except themselves)
CREATE POLICY admin_users_delete_company_admin ON admin_users
    FOR DELETE
    USING (
        id != auth.uid() AND
        company_id IN (
            SELECT company_id FROM admin_users 
            WHERE id = auth.uid() AND role = 'company_admin'
        )
    );

CREATE POLICY surveys_select_own_company ON surveys
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
        )
    );

-- Company admins and admins can create/update surveys
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

CREATE POLICY survey_links_select_own_company ON survey_links
    FOR SELECT
    USING (
        survey_id IN (
            SELECT id FROM surveys WHERE company_id IN (
                SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
            )
        )
    );

-- Company admins and admins can manage survey links
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

CREATE POLICY survey_responses_select_own_company ON survey_responses
    FOR SELECT
    USING (
        survey_id IN (
            SELECT id FROM surveys WHERE company_id IN (
                SELECT company_id FROM admin_users WHERE id = auth.uid() AND is_active = true
            )
        )
    );

-- Public access for survey respondents (via token)
CREATE POLICY survey_links_public_access ON survey_links
    FOR SELECT
    USING (true);

CREATE POLICY survey_responses_public_insert ON survey_responses
    FOR INSERT
    WITH CHECK (true);

-- Functions

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
DROP TRIGGER IF EXISTS update_survey_schedules_updated_at ON survey_schedules;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_schedules_updated_at BEFORE UPDATE ON survey_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

