-- Check RLS policies on survey_links table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'survey_links';

-- Check if RLS is enabled on survey_links
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'survey_links';

-- Test direct query to survey_links
SELECT COUNT(*) as total_links FROM survey_links;

-- Test query with the specific token
SELECT * FROM survey_links WHERE token = '5a9ec29adac83c07fa5b778a5161baba005027fa8c669c8e74c2b510cbc941f5';
