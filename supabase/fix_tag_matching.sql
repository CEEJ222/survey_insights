-- Fix the tag names to match exactly what's in survey responses
-- Update existing tags to have the correct normalized names

-- First, let's see what the actual survey response tags look like
SELECT DISTINCT UNNEST(sr.ai_tags) as survey_tag_name
FROM survey_responses sr
JOIN surveys s ON s.id = sr.survey_id
WHERE s.company_id = '7dd73527-565d-4098-9475-210bd58af35e'
  AND sr.ai_tags IS NOT NULL
  AND array_length(sr.ai_tags, 1) > 0
ORDER BY survey_tag_name;

-- Update the existing tags to match the survey response format
UPDATE tags 
SET normalized_name = 'small-team'
WHERE company_id = '7dd73527-565d-4098-9475-210bd58af35e' 
  AND normalized_name = 'small_team';

UPDATE tags 
SET normalized_name = 'learning'
WHERE company_id = '7dd73527-565d-4098-9475-210bd58af35e' 
  AND normalized_name = 'learning_curve';

-- Now run the tag_usages population again
INSERT INTO tag_usages (
  tag_id,
  company_id,
  source_type,
  source_id,
  sentiment_score,
  used_at
)
SELECT 
  t.id as tag_id,
  s.company_id,
  'survey_response' as source_type,
  sr.id as source_id,
  sr.sentiment_score,
  sr.submitted_at as used_at
FROM survey_responses sr
JOIN surveys s ON s.id = sr.survey_id,
     UNNEST(sr.ai_tags) as tag_name,
     tags t
WHERE s.company_id = '7dd73527-565d-4098-9475-210bd58af35e'
  AND sr.ai_tags IS NOT NULL
  AND array_length(sr.ai_tags, 1) > 0
  AND t.company_id = s.company_id
  AND t.normalized_name = tag_name  -- Exact match now
ON CONFLICT (tag_id, source_type, source_id) DO NOTHING;

-- Update tag statistics
UPDATE tags SET
  usage_count = (
    SELECT COUNT(*) 
    FROM tag_usages 
    WHERE tag_id = tags.id
  ),
  first_used = (
    SELECT MIN(used_at) 
    FROM tag_usages 
    WHERE tag_id = tags.id
  ),
  last_used = (
    SELECT MAX(used_at) 
    FROM tag_usages 
    WHERE tag_id = tags.id
  ),
  avg_sentiment = (
    SELECT AVG(sentiment_score) 
    FROM tag_usages 
    WHERE tag_id = tags.id 
      AND sentiment_score IS NOT NULL
  ),
  updated_at = CURRENT_TIMESTAMP
WHERE company_id = '7dd73527-565d-4098-9475-210bd58af35e';

-- Check the results
SELECT 
  t.name,
  t.normalized_name,
  t.category,
  t.usage_count,
  t.avg_sentiment,
  COUNT(tu.id) as actual_usages
FROM tags t
LEFT JOIN tag_usages tu ON tu.tag_id = t.id
WHERE t.company_id = '7dd73527-565d-4098-9475-210bd58af35e'
GROUP BY t.id, t.name, t.normalized_name, t.category, t.usage_count, t.avg_sentiment
ORDER BY t.usage_count DESC;
