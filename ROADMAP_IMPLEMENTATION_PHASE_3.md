# 🚀 Roadmap Implementation - Phase 3: PM Workflow & Initiative Creation

**Status:** Ready to Start  
**Estimated Time:** 1-2 weeks  
**Priority:** High - Core roadmap functionality

---

## 🎯 Phase 3 Objective

Build the **PM Workflow System** - the core roadmap functionality that connects customer themes to product initiatives with a seamless PM decision workflow.

**Goal:** PMs can review themes with strategic context, make quick approve/decline decisions, and create initiatives directly from approved themes. This creates the complete customer feedback → roadmap pipeline.

---

## 🏗️ What We're Building

### **1. PM Theme Review Workflow**
✅ **Strategic scoring ready:** Phase 2 provides strategic alignment for all themes  
✅ **Strategy context ready:** PMs can see why themes score high/low strategically  
🔄 **Decision workflow:** Quick approve/decline with strategic reasoning

### **2. Initiative Creation System**
**Target:** Direct theme → initiative workflow with minimal friction

**Required Components:**
- **Initiative CRUD API** - Create, read, update, delete initiatives
- **Theme → Initiative Bridge** - One-click creation from approved themes
- **Initiative Management** - Owner assignment, effort sizing, timeline planning
- **Progress Tracking** - Status updates and milestone tracking

### **3. Roadmap Timeline View**
**Required UI Components:**
- **Now/Next/Later Buckets** - Organize initiatives by timeline priority
- **Initiative Cards** - Show progress, owner, effort, customer impact
- **Timeline Management** - Drag-and-drop timeline organization
- **Status Tracking** - Visual progress indicators

---

## 🔧 Technical Implementation

### **Database Schema (Already Ready)**
```sql
-- Initiatives table was created in Phase 1 migration
CREATE TABLE initiatives (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  theme_id UUID REFERENCES themes(id), -- Link to originating theme
  objective_id UUID REFERENCES strategic_objectives(id), -- Link to OKR
  
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES admin_users(id),
  team_ids UUID[] DEFAULT '{}',
  effort TEXT DEFAULT 'M', -- XS, S, M, L, XL
  status TEXT DEFAULT 'backlog', -- backlog, planned, in_progress, shipped, cancelled
  timeline_bucket TEXT DEFAULT 'next', -- now, next, later
  target_quarter TEXT,
  
  started_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  actual_impact TEXT,
  retrospective_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Initiative API Endpoints**
```typescript
// Initiative CRUD operations
GET    /api/admin/initiatives                    // List all initiatives
POST   /api/admin/initiatives                    // Create new initiative
GET    /api/admin/initiatives/[id]               // Get initiative details
PUT    /api/admin/initiatives/[id]               // Update initiative
DELETE /api/admin/initiatives/[id]               // Delete initiative

// Initiative management
POST   /api/admin/initiatives/from-theme         // Create from approved theme
PUT    /api/admin/initiatives/[id]/status        // Update initiative status
PUT    /api/admin/initiatives/[id]/progress      // Update progress
PUT    /api/admin/initiatives/[id]/timeline      // Update timeline bucket

// Roadmap views
GET    /api/admin/initiatives/timeline           // Timeline view (now/next/later)
GET    /api/admin/initiatives/roadmap            // Roadmap view with progress
```

### **Key Functions to Implement**
```typescript
// Initiative creation from theme
async function createInitiativeFromTheme(
  themeId: string, 
  initiativeData: CreateInitiativeRequest
): Promise<Initiative> {
  const theme = await getThemeById(themeId)
  if (!theme) throw new Error('Theme not found')
  
  const initiative = await createInitiative({
    ...initiativeData,
    theme_id: themeId,
    company_id: theme.company_id,
    // Inherit customer evidence from theme
    customer_evidence_ids: theme.supporting_feedback_item_ids,
    customer_count: theme.customer_count
  })
  
  // Update theme status
  await updateTheme(themeId, {
    status: 'approved',
    initiative_id: initiative.id,
    pm_notes: initiativeData.pm_notes
  })
  
  return initiative
}

// Timeline management
async function getInitiativesByTimeline(companyId: string): Promise<{
  now: Initiative[]
  next: Initiative[]
  later: Initiative[]
}> {
  const initiatives = await getInitiatives(companyId)
  
  return {
    now: initiatives.filter(i => i.timeline_bucket === 'now'),
    next: initiatives.filter(i => i.timeline_bucket === 'next'),
    later: initiatives.filter(i => i.timeline_bucket === 'later')
  }
}
```

---

## 🎨 UI/UX Design Requirements

### **Enhanced Theme Review Dashboard**
```
┌─────────────────────────────────────────────────────────────┐
│  Theme Review Queue                    [Batch Actions ▼]     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Strategy: "Desktop-First with Strategic Mobile"             │
│  📊 3 themes need review | 2 high priority | 1 off-strategy │
│                                                               │
│  [Select All] [Batch Approve] [Batch Decline] [Batch Defer]  │
│                                                               │
│  ──────────────────────────────────────────────────────────  │
│                                                               │
│  ☑️ Enhanced Automation and Accuracy Recognition             │
│     Priority: 87/100 | 8 customers | Strategic: 95/100      │
│     ✅ HIGH PRIORITY - Core to strategy                      │
│     [Quick Approve] [Review] [Defer to Q3]                  │
│                                                               │
│  ☑️ Integration & Workflow Success                           │
│     Priority: 64/100 | 6 customers | Strategic: 85/100      │
│     ✅ MEDIUM-HIGH PRIORITY                                  │
│     [Quick Approve] [Review] [Defer to Q3]                  │
│                                                               │
│  ☐ Mobile Support Enhancement                               │
│     Priority: 26/100 | 11 customers | Strategic: 30/100     │
│     ⚠️ EXPLORE LIGHTWEIGHT SOLUTIONS                         │
│     [Review] [Decline with Reason] [Reconsider Strategy]     │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Process Selected (2)] [Review All]                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Create Initiative from Theme Modal**
```
┌─────────────────────────────────────────────────────────────┐
│  Create Initiative from Theme                         [Save] [×]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📋 Source Theme: Enhanced Automation and Accuracy Recognition│
│  👥 Customer Evidence: 8 customers, 12 feedback items       │
│  🎯 Strategic Priority: 87/100 (92 customer × 95 strategic)  │
│                                                               │
│  ──────────────────────────────────────────────────────────  │
│                                                               │
│  Initiative Title: *                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Improve PlanSwift ML accuracy by 15%                │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Description: *                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Enhance ML-powered material recognition and           │  │
│  │ calculation accuracy for complex blueprints to       │  │
│  │ maintain competitive advantage in takeoff accuracy.  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Owner: [Select Owner ▼] Sarah Johnson                       │
│  Team: [Select Teams ▼] Engineering, ML Team                │
│                                                               │
│  Effort: [M ▼] XS | S | M | L | XL                          │
│  Timeline: [Q2 2025 ▼] Q1 2025 | Q2 2025 | Q3 2025         │
│  Bucket: [Next ▼] Now | Next | Later                        │
│                                                               │
│  Link to OKR: [Select OKR ▼] Reduce churn by 20%            │
│                                                               │
│  Expected Impact:                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Metric: Churn rate                                   │  │
│  │ Expected: 2-3% reduction                            │  │
│  │ Reasoning: Improved accuracy reduces customer        │  │
│  │          frustration and support tickets            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  PM Notes:                                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ High customer demand and perfect strategic alignment. │  │
│  │ Should be prioritized for Q2 delivery.               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Create Initiative] [Save as Draft] [Cancel]          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **Roadmap Timeline View**
```
┌─────────────────────────────────────────────────────────────┐
│  Product Roadmap Timeline                [View: Timeline ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 12 total initiatives | 3 in progress | 4 planned        │
│                                                               │
│  ──────────────────────────────────────────────────────────  │
│                                                               │
│  🚀 NOW (3 initiatives)                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Improve PlanSwift ML accuracy by 15%                    ││
│  │ 👤 Sarah Johnson | 🏗️ Engineering | 📊 65% complete    ││
│  │ 🎯 8 customers | 📅 Q2 2025 | 🔗 Reduce churn OKR      ││
│  │                                                           ││
│  │ ████████████████████░░░░ 65%                             ││
│  │                                                           ││
│  │ [Update Progress] [View Details] [Move to Next]         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ⏭️ NEXT (4 initiatives)                                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ SMS/Email Access for Field Workers                      ││
│  │ 👤 Mike Chen | 🏗️ Product Team | 📊 0% complete       ││
│  │ 🎯 11 customers | 📅 Q2 2025 | 🔗 Increase MAU OKR     ││
│  │                                                           ││
│  │ ░░░░░░░░░░░░░░░░░░░░ 0%                                  ││
│  │                                                           ││
│  │ [Start Initiative] [View Details] [Move to Now]         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  📅 LATER (5 initiatives)                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Quick Bid Integration Enhancement                        ││
│  │ 👤 Alex Rodriguez | 🏗️ Engineering | 📊 0% complete   ││
│  │ 🎯 6 customers | 📅 Q3 2025 | 🔗 Reduce churn OKR      ││
│  │                                                           ││
│  │ ░░░░░░░░░░░░░░░░░░░░ 0%                                  ││
│  │                                                           ││
│  │ [Move to Next] [View Details] [Edit Timeline]           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Steps

### **Step 1: Initiative API Development (2-3 days)**
- [ ] Create initiative CRUD endpoints
- [ ] Build theme → initiative creation endpoint
- [ ] Add timeline management endpoints
- [ ] Test all API operations

### **Step 2: Enhanced Theme Review UI (2-3 days)**
- [ ] Update theme dashboard with review workflow
- [ ] Add batch actions (approve/decline/defer)
- [ ] Create initiative creation modal
- [ ] Connect to real API data

### **Step 3: Roadmap Timeline View (2-3 days)**
- [ ] Build timeline view with Now/Next/Later buckets
- [ ] Create initiative cards with progress tracking
- [ ] Add timeline management (drag-and-drop)
- [ ] Connect to real initiative data

### **Step 4: Integration & Workflow (1-2 days)**
- [ ] Connect theme approval to initiative creation
- [ ] Add initiative progress tracking
- [ ] Update theme status when initiatives are created
- [ ] Test complete workflow end-to-end

---

## 🎯 Success Criteria

### **Phase 3 Complete When:**
- ✅ **Theme Review Workflow** - PMs can batch approve/decline themes
- ✅ **Initiative Creation** - One-click creation from approved themes
- ✅ **Roadmap Timeline** - Visual timeline with Now/Next/Later buckets
- ✅ **Progress Tracking** - Initiative status and progress updates
- ✅ **Customer Evidence Linking** - Initiatives inherit theme evidence
- ✅ **OKR Integration** - Initiatives link to strategic objectives

### **User Experience Goals:**
- **Theme review takes < 30 seconds per theme**
- **Initiative creation takes < 3 minutes**
- **Roadmap timeline view is intuitive and actionable**
- **Progress tracking is simple and visual**

---

## 🚀 Key Features

### **1. Seamless Theme → Initiative Workflow**
- **One-click creation** from approved themes
- **Automatic evidence inheritance** from theme to initiative
- **Strategic context preserved** throughout the pipeline

### **2. Intelligent PM Workflow**
- **Batch actions** for efficient theme review
- **Strategic recommendations** guide PM decisions
- **Quick approve/decline** with reasoning

### **3. Visual Roadmap Timeline**
- **Now/Next/Later buckets** for timeline organization
- **Progress tracking** with visual indicators
- **Customer impact** visible on every initiative

### **4. Complete Traceability**
- **Customer feedback → Theme → Initiative → Shipped feature**
- **Strategic alignment** tracked throughout the pipeline
- **OKR linkage** ensures initiatives support strategy

---

## 🔗 Dependencies & Prerequisites

### **Required from Phase 1:**
- ✅ **Strategy framework** - Vision, strategy, OKRs
- ✅ **Initiatives table** - Database schema ready

### **Required from Phase 2:**
- ✅ **Strategic scoring** - Themes scored against strategy
- ✅ **Strategic recommendations** - AI guidance for PM decisions
- ✅ **Theme review context** - Strategic reasoning and conflicts

### **Required from Parallel Work:**
- ✅ **Navigation structure** - Strategy, themes, roadmap sections
- ✅ **Preview pages** - UI foundation ready

---

## 📋 Testing Strategy

### **API Testing:**
- [ ] Initiative CRUD operations work correctly
- [ ] Theme → initiative creation preserves data
- [ ] Timeline management updates correctly
- [ ] Company isolation maintained

### **UI Integration Testing:**
- [ ] Theme review workflow functions properly
- [ ] Initiative creation modal saves correctly
- [ ] Roadmap timeline displays initiatives properly
- [ ] Progress tracking updates in real-time

### **End-to-End Testing:**
- [ ] Complete workflow: Theme review → Initiative creation → Timeline view
- [ ] Customer evidence flows from theme to initiative
- [ ] Strategic context preserved throughout pipeline
- [ ] OKR linkage works correctly

---

## 🎯 Business Value

### **PM Efficiency:**
- **10x faster** theme review with batch actions
- **Strategic guidance** reduces decision paralysis
- **Visual timeline** makes roadmap planning intuitive

### **Customer Impact:**
- **Faster delivery** of high-impact features
- **Strategic alignment** ensures initiatives support business goals
- **Complete traceability** from customer voice to shipped features

### **Team Alignment:**
- **Clear ownership** with initiative assignment
- **Progress visibility** keeps everyone informed
- **OKR linkage** connects work to business objectives

---

## 🔗 Related Files

- **Theme Dashboard:** `src/app/admin/dashboard/themes/page.tsx`
- **Roadmap Dashboard:** `src/app/admin/dashboard/roadmap/page.tsx`
- **Migration Script:** `minimal_v1_migration.sql`
- **Strategy Framework:** Phase 1 & 2 implementations

---

**Ready to start?** This phase creates the complete PM workflow that transforms customer themes into actionable initiatives. Once complete, you'll have a fully functional roadmap system that connects customer feedback directly to product execution.

**Estimated Time:** 1-2 weeks for full implementation  
**Next Phase:** Closed loop tracking and customer impact measurement
