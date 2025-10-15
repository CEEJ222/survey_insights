-- ================================================
-- MIGRATION: Add User Management Support
-- Date: 2025-10-14
-- Description: Adds role-based access control with
--              company_admin, admin, and user roles
-- 
-- SAFE TO RUN: This migration is idempotent
-- ================================================

BEGIN;

-- Step 1: Add new columns to admin_users table (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'is_active') THEN
        ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'invited_by') THEN
        ALTER TABLE admin_users ADD COLUMN invited_by UUID REFERENCES admin_users(id);
    END IF;
END $$;

-- Step 2: Update existing users to be active
UPDATE admin_users SET is_active = true WHERE is_active IS NULL;

-- Step 3: Add role constraint (drop first if exists)
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS valid_role;
ALTER TABLE admin_users ADD CONSTRAINT valid_role CHECK (role IN ('company_admin', 'admin', 'user'));

-- Step 4: Promote first user of each company to company_admin
-- (You may want to customize this based on your needs)
UPDATE admin_users SET role = 'company_admin'
WHERE id IN (
    SELECT DISTINCT ON (company_id) id
    FROM admin_users
    ORDER BY company_id, created_at ASC
);

-- Step 5: Drop old policies
DROP POLICY IF EXISTS admin_users_select_own_company ON admin_users;
DROP POLICY IF EXISTS admin_users_insert_company_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_update_company_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_delete_company_admin ON admin_users;
DROP POLICY IF EXISTS surveys_select_own_company ON surveys;
DROP POLICY IF EXISTS surveys_manage_company_admin ON surveys;
DROP POLICY IF EXISTS survey_links_select_own_company ON survey_links;
DROP POLICY IF EXISTS survey_links_manage_company_admin ON survey_links;
DROP POLICY IF EXISTS survey_responses_select_own_company ON survey_responses;

-- Step 6: Create new RLS policies for admin_users
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

-- Step 7: Update survey policies
CREATE POLICY surveys_select_own_company ON surveys
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM admin_users 
            WHERE id = auth.uid() AND is_active = true
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

-- Step 8: Update survey_links policies
CREATE POLICY survey_links_select_own_company ON survey_links
    FOR SELECT
    USING (
        survey_id IN (
            SELECT id FROM surveys WHERE company_id IN (
                SELECT company_id FROM admin_users 
                WHERE id = auth.uid() AND is_active = true
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

-- Step 9: Update survey_responses policies
CREATE POLICY survey_responses_select_own_company ON survey_responses
    FOR SELECT
    USING (
        survey_id IN (
            SELECT id FROM surveys WHERE company_id IN (
                SELECT company_id FROM admin_users 
                WHERE id = auth.uid() AND is_active = true
            )
        )
    );

-- Step 10: Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_admin_users_company ON admin_users(company_id);
CREATE INDEX IF NOT EXISTS idx_surveys_company ON surveys(company_id);
CREATE INDEX IF NOT EXISTS idx_survey_links_survey ON survey_links(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_links_token ON survey_links(token);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_link ON survey_responses(survey_link_id);
CREATE INDEX IF NOT EXISTS idx_survey_schedules_survey ON survey_schedules(survey_id);

COMMIT;

-- ================================================
-- VERIFICATION QUERIES
-- Run these after migration to verify success:
-- ================================================

-- Check that columns were added
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'admin_users'
--   AND column_name IN ('is_active', 'invited_by');

-- Check that constraint exists
-- SELECT constraint_name, check_clause
-- FROM information_schema.check_constraints
-- WHERE constraint_name = 'valid_role';

-- Check user roles
-- SELECT id, email, role, is_active FROM admin_users;

-- Verify policies exist
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies
-- WHERE tablename IN ('admin_users', 'surveys', 'survey_links', 'survey_responses')
-- ORDER BY tablename, policyname;

