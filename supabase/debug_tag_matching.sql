-- Debug: See what tag names are in survey responses vs what we have in tags table

-- First, see all unique tag names from survey responses
SELECT DISTINCT UNNEST(sr.ai_tags) as survey_tag_name
FROM survey_responses sr
JOIN surveys s ON s.id = sr.survey_id
WHERE s.company_id = '7dd73527-565d-4098-9475-210bd58af35e'
  AND sr.ai_tags IS NOT NULL
  AND array_length(sr.ai_tags, 1) > 0
ORDER BY survey_tag_name;

-- Then see what normalized names we have in tags table
SELECT name, normalized_name, category
FROM tags 
WHERE company_id = '7dd73527-565d-4098-9475-210bd58af35e'
ORDER BY normalized_name;

-- Now let's manually create the missing tag mappings
-- The issue is likely that survey responses have tags like "smartbid" but we need to match them properly

-- Let's create tags for the exact names from survey responses
INSERT INTO tags (
  company_id,
  name,
  normalized_name,
  description,
  category,
  color,
  is_system_tag,
  is_active
) VALUES 
-- Create tags for exact survey response tag names
('7dd73527-565d-4098-9475-210bd58af35e', 'smartbid', 'smartbid', 'Product name', 'feature', '#3B82F6', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'complicated', 'complicated', 'Complexity feedback', 'topic', '#EF4444', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'learning', 'learning', 'Learning difficulty', 'topic', '#F59E0B', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'training', 'training', 'Training needs', 'topic', '#10B981', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'small-team', 'small-team', 'Small team feedback', 'topic', '#8B5CF6', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'streamlined', 'streamlined', 'Process efficiency', 'topic', '#10B981', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'automated', 'automated', 'Automation features', 'feature', '#10B981', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'notifications', 'notifications', 'Notification system', 'feature', '#3B82F6', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'excellent', 'excellent', 'Positive sentiment', 'sentiment', '#10B981', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'organizing', 'organizing', 'Organization features', 'feature', '#3B82F6', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'tracking', 'tracking', 'Tracking capabilities', 'feature', '#3B82F6', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'interface', 'interface', 'User interface', 'topic', '#F59E0B', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'subcontractors', 'subcontractors', 'Subcontractor users', 'topic', '#6B7280', true, true)

ON CONFLICT (company_id, normalized_name) DO NOTHING;
