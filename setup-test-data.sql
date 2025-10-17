-- ============================================================================
-- PHASE 2 TEST DATA SETUP
-- ============================================================================
-- This script sets up test data for Phase 2 strategic theme scoring
-- ============================================================================

-- 1. Create test company (if not exists)
INSERT INTO companies (id, name) 
VALUES ('test-company-phase2', 'Test Company Phase 2')
ON CONFLICT (id) DO NOTHING;

-- 2. Create test admin user
INSERT INTO admin_users (id, company_id, email, full_name, role, is_active)
VALUES (
  'test-admin-phase2',
  'test-company-phase2', 
  'test@phase2.com',
  'Test Admin',
  'company_admin',
  true
) ON CONFLICT (id) DO NOTHING;

-- 3. Create test strategy
INSERT INTO product_strategy (
  id,
  company_id,
  title,
  description,
  target_customer_description,
  problems_we_solve,
  problems_we_dont_solve,
  how_we_win,
  strategic_keywords,
  is_active,
  created_by
) VALUES (
  'test-strategy-phase2',
  'test-company-phase2',
  'Desktop-First Construction Software',
  'Focus on desktop accuracy and workflow efficiency for power users',
  'Power estimators and takeoff specialists who need desktop accuracy and workflow efficiency',
  ARRAY[
    'Takeoff accuracy and precision',
    'Desktop workflow efficiency', 
    'Integration with existing construction tools',
    'Advanced calculation capabilities'
  ],
  ARRAY[
    'Field execution and mobile workflows',
    'Consumer-grade mobile apps',
    'Basic or simplified features',
    'Non-construction use cases'
  ],
  'Best desktop accuracy and workflow efficiency for power users',
  '[
    {"keyword": "desktop", "weight": 0.8, "reasoning": "Core focus on desktop-first approach"},
    {"keyword": "accuracy", "weight": 0.9, "reasoning": "Primary competitive advantage"},
    {"keyword": "mobile", "weight": -0.5, "reasoning": "Deprioritizing mobile in favor of desktop"},
    {"keyword": "integration", "weight": 0.6, "reasoning": "Key differentiator for workflow efficiency"},
    {"keyword": "field", "weight": -0.3, "reasoning": "Out of scope for V1 strategy"},
    {"keyword": "automation", "weight": 0.7, "reasoning": "Supports accuracy and efficiency goals"}
  ]'::jsonb,
  true,
  'test-admin-phase2'
) ON CONFLICT (company_id, version) DO NOTHING;

-- 4. Create test customers
INSERT INTO customers (id, company_id, full_name, primary_email, account_status)
VALUES 
  ('test-customer-1', 'test-company-phase2', 'John Estimator', 'john@construction.com', 'active'),
  ('test-customer-2', 'test-company-phase2', 'Sarah Takeoff', 'sarah@builders.com', 'active'),
  ('test-customer-3', 'test-company-phase2', 'Mike Field', 'mike@contractors.com', 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. Create test survey
INSERT INTO surveys (id, company_id, title, description, status)
VALUES (
  'test-survey-phase2',
  'test-company-phase2',
  'Phase 2 Test Survey',
  'Test survey for strategic theme scoring',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- 6. Create test survey responses with strategic themes
INSERT INTO survey_responses (id, survey_id, customer_id, responses, sentiment_score, submitted_at)
VALUES 
  -- High alignment theme: Desktop accuracy
  (
    'response-desktop-1',
    'test-survey-phase2',
    'test-customer-1',
    '{"feedback": "The desktop accuracy is great, but I need even more precision in my takeoff calculations. The current system is good but could be more accurate."}',
    0.8,
    NOW() - INTERVAL '1 day'
  ),
  (
    'response-desktop-2', 
    'test-survey-phase2',
    'test-customer-2',
    '{"feedback": "Desktop workflow is efficient but I want better integration with Quick Bid. The accuracy is good but could be improved."}',
    0.7,
    NOW() - INTERVAL '2 days'
  ),
  
  -- Off-strategy theme: Mobile field access
  (
    'response-mobile-1',
    'test-survey-phase2', 
    'test-customer-3',
    '{"feedback": "I need mobile access to view takeoffs while on construction sites. The desktop version is great but I need field access."}',
    0.6,
    NOW() - INTERVAL '3 days'
  ),
  (
    'response-mobile-2',
    'test-survey-phase2',
    'test-customer-1', 
    '{"feedback": "Mobile app would be helpful for field workers to check measurements and takeoffs on site."}',
    0.5,
    NOW() - INTERVAL '4 days'
  ),
  
  -- Mixed alignment theme: Integration
  (
    'response-integration-1',
    'test-survey-phase2',
    'test-customer-2',
    '{"feedback": "Better integration with other construction software would improve my workflow efficiency."}',
    0.9,
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Create test tags
INSERT INTO tags (id, company_id, name, normalized_name, category, is_active)
VALUES 
  ('tag-desktop', 'test-company-phase2', 'desktop', 'desktop', 'platform', true),
  ('tag-accuracy', 'test-company-phase2', 'accuracy', 'accuracy', 'feature', true),
  ('tag-mobile', 'test-company-phase2', 'mobile', 'mobile', 'platform', true),
  ('tag-field', 'test-company-phase2', 'field', 'field', 'context', true),
  ('tag-integration', 'test-company-phase2', 'integration', 'integration', 'feature', true),
  ('tag-automation', 'test-company-phase2', 'automation', 'automation', 'feature', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Create tag usages for survey responses
INSERT INTO tag_usages (id, company_id, tag_id, source_id, source_type, sentiment_score, used_at)
VALUES 
  -- Desktop accuracy theme
  ('usage-desktop-1', 'test-company-phase2', 'tag-desktop', 'response-desktop-1', 'survey_response', 0.8, NOW() - INTERVAL '1 day'),
  ('usage-accuracy-1', 'test-company-phase2', 'tag-accuracy', 'response-desktop-1', 'survey_response', 0.8, NOW() - INTERVAL '1 day'),
  ('usage-desktop-2', 'test-company-phase2', 'tag-desktop', 'response-desktop-2', 'survey_response', 0.7, NOW() - INTERVAL '2 days'),
  ('usage-integration-1', 'test-company-phase2', 'tag-integration', 'response-desktop-2', 'survey_response', 0.7, NOW() - INTERVAL '2 days'),
  
  -- Mobile field theme  
  ('usage-mobile-1', 'test-company-phase2', 'tag-mobile', 'response-mobile-1', 'survey_response', 0.6, NOW() - INTERVAL '3 days'),
  ('usage-field-1', 'test-company-phase2', 'tag-field', 'response-mobile-1', 'survey_response', 0.6, NOW() - INTERVAL '3 days'),
  ('usage-mobile-2', 'test-company-phase2', 'tag-mobile', 'response-mobile-2', 'survey_response', 0.5, NOW() - INTERVAL '4 days'),
  ('usage-field-2', 'test-company-phase2', 'tag-field', 'response-mobile-2', 'survey_response', 0.5, NOW() - INTERVAL '4 days'),
  
  -- Integration theme
  ('usage-integration-2', 'test-company-phase2', 'tag-integration', 'response-integration-1', 'survey_response', 0.9, NOW() - INTERVAL '5 days'),
  ('usage-automation-1', 'test-company-phase2', 'tag-automation', 'response-integration-1', 'survey_response', 0.9, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- 9. Create test themes (if they don't exist from discovery)
INSERT INTO themes (
  id,
  company_id,
  title,
  description,
  feedback_count,
  sentiment_score,
  priority_score,
  strategic_alignment_score,
  strategic_reasoning,
  strategic_conflicts,
  strategic_opportunities,
  final_priority_score,
  recommendation,
  created_at
) VALUES 
  (
    'theme-desktop-accuracy',
    'test-company-phase2',
    'Enhanced Desktop Accuracy Features',
    'Customers want improved accuracy in takeoff calculations and desktop workflow efficiency',
    2,
    0.75,
    85,
    90,
    'Strongly aligns with desktop-first strategy and core accuracy focus. Supports competitive advantage in takeoff precision.',
    ARRAY[]::text[],
    ARRAY['Supports "How we win: Best desktop accuracy"', 'Matches target customer (power estimators)', 'Addresses core problem (takeoff accuracy)'],
    77,
    'high_priority',
    NOW()
  ),
  (
    'theme-mobile-field',
    'test-company-phase2', 
    'Mobile Support for Field Measurements',
    'Users need mobile access to view takeoffs and measurements while on construction sites',
    2,
    0.55,
    86,
    25,
    'Conflicts with desktop-first strategy and field execution is explicitly out of scope. High customer demand but strategic misalignment.',
    ARRAY['Strategic keyword "mobile" (-0.5)', 'Conflicts with "Problems we don\'t solve: Field execution"'],
    ARRAY['Partial match: Target customer includes field workers'],
    22,
    'explore_lightweight',
    NOW()
  ),
  (
    'theme-integration',
    'test-company-phase2',
    'Enhanced Integration Capabilities', 
    'Better integration with construction software tools for improved workflow efficiency',
    1,
    0.9,
    90,
    85,
    'Aligns with strategic keyword "integration" and supports workflow efficiency goals. Strong customer demand with good strategic fit.',
    ARRAY[]::text[],
    ARRAY['Strategic keyword "integration" (+0.6)', 'Supports "Problems we solve: Integration with existing tools"'],
    77,
    'high_priority',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 10. Verify test data setup
SELECT 'Test data setup complete!' as status;

-- Show summary of created data
SELECT 
  'Companies' as table_name, 
  COUNT(*) as count 
FROM companies 
WHERE id = 'test-company-phase2'

UNION ALL

SELECT 
  'Strategies' as table_name,
  COUNT(*) as count
FROM product_strategy 
WHERE company_id = 'test-company-phase2'

UNION ALL

SELECT 
  'Survey Responses' as table_name,
  COUNT(*) as count  
FROM survey_responses
WHERE survey_id = 'test-survey-phase2'

UNION ALL

SELECT 
  'Tags' as table_name,
  COUNT(*) as count
FROM tags
WHERE company_id = 'test-company-phase2'

UNION ALL

SELECT 
  'Tag Usages' as table_name,
  COUNT(*) as count
FROM tag_usages
WHERE company_id = 'test-company-phase2'

UNION ALL

SELECT 
  'Themes' as table_name,
  COUNT(*) as count
FROM themes
WHERE company_id = 'test-company-phase2';

-- Show themes with strategic scoring
SELECT 
  title,
  priority_score as customer_signal,
  strategic_alignment_score,
  final_priority_score,
  recommendation
FROM themes
WHERE company_id = 'test-company-phase2'
ORDER BY final_priority_score DESC;
