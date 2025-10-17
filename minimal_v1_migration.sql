-- ============================================================================
-- MINIMAL V1 MIGRATION: Strategy + Enhanced Themes + Initiatives
-- ============================================================================
-- This migration adds only what's needed for V1 roadmap system
-- ============================================================================

-- ============================================================================
-- STEP 1: STRATEGY LAYER (3 new tables)
-- ============================================================================

-- Table 1: company_vision
CREATE TABLE IF NOT EXISTS public.company_vision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Vision content
  vision_statement TEXT NOT NULL,
  mission_statement TEXT,
  
  -- Version tracking
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  active_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_until TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, version),
  CHECK (active_until IS NULL OR active_until > active_from)
);

-- Table 2: product_strategy
CREATE TABLE IF NOT EXISTS public.product_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  vision_id UUID REFERENCES public.company_vision(id) ON DELETE SET NULL,
  
  -- Strategy definition
  title TEXT NOT NULL,
  description TEXT,
  
  -- Target customer
  target_customer_description TEXT,
  target_customer_segments TEXT[] DEFAULT '{}',
  
  -- Strategic choices (Critical!)
  problems_we_solve TEXT[] NOT NULL DEFAULT '{}',
  problems_we_dont_solve TEXT[] NOT NULL DEFAULT '{}',
  how_we_win TEXT,
  
  -- Strategic keywords with weights
  strategic_keywords JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"keyword": "mobile", "weight": -0.5, "reasoning": "Deprioritizing mobile"}]
  
  -- Competitive positioning
  competitors JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"name": "Competitor A", "their_strength": "...", "our_differentiation": "..."}]
  
  -- Version tracking
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  active_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_until TIMESTAMPTZ,
  
  -- Change tracking
  update_reason TEXT,
  what_we_learned TEXT,
  
  -- Metadata
  created_by UUID REFERENCES public.admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company_id, version),
  CHECK (active_until IS NULL OR active_until > active_from)
);

-- Table 3: strategic_objectives (OKRs)
CREATE TABLE IF NOT EXISTS public.strategic_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES public.product_strategy(id) ON DELETE CASCADE,
  
  -- OKR definition
  objective TEXT NOT NULL,
  quarter TEXT NOT NULL,
  
  -- Key results (array of metrics)
  key_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Format: [{"metric": "Churn rate", "baseline": 12, "target": 9.6, "current": 10.5, "unit": "percent"}]
  
  -- Ownership
  owner_id UUID REFERENCES public.admin_users(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'planning',
  
  -- Results (after quarter ends)
  final_results JSONB,
  retrospective_url TEXT,
  retrospective_notes TEXT,
  
  -- Timestamps
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (status IN ('planning', 'active', 'completed', 'missed', 'deprioritized'))
);

-- ============================================================================
-- STEP 2: ENHANCE THEMES TABLE (Strategic Scoring + PM Decisions)
-- ============================================================================

-- Add strategic scoring columns (only if they don't exist)
DO $$ 
BEGIN
    -- Add strategic alignment score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'themes' AND column_name = 'strategic_alignment_score') THEN
        ALTER TABLE public.themes ADD COLUMN strategic_alignment_score INTEGER DEFAULT 50;
    END IF;
    
    -- Add strategic reasoning
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'themes' AND column_name = 'strategic_reasoning') THEN
        ALTER TABLE public.themes ADD COLUMN strategic_reasoning TEXT;
    END IF;
    
    -- Add strategic conflicts
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'themes' AND column_name = 'strategic_conflicts') THEN
        ALTER TABLE public.themes ADD COLUMN strategic_conflicts TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add strategic opportunities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'themes' AND column_name = 'strategic_opportunities') THEN
        ALTER TABLE public.themes ADD COLUMN strategic_opportunities TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add final priority score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'themes' AND column_name = 'final_priority_score') THEN
        ALTER TABLE public.themes ADD COLUMN final_priority_score INTEGER DEFAULT 50;
    END IF;
    
    -- Add recommendation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'themes' AND column_name = 'recommendation') THEN
        ALTER TABLE public.themes ADD COLUMN recommendation TEXT DEFAULT 'needs_review';
    END IF;
    
    -- Add PM notes (only if not exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'themes' AND column_name = 'pm_notes') THEN
        ALTER TABLE public.themes ADD COLUMN pm_notes TEXT;
    END IF;
    
    -- Add declined reason (only if not exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'themes' AND column_name = 'declined_reason') THEN
        ALTER TABLE public.themes ADD COLUMN declined_reason TEXT;
    END IF;
    
    -- Add initiative_id (only if not exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'themes' AND column_name = 'initiative_id') THEN
        ALTER TABLE public.themes ADD COLUMN initiative_id UUID;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: INITIATIVES TABLE (Direct link to themes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  objective_id UUID REFERENCES public.strategic_objectives(id) ON DELETE SET NULL,
  
  -- Initiative details
  title TEXT NOT NULL,
  description TEXT,
  
  -- Execution
  owner_id UUID REFERENCES public.admin_users(id),
  team_ids UUID[] DEFAULT '{}',
  effort TEXT NOT NULL DEFAULT 'M',
  
  -- Timeline
  target_quarter TEXT,
  timeline_bucket TEXT NOT NULL DEFAULT 'next',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'backlog',
  
  -- Tracking
  started_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  
  -- Impact (post-ship)
  actual_impact TEXT,
  retrospective_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CHECK (effort IN ('XS', 'S', 'M', 'L', 'XL')),
  CHECK (timeline_bucket IN ('now', 'next', 'later')),
  CHECK (status IN ('backlog', 'planned', 'in_progress', 'shipped', 'cancelled'))
);

-- ============================================================================
-- STEP 4: INDEXES
-- ============================================================================

-- Strategy table indexes
CREATE INDEX IF NOT EXISTS idx_company_vision_company_active 
  ON public.company_vision(company_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_product_strategy_company_active 
  ON public.product_strategy(company_id, is_active) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_strategic_objectives_company 
  ON public.strategic_objectives(company_id);

-- Themes enhancements indexes
CREATE INDEX IF NOT EXISTS idx_themes_strategic_priority 
  ON public.themes(company_id, final_priority_score DESC);

-- Initiatives indexes
CREATE INDEX IF NOT EXISTS idx_initiatives_company_status 
  ON public.initiatives(company_id, status);

CREATE INDEX IF NOT EXISTS idx_initiatives_theme 
  ON public.initiatives(theme_id);

CREATE INDEX IF NOT EXISTS idx_initiatives_objective 
  ON public.initiatives(objective_id);

-- ============================================================================
-- STEP 5: FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key from themes to initiatives (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'themes_initiative_id_fkey' 
                   AND table_name = 'themes') THEN
        ALTER TABLE public.themes 
        ADD CONSTRAINT themes_initiative_id_fkey 
        FOREIGN KEY (initiative_id) REFERENCES public.initiatives(id);
    END IF;
END $$;

-- ============================================================================
-- STEP 6: RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.company_vision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_strategy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their company vision" ON public.company_vision;
DROP POLICY IF EXISTS "Admins can manage their company vision" ON public.company_vision;
DROP POLICY IF EXISTS "Users can view their company strategy" ON public.product_strategy;
DROP POLICY IF EXISTS "Admins can manage their company strategy" ON public.product_strategy;
DROP POLICY IF EXISTS "Users can view their company objectives" ON public.strategic_objectives;
DROP POLICY IF EXISTS "Admins can manage their company objectives" ON public.strategic_objectives;
DROP POLICY IF EXISTS "Users can view their company initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Admins can manage their company initiatives" ON public.initiatives;

-- Create RLS policies for strategy tables
CREATE POLICY "Users can view their company vision"
  ON public.company_vision FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage their company vision"
  ON public.company_vision FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view their company strategy"
  ON public.product_strategy FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage their company strategy"
  ON public.product_strategy FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view their company objectives"
  ON public.strategic_objectives FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage their company objectives"
  ON public.strategic_objectives FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view their company initiatives"
  ON public.initiatives FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage their company initiatives"
  ON public.initiatives FOR ALL
  USING (company_id IN (
    SELECT company_id FROM public.admin_users WHERE id = auth.uid()
  ));

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Show what was created
SELECT 'MIGRATION_COMPLETE' as status, 
       'Strategy + Themes + Initiatives tables created' as message;
