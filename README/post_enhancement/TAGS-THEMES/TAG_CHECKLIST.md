# Implementation Checklist: Feedback → Roadmap

**Goal:** Build the complete system from feedback collection to product roadmap decisions

**Timeline:** ~10-12 weeks total

---

## 📍 Current Status

- ✅ **Phase 1: Foundation** - COMPLETE
  - Database migration (customer-centric model)
  - AI integration (tag generation, sentiment analysis)
  - Basic survey functionality
  - Automatic AI analysis on submission

**Next Up:** Phase 2 - Tag Management & Theme Discovery

---

## 🏷️ Phase 2A: Tag Management System (Week 1-2)

**Goal:** Implement AI-powered tag normalization to prevent duplicates and ensure consistency

### **Week 1: Core Tag Normalization**

- [x] **Create SQL Helper Function** ✅ COMPLETE
  - [x] Add `get_top_tags()` function to Supabase
  - [x] Add `replace_tag_in_array()` function
  - [x] Add `get_tag_trends()` function
  - [x] Create `tag_merge_log` audit table
  - [ ] Run SQL in Supabase (USER ACTION REQUIRED)
  - [ ] Test query performance with sample data

- [x] **Build AI Tag Normalizer Class** ✅ COMPLETE
  - [x] Create `/src/lib/ai/tag-normalizer.ts`
  - [x] Implement `normalizeTags()` method
  - [x] Implement `getCompanyTagHistory()` for context
  - [x] Add Redis caching for normalized results
  - [x] Implement `detectDuplicates()` method
  - [x] Add cost tracking
  - [ ] Test with existing feedback items (TODO)

- [x] **Integrate with AI Orchestrator** ✅ COMPLETE
  - [x] Update `/src/lib/ai/orchestrator.ts`
  - [x] Add normalization step after tag generation
  - [x] Ensure backward compatibility
  - [ ] Test end-to-end flow (TODO)

- [ ] **Test & Validate** ⏳ NEXT
  - [ ] Submit test survey responses
  - [ ] Verify tags are normalized correctly
  - [ ] Check cache hit rates
  - [ ] Monitor cost tracking

### **Week 2: Duplicate Detection & Admin UI**

- [ ] **Build Duplicate Detection**
  - [ ] Implement `detectDuplicates()` method in normalizer
  - [ ] Create weekly cron job for detection
  - [ ] Test duplicate detection algorithm

- [ ] **Create Tag Management UI**
  - [ ] Create `/src/app/admin/dashboard/tags/page.tsx`
  - [ ] Build tag analytics dashboard
    - [ ] Top tags by frequency
    - [ ] Tags by sentiment
    - [ ] Tag trends over time
  - [ ] Build duplicate review interface
    - [ ] Show AI-suggested merges
    - [ ] Confidence scores & reasoning
    - [ ] One-click approve/dismiss

- [ ] **Implement Tag Merge Functionality**
  - [ ] Create `replace_tag_in_array()` SQL function
  - [ ] Create `tag_merge_log` table (optional)
  - [ ] Build backend merge API route
  - [ ] Test bulk updates across all tables

- [ ] **Documentation**
  - [ ] Update user guide with tag management
  - [ ] Document tag normalization rules
  - [ ] Add troubleshooting guide

**Deliverables:**
- ✅ Tag normalization working automatically
- ✅ Admin UI for managing tags
- ✅ Duplicate detection & merge workflow
- ✅ Zero manual tag cleanup needed

---

## 🎯 Phase 2B: Theme Discovery Engine (Week 3-4)

**Goal:** AI discovers patterns across feedback items and generates themes

### **Week 3: Theme Discovery Algorithm**

- [ ] **Create Theme Discovery Database Schema**
  - [ ] Run migration to add `themes` table
  - [ ] Add indexes for performance
  - [ ] Create helper views if needed
  - [ ] Test with sample data

- [ ] **Build Theme Discovery Engine**
  - [ ] Create `/src/lib/ai/theme-discovery.ts`
  - [ ] Implement `discoverThemes()` method
  - [ ] Implement tag clustering algorithm
  - [ ] Implement `generateTheme()` with AI
  - [ ] Implement `calculateTrend()` for themes
  - [ ] Add Redis caching for expensive operations

- [ ] **Create Daily Batch Job**
  - [ ] Set up Vercel Cron (or alternative)
  - [ ] Create API route for theme discovery
  - [ ] Add error handling & logging
  - [ ] Test manual trigger

- [ ] **Test Theme Discovery**
  - [ ] Run on existing feedback
  - [ ] Validate theme quality
  - [ ] Check performance (should complete in <5 min)
  - [ ] Verify trends are calculated correctly

### **Week 4: Theme UI & Analytics**

- [ ] **Create Theme List Page**
  - [ ] Create `/src/app/admin/dashboard/themes/page.tsx`
  - [ ] Show all discovered themes
  - [ ] Filter by status, priority, trend
  - [ ] Sort by various metrics

- [ ] **Create Theme Detail Page**
  - [ ] Create `/src/app/admin/dashboard/themes/[id]/page.tsx`
  - [ ] Show theme metrics (customers, mentions, sentiment)
  - [ ] Display trend chart over time
  - [ ] Show supporting feedback items
  - [ ] Show top customer quotes
  - [ ] Link to all related feedback

- [ ] **Add Theme Status Management**
  - [ ] Mark themes as "reviewing", "validated", "addressed"
  - [ ] Add notes/comments on themes
  - [ ] Track who reviewed and when

- [ ] **Theme Analytics Dashboard**
  - [ ] Top themes widget
  - [ ] Trending themes (up/down)
  - [ ] Theme sentiment breakdown
  - [ ] Cross-channel theme analysis

**Deliverables:**
- ✅ Daily theme discovery running automatically
- ✅ Theme management UI
- ✅ Theme detail pages with full evidence
- ✅ Analytics on patterns across feedback

---

## 🗺️ Phase 3: Product Discovery / Roadmapping (Week 5-8)

**Goal:** Connect themes to roadmap items with AI-powered prioritization

### **Week 5: Roadmap Database & Backend**

- [ ] **Create Roadmap Database Schema**
  - [ ] Run migration for roadmap tables:
    - [ ] `roadmap_items`
    - [ ] `roadmap_theme_links`
    - [ ] `roadmap_feedback_events`
    - [ ] `roadmap_comments`
    - [ ] `roadmap_upvotes`
    - [ ] `product_releases`
  - [ ] Add indexes
  - [ ] Create helper views
  - [ ] Test relationships

- [ ] **Build Roadmap API Routes**
  - [ ] `POST /api/roadmap/items` - Create item
  - [ ] `GET /api/roadmap/items` - List items
  - [ ] `GET /api/roadmap/items/[id]` - Get item details
  - [ ] `PATCH /api/roadmap/items/[id]` - Update item
  - [ ] `DELETE /api/roadmap/items/[id]` - Delete item
  - [ ] `POST /api/roadmap/items/[id]/link-theme` - Link theme
  - [ ] Test all CRUD operations

- [ ] **Implement RLS Policies**
  - [ ] Ensure multi-tenancy security
  - [ ] Test permissions
  - [ ] Add role-based access if needed

### **Week 6: AI Roadmap Suggestions**

- [ ] **Build Roadmap Item Generator**
  - [ ] Create `/src/lib/ai/roadmap-generator.ts`
  - [ ] Implement `generateSuggestions()` from themes
  - [ ] Implement `enrichSuggestion()` with details
  - [ ] Implement `analyzeCompetitive()` for intel
  - [ ] Test with real themes

- [ ] **Create Weekly Suggestion Job**
  - [ ] Set up weekly cron (Mondays 9am)
  - [ ] Create API route for suggestions
  - [ ] Auto-create items with "under_review" status
  - [ ] Send notification to product team
  - [ ] Test manual trigger

- [ ] **Build Suggestion Review UI**
  - [ ] Show pending AI suggestions
  - [ ] Display full evidence (quotes, trends, etc.)
  - [ ] One-click approve → backlog
  - [ ] Ability to edit before approving
  - [ ] Decline with reason

### **Week 7: Roadmap UI - Core Views**

- [ ] **Create Roadmap List View**
  - [ ] Create `/src/app/admin/dashboard/roadmap/page.tsx`
  - [ ] Group by status (backlog, in progress, shipped)
  - [ ] Group by priority quadrants
  - [ ] Filter by type, quarter, owner
  - [ ] Search functionality

- [ ] **Create Roadmap Item Detail Page**
  - [ ] Create `/src/app/admin/dashboard/roadmap/[id]/page.tsx`
  - [ ] Show all item details
  - [ ] **Customer Evidence Section:**
    - [ ] Linked themes with metrics
    - [ ] Top customer quotes
    - [ ] Feedback breakdown by source
    - [ ] Affected customer count
  - [ ] **AI Insights Section:**
    - [ ] AI rationale
    - [ ] Competitive analysis
    - [ ] Suggested solution
  - [ ] **Collaboration Section:**
    - [ ] Comments
    - [ ] Activity log
    - [ ] Stakeholders
  - [ ] Status change actions
  - [ ] Edit capabilities

- [ ] **Build Impact vs Effort Matrix**
  - [ ] Create matrix visualization component
  - [ ] Four quadrants (quick wins, big bets, fill-ins, avoid)
  - [ ] Drag-and-drop to change scores
  - [ ] Filter and search within matrix
  - [ ] Click item to open detail

### **Week 8: Roadmap UI - Advanced Features**

- [ ] **Create Roadmap Kanban Board**
  - [ ] Columns by status
  - [ ] Drag-and-drop between columns
  - [ ] Quick actions on cards
  - [ ] Filtering

- [ ] **Create Timeline/Gantt View**
  - [ ] Group by quarter
  - [ ] Visual timeline
  - [ ] Estimated vs actual ship dates
  - [ ] Dependencies (optional)

- [ ] **Create Theme-Driven View**
  - [ ] Group roadmap items by theme
  - [ ] Show which themes are addressed
  - [ ] Highlight unaddressed high-priority themes

- [ ] **Add Collaboration Features**
  - [ ] Comments on roadmap items
  - [ ] @mentions for stakeholders
  - [ ] Internal voting/upvotes
  - [ ] Activity feed

- [ ] **Jira/Linear Integration (Optional)**
  - [ ] Link to external tickets
  - [ ] Sync status (if possible)
  - [ ] Create tickets from roadmap items

**Deliverables:**
- ✅ Complete roadmap management system
- ✅ AI-powered suggestions with evidence
- ✅ Multiple visualization views
- ✅ Direct connection: themes → roadmap items
- ✅ Full customer evidence on every item

---

## 🔁 Phase 4: Closed Loop Validation (Week 9-10)

**Goal:** Track shipped features and validate they solved the problem

### **Week 9: Shipping & Customer Notifications**

- [ ] **Build Release Management**
  - [ ] Create release creation UI
  - [ ] Link roadmap items to releases
  - [ ] Auto-generate release notes with customer evidence
  - [ ] Template system for release notes

- [ ] **Customer Notification System**
  - [ ] Get all customers affected by theme
  - [ ] Send personalized "We heard you" emails
  - [ ] Include what changed and why
  - [ ] Track email opens/clicks

- [ ] **Status Tracking**
  - [ ] Auto-update roadmap item status on ship
  - [ ] Update theme status (addressed → resolved)
  - [ ] Log shipping events

### **Week 10: Impact Validation**

- [ ] **Build Validation Algorithm**
  - [ ] Count complaints before vs after ship
  - [ ] Measure sentiment change
  - [ ] Track customer health changes
  - [ ] Calculate ROI metrics

- [ ] **Create Daily Validation Job**
  - [ ] Check shipped items from last 30 days
  - [ ] Run validation analysis
  - [ ] Update roadmap items with results
  - [ ] Notify item owners of results

- [ ] **Validation Dashboard**
  - [ ] Show validation metrics per item
  - [ ] Highlight successes (>70% reduction)
  - [ ] Flag items that didn't help
  - [ ] Track overall product team effectiveness

- [ ] **ROI Reporting**
  - [ ] Revenue protected (churn prevention)
  - [ ] Customer satisfaction improvement
  - [ ] Feature adoption rates
  - [ ] Executive summary reports

**Deliverables:**
- ✅ Automated customer notifications
- ✅ Impact validation tracking
- ✅ ROI metrics per roadmap item
- ✅ Complete closed loop

---

## 🚀 Phase 5: Multi-Channel Integration (Week 11-14+)

**Goal:** Add more feedback sources beyond surveys

### **Interview Integration (Week 11-12)**

- [ ] **Interview Management Schema**
  - [ ] Already in database (from unified schema)
  - [ ] Verify and test

- [ ] **Interview CRUD UI**
  - [ ] Create interview
  - [ ] Interview detail page
  - [ ] Note-taking interface
  - [ ] Link to customers

- [ ] **AI Transcription (Optional)**
  - [ ] Integrate Whisper API
  - [ ] Real-time transcription
  - [ ] Speaker identification

- [ ] **Interview Analysis**
  - [ ] Run AI analysis on notes/transcript
  - [ ] Extract themes
  - [ ] Generate summary
  - [ ] Link to existing themes

### **Review Integration (Week 13-14)**

- [ ] **Review Scraping**
  - [ ] Start with 2-3 platforms (Trustpilot, G2, Google)
  - [ ] Set up scraping/API integration
  - [ ] Daily sync job

- [ ] **Review Management**
  - [ ] Review list page
  - [ ] Review detail page
  - [ ] Customer matching
  - [ ] Response tracking

- [ ] **Review Analysis**
  - [ ] AI sentiment analysis
  - [ ] Theme extraction
  - [ ] Link to existing themes
  - [ ] Priority scoring

### **Reddit Integration (Week 15-16)**

- [ ] **Reddit Monitoring**
  - [ ] Configure subreddits to monitor
  - [ ] Set up scraping (Apify or PRAW)
  - [ ] Daily collection job

- [ ] **Relevance Filtering**
  - [ ] AI determines relevance
  - [ ] Filter noise
  - [ ] Track competitor mentions

- [ ] **Reddit Analysis**
  - [ ] Sentiment analysis
  - [ ] Theme extraction
  - [ ] Competitive intelligence

**Deliverables:**
- ✅ Multi-channel feedback collection
- ✅ All sources feed into same themes
- ✅ Unified view of customer voice

---

## 📊 Testing & Validation Checklist

### **After Each Phase:**

- [ ] **Functionality Testing**
  - [ ] All features work as expected
  - [ ] No broken links or errors
  - [ ] Mobile responsive (if applicable)

- [ ] **Performance Testing**
  - [ ] Page load times <2 seconds
  - [ ] API responses <200ms
  - [ ] Batch jobs complete in reasonable time

- [ ] **AI Quality Testing**
  - [ ] Tag normalization is accurate
  - [ ] Themes make sense
  - [ ] Roadmap suggestions are relevant
  - [ ] Validation metrics are correct

- [ ] **Cost Monitoring**
  - [ ] AI costs within budget
  - [ ] Cache hit rates >80%
  - [ ] Database query performance good

- [ ] **User Acceptance Testing**
  - [ ] Test with real users (internal team)
  - [ ] Gather feedback
  - [ ] Iterate on UX

---

## 🎯 Success Criteria

### **Phase 2 Success (Tag Management & Themes):**
- [ ] Tags are automatically normalized with >90% accuracy
- [ ] Duplicates detected and merged weekly
- [ ] Themes discovered daily
- [ ] At least 10-20 themes identified from existing data
- [ ] Theme detail pages show clear patterns

### **Phase 3 Success (Product Discovery):**
- [ ] AI generates relevant roadmap suggestions
- [ ] 100% of roadmap items have customer evidence
- [ ] Product team can prioritize in <1 hour (vs days)
- [ ] Impact vs Effort matrix visualized clearly
- [ ] Team confidence in priorities >8/10

### **Phase 4 Success (Closed Loop):**
- [ ] Shipped features tracked automatically
- [ ] Customers notified within 24 hours of ship
- [ ] Validation metrics calculated for 100% of shipped items
- [ ] At least 70% of shipped features reduce complaints
- [ ] Clear ROI visible for product decisions

### **Phase 5 Success (Multi-Channel):**
- [ ] Multiple feedback sources integrated
- [ ] All sources contribute to same themes
- [ ] Cross-channel patterns identified
- [ ] Unified customer voice

---

## 🚦 Current Priority: START HERE

### **This Week (Week 1):**

1. **Day 1-2: Set Up Tag Management**
   - [ ] Create SQL helper functions
   - [ ] Build AI tag normalizer class
   - [ ] Test with existing feedback

2. **Day 3-4: Integration**
   - [ ] Integrate normalizer with AI orchestrator
   - [ ] Test end-to-end flow
   - [ ] Monitor performance

3. **Day 5: Validation**
   - [ ] Submit test surveys
   - [ ] Verify normalization works
   - [ ] Fix any issues

### **Next Week (Week 2):**

1. **Day 1-2: Duplicate Detection**
   - [ ] Build detection algorithm
   - [ ] Test with sample data

2. **Day 3-5: Admin UI**
   - [ ] Build tag management dashboard
   - [ ] Build duplicate review interface
   - [ ] Test merge workflow

### **Following Weeks:**
- Week 3-4: Theme Discovery
- Week 5-8: Product Roadmapping
- Week 9-10: Closed Loop
- Week 11+: Multi-Channel

---

## 📝 Notes & Decisions Needed

### **Questions to Answer Soon:**

1. **Roadmap Privacy:** 
   - [ ] Who can see the roadmap? (all team / PM only / restricted)
   - [ ] Decision: _______________

2. **Public Roadmap:**
   - [ ] Should customers see it?
   - [ ] Decision: _______________

3. **Internal Voting:**
   - [ ] Should team members vote on priorities?
   - [ ] Decision: _______________

4. **External Integration:**
   - [ ] Integrate with Jira/Linear?
   - [ ] Decision: _______________

5. **Release Notes:**
   - [ ] Auto-generate with customer evidence?
   - [ ] Decision: _______________

---

## 🎉 Milestones

- [ ] **Milestone 1:** Tag management working (Week 2)
- [ ] **Milestone 2:** Themes discovered automatically (Week 4)
- [ ] **Milestone 3:** First roadmap item with customer evidence (Week 6)
- [ ] **Milestone 4:** Complete roadmap UI (Week 8)
- [ ] **Milestone 5:** First validated shipped feature (Week 10)
- [ ] **Milestone 6:** Multi-channel feedback integrated (Week 14+)

---

## 📞 Need Help?

- **Tag Management:** See `TAG_MANAGEMENT_STRATEGY.md`
- **Product Discovery:** See `PRODUCT_DISCOVERY_ARCHITECTURE.md`
- **Complete Flow:** See `COMPLETE_SYSTEM_FLOW.md`
- **PRD:** See `UNIFIED_FEEDBACK_PRD.md`

---

*Last Updated: December 2024*  
*Current Phase: Phase 2A - Tag Management (Week 1)*

