# 🚀 Roadmap Implementation - Phase 1: Strategy Layer

**Status:** Ready to Start  
**Estimated Time:** 1-2 weeks  
**Priority:** High - Foundation for all roadmap features

---

## 🎯 Phase 1 Objective

Build the **Strategy Layer** - the foundation that will power strategic alignment scoring for themes and drive roadmap decisions.

**Goal:** Create a living strategy system where PMs can define vision, strategy, and OKRs, and this information automatically influences how customer themes are prioritized.

---

## 🏗️ What We're Building

### **1. Database Schema (Already Ready)**
✅ **Migration script created:** `minimal_v1_migration.sql`  
✅ **3 new tables designed:**
- `company_vision` - Versioned company vision statements
- `product_strategy` - Strategic choices and framework
- `strategic_objectives` - OKRs linked to strategy

### **2. Strategy Definition Interface**
**Target:** PMs can easily define and update their strategy

**Required UI Components:**
- **Strategy Dashboard** - Overview of current vision/strategy/OKRs
- **Vision Editor** - Create/edit vision statements with versioning
- **Strategy Editor** - Define target customer, problems we solve/don't solve, how we win
- **OKR Management** - Create and track quarterly objectives
- **Strategy History** - View past versions and pivots

### **3. Strategic Framework Input**
**Key Fields PMs Need to Define:**

```typescript
// Vision
vision_statement: "Become the most trusted construction intelligence platform"
mission_statement: "Empower construction teams with accurate data and insights"

// Strategy
target_customer_description: "Mid-market construction firms (50-500 employees) with dedicated estimating teams"
problems_we_solve: ["Inaccurate takeoffs costing projects $50K+", "Fragmented bid management"]
problems_we_dont_solve: ["Field execution / project management", "Accounting / financial management"]
how_we_win: "Most accurate takeoff engine + best-in-class desktop UX for power users"

// Strategic Keywords (for AI scoring)
strategic_keywords: [
  {keyword: "desktop", weight: 0.8, reasoning: "Core differentiation"},
  {keyword: "mobile", weight: -0.5, reasoning: "Deprioritizing mobile to focus on desktop"},
  {keyword: "integration", weight: 0.6, reasoning: "Key to workflow efficiency"}
]

// OKRs
objective: "Reduce churn by 20%"
key_results: [
  {metric: "Churn rate", baseline: 12, target: 9.6, current: 10.5, unit: "percent"}
]
```

---

## 🎨 UI/UX Design Requirements

### **Strategy Dashboard Layout**
```
┌─────────────────────────────────────────────────────────────┐
│  Strategy & Vision                              [Edit] [History]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🎯 Current Vision (v2 - Updated Q1 2025)                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ "Become the most trusted construction intelligence       ││
│  │  platform for mid-market contractors"                    ││
│  │                                                           ││
│  │ [View Previous Versions]                                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  📊 Current Strategy (v3 - Q1 2025)                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Title: "Desktop-First with Strategic Mobile"            ││
│  │                                                           ││
│  │ Target Customer: Mid-market construction firms...        ││
│  │                                                           ││
│  │ Problems We Solve: ✅ Inaccurate takeoffs...            ││
│  │ Problems We DON'T Solve: ❌ Field execution...          ││
│  │                                                           ││
│  │ How We Win: "Best desktop UX for power users"           ││
│  │                                                           ││
│  │ [Edit Strategy] [View v2 Strategy]                      ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  🎯 Q2 2025 Objectives (3 active)                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. Reduce churn: 12% → 9.6% (Current: 10.5%)           ││
│  │ 2. Increase MAU: 450 → 750 (Current: 520)              ││
│  │ 3. Improve NPS: 42 → 55 (Current: 47)                  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### **Strategy Editor Modal**
```
┌─────────────────────────────────────────────────────────────┐
│  Edit Strategy                                        [Save] [×]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Title:                                                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Desktop-First with Strategic Mobile                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Target Customer:                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Mid-market construction firms (50-500 employees)      │  │
│  │ with dedicated estimating teams                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Problems We Solve:                                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ + Inaccurate takeoffs costing projects $50K+         │  │
│  │ + Fragmented bid management across tools             │  │
│  │ + Poor project intelligence for pre-construction     │  │
│  │                                   [+ Add Problem]    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Problems We DON'T Solve:                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ + Field execution / project management               │  │
│  │ + Accounting / financial management                  │  │
│  │ + Small contractors (<10 employees)                  │  │
│  │                                   [+ Add Exclusion]  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  How We Win:                                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Most accurate takeoff engine + best-in-class desktop │  │
│  │ UX for power users                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Strategic Keywords:                                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Keyword: desktop    Weight: +0.8    [Remove]         │  │
│  │ Keyword: mobile     Weight: -0.5    [Remove]         │  │
│  │ Keyword: integration Weight: +0.6   [Remove]         │  │
│  │                                                       │  │
│  │ [+ Add Keyword]                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Save Strategy] [Cancel]                              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### **API Endpoints Needed**
```typescript
// Strategy CRUD
GET    /api/admin/strategy/current          // Get active strategy
POST   /api/admin/strategy                  // Create new strategy version
PUT    /api/admin/strategy/[id]             // Update strategy
GET    /api/admin/strategy/history          // Get strategy history

// Vision CRUD
GET    /api/admin/vision/current            // Get active vision
POST   /api/admin/vision                    // Create new vision version
PUT    /api/admin/vision/[id]               // Update vision

// OKR Management
GET    /api/admin/objectives                // Get current OKRs
POST   /api/admin/objectives                // Create new OKR
PUT    /api/admin/objectives/[id]           // Update OKR
PUT    /api/admin/objectives/[id]/progress  // Update progress
```

### **Database Integration**
```typescript
// Use the migration script: minimal_v1_migration.sql
// Tables created:
// - company_vision
// - product_strategy  
// - strategic_objectives
```

### **Key Functions to Build**
```typescript
// Strategy management
async function getCurrentStrategy(companyId: string): Promise<ProductStrategy>
async function createStrategyVersion(companyId: string, strategy: CreateStrategyRequest): Promise<ProductStrategy>
async function updateStrategy(companyId: string, strategyId: string, updates: UpdateStrategyRequest): Promise<ProductStrategy>

// Vision management
async function getCurrentVision(companyId: string): Promise<CompanyVision>
async function createVisionVersion(companyId: string, vision: CreateVisionRequest): Promise<CompanyVision>

// OKR management
async function getCurrentOKRs(companyId: string): Promise<StrategicObjective[]>
async function updateOKRProgress(companyId: string, okrId: string, progress: KeyResultProgress[]): Promise<StrategicObjective>
```

---

## 🎯 Success Criteria

### **Phase 1 Complete When:**
- ✅ **Strategy Dashboard** shows current vision, strategy, and OKRs
- ✅ **Strategy Editor** allows PMs to define target customer, problems, how we win
- ✅ **Strategic Keywords** can be added with weights for AI scoring
- ✅ **OKR Management** allows creating and tracking quarterly objectives
- ✅ **Strategy History** shows version changes and pivots
- ✅ **API Integration** works with existing authentication system
- ✅ **Data Persistence** strategy changes are saved and versioned

### **User Experience Goals:**
- **PM can define strategy in < 10 minutes**
- **Strategy changes are versioned and trackable**
- **Current strategy is always visible in dashboard**
- **OKR progress can be updated weekly**

---

## 🚀 Next Steps After Phase 1

### **Phase 2: Theme Enhancement**
- Add strategic alignment scoring to existing themes
- AI calculates how well themes fit current strategy
- Theme dashboard shows strategic priority

### **Phase 3: PM Workflow**
- Theme review dashboard with strategic context
- Quick approve/decline decisions
- Direct theme → initiative creation

---

## 📋 Implementation Checklist

### **Database Setup**
- [ ] Run `minimal_v1_migration.sql` to create strategy tables
- [ ] Verify RLS policies are working
- [ ] Test company isolation

### **API Development**
- [ ] Create strategy CRUD endpoints
- [ ] Create vision CRUD endpoints  
- [ ] Create OKR management endpoints
- [ ] Add proper authentication and company scoping
- [ ] Test all endpoints with existing auth system

### **UI Development**
- [ ] Create strategy dashboard component
- [ ] Build strategy editor modal
- [ ] Build vision editor modal
- [ ] Build OKR management interface
- [ ] Add strategy history view
- [ ] Integrate with existing navigation

### **Integration Testing**
- [ ] Test strategy creation and updates
- [ ] Test versioning system
- [ ] Test company data isolation
- [ ] Test OKR progress tracking
- [ ] Verify UI updates reflect database changes

---

## 💡 Key Design Decisions

### **1. Versioning Strategy**
- **Vision & Strategy:** Full versioning with active/inactive states
- **OKRs:** No versioning - update in place with history tracking
- **Rationale:** OKRs change weekly, strategy changes quarterly

### **2. Strategic Keywords**
- **Weight Range:** -1.0 to +1.0 (negative = deprioritize, positive = prioritize)
- **AI Integration:** These weights will be used in Phase 2 for theme scoring
- **PM Control:** PMs define keywords, AI uses them for alignment scoring

### **3. Company Isolation**
- **All strategy data** scoped to company_id
- **RLS policies** ensure users only see their company's strategy
- **Consistent** with existing authentication system

---

## 🔗 Related Files

- **Migration Script:** `minimal_v1_migration.sql`
- **Database Schema:** `supabase/schema_unified_platform.sql`
- **Current PRD:** `README/post_enhancement/ONGOING_PRD.md`
- **Authentication:** `src/lib/auth.ts`

---

**Ready to start?** This phase gives you the foundation for all roadmap features. Once complete, you'll have a living strategy system that automatically influences theme prioritization and roadmap decisions.

**Estimated Time:** 1-2 weeks for full implementation
**Next Phase:** Theme enhancement with strategic scoring
