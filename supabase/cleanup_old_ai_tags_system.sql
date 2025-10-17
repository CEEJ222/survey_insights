-- ============================================================================
-- CLEAN UP OLD AI_TAGS SYSTEM
-- ============================================================================
-- Remove the old ai_tags columns since we now have the proper tags table system
-- ============================================================================

-- Remove ai_tags column from survey_responses
ALTER TABLE survey_responses DROP COLUMN IF EXISTS ai_tags;

-- Remove ai_tags column from feedback_items  
ALTER TABLE feedback_items DROP COLUMN IF EXISTS ai_tags;

-- Verify the columns are gone
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('survey_responses', 'feedback_items')
  AND column_name = 'ai_tags';

-- Should return 0 rows if successful
