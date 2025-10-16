-- ============================================================================
-- POPULATE TAGS TABLE - QUICK SETUP
-- ============================================================================
-- Run this after creating the tags table to populate it with data
-- ============================================================================

-- Step 1: Insert sample tags for testing
INSERT INTO tags (company_id, name, normalized_name, description, category, color, is_system_tag) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Takeoff', 'takeoff', 'Digital takeoff and measurement features', 'feature', '#3B82F6', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'AI', 'ai', 'Artificial intelligence and automation features', 'feature', '#8B5CF6', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Performance', 'performance', 'System performance and speed issues', 'topic', '#EF4444', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Integration', 'integration', 'Third-party integrations and APIs', 'feature', '#10B981', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'User Experience', 'user experience', 'UI/UX and usability feedback', 'topic', '#F59E0B', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Efficiency', 'efficiency', 'Workflow and efficiency improvements', 'topic', '#06B6D4', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Interface', 'interface', 'User interface and design feedback', 'topic', '#84CC16', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Mobile', 'mobile', 'Mobile app and mobile-specific features', 'feature', '#F97316', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Positive', 'positive', 'Positive feedback and praise', 'sentiment', '#22C55E', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Crashes', 'crashes', 'System crashes and stability issues', 'topic', '#EF4444', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Stability', 'stability', 'System stability and reliability', 'topic', '#DC2626', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Project', 'project', 'Project management and planning features', 'feature', '#7C3AED', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Intelligence', 'intelligence', 'AI-powered intelligence and insights', 'feature', '#EC4899', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Contracts', 'contracts', 'Contract and bidding management', 'feature', '#059669', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Geographic', 'geographic', 'Location-based features and filtering', 'feature', '#0891B2', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Analysis', 'analysis', 'Data analysis and reporting features', 'feature', '#BE185D', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'SmartBid', 'smartbid', 'SmartBid bid management platform', 'feature', '#7C2D12', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Response Time', 'response-time', 'Response time and speed improvements', 'topic', '#1E40AF', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Subcontractor', 'subcontractor', 'Subcontractor network and management', 'feature', '#0F766E', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Network', 'network', 'Professional network and connections', 'feature', '#BE185D', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Game Changer', 'game-changer', 'Game-changing features and improvements', 'sentiment', '#DC2626', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Accuracy', 'accuracy', 'Accuracy and precision in measurements', 'topic', '#059669', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Measurement', 'measurement', 'Measurement tools and precision', 'feature', '#0891B2', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Precision', 'precision', 'Precision and accuracy features', 'topic', '#7C3AED', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Collaboration', 'collaboration', 'Team collaboration features', 'feature', '#EC4899', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'PDF', 'pdf', 'PDF handling and processing', 'feature', '#BE185D', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Frustrating', 'frustrating', 'Frustrating user experiences', 'sentiment', '#DC2626', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Learning', 'learning', 'Learning curve and user onboarding', 'topic', '#F59E0B', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'Speed', 'speed', 'Speed and performance improvements', 'topic', '#06B6D4', true)
ON CONFLICT (company_id, normalized_name) DO NOTHING;

-- Step 2: Update usage counts and statistics
-- This will populate the usage_count, first_used, last_used, and avg_sentiment fields
UPDATE tags SET
    usage_count = (
        SELECT COUNT(*) 
        FROM feedback_items fi, UNNEST(fi.ai_tags) as t(tag)
        WHERE fi.company_id = tags.company_id 
          AND LOWER(TRIM(t.tag)) = tags.normalized_name
    ),
    first_used = (
        SELECT MIN(fi.created_at)
        FROM feedback_items fi, UNNEST(fi.ai_tags) as t(tag)
        WHERE fi.company_id = tags.company_id 
          AND LOWER(TRIM(t.tag)) = tags.normalized_name
    ),
    last_used = (
        SELECT MAX(fi.created_at)
        FROM feedback_items fi, UNNEST(fi.ai_tags) as t(tag)
        WHERE fi.company_id = tags.company_id 
          AND LOWER(TRIM(t.tag)) = tags.normalized_name
    ),
    avg_sentiment = (
        SELECT AVG(fi.sentiment_score)
        FROM feedback_items fi, UNNEST(fi.ai_tags) as t(tag)
        WHERE fi.company_id = tags.company_id 
          AND LOWER(TRIM(t.tag)) = tags.normalized_name
          AND fi.sentiment_score IS NOT NULL
    )
WHERE company_id = '550e8400-e29b-41d4-a716-446655440001';

-- Step 3: Create tag_usages records for existing feedback_items
INSERT INTO tag_usages (tag_id, company_id, source_type, source_id, customer_id, sentiment_score, used_at)
SELECT 
    t.id as tag_id,
    fi.company_id,
    'feedback_item' as source_type,
    fi.id as source_id,
    fi.customer_id,
    fi.sentiment_score,
    fi.created_at as used_at
FROM feedback_items fi, UNNEST(fi.ai_tags) as unnest_tag(tag)
JOIN tags t ON t.company_id = fi.company_id 
    AND t.normalized_name = LOWER(TRIM(unnest_tag.tag))
WHERE fi.company_id = '550e8400-e29b-41d4-a716-446655440001'
ON CONFLICT (tag_id, source_type, source_id) DO NOTHING;

-- Step 4: Verify the data
SELECT 
    name,
    normalized_name,
    category,
    usage_count,
    avg_sentiment,
    first_used,
    last_used,
    color
FROM tags 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY usage_count DESC;

-- Step 5: Check tag_usages
SELECT 
    t.name,
    COUNT(tu.id) as usage_records,
    AVG(tu.sentiment_score) as avg_sentiment
FROM tags t
LEFT JOIN tag_usages tu ON tu.tag_id = t.id
WHERE t.company_id = '550e8400-e29b-41d4-a716-446655440001'
GROUP BY t.id, t.name
ORDER BY usage_records DESC;
