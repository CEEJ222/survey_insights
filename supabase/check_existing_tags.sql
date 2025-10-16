-- Check what tags already exist and their normalized names
SELECT name, normalized_name, category, usage_count
FROM tags 
WHERE company_id = '7dd73527-565d-4098-9475-210bd58af35e'
ORDER BY normalized_name;

-- Also check what survey response tags we have
SELECT DISTINCT UNNEST(sr.ai_tags) as survey_tag_name
FROM survey_responses sr
JOIN surveys s ON s.id = sr.survey_id
WHERE s.company_id = '7dd73527-565d-4098-9475-210bd58af35e'
  AND sr.ai_tags IS NOT NULL
  AND array_length(sr.ai_tags, 1) > 0
ORDER BY survey_tag_name;
