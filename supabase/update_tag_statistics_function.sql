-- Function to update tag statistics after merging duplicates
-- This recalculates usage_count, first_used, last_used, and avg_sentiment

CREATE OR REPLACE FUNCTION update_tag_statistics(p_company_id UUID)
RETURNS void AS $$
BEGIN
  -- Update tag statistics based on actual tag_usages
  UPDATE tags 
  SET 
    usage_count = (
      SELECT COUNT(*) 
      FROM tag_usages 
      WHERE tag_id = tags.id
    ),
    first_used = (
      SELECT MIN(used_at) 
      FROM tag_usages 
      WHERE tag_id = tags.id
    ),
    last_used = (
      SELECT MAX(used_at) 
      FROM tag_usages 
      WHERE tag_id = tags.id
    ),
    avg_sentiment = (
      SELECT AVG(sentiment_score) 
      FROM tag_usages 
      WHERE tag_id = tags.id 
        AND sentiment_score IS NOT NULL
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE company_id = p_company_id
    AND is_active = true;
    
  -- Log the update
  RAISE NOTICE 'Updated tag statistics for company %', p_company_id;
END;
$$ LANGUAGE plpgsql;
