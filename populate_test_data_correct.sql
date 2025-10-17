-- ============================================================================
-- CORRECT POPULATE TEST COMPANY DATA
-- ============================================================================
-- Based on actual database schema: ai_tags is TEXT[], tags are in separate table
-- ============================================================================

-- First, ensure the test company exists
INSERT INTO companies (id, name, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'Carter Lumber', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create 10 realistic customers for the test company (with unique IDs)
INSERT INTO customers (id, company_id, primary_email, full_name, company_name, job_title, industry, company_size, location, subscription_tier, account_status, created_at, updated_at, last_activity) VALUES
  ('770e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'mike.contractor@carterlumber.com', 'Mike Rodriguez', 'Carter Lumber', 'Senior Estimator', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '45 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('770e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'sarah.estimator@carterlumber.com', 'Sarah Chen', 'Carter Lumber', 'Project Manager', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('770e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', 'john.superintendent@carterlumber.com', 'John Thompson', 'Carter Lumber', 'Superintendent', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('770e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'lisa.projectmanager@carterlumber.com', 'Lisa Martinez', 'Carter Lumber', 'Operations Manager', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '90 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  ('770e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440002', 'david.foreman@carterlumber.com', 'David Wilson', 'Carter Lumber', 'Foreman', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('770e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440002', 'jennifer.architect@carterlumber.com', 'Jennifer Lee', 'Carter Lumber', 'Design Coordinator', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '75 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('770e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440002', 'robert.subcontractor@carterlumber.com', 'Robert Johnson', 'Carter Lumber', 'Subcontractor Relations', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '35 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('770e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440002', 'amanda.engineer@carterlumber.com', 'Amanda Davis', 'Carter Lumber', 'Structural Engineer', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '50 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('770e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440002', 'chris.owner@carterlumber.com', 'Chris Anderson', 'Carter Lumber', 'Owner', 'Construction', '51-200', 'Phoenix, AZ', 'Enterprise', 'active', NOW() - INTERVAL '120 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  ('770e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440002', 'maria.supplier@carterlumber.com', 'Maria Garcia', 'Carter Lumber', 'Materials Manager', 'Construction', '51-200', 'Phoenix, AZ', 'Professional', 'active', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Create 5 comprehensive surveys for the test company (with unique IDs)
INSERT INTO surveys (id, company_id, title, description, questions, status, enable_ai_analysis, created_by, created_at, updated_at) VALUES
  ('880e8400-e29b-41d4-a716-446655440021', 
   '550e8400-e29b-41d4-a716-446655440002',
   'On-Screen Takeoff User Experience Survey', 
   'Help us improve On-Screen Takeoff by sharing your experience with our digital takeoff and estimating software.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How would you rate On-Screen Takeoff overall?", "required": true}, {"id": "q2", "type": "text", "question": "What do you like most about On-Screen Takeoff?", "required": false}, {"id": "q3", "type": "text", "question": "What improvements would you like to see?", "required": false}, {"id": "q4", "type": "rating", "question": "How likely are you to recommend On-Screen Takeoff to a colleague?", "required": true}]}',
   'active', true, 'bc3b55b1-94df-45d1-ad52-55449b4faa5c', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
   
  ('880e8400-e29b-41d4-a716-446655440022',
   '550e8400-e29b-41d4-a716-446655440002',
   'Project Intelligence Platform Feedback',
   'Share your thoughts on ConstructConnect Project Intelligence and how it helps you find the right construction projects.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How accurate are the project leads from Project Intelligence?", "required": true}, {"id": "q2", "type": "text", "question": "How has Project Intelligence helped your business?", "required": false}, {"id": "q3", "type": "rating", "question": "How easy is it to filter and search for relevant projects?", "required": true}, {"id": "q4", "type": "text", "question": "What additional features would be most valuable?", "required": false}]}',
   'active', true, 'bc3b55b1-94df-45d1-ad52-55449b4faa5c', NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days'),
   
  ('880e8400-e29b-41d4-a716-446655440023',
   '550e8400-e29b-41d4-a716-446655440002',
   'SmartBid Bid Management Experience',
   'Tell us about your experience using SmartBid for bid management and subcontractor coordination.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How effective is SmartBid for managing your bidding process?", "required": true}, {"id": "q2", "type": "text", "question": "What challenges do you face with bid management?", "required": false}, {"id": "q3", "type": "rating", "question": "How well does SmartBid help you connect with subcontractors?", "required": true}, {"id": "q4", "type": "text", "question": "How could we improve the bid management workflow?", "required": false}]}',
   'active', true, 'bc3b55b1-94df-45d1-ad52-55449b4faa5c', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
   
  ('880e8400-e29b-41d4-a716-446655440024',
   '550e8400-e29b-41d4-a716-446655440002',
   'PlanSwift Takeoff Tool Evaluation',
   'Share your experience with PlanSwift for digital takeoffs and material calculations.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How user-friendly is PlanSwift for digital takeoffs?", "required": true}, {"id": "q2", "type": "text", "question": "What features of PlanSwift do you use most?", "required": false}, {"id": "q3", "type": "rating", "question": "How accurate are the material calculations?", "required": true}, {"id": "q4", "type": "text", "question": "What would make PlanSwift more efficient for your workflow?", "required": false}]}',
   'active', true, 'bc3b55b1-94df-45d1-ad52-55449b4faa5c', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),
   
  ('880e8400-e29b-41d4-a716-446655440025',
   '550e8400-e29b-41d4-a716-446655440002',
   'ConstructConnect Platform Overall Experience',
   'Help us understand your overall experience with the ConstructConnect platform and our suite of tools.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How satisfied are you with ConstructConnect overall?", "required": true}, {"id": "q2", "type": "text", "question": "Which ConstructConnect tools do you use regularly?", "required": false}, {"id": "q3", "type": "rating", "question": "How likely are you to continue using ConstructConnect?", "required": true}, {"id": "q4", "type": "text", "question": "What would make ConstructConnect more valuable to your business?", "required": false}]}',
   'active', true, 'bc3b55b1-94df-45d1-ad52-55449b4faa5c', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Create survey links for all surveys (with unique tokens)
INSERT INTO survey_links (id, survey_id, customer_id, token, respondent_email, respondent_name, status, created_at, completed_at) VALUES
  -- On-Screen Takeoff Survey Links
  ('990e8400-e29b-41d4-a716-446655440021', '880e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440021', 'takeoff_survey_021', 'mike.contractor@carterlumber.com', 'Mike Rodriguez', 'completed', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  ('990e8400-e29b-41d4-a716-446655440022', '880e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440022', 'takeoff_survey_022', 'sarah.estimator@carterlumber.com', 'Sarah Chen', 'completed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('990e8400-e29b-41d4-a716-446655440023', '880e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440023', 'takeoff_survey_023', 'john.superintendent@carterlumber.com', 'John Thompson', 'completed', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
  
  -- Project Intelligence Survey Links
  ('990e8400-e29b-41d4-a716-446655440024', '880e8400-e29b-41d4-a716-446655440022', '770e8400-e29b-41d4-a716-446655440024', 'project_intel_021', 'lisa.projectmanager@carterlumber.com', 'Lisa Martinez', 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('990e8400-e29b-41d4-a716-446655440025', '880e8400-e29b-41d4-a716-446655440022', '770e8400-e29b-41d4-a716-446655440025', 'project_intel_022', 'david.foreman@carterlumber.com', 'David Wilson', 'completed', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
  
  -- SmartBid Survey Links (with new unique tokens)
  ('990e8400-e29b-41d4-a716-446655440026', '880e8400-e29b-41d4-a716-446655440023', '770e8400-e29b-41d4-a716-446655440026', 'smartbid_021', 'jennifer.architect@carterlumber.com', 'Jennifer Lee', 'completed', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
  ('990e8400-e29b-41d4-a716-446655440027', '880e8400-e29b-41d4-a716-446655440023', '770e8400-e29b-41d4-a716-446655440027', 'smartbid_022', 'robert.subcontractor@carterlumber.com', 'Robert Johnson', 'completed', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
  
  -- PlanSwift Survey Links
  ('990e8400-e29b-41d4-a716-446655440028', '880e8400-e29b-41d4-a716-446655440024', '770e8400-e29b-41d4-a716-446655440028', 'planswift_021', 'amanda.engineer@carterlumber.com', 'Amanda Davis', 'completed', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('990e8400-e29b-41d4-a716-446655440029', '880e8400-e29b-41d4-a716-446655440024', '770e8400-e29b-41d4-a716-446655440029', 'planswift_022', 'chris.owner@carterlumber.com', 'Chris Anderson', 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
  
  -- Platform Overall Survey Links
  ('990e8400-e29b-41d4-a716-446655440030', '880e8400-e29b-41d4-a716-446655440025', '770e8400-e29b-41d4-a716-446655440030', 'platform_021', 'maria.supplier@carterlumber.com', 'Maria Garcia', 'completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- Create comprehensive survey responses with CORRECT ai_tags format (TEXT[] not JSON)
INSERT INTO survey_responses (id, survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, sentiment_score, ai_tags, priority_score) VALUES
-- On-Screen Takeoff Responses (Mixed feedback) - CORRECT TEXT[] format
('aa0e8400-e29b-41d4-a716-446655440021', '990e8400-e29b-41d4-a716-446655440021', '880e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440021', 
 '{"q1": 4, "q2": "The AI-assisted counting features are amazing! Takeoff Boost saves me hours every week.", "q3": "The interface could be more intuitive for new users.", "q4": 5}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.100"}', NOW() - INTERVAL '28 days', 0.7, ARRAY['takeoff', 'ai', 'efficiency', 'positive', 'interface', 'boost'], 45),

('aa0e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', '880e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440022',
 '{"q1": 5, "q2": "PlanSwift integration is seamless. The accuracy is incredible.", "q3": "Wish there was better mobile support for field measurements.", "q4": 5}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.101"}', NOW() - INTERVAL '25 days', 0.8, ARRAY['takeoff', 'integration', 'accuracy', 'mobile', 'positive', 'planswift'], 35),

('aa0e8400-e29b-41d4-a716-446655440023', '990e8400-e29b-41d4-a716-446655440023', '880e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440023',
 '{"q1": 3, "q2": "Good for basic takeoffs but struggles with complex architectural drawings.", "q3": "Need better support for BIM integration and 3D models.", "q4": 3}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.102"}', NOW() - INTERVAL '22 days', 0.1, ARRAY['takeoff', 'bim', '3d', 'complex', 'integration', 'architectural'], 65),

-- Project Intelligence Responses
('aa0e8400-e29b-41d4-a716-446655440024', '990e8400-e29b-41d4-a716-446655440024', '880e8400-e29b-41d4-a716-446655440022', '770e8400-e29b-41d4-a716-446655440024',
 '{"q1": 4, "q2": "Project leads are very accurate. Found 3 new projects this month!", "q3": "Sometimes get duplicate notifications for the same project.", "q4": 4}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.106"}', NOW() - INTERVAL '20 days', 0.6, ARRAY['project', 'leads', 'accuracy', 'notifications', 'positive', 'business-growth'], 50),

('aa0e8400-e29b-41d4-a716-446655440025', '990e8400-e29b-41d4-a716-446655440025', '880e8400-e29b-41d4-a716-446655440022', '770e8400-e29b-41d4-a716-446655440025',
 '{"q1": 5, "q2": "Game changer for our business. Project Intelligence helped us win 2 major contracts.", "q3": "Love the geographic filtering and market analysis features.", "q4": 5}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.107"}', NOW() - INTERVAL '18 days', 0.9, ARRAY['project', 'intelligence', 'contracts', 'geographic', 'analysis', 'game-changer'], 25),

-- SmartBid Responses
('aa0e8400-e29b-41d4-a716-446655440026', '990e8400-e29b-41d4-a716-446655440026', '880e8400-e29b-41d4-a716-446655440023', '770e8400-e29b-41d4-a716-446655440026',
 '{"q1": 4, "q2": "Great for organizing bids and tracking responses.", "q3": "The interface could be simpler for subcontractors to use.", "q4": 4}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.112"}', NOW() - INTERVAL '16 days', 0.6, ARRAY['smartbid', 'organizing', 'tracking', 'interface', 'subcontractors', 'workflow'], 50),

('aa0e8400-e29b-41d4-a716-446655440027', '990e8400-e29b-41d4-a716-446655440027', '880e8400-e29b-41d4-a716-446655440023', '770e8400-e29b-41d4-a716-446655440027',
 '{"q1": 5, "q2": "SmartBid has streamlined our entire bidding process. Highly recommend!", "q3": "Love the automated notifications and status tracking.", "q4": 5}',
 '{"user_agent": "Safari", "ip_address": "192.168.1.113"}', NOW() - INTERVAL '14 days', 0.9, ARRAY['smartbid', 'streamlined', 'automated', 'notifications', 'excellent', 'recommend'], 25),

-- PlanSwift Responses
('aa0e8400-e29b-41d4-a716-446655440028', '990e8400-e29b-41d4-a716-446655440028', '880e8400-e29b-41d4-a716-446655440024', '770e8400-e29b-41d4-a716-446655440028',
 '{"q1": 4, "q2": "PlanSwift is intuitive and fast for digital takeoffs.", "q3": "Material calculations are very accurate. Great tool!", "q4": 4}',
 '{"user_agent": "Safari", "ip_address": "192.168.1.118"}', NOW() - INTERVAL '12 days', 0.8, ARRAY['planswift', 'intuitive', 'fast', 'calculations', 'accurate', 'material'], 35),

('aa0e8400-e29b-41d4-a716-446655440029', '990e8400-e29b-41d4-a716-446655440029', '880e8400-e29b-41d4-a716-446655440024', '770e8400-e29b-41d4-a716-446655440029',
 '{"q1": 5, "q2": "Love the drag-and-drop interface. Makes takeoffs fun!", "q3": "Integration with Quick Bid is seamless. Perfect workflow.", "q4": 5}',
 '{"user_agent": "Edge", "ip_address": "192.168.1.120"}', NOW() - INTERVAL '10 days', 0.9, ARRAY['planswift', 'drag-drop', 'interface', 'quick-bid', 'workflow', 'seamless'], 25),

-- Platform Overall Responses
('aa0e8400-e29b-41d4-a716-446655440030', '990e8400-e29b-41d4-a716-446655440030', '880e8400-e29b-41d4-a716-446655440025', '770e8400-e29b-41d4-a716-446655440030',
 '{"q1": 4, "q2": "ConstructConnect is essential for our business. Great suite of tools.", "q3": "The integration between different tools could be smoother.", "q4": 4}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.124"}', NOW() - INTERVAL '8 days', 0.7, ARRAY['platform', 'essential', 'tools', 'integration', 'business', 'suite'], 50)
ON CONFLICT (id) DO NOTHING;

-- Create comprehensive tags for the test company (with unique IDs and names)
INSERT INTO tags (id, company_id, name, normalized_name, description, category, color, usage_count, first_used, last_used, avg_sentiment, is_system_tag, is_active, created_at, updated_at) VALUES
  ('tt0e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'takeoff-tool', 'takeoff-tool', 'Digital takeoff and estimating features', 'feature', '#3B82F6', 3, NOW() - INTERVAL '28 days', NOW() - INTERVAL '22 days', 0.5, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440002', 'ai-features', 'ai-features', 'AI-powered features and automation', 'feature', '#8B5CF6', 1, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', 0.8, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440002', 'integration-tools', 'integration-tools', 'Integration with other tools and platforms', 'feature', '#10B981', 2, NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days', 0.7, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440002', 'accuracy-precision', 'accuracy-precision', 'Accuracy and precision of measurements/calculations', 'feature', '#F59E0B', 2, NOW() - INTERVAL '25 days', NOW() - INTERVAL '12 days', 0.8, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440002', 'mobile-support', 'mobile-support', 'Mobile support and accessibility', 'feature', '#EF4444', 2, NOW() - INTERVAL '25 days', NOW() - INTERVAL '22 days', 0.1, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440002', 'positive-feedback', 'positive-feedback', 'Positive sentiment and feedback', 'sentiment', '#10B981', 8, NOW() - INTERVAL '28 days', NOW() - INTERVAL '8 days', 0.8, true, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440002', 'user-interface', 'user-interface', 'User interface and user experience', 'feature', '#6B7280', 4, NOW() - INTERVAL '28 days', NOW() - INTERVAL '16 days', 0.2, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440002', 'project-management', 'project-management', 'Project management and intelligence features', 'feature', '#3B82F6', 2, NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', 0.6, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440002', 'bid-management', 'bid-management', 'SmartBid bid management features', 'feature', '#8B5CF6', 2, NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days', 0.3, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440002', 'planswift-tool', 'planswift-tool', 'PlanSwift takeoff tool features', 'feature', '#10B981', 2, NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days', 0.6, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440002', 'platform-overall', 'platform-overall', 'Overall ConstructConnect platform', 'feature', '#6366F1', 1, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 0.6, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440002', 'game-changing', 'game-changing', 'Game-changing features or improvements', 'sentiment', '#10B981', 1, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', 0.9, true, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440002', 'efficiency', 'efficiency', 'Efficiency and time-saving features', 'feature', '#059669', 2, NOW() - INTERVAL '28 days', NOW() - INTERVAL '14 days', 0.8, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440002', 'automated', 'automated', 'Automated features and processes', 'feature', '#7C3AED', 1, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 0.9, false, true, NOW(), NOW()),
  ('tt0e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440002', 'workflow', 'workflow', 'Workflow improvements and optimization', 'feature', '#DC2626', 2, NOW() - INTERVAL '16 days', NOW() - INTERVAL '10 days', 0.8, false, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
SELECT 'POPULATION SUMMARY' as info,
  (SELECT COUNT(*) FROM customers WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') as customers,
  (SELECT COUNT(*) FROM surveys WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') as surveys,
  (SELECT COUNT(*) FROM survey_responses sr JOIN surveys s ON sr.survey_id = s.id WHERE s.company_id = '550e8400-e29b-41d4-a716-446655440002') as responses,
  (SELECT COUNT(*) FROM tags WHERE company_id = '550e8400-e29b-41d4-a716-446655440002') as tags;
