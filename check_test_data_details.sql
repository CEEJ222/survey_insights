-- ============================================================================
-- DETAILED TEST DATA CHECK
-- ============================================================================
-- Let's see exactly what test data is available for comprehensive testing
-- ============================================================================

-- 1. Check all surveys for the test company
SELECT 'SURVEYS' as data_type, id, title, status, created_at
FROM surveys 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY created_at DESC;

-- 2. Check survey responses with details
SELECT 'SURVEY RESPONSES' as data_type, 
  sr.id, 
  s.title as survey_title,
  sr.responses,
  sr.ai_tags,
  sr.sentiment_score,
  sr.submitted_at
FROM survey_responses sr
JOIN surveys s ON sr.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY sr.submitted_at DESC;

-- 3. Check customers for the test company
SELECT 'CUSTOMERS' as data_type, id, full_name, primary_email, created_at
FROM customers 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY created_at DESC;

-- 4. Check tags for the test company
SELECT 'TAGS' as data_type, id, name, normalized_name, category, usage_count, is_active
FROM tags 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY usage_count DESC;

-- 5. Check if there are any feedback_items for the test company
SELECT 'FEEDBACK ITEMS' as data_type, id, content, sentiment_score, ai_tags, created_at
FROM feedback_items 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Summary counts for the test company
SELECT 
  'SUMMARY' as data_type,
  (SELECT COUNT(*) FROM surveys WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') as survey_count,
  (SELECT COUNT(*) FROM survey_responses sr JOIN surveys s ON sr.survey_id = s.id WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002') as response_count,
  (SELECT COUNT(*) FROM customers WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') as customer_count,
  (SELECT COUNT(*) FROM tags WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') as tag_count,
  (SELECT COUNT(*) FROM feedback_items WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') as feedback_count;
