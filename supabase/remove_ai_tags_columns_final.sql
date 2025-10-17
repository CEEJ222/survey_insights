-- Remove ai_tags columns from survey_responses and feedback_items
-- This completes the migration to the new tags table system

-- Remove ai_tags column from survey_responses
ALTER TABLE survey_responses DROP COLUMN IF EXISTS ai_tags;

-- Remove ai_tags column from feedback_items  
ALTER TABLE feedback_items DROP COLUMN IF EXISTS ai_tags;

-- Add comment to document the change
COMMENT ON TABLE survey_responses IS 'Survey responses now use the tags table system instead of ai_tags array column';
COMMENT ON TABLE feedback_items IS 'Feedback items now use the tags table system instead of ai_tags array column';
