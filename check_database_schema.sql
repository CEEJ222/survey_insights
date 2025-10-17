-- ============================================================================
-- CHECK ACTUAL DATABASE SCHEMA AND EXISTING DATA
-- ============================================================================
-- Let's see what the actual table structures look like and what data exists
-- ============================================================================

-- 1. Check the survey_responses table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'survey_responses' 
ORDER BY ordinal_position;

-- 2. Check what ai_tags look like in existing data
SELECT id, ai_tags, pg_typeof(ai_tags) as ai_tags_type
FROM survey_responses 
LIMIT 5;

-- 3. Check the tags table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tags' 
ORDER BY ordinal_position;

-- 4. Check what tags look like in existing data
SELECT id, name, ai_tags, pg_typeof(ai_tags) as ai_tags_type
FROM tags 
LIMIT 5;

-- 5. Check all tables that exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 6. Check existing survey_responses for the test company
SELECT COUNT(*) as response_count, 
       COUNT(CASE WHEN ai_tags IS NOT NULL THEN 1 END) as responses_with_tags
FROM survey_responses sr
JOIN surveys s ON sr.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002';
