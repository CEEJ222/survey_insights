# Database Migration Guide - User Management System

## Overview

This guide will help you migrate your existing database to support the new multi-user and role-based access control system.

## Migration Steps

### Step 1: Backup Your Database

**IMPORTANT**: Always backup your database before running migrations!

```bash
# Using Supabase CLI
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Or using Supabase Dashboard
# Go to Database > Backups and create a manual backup
```

### Step 2: Apply Schema Changes

You have two options:

#### Option A: Apply Full Schema (Recommended for New Projects)

If you're starting fresh or can recreate your database:

```bash
# Run the updated schema file
psql -U postgres -h your-db-host -d your-database -f supabase/schema.sql
```

#### Option B: Apply Migration SQL (For Existing Databases)

Create and run this migration SQL:

```sql
-- ================================================
-- MIGRATION: Add User Management Support
-- Date: 2025-10-14
-- Description: Adds role-based access control with
--              company_admin, admin, and user roles
-- ================================================

BEGIN;

-- Step 1: Add new columns to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES admin_users(id);

-- Step 2: Add role constraint
ALTER TABLE admin_users
DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE admin_users
ADD CONSTRAINT valid_role CHECK (role IN ('company_admin', 'admin', 'user'));

-- Step 3: Update existing users to be active
UPDATE admin_users SET is_active = true WHERE is_active IS NULL;

-- Step 4: Promote existing admins to company_admin
-- (You may want to customize this based on your needs)
UPDATE admin_users 
SET role = 'company_admin' 
WHERE role = 'admin';

-- Step 5: Drop old policies
DROP POLICY IF EXISTS admin_users_select_own_company ON admin_users;
DROP POLICY IF EXISTS surveys_select_own_company ON surveys;
DROP POLICY IF EXISTS survey_links_select_own_company ON survey_links;
DROP POLICY IF EXISTS survey_responses_select_own_company ON survey_responses;

-- Step 6: Create new RLS policies for admin_users
CREATE POLICY admin_users_select_own_company ON admin_users
    FOR SELECT
    USING (
        -- User can always read their own record (prevents circular dependency)
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
DROP POLICY IF EXISTS survey_links_select_own_company ON survey_links;

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
DROP POLICY IF EXISTS survey_responses_select_own_company ON survey_responses;

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

COMMIT;
```

### Step 3: Verify Migration

Run these verification queries:

```sql
-- Check that columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_users'
  AND column_name IN ('is_active', 'invited_by');

-- Check that constraint exists
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'valid_role';

-- Check user roles
SELECT id, email, role, is_active
FROM admin_users;

-- Verify policies exist
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'admin_users';
```

Expected results:
- ✅ `is_active` column exists (boolean)
- ✅ `invited_by` column exists (uuid, nullable)
- ✅ `valid_role` constraint exists
- ✅ All existing users have `is_active = true`
- ✅ At least one user has `role = 'company_admin'`
- ✅ 4 policies exist on `admin_users` table

### Step 4: Update Existing Companies

If you have existing companies, decide which user should be the company admin:

```sql
-- Option A: Make the oldest user in each company the company_admin
UPDATE admin_users au1
SET role = 'company_admin'
WHERE id IN (
    SELECT id
    FROM admin_users au2
    WHERE au2.company_id = au1.company_id
    ORDER BY created_at ASC
    LIMIT 1
);

-- Option B: Manually set specific users as company admins
UPDATE admin_users
SET role = 'company_admin'
WHERE email IN (
    'admin1@company1.com',
    'admin2@company2.com'
    -- Add more emails as needed
);

-- Set remaining users as regular admins
UPDATE admin_users
SET role = 'admin'
WHERE role NOT IN ('company_admin', 'user');
```

## Rollback Procedure

If something goes wrong, you can rollback:

```sql
BEGIN;

-- Remove new policies
DROP POLICY IF EXISTS admin_users_insert_company_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_update_company_admin ON admin_users;
DROP POLICY IF EXISTS admin_users_delete_company_admin ON admin_users;
DROP POLICY IF EXISTS surveys_manage_company_admin ON surveys;
DROP POLICY IF EXISTS survey_links_manage_company_admin ON survey_links;

-- Restore original policies (adjust based on your original schema)
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

-- Remove new columns (optional - may lose data!)
-- ALTER TABLE admin_users DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE admin_users DROP COLUMN IF EXISTS invited_by;

-- Remove role constraint
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS valid_role;

COMMIT;
```

## Post-Migration Testing

### Test 1: Company Admin Can Access User Management

```bash
# 1. Login as a company admin user
# 2. Navigate to /admin/dashboard
# 3. Verify "Team" menu appears in navigation
# 4. Click Team and verify user list loads
```

### Test 2: Company Admin Can Invite Users

```bash
# 1. Go to Team page
# 2. Click "Invite User"
# 3. Fill in user details
# 4. Verify user is created successfully
# 5. Check temporary password is displayed
```

### Test 3: Regular Admin Cannot Access User Management

```bash
# 1. Create or update a user with role = 'admin'
# 2. Login as that user
# 3. Verify "Team" menu does NOT appear
# 4. Verify direct access to /admin/dashboard/users shows error or redirects
```

### Test 4: User Permissions Work Correctly

```bash
# Test Company Admin:
- Can create surveys ✅
- Can send surveys ✅
- Can view responses ✅
- Can access Team page ✅

# Test Admin:
- Can create surveys ✅
- Can send surveys ✅
- Can view responses ✅
- Cannot access Team page ❌

# Test User (view-only):
- Can view surveys ✅
- Can view responses ✅
- Cannot create surveys ❌
- Cannot send surveys ❌
- Cannot access Team page ❌
```

## Common Issues & Solutions

### Issue 1: Migration Fails with "column already exists"

**Solution**: The column was already added. Skip to the next step or use `ADD COLUMN IF NOT EXISTS`.

### Issue 2: "permission denied for table admin_users"

**Solution**: Make sure you're running the migration with appropriate database privileges:

```sql
-- Check your role
SELECT current_user, current_database();

-- If needed, run as postgres user or database owner
```

### Issue 3: Existing users cannot log in

**Cause**: They might be marked as inactive or have an invalid role.

**Solution**:
```sql
-- Check user status
SELECT id, email, role, is_active FROM admin_users WHERE email = 'user@example.com';

-- Fix if needed
UPDATE admin_users SET is_active = true WHERE email = 'user@example.com';
UPDATE admin_users SET role = 'admin' WHERE email = 'user@example.com';
```

### Issue 4: RLS policy blocking legitimate access

**Cause**: Policies might be too restrictive or incorrect.

**Solution**:
```sql
-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Test your queries
-- ...

-- Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Review and fix policies
```

## Supabase-Specific Instructions

### Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Create a new query
4. Paste the migration SQL
5. Click **Run**
6. Verify results in **Table Editor**

### Using Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push

# Or run SQL directly
supabase db execute "$(cat migration.sql)"
```

### Verify in Supabase

1. **Database** → **Tables** → `admin_users`
   - Check columns: `is_active`, `invited_by`
   - Check role values

2. **Authentication** → **Policies**
   - Verify new policies are listed

3. **Authentication** → **Users**
   - Check that users can still authenticate

## Next Steps After Migration

1. ✅ Test signup flow with new company
2. ✅ Test user invitation process
3. ✅ Verify role-based access control
4. ✅ Update any custom queries to include `is_active` checks
5. ✅ Document role assignments for your team
6. ✅ Plan email invitation system (replace temp password)

## Support

If you encounter issues:

1. Check the migration logs for specific error messages
2. Review the `USER_MANAGEMENT.md` documentation
3. Verify your Supabase project settings
4. Test queries individually to isolate problems
5. Check Supabase logs for RLS policy errors

## Changelog

- **2025-10-14**: Initial migration for user management system
  - Added `is_active` and `invited_by` columns
  - Implemented role-based access control
  - Created new RLS policies for multi-user support

