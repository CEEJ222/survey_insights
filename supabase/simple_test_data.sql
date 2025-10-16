-- ============================================================================
-- SIMPLE TEST DATA for ORIGINAL Survey Insights Schema
-- ============================================================================
-- This works with the CURRENT database structure (before unified migration)
-- ============================================================================

-- First, let's create some companies
INSERT INTO companies (id, name, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Keystone Construction Services', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Carter Lumber', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Elder Corporation', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create 3 surveys about ConstructConnect products
INSERT INTO surveys (id, title, description, questions, company_id, created_at, updated_at) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 
   'On-Screen Takeoff User Experience Survey', 
   'Help us improve On-Screen Takeoff by sharing your experience with our digital takeoff and estimating software.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How would you rate On-Screen Takeoff overall?", "required": true}, {"id": "q2", "type": "text", "question": "What do you like most about On-Screen Takeoff?", "required": false}, {"id": "q3", "type": "text", "question": "What improvements would you like to see?", "required": false}, {"id": "q4", "type": "rating", "question": "How likely are you to recommend On-Screen Takeoff to a colleague?", "required": true}]}',
   '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),
   
  ('880e8400-e29b-41d4-a716-446655440002',
   'Project Intelligence Platform Feedback',
   'Share your thoughts on ConstructConnect Project Intelligence and how it helps you find the right construction projects.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How accurate are the project leads from Project Intelligence?", "required": true}, {"id": "q2", "type": "text", "question": "How has Project Intelligence helped your business?", "required": false}, {"id": "q3", "type": "rating", "question": "How easy is it to filter and search for relevant projects?", "required": true}, {"id": "q4", "type": "text", "question": "What additional features would be most valuable?", "required": false}]}',
   '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days'),
   
  ('880e8400-e29b-41d4-a716-446655440003',
   'SmartBid Bid Management Experience',
   'Tell us about your experience using SmartBid for bid management and subcontractor coordination.',
   '{"questions": [{"id": "q1", "type": "rating", "question": "How effective is SmartBid for managing your bidding process?", "required": true}, {"id": "q2", "type": "text", "question": "What challenges do you face with bid management?", "required": false}, {"id": "q3", "type": "rating", "question": "How well does SmartBid help you connect with subcontractors?", "required": true}, {"id": "q4", "type": "text", "question": "How could we improve the bid management workflow?", "required": false}]}',
   '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Create survey links for the surveys
INSERT INTO survey_links (id, survey_id, token, respondent_email, respondent_name, status, created_at) VALUES
  -- On-Screen Takeoff Survey Links
  ('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'takeoff_survey_001', 'mike.contractor@builders.com', 'Mike Rodriguez', 'completed', NOW() - INTERVAL '28 days'),
  ('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 'takeoff_survey_002', 'sarah.estimator@construction.com', 'Sarah Chen', 'completed', NOW() - INTERVAL '25 days'),
  ('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', 'takeoff_survey_003', 'john.superintendent@buildpro.com', 'John Thompson', 'completed', NOW() - INTERVAL '22 days'),
  
  -- Project Intelligence Survey Links
  ('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', 'project_intel_001', 'robert.subcontractor@trade.com', 'Robert Johnson', 'completed', NOW() - INTERVAL '23 days'),
  ('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440002', 'project_intel_002', 'amanda.engineer@structural.com', 'Amanda Davis', 'completed', NOW() - INTERVAL '21 days'),
  ('990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440002', 'project_intel_003', 'chris.owner@development.com', 'Chris Anderson', 'completed', NOW() - INTERVAL '19 days'),
  
  -- SmartBid Survey Links
  ('990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440003', 'smartbid_001', 'lisa.projectmanager@construct.com', 'Lisa Martinez', 'completed', NOW() - INTERVAL '18 days'),
  ('990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440003', 'smartbid_002', 'david.foreman@builders.com', 'David Wilson', 'completed', NOW() - INTERVAL '16 days'),
  ('990e8400-e29b-41d4-a716-446655440009', '880e8400-e29b-41d4-a716-446655440003', 'smartbid_003', 'jennifer.architect@design.com', 'Jennifer Lee', 'completed', NOW() - INTERVAL '13 days')
ON CONFLICT (id) DO NOTHING;

-- Create 9 realistic survey responses with ConstructConnect product feedback
INSERT INTO survey_responses (id, survey_link_id, survey_id, responses, metadata, submitted_at) VALUES

-- On-Screen Takeoff Responses
('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 
 '{"q1": 4, "q2": "The AI-assisted counting features are amazing! Takeoff Boost saves me hours every week.", "q3": "The interface could be more intuitive for new users.", "q4": 5}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.100"}', NOW() - INTERVAL '28 days'),

('aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001',
 '{"q1": 5, "q2": "PlanSwift integration is seamless. The accuracy is incredible.", "q3": "Wish there was better mobile support for field measurements.", "q4": 5}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.101"}', NOW() - INTERVAL '25 days'),

('aa0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001',
 '{"q1": 3, "q2": "Good for basic takeoffs but struggles with complex architectural drawings.", "q3": "Need better support for BIM integration and 3D models.", "q4": 3}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.102"}', NOW() - INTERVAL '22 days'),

-- Project Intelligence Responses
('aa0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002',
 '{"q1": 4, "q2": "Project leads are very accurate. Found 3 new projects this month!", "q3": "Sometimes get duplicate notifications for the same project.", "q4": 4}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.106"}', NOW() - INTERVAL '23 days'),

('aa0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440002',
 '{"q1": 5, "q2": "Game changer for our business. Project Intelligence helped us win 2 major contracts.", "q3": "Love the geographic filtering and market analysis features.", "q4": 5}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.107"}', NOW() - INTERVAL '21 days'),

('aa0e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440002',
 '{"q1": 3, "q2": "Good project data but the pricing seems high for what we get.", "q3": "Need more detailed project specifications and timelines.", "q4": 3}',
 '{"user_agent": "Safari", "ip_address": "192.168.1.108"}', NOW() - INTERVAL '19 days'),

-- SmartBid Responses
('aa0e8400-e29b-41d4-a716-446655440007', '990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440003',
 '{"q1": 4, "q2": "Great for organizing bids and tracking responses.", "q3": "The interface could be simpler for subcontractors to use.", "q4": 4}',
 '{"user_agent": "Firefox", "ip_address": "192.168.1.112"}', NOW() - INTERVAL '18 days'),

('aa0e8400-e29b-41d4-a716-446655440008', '990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440003',
 '{"q1": 5, "q2": "SmartBid has streamlined our entire bidding process. Highly recommend!", "q3": "Love the automated notifications and status tracking.", "q4": 5}',
 '{"user_agent": "Safari", "ip_address": "192.168.1.113"}', NOW() - INTERVAL '16 days'),

('aa0e8400-e29b-41d4-a716-446655440009', '990e8400-e29b-41d4-a716-446655440009', '880e8400-e29b-41d4-a716-446655440003',
 '{"q1": 2, "q2": "Too complicated for our small team. Steep learning curve.", "q3": "Need simpler features and better training resources.", "q4": 2}',
 '{"user_agent": "Chrome", "ip_address": "192.168.1.114"}', NOW() - INTERVAL '13 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the data was inserted correctly:

-- SELECT 'Companies' as table_name, COUNT(*) as count FROM companies
-- UNION ALL
-- SELECT 'Surveys', COUNT(*) FROM surveys
-- UNION ALL  
-- SELECT 'Survey Links', COUNT(*) FROM survey_links
-- UNION ALL
-- SELECT 'Survey Responses', COUNT(*) FROM survey_responses;

-- SELECT 
--   s.title as survey_title,
--   c.name as company_name,
--   sl.respondent_name,
--   sl.respondent_email,
--   sr.submitted_at
-- FROM surveys s
-- JOIN companies c ON s.company_id = c.id
-- JOIN survey_links sl ON sl.survey_id = s.id
-- JOIN survey_responses sr ON sr.survey_link_id = sl.id
-- ORDER BY sr.submitted_at DESC;


