-- ============================================================================
-- TEST DATA: ConstructConnect Product Feedback
-- ============================================================================
-- Creates realistic test data for 10 customers, 5 surveys, and 30 responses
-- Based on ConstructConnect's actual products and customer base
-- ============================================================================

-- First, let's create some companies (ConstructConnect customers)
INSERT INTO companies (id, name, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Keystone Construction Services', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Carter Lumber', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Elder Corporation', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'RamJack Foundation Solutions', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'BCI Construction Group', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Note: Admin users require Supabase Auth users to exist first
-- You'll need to create these through the Supabase Auth UI or API
-- For now, we'll skip admin_users creation and focus on the customer data

-- Create 10 realistic customers (construction professionals)
INSERT INTO customers (id, company_id, primary_email, full_name, created_at, updated_at, last_activity) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'mike.contractor@builders.com', 'Mike Rodriguez', NOW() - INTERVAL '45 days', NOW() - INTERVAL '2 days'),
  ('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'sarah.estimator@construction.com', 'Sarah Chen', NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'john.superintendent@buildpro.com', 'John Thompson', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
  ('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'lisa.projectmanager@construct.com', 'Lisa Martinez', NOW() - INTERVAL '90 days', NOW() - INTERVAL '7 days'),
  ('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'david.foreman@builders.com', 'David Wilson', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'jennifer.architect@design.com', 'Jennifer Lee', NOW() - INTERVAL '75 days', NOW() - INTERVAL '4 days'),
  ('770e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'robert.subcontractor@trade.com', 'Robert Johnson', NOW() - INTERVAL '35 days', NOW() - INTERVAL '6 days'),
  ('770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'amanda.engineer@structural.com', 'Amanda Davis', NOW() - INTERVAL '50 days', NOW() - INTERVAL '1 day'),
  ('770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440004', 'chris.owner@development.com', 'Chris Anderson', NOW() - INTERVAL '120 days', NOW() - INTERVAL '8 days'),
  ('770e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', 'maria.supplier@materials.com', 'Maria Garcia', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Create 5 surveys about ConstructConnect products
INSERT INTO surveys (id, title, description, questions, company_id, created_at, updated_at, enable_ai_analysis) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 
   'On-Screen Takeoff User Experience Survey', 
   'Help us improve On-Screen Takeoff by sharing your experience with our digital takeoff and estimating software.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How would you rate On-Screen Takeoff overall?", "required": true}, {"id": "q2", "type": "text", "question": "What do you like most about On-Screen Takeoff?", "required": false}, {"id": "q3", "type": "text", "question": "What improvements would you like to see?", "required": false}, {"id": "q4", "type": "rating", "question": "How likely are you to recommend On-Screen Takeoff to a colleague?", "required": true}]}',
   '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days', true),
   
  ('880e8400-e29b-41d4-a716-446655440002',
   'Project Intelligence Platform Feedback',
   'Share your thoughts on ConstructConnect Project Intelligence and how it helps you find the right construction projects.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How accurate are the project leads from Project Intelligence?", "required": true}, {"id": "q2", "type": "text", "question": "How has Project Intelligence helped your business?", "required": false}, {"id": "q3", "type": "rating", "question": "How easy is it to filter and search for relevant projects?", "required": true}, {"id": "q4", "type": "text", "question": "What additional features would be most valuable?", "required": false}]}',
   '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days', true),
   
  ('880e8400-e29b-41d4-a716-446655440003',
   'SmartBid Bid Management Experience',
   'Tell us about your experience using SmartBid for bid management and subcontractor coordination.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How effective is SmartBid for managing your bidding process?", "required": true}, {"id": "q2", "type": "text", "question": "What challenges do you face with bid management?", "required": false}, {"id": "q3", "type": "rating", "question": "How well does SmartBid help you connect with subcontractors?", "required": true}, {"id": "q4", "type": "text", "question": "How could we improve the bid management workflow?", "required": false}]}',
   '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day', true),
   
  ('880e8400-e29b-41d4-a716-446655440004',
   'PlanSwift Takeoff Tool Evaluation',
   'Share your experience with PlanSwift for digital takeoffs and material calculations.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How user-friendly is PlanSwift for digital takeoffs?", "required": true}, {"id": "q2", "type": "text", "question": "What features of PlanSwift do you use most?", "required": false}, {"id": "q3", "type": "rating", "question": "How accurate are the material calculations?", "required": true}, {"id": "q4", "type": "text", "question": "What would make PlanSwift more efficient for your workflow?", "required": false}]}',
   '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days', true),
   
  ('880e8400-e29b-41d4-a716-446655440005',
   'ConstructConnect Platform Overall Experience',
   'Help us understand your overall experience with the ConstructConnect platform and our suite of tools.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How satisfied are you with ConstructConnect overall?", "required": true}, {"id": "q2", "type": "text", "question": "Which ConstructConnect tools do you use regularly?", "required": false}, {"id": "q3", "type": "rating", "question": "How likely are you to continue using ConstructConnect?", "required": true}, {"id": "q4", "type": "text", "question": "What would make ConstructConnect more valuable to your business?", "required": false}]}',
   '550e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day', true)
ON CONFLICT (id) DO NOTHING;

-- Create survey links for the surveys
INSERT INTO survey_links (id, survey_id, token, respondent_email, respondent_name, status, created_at) VALUES
  -- On-Screen Takeoff Survey Links
  ('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'takeoff_survey_001', 'mike.contractor@builders.com', 'Mike Rodriguez', 'completed', NOW() - INTERVAL '28 days'),
  ('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 'takeoff_survey_002', 'sarah.estimator@construction.com', 'Sarah Chen', 'completed', NOW() - INTERVAL '25 days'),
  ('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', 'takeoff_survey_003', 'john.superintendent@buildpro.com', 'John Thompson', 'completed', NOW() - INTERVAL '22 days'),
  ('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440001', 'takeoff_survey_004', 'lisa.projectmanager@construct.com', 'Lisa Martinez', 'completed', NOW() - INTERVAL '20 days'),
  ('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440001', 'takeoff_survey_005', 'david.foreman@builders.com', 'David Wilson', 'completed', NOW() - INTERVAL '18 days'),
  ('990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440001', 'takeoff_survey_006', 'jennifer.architect@design.com', 'Jennifer Lee', 'completed', NOW() - INTERVAL '15 days'),
  
  -- Project Intelligence Survey Links
  ('990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440002', 'project_intel_001', 'robert.subcontractor@trade.com', 'Robert Johnson', 'completed', NOW() - INTERVAL '23 days'),
  ('990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440002', 'project_intel_002', 'amanda.engineer@structural.com', 'Amanda Davis', 'completed', NOW() - INTERVAL '21 days'),
  ('990e8400-e29b-41d4-a716-446655440009', '880e8400-e29b-41d4-a716-446655440002', 'project_intel_003', 'chris.owner@development.com', 'Chris Anderson', 'completed', NOW() - INTERVAL '19 days'),
  ('990e8400-e29b-41d4-a716-446655440010', '880e8400-e29b-41d4-a716-446655440002', 'project_intel_004', 'maria.supplier@materials.com', 'Maria Garcia', 'completed', NOW() - INTERVAL '17 days'),
  ('990e8400-e29b-41d4-a716-446655440011', '880e8400-e29b-41d4-a716-446655440002', 'project_intel_005', 'mike.contractor@builders.com', 'Mike Rodriguez', 'completed', NOW() - INTERVAL '14 days'),
  ('990e8400-e29b-41d4-a716-446655440012', '880e8400-e29b-41d4-a716-446655440002', 'project_intel_006', 'sarah.estimator@construction.com', 'Sarah Chen', 'completed', NOW() - INTERVAL '12 days'),
  
  -- SmartBid Survey Links
  ('990e8400-e29b-41d4-a716-446655440013', '880e8400-e29b-41d4-a716-446655440003', 'smartbid_001', 'john.superintendent@buildpro.com', 'John Thompson', 'completed', NOW() - INTERVAL '18 days'),
  ('990e8400-e29b-41d4-a716-446655440014', '880e8400-e29b-41d4-a716-446655440003', 'smartbid_002', 'lisa.projectmanager@construct.com', 'Lisa Martinez', 'completed', NOW() - INTERVAL '16 days'),
  ('990e8400-e29b-41d4-a716-446655440015', '880e8400-e29b-41d4-a716-446655440003', 'smartbid_003', 'david.foreman@builders.com', 'David Wilson', 'completed', NOW() - INTERVAL '13 days'),
  ('990e8400-e29b-41d4-a716-446655440016', '880e8400-e29b-41d4-a716-446655440003', 'smartbid_004', 'jennifer.architect@design.com', 'Jennifer Lee', 'completed', NOW() - INTERVAL '11 days'),
  ('990e8400-e29b-41d4-a716-446655440017', '880e8400-e29b-41d4-a716-446655440003', 'smartbid_005', 'robert.subcontractor@trade.com', 'Robert Johnson', 'completed', NOW() - INTERVAL '9 days'),
  ('990e8400-e29b-41d4-a716-446655440018', '880e8400-e29b-41d4-a716-446655440003', 'smartbid_006', 'amanda.engineer@structural.com', 'Amanda Davis', 'completed', NOW() - INTERVAL '7 days'),
  
  -- PlanSwift Survey Links
  ('990e8400-e29b-41d4-a716-446655440019', '880e8400-e29b-41d4-a716-446655440004', 'planswift_001', 'chris.owner@development.com', 'Chris Anderson', 'completed', NOW() - INTERVAL '13 days'),
  ('990e8400-e29b-41d4-a716-446655440020', '880e8400-e29b-41d4-a716-446655440004', 'planswift_002', 'maria.supplier@materials.com', 'Maria Garcia', 'completed', NOW() - INTERVAL '11 days'),
  ('990e8400-e29b-41d4-a716-446655440021', '880e8400-e29b-41d4-a716-446655440004', 'planswift_003', 'mike.contractor@builders.com', 'Mike Rodriguez', 'completed', NOW() - INTERVAL '8 days'),
  ('990e8400-e29b-41d4-a716-446655440022', '880e8400-e29b-41d4-a716-446655440004', 'planswift_004', 'sarah.estimator@construction.com', 'Sarah Chen', 'completed', NOW() - INTERVAL '6 days'),
  ('990e8400-e29b-41d4-a716-446655440023', '880e8400-e29b-41d4-a716-446655440004', 'planswift_005', 'john.superintendent@buildpro.com', 'John Thompson', 'completed', NOW() - INTERVAL '4 days'),
  ('990e8400-e29b-41d4-a716-446655440024', '880e8400-e29b-41d4-a716-446655440004', 'planswift_006', 'lisa.projectmanager@construct.com', 'Lisa Martinez', 'completed', NOW() - INTERVAL '2 days'),
  
  -- Platform Overall Survey Links
  ('990e8400-e29b-41d4-a716-446655440025', '880e8400-e29b-41d4-a716-446655440005', 'platform_001', 'david.foreman@builders.com', 'David Wilson', 'completed', NOW() - INTERVAL '8 days'),
  ('990e8400-e29b-41d4-a716-446655440026', '880e8400-e29b-41d4-a716-446655440005', 'platform_002', 'jennifer.architect@design.com', 'Jennifer Lee', 'completed', NOW() - INTERVAL '6 days'),
  ('990e8400-e29b-41d4-a716-446655440027', '880e8400-e29b-41d4-a716-446655440005', 'platform_003', 'robert.subcontractor@trade.com', 'Robert Johnson', 'completed', NOW() - INTERVAL '4 days'),
  ('990e8400-e29b-41d4-a716-446655440028', '880e8400-e29b-41d4-a716-446655440005', 'platform_004', 'amanda.engineer@structural.com', 'Amanda Davis', 'completed', NOW() - INTERVAL '2 days'),
  ('990e8400-e29b-41d4-a716-446655440029', '880e8400-e29b-41d4-a716-446655440005', 'platform_005', 'chris.owner@development.com', 'Chris Anderson', 'completed', NOW() - INTERVAL '1 day'),
  ('990e8400-e29b-41d4-a716-446655440030', '880e8400-e29b-41d4-a716-446655440005', 'platform_006', 'maria.supplier@materials.com', 'Maria Garcia', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Update survey_links to link customers (customer_id column added by migration)
UPDATE survey_links SET customer_id = '770e8400-e29b-41d4-a716-446655440001' WHERE respondent_email = 'mike.contractor@builders.com';
UPDATE survey_links SET customer_id = '770e8400-e29b-41d4-a716-446655440002' WHERE respondent_email = 'sarah.estimator@construction.com';
UPDATE survey_links SET customer_id = '770e8400-e29b-41d4-a716-446655440003' WHERE respondent_email = 'john.superintendent@buildpro.com';
UPDATE survey_links SET customer_id = '770e8400-e29b-41d4-a716-446655440004' WHERE respondent_email = 'lisa.projectmanager@construct.com';
UPDATE survey_links SET customer_id = '770e8400-e29b-41d4-a716-446655440005' WHERE respondent_email = 'david.foreman@builders.com';
UPDATE survey_links SET customer_id = '770e8400-e29b-41d4-a716-446655440006' WHERE respondent_email = 'jennifer.architect@design.com';
UPDATE survey_links SET customer_id = '770e8400-e29b-41d4-a716-446655440007' WHERE respondent_email = 'robert.subcontractor@trade.com';
UPDATE survey_links SET customer_id = '770e8400-e29b-41d4-a716-446655440008' WHERE respondent_email = 'amanda.engineer@structural.com';
UPDATE survey_links SET customer_id = '770e8400-e29b-41d4-a716-446655440009' WHERE respondent_email = 'chris.owner@development.com';
UPDATE survey_links SET customer_id = '770e8400-e29b-41d4-a716-446655440010' WHERE respondent_email = 'maria.supplier@materials.com';

-- Create 30 realistic survey responses with ConstructConnect product feedback
INSERT INTO survey_responses (id, survey_link_id, survey_id, customer_id, responses, metadata, submitted_at, created_at, updated_at, sentiment_score, ai_tags, priority_score) VALUES

-- On-Screen Takeoff Responses (Mixed feedback - some love it, some have issues)
('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 
 '{"q1": 4, "q2": "The AI-assisted counting features are amazing! Takeoff Boost saves me hours every week.", "q3": "The interface could be more intuitive for new users.", "q4": 5}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.100"}', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', 0.7, '["takeoff", "ai", "efficiency", "positive", "interface"]', 45),

('aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002',
 '{"q1": 5, "q2": "PlanSwift integration is seamless. The accuracy is incredible.", "q3": "Wish there was better mobile support for field measurements.", "q4": 5}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.101"}', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', 0.8, '["takeoff", "integration", "accuracy", "mobile", "positive"]', 35),

('aa0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003',
 '{"q1": 3, "q2": "Good for basic takeoffs but struggles with complex architectural drawings.", "q3": "Need better support for BIM integration and 3D models.", "q4": 3}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.102"}', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', 0.1, '["takeoff", "bim", "3d", "complex", "integration"]', 65),

('aa0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004',
 '{"q1": 4, "q2": "Love the speed and accuracy. Cuts my takeoff time in half.", "q3": "The learning curve was steep but worth it.", "q4": 4}',
 '{"user_agent": "Safari", "ip_address": "192.168.1.103"}', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 0.6, '["takeoff", "speed", "accuracy", "learning", "positive"]', 40),

('aa0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440005',
 '{"q1": 2, "q2": "Frequently crashes with large PDF files. Very frustrating.", "q3": "Need better error handling and stability improvements.", "q4": 2}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.104"}', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', -0.6, '["takeoff", "crashes", "stability", "pdf", "frustrating"]', 85),

('aa0e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440006',
 '{"q1": 4, "q2": "Excellent for quantity takeoffs. The measurement tools are precise.", "q3": "Could use better collaboration features for team projects.", "q4": 4}',
 '{"user_agent": "Edge", "ip_address": "192.168.1.105"}', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', 0.7, '["takeoff", "measurement", "precision", "collaboration", "positive"]', 45),

-- Project Intelligence Responses (Mostly positive with some concerns)
('aa0e8400-e29b-41d4-a716-446655440007', '990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440007',
 '{"q1": 4, "q2": "Project leads are very accurate. Found 3 new projects this month!", "q3": "Sometimes get duplicate notifications for the same project.", "q4": 4}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.106"}', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days', 0.6, '["project", "leads", "accuracy", "notifications", "positive"]', 50),

('aa0e8400-e29b-41d4-a716-446655440008', '990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440008',
 '{"q1": 5, "q2": "Game changer for our business. Project Intelligence helped us win 2 major contracts.", "q3": "Love the geographic filtering and market analysis features.", "q4": 5}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.107"}', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', 0.9, '["project", "intelligence", "contracts", "geographic", "analysis"]', 25),

('aa0e8400-e29b-41d4-a716-446655440009', '990e8400-e29b-41d4-a716-446655440009', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440009',
 '{"q1": 3, "q2": "Good project data but the pricing seems high for what we get.", "q3": "Need more detailed project specifications and timelines.", "q4": 3}',
 '{"user_agent": "Safari", "ip_address": "192.168.1.108"}', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days', 0.2, '["project", "pricing", "specifications", "timeline", "concerns"]', 60),

('aa0e8400-e29b-41d4-a716-446655440010', '990e8400-e29b-41d4-a716-446655440010', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440010',
 '{"q1": 4, "q2": "Very helpful for identifying potential suppliers and partners.", "q3": "Would like better integration with our CRM system.", "q4": 4}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.109"}', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days', 0.5, '["project", "suppliers", "partners", "crm", "integration"]', 55),

('aa0e8400-e29b-41d4-a716-446655440011', '990e8400-e29b-41d4-a716-446655440011', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001',
 '{"q1": 5, "q2": "The market insights and trends analysis are incredibly valuable.", "q3": "Keep up the great work! Maybe add more regional data.", "q4": 5}',
 '{"user_agent": "Edge", "ip_address": "192.168.1.110"}', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 0.8, '["project", "insights", "trends", "regional", "valuable"]', 30),

('aa0e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002',
 '{"q1": 4, "q2": "Good project leads but sometimes outdated information.", "q3": "Need more real-time updates and better contact information.", "q4": 4}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.111"}', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', 0.3, '["project", "leads", "outdated", "real-time", "contacts"]', 70),

-- SmartBid Responses (Mixed - some love it, some struggle with complexity)
('aa0e8400-e29b-41d4-a716-446655440013', '990e8400-e29b-41d4-a716-446655440013', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003',
 '{"q1": 4, "q2": "Great for organizing bids and tracking responses.", "q3": "The interface could be simpler for subcontractors to use.", "q4": 4}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.112"}', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', 0.6, '["smartbid", "organizing", "tracking", "interface", "subcontractors"]', 50),

('aa0e8400-e29b-41d4-a716-446655440014', '990e8400-e29b-41d4-a716-446655440014', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440004',
 '{"q1": 5, "q2": "SmartBid has streamlined our entire bidding process. Highly recommend!", "q3": "Love the automated notifications and status tracking.", "q4": 5}',
 '{"user_agent": "Safari", "ip_address": "192.168.1.113"}', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', 0.9, '["smartbid", "streamlined", "automated", "notifications", "excellent"]', 25),

('aa0e8400-e29b-41d4-a716-446655440015', '990e8400-e29b-41d4-a716-446655440015', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440005',
 '{"q1": 2, "q2": "Too complicated for our small team. Steep learning curve.", "q3": "Need simpler features and better training resources.", "q4": 2}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.114"}', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', -0.5, '["smartbid", "complicated", "learning", "training", "small-team"]', 75),

('aa0e8400-e29b-41d4-a716-446655440016', '990e8400-e29b-41d4-a716-446655440016', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440006',
 '{"q1": 4, "q2": "Excellent for managing multiple bids simultaneously.", "q3": "Would like better reporting and analytics features.", "q4": 4}',
 '{"user_agent": "Edge", "ip_address": "192.168.1.115"}', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', 0.7, '["smartbid", "multiple", "bids", "reporting", "analytics"]', 45),

('aa0e8400-e29b-41d4-a716-446655440017', '990e8400-e29b-41d4-a716-446655440017', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440007',
 '{"q1": 3, "q2": "Good concept but needs better mobile support for field teams.", "q3": "Integration with other ConstructConnect tools could be smoother.", "q4": 3}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.116"}', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', 0.1, '["smartbid", "mobile", "integration", "field", "tools"]', 65),

('aa0e8400-e29b-41d4-a716-446655440018', '990e8400-e29b-41d4-a716-446655440018', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440008',
 '{"q1": 5, "q2": "Game changer! Reduced our bid response time by 40%.", "q3": "The subcontractor network is amazing for finding qualified partners.", "q4": 5}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.117"}', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 0.9, '["smartbid", "response-time", "subcontractor", "network", "game-changer"]', 20),

-- PlanSwift Responses (Mostly positive with some technical issues)
('aa0e8400-e29b-41d4-a716-446655440019', '990e8400-e29b-41d4-a716-446655440019', '880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440009',
 '{"q1": 4, "q2": "PlanSwift is intuitive and fast for digital takeoffs.", "q3": "Material calculations are very accurate. Great tool!", "q4": 4}',
 '{"user_agent": "Safari", "ip_address": "192.168.1.118"}', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', 0.8, '["planswift", "intuitive", "fast", "calculations", "accurate"]', 35),

('aa0e8400-e29b-41d4-a716-446655440020', '990e8400-e29b-41d4-a716-446655440020', '880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440010',
 '{"q1": 3, "q2": "Good for basic measurements but struggles with complex drawings.", "q3": "Need better support for different file formats and versions.", "q4": 3}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.119"}', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', 0.2, '["planswift", "measurements", "complex", "formats", "support"]', 60),

('aa0e8400-e29b-41d4-a716-446655440021', '990e8400-e29b-41d4-a716-446655440021', '880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001',
 '{"q1": 5, "q2": "Love the drag-and-drop interface. Makes takeoffs fun!", "q3": "Integration with Quick Bid is seamless. Perfect workflow.", "q4": 5}',
 '{"user_agent": "Edge", "ip_address": "192.168.1.120"}', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 0.9, '["planswift", "drag-drop", "interface", "quick-bid", "workflow"]', 25),

('aa0e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', '880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002',
 '{"q1": 4, "q2": "Excellent for material quantity calculations and cost estimates.", "q3": "Wish there was better cloud sync for team collaboration.", "q4": 4}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.121"}', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 0.7, '["planswift", "material", "calculations", "cloud", "collaboration"]', 45),

('aa0e8400-e29b-41d4-a716-446655440023', '990e8400-e29b-41d4-a716-446655440023', '880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003',
 '{"q1": 2, "q2": "Frequent crashes when working with large architectural files.", "q3": "Need better stability and error recovery features.", "q4": 2}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.122"}', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', -0.6, '["planswift", "crashes", "stability", "architectural", "error-recovery"]', 85),

('aa0e8400-e29b-41d4-a716-446655440024', '990e8400-e29b-41d4-a716-446655440024', '880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004',
 '{"q1": 4, "q2": "Great tool for estimating. Saves time and improves accuracy.", "q3": "The learning resources and tutorials are very helpful.", "q4": 4}',
 '{"user_agent": "Safari", "ip_address": "192.168.1.123"}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 0.8, '["planswift", "estimating", "time", "accuracy", "tutorials"]', 35),

-- Platform Overall Responses (Mixed - some love the ecosystem, others want improvements)
('aa0e8400-e29b-41d4-a716-446655440025', '990e8400-e29b-41d4-a716-446655440025', '880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005',
 '{"q1": 4, "q2": "ConstructConnect is essential for our business. Great suite of tools.", "q3": "The integration between different tools could be smoother.", "q4": 4}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.124"}', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 0.7, '["platform", "essential", "tools", "integration", "business"]', 50),

('aa0e8400-e29b-41d4-a716-446655440026', '990e8400-e29b-41d4-a716-446655440026', '880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440006',
 '{"q1": 5, "q2": "Best construction software platform available. Worth every penny!", "q3": "Customer support is excellent. Keep up the great work!", "q4": 5}',
 '{"user_agent": "Edge", "ip_address": "192.168.1.125"}', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 0.9, '["platform", "best", "software", "support", "excellent"]', 20),

('aa0e8400-e29b-41d4-a716-446655440027', '990e8400-e29b-41d4-a716-446655440027', '880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440007',
 '{"q1": 3, "q2": "Good tools but the pricing is getting expensive for small companies.", "q3": "Need more flexible pricing options and better mobile apps.", "q4": 3}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.126"}', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 0.1, '["platform", "pricing", "expensive", "small-companies", "mobile"]', 70),

('aa0e8400-e29b-41d4-a716-446655440028', '990e8400-e29b-41d4-a716-446655440028', '880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440008',
 '{"q1": 4, "q2": "ConstructConnect has transformed how we manage projects.", "q3": "Love the data insights and market intelligence features.", "q4": 4}',
 '{"user_agent": "Safari", "ip_address": "192.168.1.127"}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 0.8, '["platform", "transformed", "projects", "insights", "intelligence"]', 35),

('aa0e8400-e29b-41d4-a716-446655440029', '990e8400-e29b-41d4-a716-446655440029', '880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440009',
 '{"q1": 4, "q2": "Comprehensive platform with everything we need in one place.", "q3": "The learning curve was worth it. ROI is excellent.", "q4": 4}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.128"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 0.7, '["platform", "comprehensive", "learning", "roi", "excellent"]', 40),

('aa0e8400-e29b-41d4-a716-446655440030', '990e8400-e29b-41d4-a716-446655440030', '880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440010',
 '{"q1": 3, "q2": "Good platform but needs better integration with third-party software.", "q3": "API access would be helpful for custom integrations.", "q4": 3}',
 '{"user_agent": "Edge", "ip_address": "192.168.1.129"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 0.2, '["platform", "integration", "third-party", "api", "custom"]', 60)
ON CONFLICT (id) DO NOTHING;

-- Create customer health scores
INSERT INTO customer_health_scores (id, customer_id, health_score, calculated_at, created_at) VALUES
  ('bb0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 75, NOW() - INTERVAL '2 days'),
  ('bb0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 85, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('bb0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 45, NOW() - INTERVAL '1 day'),
  ('bb0e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004', 80, NOW() - INTERVAL '7 days'),
  ('bb0e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005', 35, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('bb0e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440006', 90, NOW() - INTERVAL '4 days'),
  ('bb0e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440007', 70, NOW() - INTERVAL '6 days'),
  ('bb0e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440008', 95, NOW() - INTERVAL '1 day'),
  ('bb0e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440009', 60, NOW() - INTERVAL '8 days'),
  ('bb0e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440010', 50, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Create some customer identifiers
INSERT INTO customer_identifiers (id, customer_id, identifier_type, identifier_value, created_at) VALUES
  ('cc0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'phone', '+1-555-0101', NOW()),
  ('cc0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 'phone', '+1-555-0102', NOW()),
  ('cc0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'company', 'BuildPro Construction', NOW()),
  ('cc0e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440004', 'company', 'Construct Solutions Inc', NOW()),
  ('cc0e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005', 'phone', '+1-555-0105', NOW()),
  ('cc0e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440006', 'company', 'Design Architects LLC', NOW()),
  ('cc0e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440007', 'company', 'Trade Specialists Co', NOW()),
  ('cc0e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440008', 'phone', '+1-555-0108', NOW()),
  ('cc0e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440009', 'company', 'Development Partners', NOW()),
  ('cc0e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440010', 'company', 'Material Supply Corp', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create feedback items (these should be automatically created by triggers, but let's create some manually for testing)
INSERT INTO feedback_items (id, customer_id, company_id, source_type, source_id, content, sentiment_score, priority_score, ai_tags, created_at, updated_at) VALUES
  ('dd0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'survey_response', 'aa0e8400-e29b-41d4-a716-446655440001', 'The AI-assisted counting features are amazing! Takeoff Boost saves me hours every week. The interface could be more intuitive for new users.', 0.7, 45, '["takeoff", "ai", "efficiency", "positive", "interface"]', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),
  ('dd0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'survey_response', 'aa0e8400-e29b-41d4-a716-446655440002', 'PlanSwift integration is seamless. The accuracy is incredible. Wish there was better mobile support for field measurements.', 0.8, 35, '["takeoff", "integration", "accuracy", "mobile", "positive"]', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('dd0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'survey_response', 'aa0e8400-e29b-41d4-a716-446655440005', 'Frequently crashes with large PDF files. Very frustrating. Need better error handling and stability improvements.', -0.6, 85, '["takeoff", "crashes", "stability", "pdf", "frustrating"]', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
  ('dd0e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'survey_response', 'aa0e8400-e29b-41d4-a716-446655440008', 'Game changer for our business. Project Intelligence helped us win 2 major contracts. Love the geographic filtering and market analysis features.', 0.9, 25, '["project", "intelligence", "contracts", "geographic", "analysis"]', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),
  ('dd0e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', 'survey_response', 'aa0e8400-e29b-41d4-a716-446655440018', 'Game changer! Reduced our bid response time by 40%. The subcontractor network is amazing for finding qualified partners.', 0.9, 20, '["smartbid", "response-time", "subcontractor", "network", "game-changer"]', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Update customer last_activity based on most recent feedback
UPDATE customers SET last_activity = (
  SELECT MAX(submitted_at) FROM survey_responses 
  WHERE survey_responses.customer_id = customers.id
) WHERE id IN (
  SELECT DISTINCT customer_id FROM survey_responses
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the data was inserted correctly:

-- SELECT 'Customers' as table_name, COUNT(*) as count FROM customers
-- UNION ALL
-- SELECT 'Surveys', COUNT(*) FROM surveys
-- UNION ALL  
-- SELECT 'Survey Links', COUNT(*) FROM survey_links
-- UNION ALL
-- SELECT 'Survey Responses', COUNT(*) FROM survey_responses
-- UNION ALL
-- SELECT 'Customer Health Scores', COUNT(*) FROM customer_health_scores
-- UNION ALL
-- SELECT 'Feedback Items', COUNT(*) FROM feedback_items;

-- SELECT 
--   c.primary_email,
--   c.full_name,
--   chs.health_score,
--   COUNT(sr.id) as response_count,
--   AVG(sr.sentiment_score) as avg_sentiment
-- FROM customers c
-- LEFT JOIN customer_health_scores chs ON c.id = chs.customer_id
-- LEFT JOIN survey_responses sr ON c.id = sr.customer_id
-- GROUP BY c.id, c.primary_email, c.full_name, chs.health_score
-- ORDER BY chs.health_score DESC;
