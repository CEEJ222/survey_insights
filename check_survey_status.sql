-- Check the specific survey status
SELECT 
  s.id,
  s.title,
  s.status,
  s.company_id,
  s.created_at
FROM surveys s
WHERE s.id = 'f992c403-7587-4977-8176-cc27f73ad79c';

-- Check all recent surveys and their status
SELECT 
  s.id,
  s.title,
  s.status,
  s.company_id,
  s.created_at
FROM surveys s
ORDER BY s.created_at DESC
LIMIT 10;
