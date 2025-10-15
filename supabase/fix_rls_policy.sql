-- Fix RLS policy to allow users to read their own record
-- This fixes the "no admin access" issue

-- Drop and recreate the admin_users SELECT policy
DROP POLICY IF EXISTS admin_users_select_own_company ON admin_users;

-- New policy: Users can read their own record AND other users in their company
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

-- Verify the policy was created
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'admin_users' AND policyname = 'admin_users_select_own_company';

