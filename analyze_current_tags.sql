-- Analyze current tags for potential duplicates
-- Based on the recent processing logs, here are the tags I observed:

-- From the logs, these tags were created/processed:
-- project-leads, accuracy, notifications, duplicates, positive
-- project-intelligence, geographic-filtering, market-analysis, business-impact
-- ai-assisted, counting, interface, ux
-- planswift, integration, mobile-support, field-measurements
-- duplicate (singular vs duplicates plural)
-- features, bids, tracking, usability, subcontractors
-- bidding, automation, recommendation
-- intuitive, fast, accurate
-- drag-and-drop, workflow

-- Check for potential duplicates:

-- 1. Check for exact duplicates
SELECT 
  normalized_name,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as names,
  STRING_AGG(id::text, ', ') as ids
FROM tags 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
GROUP BY normalized_name
HAVING COUNT(*) > 1;

-- 2. Check for singular/plural variations
SELECT 
  t1.name as tag1,
  t1.normalized_name as norm1,
  t1.usage_count as count1,
  t2.name as tag2,
  t2.normalized_name as norm2,
  t2.usage_count as count2
FROM tags t1
JOIN tags t2 ON t1.company_id = t2.company_id 
  AND t1.id < t2.id
WHERE t1.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND (
    -- Singular vs plural
    (t1.normalized_name || 's' = t2.normalized_name) OR
    (t2.normalized_name || 's' = t1.normalized_name) OR
    (t1.normalized_name || 'es' = t2.normalized_name) OR
    (t2.normalized_name || 'es' = t1.normalized_name) OR
    -- Specific cases from logs
    (t1.normalized_name = 'duplicate' AND t2.normalized_name = 'duplicates') OR
    (t1.normalized_name = 'duplicates' AND t2.normalized_name = 'duplicate') OR
    -- Similar meaning
    (t1.normalized_name = 'bidding' AND t2.normalized_name = 'bids') OR
    (t1.normalized_name = 'bids' AND t2.normalized_name = 'bidding')
  );

-- 3. Check for very similar tags (one contains the other)
SELECT 
  t1.name as tag1,
  t1.normalized_name as norm1,
  t1.usage_count as count1,
  t2.name as tag2,
  t2.normalized_name as norm2,
  t2.usage_count as count2
FROM tags t1
JOIN tags t2 ON t1.company_id = t2.company_id 
  AND t1.id < t2.id
WHERE t1.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND (
    t1.normalized_name LIKE '%' || t2.normalized_name || '%' OR
    t2.normalized_name LIKE '%' || t1.normalized_name || '%'
  );

-- 4. Show all current tags ordered by usage
SELECT 
  name,
  normalized_name,
  category,
  usage_count,
  avg_sentiment,
  created_at
FROM tags 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
ORDER BY usage_count DESC, normalized_name;

