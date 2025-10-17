-- ============================================================================
-- PHASE 4 MIGRATION: Customer Impact Tracking & Closed Loop System
-- ============================================================================
-- This migration adds customer impact tracking for shipped initiatives
-- ============================================================================

-- ============================================================================
-- STEP 1: CUSTOMER IMPACT TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.initiative_customer_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Impact measurement
  impact_type TEXT NOT NULL DEFAULT 'feature_request_addressed',
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
  usage_increase_percentage DECIMAL(5,2),
  churn_prevention BOOLEAN DEFAULT false,
  
  -- Tracking
  notified_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  follow_up_survey_completed BOOLEAN DEFAULT false,
  
  -- Business impact
  estimated_revenue_impact DECIMAL(10,2),
  retention_impact DECIMAL(5,2),
  nps_impact DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (impact_type IN ('feature_request_addressed', 'bug_fix', 'improvement')),
  UNIQUE(initiative_id, customer_id)
);

-- ============================================================================
-- STEP 2: CUSTOMER NOTIFICATION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customer_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  initiative_id UUID REFERENCES public.initiatives(id) ON DELETE SET NULL,
  
  -- Notification details
  notification_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_used TEXT,
  
  -- Delivery tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  
  -- Response tracking
  responded_at TIMESTAMPTZ,
  response_content TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (notification_type IN ('initiative_shipped', 'follow_up_survey', 'impact_measurement'))
);

-- ============================================================================
-- STEP 3: FOLLOW-UP SURVEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.follow_up_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  initiative_id UUID NOT NULL REFERENCES public.initiatives(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Survey details
  survey_type TEXT NOT NULL DEFAULT 'impact_measurement',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  responses JSONB DEFAULT '{}'::jsonb,
  
  -- Completion tracking
  sent_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Results
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 10),
  workflow_improvement BOOLEAN,
  time_saved_hours DECIMAL(5,2),
  recommendation_score INTEGER CHECK (recommendation_score >= 1 AND recommendation_score <= 10),
  additional_feedback TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (survey_type IN ('impact_measurement', 'satisfaction', 'feature_feedback'))
);

-- ============================================================================
-- STEP 4: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Initiative customer impact indexes
CREATE INDEX IF NOT EXISTS idx_initiative_customer_impact_initiative 
  ON public.initiative_customer_impact(initiative_id);

CREATE INDEX IF NOT EXISTS idx_initiative_customer_impact_customer 
  ON public.initiative_customer_impact(customer_id);

CREATE INDEX IF NOT EXISTS idx_initiative_customer_impact_company 
  ON public.initiative_customer_impact(company_id);

CREATE INDEX IF NOT EXISTS idx_initiative_customer_impact_notified 
  ON public.initiative_customer_impact(notified_at) 
  WHERE notified_at IS NOT NULL;

-- Customer notifications indexes
CREATE INDEX IF NOT EXISTS idx_customer_notifications_customer 
  ON public.customer_notifications(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_initiative 
  ON public.customer_notifications(initiative_id);

CREATE INDEX IF NOT EXISTS idx_customer_notifications_sent 
  ON public.customer_notifications(sent_at) 
  WHERE sent_at IS NOT NULL;

-- Follow-up surveys indexes
CREATE INDEX IF NOT EXISTS idx_follow_up_surveys_initiative 
  ON public.follow_up_surveys(initiative_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_surveys_customer 
  ON public.follow_up_surveys(customer_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_surveys_completed 
  ON public.follow_up_surveys(completed_at) 
  WHERE completed_at IS NOT NULL;

-- ============================================================================
-- STEP 5: RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.initiative_customer_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_surveys ENABLE ROW LEVEL SECURITY;

-- Initiative customer impact policies
CREATE POLICY "Users can view their company initiative impacts"
  ON public.initiative_customer_impact FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage their company initiative impacts"
  ON public.initiative_customer_impact FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

-- Customer notifications policies
CREATE POLICY "Users can view their company notifications"
  ON public.customer_notifications FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage their company notifications"
  ON public.customer_notifications FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

-- Follow-up surveys policies
CREATE POLICY "Users can view their company follow-up surveys"
  ON public.follow_up_surveys FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage their company follow-up surveys"
  ON public.follow_up_surveys FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

-- ============================================================================
-- STEP 6: HELPER FUNCTIONS
-- ============================================================================

-- Function to get customers affected by a theme
CREATE OR REPLACE FUNCTION get_customers_for_theme(theme_uuid UUID)
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  customer_email TEXT,
  feedback_count BIGINT,
  last_feedback_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    c.id as customer_id,
    c.full_name as customer_name,
    c.primary_email as customer_email,
    COUNT(fi.id) as feedback_count,
    MAX(fi.feedback_date) as last_feedback_date
  FROM public.customers c
  JOIN public.feedback_items fi ON fi.customer_id = c.id
  JOIN public.themes t ON t.id = theme_uuid
  WHERE fi.themes @> ARRAY[t.title]::TEXT[]
    AND c.company_id = (SELECT company_id FROM public.themes WHERE id = theme_uuid)
  GROUP BY c.id, c.full_name, c.primary_email
  ORDER BY feedback_count DESC, last_feedback_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create customer impact records when initiative ships
CREATE OR REPLACE FUNCTION create_customer_impacts_for_initiative(initiative_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  impact_count INTEGER := 0;
  customer_record RECORD;
BEGIN
  -- Get the initiative and its theme
  FOR customer_record IN 
    SELECT DISTINCT c.id, c.full_name, c.primary_email
    FROM public.initiatives i
    JOIN public.themes t ON t.id = i.theme_id
    JOIN public.feedback_items fi ON fi.themes @> ARRAY[t.title]::TEXT[]
    JOIN public.customers c ON c.id = fi.customer_id
    WHERE i.id = initiative_uuid
      AND i.status = 'shipped'
      AND c.company_id = i.company_id
  LOOP
    -- Create impact record if it doesn't exist
    INSERT INTO public.initiative_customer_impact (
      company_id,
      initiative_id,
      customer_id,
      impact_type,
      created_at
    )
    SELECT 
      i.company_id,
      i.id,
      customer_record.id,
      'feature_request_addressed',
      NOW()
    FROM public.initiatives i
    WHERE i.id = initiative_uuid
    ON CONFLICT (initiative_id, customer_id) DO NOTHING;
    
    impact_count := impact_count + 1;
  END LOOP;
  
  RETURN impact_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: TRIGGERS
-- ============================================================================

-- Trigger to automatically create customer impacts when initiative ships
CREATE OR REPLACE FUNCTION trigger_create_customer_impacts()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'shipped'
  IF NEW.status = 'shipped' AND (OLD.status IS NULL OR OLD.status != 'shipped') THEN
    PERFORM create_customer_impacts_for_initiative(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS initiative_shipped_create_impacts ON public.initiatives;
CREATE TRIGGER initiative_shipped_create_impacts
  AFTER UPDATE ON public.initiatives
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_customer_impacts();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Show what was created
SELECT 'PHASE_4_MIGRATION_COMPLETE' as status, 
       'Customer impact tracking tables created' as message;
