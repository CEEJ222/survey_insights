-- Debug survey links and surveys
-- Run these queries in your Supabase SQL editor

-- 1. Check if survey_links table has any data
SELECT 'SURVEY_LINKS' as table_name, COUNT(*) as count FROM survey_links;

-- 2. Check recent survey links
SELECT id, survey_id, token, status, created_at 
FROM survey_links 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if the specific token exists
SELECT 'TOKEN_SEARCH' as search_type, id, survey_id, token, status, created_at 
FROM survey_links 
WHERE token = '5a9ec29adac83c07fa5b778a5161baba005027fa8c669c8e74c2b510cbc941f5';

-- 4. Check surveys table
SELECT 'SURVEYS' as table_name, COUNT(*) as count FROM surveys;

-- 5. Check recent surveys
SELECT id, title, status, created_at 
FROM surveys 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Check if any survey_links exist for recent surveys
SELECT 
  s.id as survey_id,
  s.title,
  s.status as survey_status,
  sl.id as link_id,
  sl.token,
  sl.status as link_status,
  sl.created_at as link_created
FROM surveys s
LEFT JOIN survey_links sl ON s.id = sl.survey_id
ORDER BY s.created_at DESC
LIMIT 10;
