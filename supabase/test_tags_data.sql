-- Proper test data that matches the actual table constraints
-- Company ID: 7dd73527-565d-4098-9475-210bd58af35e

-- Insert tags with valid categories only
INSERT INTO tags (
  company_id,
  name,
  normalized_name,
  description,
  category,
  color,
  usage_count,
  avg_sentiment,
  first_used,
  last_used,
  is_system_tag,
  is_active
) VALUES 
-- Feature tags
('7dd73527-565d-4098-9475-210bd58af35e', 'SmartBid', 'smartbid', 'Core product name', 'feature', '#3B82F6', 3, 0.33, NOW() - INTERVAL '2 days', NOW(), true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'Automated', 'automated', 'Automation features', 'feature', '#10B981', 1, 0.90, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'Notifications', 'notifications', 'Notification system', 'feature', '#3B82F6', 1, 0.90, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'Organizing', 'organizing', 'Organization features', 'feature', '#3B82F6', 1, 0.60, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'Tracking', 'tracking', 'Tracking capabilities', 'feature', '#3B82F6', 1, 0.60, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', true, true),

-- Topic tags
('7dd73527-565d-4098-9475-210bd58af35e', 'Complicated', 'complicated', 'System complexity', 'topic', '#EF4444', 1, -0.50, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'Learning Curve', 'learning_curve', 'Learning difficulty', 'topic', '#F59E0B', 1, -0.50, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'Training', 'training', 'Training resources', 'topic', '#10B981', 1, -0.50, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'Small Team', 'small_team', 'Small team feedback', 'topic', '#8B5CF6', 1, -0.50, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'Streamlined', 'streamlined', 'Process efficiency', 'topic', '#10B981', 1, 0.90, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'Interface', 'interface', 'User interface', 'topic', '#F59E0B', 1, 0.60, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', true, true),
('7dd73527-565d-4098-9475-210bd58af35e', 'Subcontractors', 'subcontractors', 'Subcontractor users', 'topic', '#6B7280', 1, 0.60, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', true, true),

-- Sentiment tags
('7dd73527-565d-4098-9475-210bd58af35e', 'Excellent', 'excellent', 'Positive sentiment', 'sentiment', '#10B981', 1, 0.90, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', true, true)

ON CONFLICT (company_id, normalized_name) DO NOTHING;
