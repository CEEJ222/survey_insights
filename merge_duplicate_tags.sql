-- Merge duplicate tags to consolidate the tag system
-- This script will merge similar tags and update all references

-- 1. Merge 'duplicate' into 'duplicates' (keep plural)
UPDATE tag_usages 
SET tag_id = (SELECT id FROM tags WHERE normalized_name = 'duplicates' AND company_id = '550e8400-e29b-41d4-a716-446655440002')
WHERE tag_id = (SELECT id FROM tags WHERE normalized_name = 'duplicate' AND company_id = '550e8400-e29b-41d4-a716-446655440002');

-- Update usage count for duplicates
UPDATE tags 
SET usage_count = usage_count + 1 
WHERE normalized_name = 'duplicates' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- Delete the singular 'duplicate' tag
DELETE FROM tags 
WHERE normalized_name = 'duplicate' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- 2. Merge 'accurate' into 'accuracy' (keep the noun form)
UPDATE tag_usages 
SET tag_id = (SELECT id FROM tags WHERE normalized_name = 'accuracy' AND company_id = '550e8400-e29b-41d4-a716-446655440002')
WHERE tag_id = (SELECT id FROM tags WHERE normalized_name = 'accurate' AND company_id = '550e8400-e29b-41d4-a716-446655440002');

-- Update usage count for accuracy
UPDATE tags 
SET usage_count = usage_count + 1 
WHERE normalized_name = 'accuracy' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- Delete the 'accurate' tag
DELETE FROM tags 
WHERE normalized_name = 'accurate' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- 3. Merge 'automated' into 'automation' (keep the noun form)
UPDATE tag_usages 
SET tag_id = (SELECT id FROM tags WHERE normalized_name = 'automation' AND company_id = '550e8400-e29b-41d4-a716-446655440002')
WHERE tag_id = (SELECT id FROM tags WHERE normalized_name = 'automated' AND company_id = '550e8400-e29b-41d4-a716-446655440002');

-- Update usage count for automation
UPDATE tags 
SET usage_count = usage_count + 1 
WHERE normalized_name = 'automation' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- Delete the 'automated' tag
DELETE FROM tags 
WHERE normalized_name = 'automated' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- 4. Merge 'bids' into 'bidding' (keep the more descriptive term)
UPDATE tag_usages 
SET tag_id = (SELECT id FROM tags WHERE normalized_name = 'bidding' AND company_id = '550e8400-e29b-41d4-a716-446655440002')
WHERE tag_id = (SELECT id FROM tags WHERE normalized_name = 'bids' AND company_id = '550e8400-e29b-41d4-a716-446655440002');

-- Delete the 'bids' tag (it has 0 usage anyway)
DELETE FROM tags 
WHERE normalized_name = 'bids' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- 5. Merge 'planswift' into 'planswift-tool' (keep the more descriptive term)
UPDATE tag_usages 
SET tag_id = (SELECT id FROM tags WHERE normalized_name = 'planswift-tool' AND company_id = '550e8400-e29b-41d4-a716-446655440002')
WHERE tag_id = (SELECT id FROM tags WHERE normalized_name = 'planswift' AND company_id = '550e8400-e29b-41d4-a716-446655440002');

-- Update usage count for planswift-tool
UPDATE tags 
SET usage_count = usage_count + 1 
WHERE normalized_name = 'planswift-tool' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- Delete the 'planswift' tag
DELETE FROM tags 
WHERE normalized_name = 'planswift' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- 6. Merge 'user_friendly' into 'user-friendly' (fix underscore vs hyphen)
UPDATE tag_usages 
SET tag_id = (SELECT id FROM tags WHERE normalized_name = 'user-friendly' AND company_id = '550e8400-e29b-41d4-a716-446655440002')
WHERE tag_id = (SELECT id FROM tags WHERE normalized_name = 'user_friendly' AND company_id = '550e8400-e29b-41d4-a716-446655440002');

-- Update usage count for user-friendly
UPDATE tags 
SET usage_count = usage_count + 1 
WHERE normalized_name = 'user-friendly' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- Delete the 'user_friendly' tag
DELETE FROM tags 
WHERE normalized_name = 'user_friendly' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- 7. Merge 'ai-assisted' into 'ai-assistance' (keep the noun form)
UPDATE tag_usages 
SET tag_id = (SELECT id FROM tags WHERE normalized_name = 'ai-assistance' AND company_id = '550e8400-e29b-41d4-a716-446655440002')
WHERE tag_id = (SELECT id FROM tags WHERE normalized_name = 'ai-assisted' AND company_id = '550e8400-e29b-41d4-a716-446655440002');

-- Delete the 'ai-assisted' tag (it has 0 usage anyway)
DELETE FROM tags 
WHERE normalized_name = 'ai-assisted' AND company_id = '550e8400-e29b-41d4-a716-446655440002';

-- 8. Update tag statistics after merges
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
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002';

-- 9. Show results after merge
SELECT 
  name,
  normalized_name,
  category,
  usage_count,
  avg_sentiment,
  created_at
FROM tags 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND is_active = true
ORDER BY usage_count DESC, normalized_name;
