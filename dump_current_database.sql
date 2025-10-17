-- ============================================================================
-- DUMP CURRENT DATABASE STATE
-- ============================================================================
-- This script will show us exactly what's in the database right now
-- ============================================================================

-- 1. Show all table names
SELECT 'TABLES' as info, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Show companies
SELECT 'COMPANIES' as info, id, name, created_at FROM companies ORDER BY name;

-- 3. Show admin_users
SELECT 'ADMIN_USERS' as info, id, email, company_id, role FROM admin_users;

-- 4. Show customers for test company
SELECT 'CUSTOMERS' as info, id, company_id, primary_email, full_name, created_at 
FROM customers 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY created_at DESC;

-- 5. Show surveys for test company
SELECT 'SURVEYS' as info, id, company_id, title, status, created_at 
FROM surveys 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY created_at DESC;

-- 6. Show survey_links for test company
SELECT 'SURVEY_LINKS' as info, id, survey_id, token, respondent_email, status, created_at 
FROM survey_links sl
JOIN surveys s ON sl.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY created_at DESC;

-- 7. Show survey_responses for test company
SELECT 'SURVEY_RESPONSES' as info, id, survey_id, customer_id, sentiment_score, ai_tags, priority_score, submitted_at 
FROM survey_responses sr
JOIN surveys s ON sr.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY submitted_at DESC;

-- 8. Show tags for test company
SELECT 'TAGS' as info, id, company_id, name, normalized_name, category, usage_count, is_active 
FROM tags 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY usage_count DESC;

-- 9. Show tag_usages for test company
SELECT 'TAG_USAGES' as info, id, tag_id, source_type, source_id, customer_id, sentiment_score, used_at 
FROM tag_usages 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY used_at DESC;

-- 10. Show feedback_items for test company
SELECT 'FEEDBACK_ITEMS' as info, id, customer_id, company_id, source_type, source_id, title, sentiment_score, priority_score, created_at 
FROM feedback_items 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY created_at DESC;

-- 11. Show customer_health_scores for test company
SELECT 'CUSTOMER_HEALTH_SCORES' as info, id, customer_id, company_id, health_score, churn_risk_score, calculated_at 
FROM customer_health_scores 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY calculated_at DESC;

-- 12. Check what UUIDs actually look like in your database
SELECT 'SAMPLE_UUIDS' as info, 
  (SELECT id FROM companies LIMIT 1) as company_uuid,
  (SELECT id FROM customers LIMIT 1) as customer_uuid,
  (SELECT id FROM surveys LIMIT 1) as survey_uuid,
  (SELECT id FROM tags LIMIT 1) as tag_uuid;

-- 13. Check data types for key columns
SELECT 'COLUMN_TYPES' as info, 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('companies', 'customers', 'surveys', 'survey_responses', 'tags', 'tag_usages')
  AND column_name IN ('id', 'company_id', 'customer_id', 'survey_id', 'ai_tags')
ORDER BY table_name, ordinal_position;
