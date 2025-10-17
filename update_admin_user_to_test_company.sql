-- ============================================================================
-- UPDATE ADMIN USER TO TEST COMPANY
-- ============================================================================
-- This will move your admin user to the test company so you can see all test data
-- ============================================================================

-- Update your admin user to be associated with the test company (Carter Lumber)
UPDATE admin_users 
SET company_id = '550e8400-e29b-41d4-a716-446655440002'
WHERE id = 'bc3b55b1-94df-45d1-ad52-55449b4faa5c';

-- Verify the change
SELECT 
  au.id as user_id,
  au.email,
  au.company_id,
  c.name as company_name,
  au.role
FROM admin_users au
JOIN companies c ON au.company_id = c.id
WHERE au.id = 'bc3b55b1-94df-45d1-ad52-55449b4faa5c';

-- Show what surveys you'll now have access to
SELECT 
  s.id,
  s.title,
  s.description,
  s.status,
  s.created_at,
  c.name as company_name
FROM surveys s
JOIN companies c ON s.company_id = c.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY s.created_at DESC;

-- Show survey response count for verification
SELECT 
  COUNT(*) as total_responses,
  COUNT(DISTINCT sr.survey_id) as surveys_with_responses
FROM survey_responses sr
JOIN surveys s ON sr.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002';
