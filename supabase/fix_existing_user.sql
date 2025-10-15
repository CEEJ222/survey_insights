-- Fix existing user account after migration
-- This will ensure your account has the correct role and is_active status

-- First, let's see what your account looks like:
SELECT id, email, role, is_active, company_id
FROM admin_users
ORDER BY created_at ASC;

-- Update your account to be company_admin and active:
-- (The migration should have done this, but let's make sure)
UPDATE admin_users
SET 
    role = 'company_admin',
    is_active = true
WHERE id IN (
    -- Get the first (oldest) user for each company
    SELECT DISTINCT ON (company_id) id
    FROM admin_users
    ORDER BY company_id, created_at ASC
);

-- Verify the update:
SELECT id, email, role, is_active, company_id
FROM admin_users
ORDER BY created_at ASC;

