# Quick Migration Guide

## The Error You Encountered

The error `relation "idx_admin_users_company" already exists` happens when you try to create an index that already exists in your database. This is common when re-running schema files.

## Solution: Use the Migration Script

I've created two files for you:

### 1. `supabase/schema.sql` (Updated - Full Schema)
- **Use this for**: Brand new databases
- **Now idempotent**: Safe to run multiple times
- Contains complete schema with all tables, indexes, policies

### 2. `supabase/migration_add_user_management.sql` (New - Migration Only)
- **Use this for**: Existing databases that need the new features
- Adds only the new columns and policies
- Safe to run multiple times
- Automatically handles existing objects

## How to Run the Migration

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project**
2. **Navigate to**: SQL Editor
3. **Create a new query**
4. **Copy and paste** the contents of `supabase/migration_add_user_management.sql`
5. **Click "Run"**
6. **Check for success**: You should see "Success. No rows returned"

### Option B: Using Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db execute -f supabase/migration_add_user_management.sql
```

### Option C: Using psql

```bash
psql -h your-db-host -U postgres -d your-database -f supabase/migration_add_user_management.sql
```

## What the Migration Does

1. ✅ Adds `is_active` column to `admin_users` (if it doesn't exist)
2. ✅ Adds `invited_by` column to `admin_users` (if it doesn't exist)
3. ✅ Adds role constraint to ensure valid roles only
4. ✅ Promotes first user of each company to `company_admin`
5. ✅ Updates all RLS policies for role-based access (with circular dependency fix)
6. ✅ Adds indexes for better performance

## Verification

After running the migration, verify it worked:

### Check New Columns

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_users'
  AND column_name IN ('is_active', 'invited_by');
```

**Expected**: Should return 2 rows

### Check Roles

```sql
SELECT id, email, role, is_active FROM admin_users;
```

**Expected**: At least one user should have `role = 'company_admin'`

### Check Policies

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 'admin_users';
```

**Expected**: Should return 4 policies:
- `admin_users_select_own_company`
- `admin_users_insert_company_admin`
- `admin_users_update_company_admin`
- `admin_users_delete_company_admin`

## Common Issues

### Issue: "500 Internal Server Error" or "Access Denied" After Login

**Symptoms**: 
- Login succeeds but dashboard shows "Access Denied"
- Browser console shows `500` errors from Supabase API
- Error when fetching admin_users data

**Cause**: Circular RLS policy dependency (the old policy couldn't read your own record)

**Solution**: Run this SQL to fix the RLS policy:

```sql
DROP POLICY IF EXISTS admin_users_select_own_company ON admin_users;

CREATE POLICY admin_users_select_own_company ON admin_users
    FOR SELECT
    USING (
        id = auth.uid()  -- Always allow reading your own record first!
        OR
        company_id IN (
            SELECT company_id FROM admin_users WHERE id = auth.uid()
        )
    );
```

Then clear your Next.js cache and restart:
```bash
rm -rf .next
npm run dev
```

### Issue: "permission denied"

**Solution**: Make sure you're running as the database owner or postgres user.

```sql
-- Check your role
SELECT current_user;

-- If needed, grant yourself permission
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
```

### Issue: "column already exists"

**Good news!** The migration script handles this automatically with `IF NOT EXISTS` checks. If you see this error, the migration script is working correctly and skipping already-created columns.

### Issue: Migration seems to hang

**Cause**: The migration runs in a transaction. If there's an error, it will rollback.

**Solution**: Check for specific error messages in the output. The most common issues are permission-related.

## If Something Goes Wrong

The migration runs in a transaction (`BEGIN` ... `COMMIT`), so if it fails, nothing will be changed. You can safely run it again after fixing the issue.

### Rollback (if needed)

If you need to manually rollback:

```sql
-- This will undo the changes
-- WARNING: You'll lose the new user management features!

BEGIN;

-- Remove new columns (optional - you may want to keep data)
-- ALTER TABLE admin_users DROP COLUMN IF EXISTS is_active;
-- ALTER TABLE admin_users DROP COLUMN IF EXISTS invited_by;

-- Remove constraint
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS valid_role;

-- Revert roles back to 'admin'
UPDATE admin_users SET role = 'admin' WHERE role = 'company_admin';

COMMIT;
```

## Next Steps After Migration

1. ✅ Verify the migration succeeded (see verification queries above)
2. ✅ Restart your development server: `npm run dev`
3. ✅ Test the signup flow: Go to `/admin/signup`
4. ✅ Login and check for "Team" menu item
5. ✅ Try inviting a user
6. ✅ Test different role permissions

## Ready to Go!

Once the migration completes successfully, your user management system is ready to use!

- New signups will automatically become Company Admins
- Company Admins can invite team members
- Role-based access control is enforced
- All security policies are in place

## Need Help?

- Review the full documentation: `USER_MANAGEMENT.md`
- Check the detailed migration guide: `MIGRATION_GUIDE.md`
- Review the implementation: `IMPLEMENTATION_SUMMARY.md`

