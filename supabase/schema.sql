-- Survey Insights Database Schema

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin users table (linked to Supabase auth)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX idx_admin_users_company ON admin_users(company_id);
CREATE INDEX idx_surveys_company ON surveys(company_id);
CREATE INDEX idx_survey_links_survey ON survey_links(survey_id);
CREATE INDEX idx_survey_links_token ON survey_links(token);
CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_link ON survey_responses(survey_link_id);
CREATE INDEX idx_survey_schedules_survey ON survey_schedules(survey_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_schedules ENABLE ROW LEVEL SECURITY;

-- Admin users can access their company's data
CREATE POLICY admin_users_select_own_company ON admin_users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY surveys_select_own_company ON surveys
    FOR ALL
    USING (
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid()
        )
    );

CREATE POLICY survey_links_select_own_company ON survey_links
    FOR ALL
    USING (
        survey_id IN (
            SELECT id FROM surveys WHERE company_id IN (
                SELECT company_id FROM admin_users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY survey_responses_select_own_company ON survey_responses
    FOR SELECT
    USING (
        survey_id IN (
            SELECT id FROM surveys WHERE company_id IN (
                SELECT company_id FROM admin_users WHERE id = auth.uid()
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

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON surveys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_schedules_updated_at BEFORE UPDATE ON survey_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

