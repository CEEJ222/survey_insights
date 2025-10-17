-- ============================================================================
-- FINAL POPULATE TEST COMPANY DATA
-- ============================================================================
-- Based on actual database schema from your dump
-- Uses gen_random_uuid() for all IDs and correct data types
-- ============================================================================

-- First, ensure the test company exists
INSERT INTO companies (id, name, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Carter Lumber', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create 10 realistic customers for the test company
INSERT INTO customers (company_id, primary_email, full_name, company_name, job_title, industry, company_size, location, subscription_tier, account_status, created_at, updated_at, last_activity) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'mike.contractor@carterlumber.com', 'Mike Rodriguez', 'Carter Lumber', 'Senior Estimator', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '45 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'sarah.estimator@carterlumber.com', 'Sarah Chen', 'Carter Lumber', 'Project Manager', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'john.superintendent@carterlumber.com', 'John Thompson', 'Carter Lumber', 'Superintendent', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440002', 'lisa.projectmanager@carterlumber.com', 'Lisa Martinez', 'Carter Lumber', 'Operations Manager', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '90 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'david.foreman@carterlumber.com', 'David Wilson', 'Carter Lumber', 'Foreman', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'jennifer.architect@carterlumber.com', 'Jennifer Lee', 'Carter Lumber', 'Design Coordinator', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '75 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'robert.subcontractor@carterlumber.com', 'Robert Johnson', 'Carter Lumber', 'Subcontractor Relations', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '35 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'amanda.engineer@carterlumber.com', 'Amanda Davis', 'Carter Lumber', 'Structural Engineer', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '50 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440002', 'chris.owner@carterlumber.com', 'Chris Anderson', 'Carter Lumber', 'Owner', 'Construction', '51-200', 'Phoenix, AZ', 'Enterprise', 'active', NOW() - INTERVAL '120 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'maria.supplier@carterlumber.com', 'Maria Garcia', 'Carter Lumber', 'Materials Manager', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Create 5 comprehensive surveys for the test company
INSERT INTO surveys (company_id, title, description, questions, status, enable_ai_analysis, created_by, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440002',
   'On-Screen Takeoff User Experience Survey', 
   'Help us improve On-Screen Takeoff by sharing your experience with our digital takeoff and estimating software.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How would you rate On-Screen Takeoff overall?", "required": true}, {"id": "q2", "type": "text", "question": "What do you like most about On-Screen Takeoff?", "required": false}, {"id": "q3", "type": "text", "question": "What improvements would you like to see?", "required": false}, {"id": "q4", "type": "rating", "question": "How likely are you to recommend On-Screen Takeoff to a colleague?", "required": true}]}',
   'active', true, 'bc3b55b1-94df-45d1-ad52-55449b4faa5c', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
   
  ('550e8400-e29b-41d4-a716-446655440002',
   'Project Intelligence Platform Feedback',
   'Share your thoughts on ConstructConnect Project Intelligence and how it helps you find the right construction projects.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How accurate are the project leads from Project Intelligence?", "required": true}, {"id": "q2", "type": "text", "question": "How has Project Intelligence helped your business?", "required": false}, {"id": "q3", "type": "rating", "question": "How easy is it to filter and search for relevant projects?", "required": true}, {"id": "q4", "type": "text", "question": "What additional features would be most valuable?", "required": false}]}',
   'active', true, 'bc3b55b1-94df-45d1-ad52-55449b4faa5c', NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days'),
   
  ('550e8400-e29b-41d4-a716-446655440002',
   'SmartBid Bid Management Experience',
   'Tell us about your experience using SmartBid for bid management and subcontractor coordination.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How effective is SmartBid for managing your bidding process?", "required": true}, {"id": "q2", "type": "text", "question": "What challenges do you face with bid management?", "required": false}, {"id": "q3", "type": "rating", "question": "How well does SmartBid help you connect with subcontractors?", "required": true}, {"id": "q4", "type": "text", "question": "How could we improve the bid management workflow?", "required": false}]}',
   'active', true, 'bc3b55b1-94df-45d1-ad52-55449b4faa5c', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
   
  ('550e8400-e29b-41d4-a716-446655440002',
   'PlanSwift Takeoff Tool Evaluation',
   'Share your experience with PlanSwift for digital takeoffs and material calculations.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How user-friendly is PlanSwift for digital takeoffs?", "required": true}, {"id": "q2", "type": "text", "question": "What features of PlanSwift do you use most?", "required": false}, {"id": "q3", "type": "rating", "question": "How accurate are the material calculations?", "required": true}, {"id": "q4", "type": "text", "question": "What would make PlanSwift more efficient for your workflow?", "required": false}]}',
   'active', true, 'bc3b55b1-94df-45d1-ad52-55449b4faa5c', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),
   
  ('550e8400-e29b-41d4-a716-446655440002',
   'ConstructConnect Platform Overall Experience',
   'Help us understand your overall experience with the ConstructConnect platform and our suite of tools.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How satisfied are you with ConstructConnect overall?", "required": true}, {"id": "q2", "type": "text", "question": "Which ConstructConnect tools do you use regularly?", "required": false}, {"id": "q3", "type": "rating", "question": "How likely are you to continue using ConstructConnect?", "required": true}, {"id": "q4", "type": "text", "question": "What would make ConstructConnect more valuable to your business?", "required": false}]}',
   'active', true, 'bc3b55b1-94df-45d1-ad52-55449b4faa5c', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day');

-- Create survey links (using subqueries to get the generated IDs)
INSERT INTO survey_links (survey_id, customer_id, token, respondent_email, respondent_name, status, created_at, completed_at)
SELECT 
  s.id,
  c.id,
  'takeoff_survey_' || c.id::text,
  c.primary_email,
  c.full_name,
  'completed',
  NOW() - INTERVAL '28 days',
  NOW() - INTERVAL '28 days'
FROM surveys s, customers c
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002' 
  AND s.title LIKE '%On-Screen Takeoff%'
  AND c.company_id = '550e8400-e29b-41d4-a716-446655440002'
LIMIT 3;

INSERT INTO survey_links (survey_id, customer_id, token, respondent_email, respondent_name, status, created_at, completed_at)
SELECT 
  s.id,
  c.id,
  'project_intel_' || c.id::text,
  c.primary_email,
  c.full_name,
  'completed',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '20 days'
FROM surveys s, customers c
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002' 
  AND s.title LIKE '%Project Intelligence%'
  AND c.company_id = '550e8400-e29b-41d4-a716-446655440002'
LIMIT 2;

INSERT INTO survey_links (survey_id, customer_id, token, respondent_email, respondent_name, status, created_at, completed_at)
SELECT 
  s.id,
  c.id,
  'smartbid_' || c.id::text,
  c.primary_email,
  c.full_name,
  'completed',
  NOW() - INTERVAL '16 days',
  NOW() - INTERVAL '16 days'
FROM surveys s, customers c
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002' 
  AND s.title LIKE '%SmartBid%'
  AND c.company_id = '550e8400-e29b-41d4-a716-446655440002'
LIMIT 2;

INSERT INTO survey_links (survey_id, customer_id, token, respondent_email, respondent_name, status, created_at, completed_at)
SELECT 
  s.id,
  c.id,
  'planswift_' || c.id::text,
  c.primary_email,
  c.full_name,
  'completed',
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '12 days'
FROM surveys s, customers c
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002' 
  AND s.title LIKE '%PlanSwift%'
  AND c.company_id = '550e8400-e29b-41d4-a716-446655440002'
LIMIT 2;

INSERT INTO survey_links (survey_id, customer_id, token, respondent_email, respondent_name, status, created_at, completed_at)
SELECT 
  s.id,
  c.id,
  'platform_' || c.id::text,
  c.primary_email,
  c.full_name,
  'completed',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
FROM surveys s, customers c
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002' 
  AND s.title LIKE '%Platform Overall%'
  AND c.company_id = '550e8400-e29b-41d4-a716-446655440002'
LIMIT 1;

-- Create survey responses (using subqueries to get the generated IDs)
INSERT INTO survey_responses (survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, sentiment_score, ai_tags, priority_score)
SELECT 
  sl.id,
  sl.survey_id,
  sl.customer_id,
  '{"q1": 4, "q2": "The AI-assisted counting features are amazing! Takeoff Boost saves me hours every week.", "q3": "The interface could be more intuitive for new users.", "q4": 5}',
  '{"user_agent": "Chrome", "ip_address": "192.168.1.100"}',
  sl.completed_at,
  0.7,
  ARRAY['takeoff', 'ai', 'efficiency', 'positive', 'interface', 'boost'],
  45
FROM survey_links sl
JOIN surveys s ON sl.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND s.title LIKE '%On-Screen Takeoff%'
LIMIT 1;

INSERT INTO survey_responses (survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, sentiment_score, ai_tags, priority_score)
SELECT 
  sl.id,
  sl.survey_id,
  sl.customer_id,
  '{"q1": 5, "q2": "PlanSwift integration is seamless. The accuracy is incredible.", "q3": "Wish there was better mobile support for field measurements.", "q4": 5}',
  '{"user_agent": "Chrome", "ip_address": "192.168.1.101"}',
  sl.completed_at,
  0.8,
  ARRAY['takeoff', 'integration', 'accuracy', 'mobile', 'positive', 'planswift'],
  35
FROM survey_links sl
JOIN surveys s ON sl.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND s.title LIKE '%On-Screen Takeoff%'
LIMIT 1 OFFSET 1;

INSERT INTO survey_responses (survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, sentiment_score, ai_tags, priority_score)
SELECT 
  sl.id,
  sl.survey_id,
  sl.customer_id,
  '{"q1": 4, "q2": "Project leads are very accurate. Found 3 new projects this month!", "q3": "Sometimes get duplicate notifications for the same project.", "q4": 4}',
  '{"user_agent": "Chrome", "ip_address": "192.168.1.106"}',
  sl.completed_at,
  0.6,
  ARRAY['project', 'leads', 'accuracy', 'notifications', 'positive', 'business-growth'],
  50
FROM survey_links sl
JOIN surveys s ON sl.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND s.title LIKE '%Project Intelligence%'
LIMIT 1;

INSERT INTO survey_responses (survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, sentiment_score, ai_tags, priority_score)
SELECT 
  sl.id,
  sl.survey_id,
  sl.customer_id,
  '{"q1": 5, "q2": "Game changer for our business. Project Intelligence helped us win 2 major contracts.", "q3": "Love the geographic filtering and market analysis features.", "q4": 5}',
  '{"user_agent": "Firefox", "ip_address": "192.168.1.107"}',
  sl.completed_at,
  0.9,
  ARRAY['project', 'intelligence', 'contracts', 'geographic', 'analysis', 'game-changer'],
  25
FROM survey_links sl
JOIN surveys s ON sl.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND s.title LIKE '%Project Intelligence%'
LIMIT 1 OFFSET 1;

INSERT INTO survey_responses (survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, sentiment_score, ai_tags, priority_score)
SELECT 
  sl.id,
  sl.survey_id,
  sl.customer_id,
  '{"q1": 4, "q2": "Great for organizing bids and tracking responses.", "q3": "The interface could be simpler for subcontractors to use.", "q4": 4}',
  '{"user_agent": "Firefox", "ip_address": "192.168.1.112"}',
  sl.completed_at,
  0.6,
  ARRAY['smartbid', 'organizing', 'tracking', 'interface', 'subcontractors', 'workflow'],
  50
FROM survey_links sl
JOIN surveys s ON sl.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND s.title LIKE '%SmartBid%'
LIMIT 1;

INSERT INTO survey_responses (survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, sentiment_score, ai_tags, priority_score)
SELECT 
  sl.id,
  sl.survey_id,
  sl.customer_id,
  '{"q1": 5, "q2": "SmartBid has streamlined our entire bidding process. Highly recommend!", "q3": "Love the automated notifications and status tracking.", "q4": 5}',
  '{"user_agent": "Safari", "ip_address": "192.168.1.113"}',
  sl.completed_at,
  0.9,
  ARRAY['smartbid', 'streamlined', 'automated', 'notifications', 'excellent', 'recommend'],
  25
FROM survey_links sl
JOIN surveys s ON sl.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND s.title LIKE '%SmartBid%'
LIMIT 1 OFFSET 1;

INSERT INTO survey_responses (survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, sentiment_score, ai_tags, priority_score)
SELECT 
  sl.id,
  sl.survey_id,
  sl.customer_id,
  '{"q1": 4, "q2": "PlanSwift is intuitive and fast for digital takeoffs.", "q3": "Material calculations are very accurate. Great tool!", "q4": 4}',
  '{"user_agent": "Safari", "ip_address": "192.168.1.118"}',
  sl.completed_at,
  0.8,
  ARRAY['planswift', 'intuitive', 'fast', 'calculations', 'accurate', 'material'],
  35
FROM survey_links sl
JOIN surveys s ON sl.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND s.title LIKE '%PlanSwift%'
LIMIT 1;

INSERT INTO survey_responses (survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, sentiment_score, ai_tags, priority_score)
SELECT 
  sl.id,
  sl.survey_id,
  sl.customer_id,
  '{"q1": 5, "q2": "Love the drag-and-drop interface. Makes takeoffs fun!", "q3": "Integration with Quick Bid is seamless. Perfect workflow.", "q4": 5}',
  '{"user_agent": "Edge", "ip_address": "192.168.1.120"}',
  sl.completed_at,
  0.9,
  ARRAY['planswift', 'drag-drop', 'interface', 'quick-bid', 'workflow', 'seamless'],
  25
FROM survey_links sl
JOIN surveys s ON sl.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND s.title LIKE '%PlanSwift%'
LIMIT 1 OFFSET 1;

INSERT INTO survey_responses (survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, sentiment_score, ai_tags, priority_score)
SELECT 
  sl.id,
  sl.survey_id,
  sl.customer_id,
  '{"q1": 4, "q2": "ConstructConnect is essential for our business. Great suite of tools.", "q3": "The integration between different tools could be smoother.", "q4": 4}',
  '{"user_agent": "Chrome", "ip_address": "192.168.1.124"}',
  sl.completed_at,
  0.7,
  ARRAY['platform', 'essential', 'tools', 'integration', 'business', 'suite'],
  50
FROM survey_links sl
JOIN surveys s ON sl.survey_id = s.id
WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND s.title LIKE '%Platform Overall%'
LIMIT 1;

-- Create comprehensive tags for the test company
INSERT INTO tags (company_id, name, normalized_name, description, category, color, usage_count, first_used, last_used, avg_sentiment, is_system_tag, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'takeoff-tool', 'takeoff-tool', 'Digital takeoff and estimating features', 'feature', '#3B82F6', 2, NOW() - INTERVAL '28 days', NOW() - INTERVAL '25 days', 0.75, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'ai-features', 'ai-features', 'AI-powered features and automation', 'feature', '#8B5CF6', 1, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', 0.8, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'integration-tools', 'integration-tools', 'Integration with other tools and platforms', 'feature', '#10B981', 1, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', 0.8, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'accuracy-precision', 'accuracy-precision', 'Accuracy and precision of measurements/calculations', 'feature', '#F59E0B', 1, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', 0.8, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'mobile-support', 'mobile-support', 'Mobile support and accessibility', 'feature', '#EF4444', 1, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', 0.1, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'positive-feedback', 'positive-feedback', 'Positive sentiment and feedback', 'sentiment', '#10B981', 8, NOW() - INTERVAL '28 days', NOW() - INTERVAL '8 days', 0.8, true, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'project-management', 'project-management', 'Project management and intelligence features', 'feature', '#3B82F6', 2, NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', 0.75, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'bid-management', 'bid-management', 'SmartBid bid management features', 'feature', '#8B5CF6', 2, NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days', 0.75, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'planswift-tool', 'planswift-tool', 'PlanSwift takeoff tool features', 'feature', '#10B981', 2, NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days', 0.85, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'platform-overall', 'platform-overall', 'Overall ConstructConnect platform', 'feature', '#6366F1', 1, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 0.7, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'game-changing', 'game-changing', 'Game-changing features or improvements', 'sentiment', '#10B981', 1, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', 0.9, true, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'efficiency', 'efficiency', 'Efficiency and time-saving features', 'feature', '#059669', 1, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', 0.8, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'automated', 'automated', 'Automated features and processes', 'feature', '#7C3AED', 1, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 0.9, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'workflow', 'workflow', 'Workflow improvements and optimization', 'feature', '#DC2626', 2, NOW() - INTERVAL '16 days', NOW() - INTERVAL '10 days', 0.8, false, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'interface', 'interface', 'User interface and user experience', 'feature', '#6B7280', 1, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', 0.2, false, true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
SELECT 'POPULATION SUMMARY' as info,
  (SELECT COUNT(*) FROM customers WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') as customers,
  (SELECT COUNT(*) FROM surveys WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') as surveys,
  (SELECT COUNT(*) FROM survey_responses sr JOIN surveys s ON sr.survey_id = s.id WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002') as responses,
  (SELECT COUNT(*) FROM tags WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') as tags;
