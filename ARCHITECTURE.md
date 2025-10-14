# Architecture Overview

This document provides a technical overview of the Survey Insights application architecture.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Survey Insights Platform                 │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Survey          │         │  Admin           │
│  Respondents     │         │  Users           │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │ Unique Link                │ Auth Login
         │                            │
         ▼                            ▼
┌─────────────────────────────────────────────────┐
│           Next.js Frontend (React)              │
│  ┌─────────────────┐    ┌──────────────────┐   │
│  │ Survey Pages    │    │ Admin Dashboard  │   │
│  │ /survey/[token] │    │ /admin/*        │   │
│  └─────────────────┘    └──────────────────┘   │
└────────────┬──────────────────────┬─────────────┘
             │                      │
             │ API Routes           │
             ▼                      ▼
┌─────────────────────────────────────────────────┐
│              Next.js API Routes                 │
│  • /api/survey/[token]                         │
│  • /api/survey/[token]/submit                  │
│  • /api/admin/signup                           │
│  • /api/admin/send-survey                      │
└────────────┬────────────────────────────────────┘
             │
             ├──────────────┬──────────────┐
             ▼              ▼              ▼
    ┌─────────────┐  ┌──────────┐  ┌──────────┐
    │  Supabase   │  │ Supabase │  │ SMTP     │
    │  PostgreSQL │  │ Auth     │  │ Email    │
    └─────────────┘  └──────────┘  └──────────┘
```

## Data Flow

### Survey Response Flow

1. **Admin creates survey** → Stored in `surveys` table
2. **Admin generates links** → Creates records in `survey_links` with unique tokens
3. **Email sent** → Contains unique link with token
4. **Respondent opens link** → Frontend fetches survey via token
5. **Respondent submits** → Creates `survey_responses` record, updates link status
6. **Admin reviews** → Queries responses with filters

### Authentication Flow

1. **Admin signs up** → Creates `auth.users`, `companies`, and `admin_users` records
2. **Admin logs in** → Supabase Auth returns session
3. **Protected routes** → Verify auth on each request
4. **RLS enforcement** → Database automatically filters data by company

## Database Design

### Entity Relationship Diagram

```
companies
├── id (PK)
├── name
└── timestamps

admin_users
├── id (PK, FK → auth.users)
├── company_id (FK → companies)
├── email (unique)
├── full_name
├── role
└── timestamps

surveys
├── id (PK)
├── company_id (FK → companies)
├── title
├── description
├── questions (JSONB)
├── status
├── created_by (FK → admin_users)
└── timestamps

survey_links
├── id (PK)
├── survey_id (FK → surveys)
├── token (unique)
├── respondent_email
├── respondent_name
├── respondent_metadata (JSONB)
├── status
├── opened_at
├── completed_at
├── expires_at
└── created_at

survey_responses
├── id (PK)
├── survey_link_id (FK → survey_links)
├── survey_id (FK → surveys)
├── responses (JSONB)
├── metadata (JSONB)
└── submitted_at

survey_schedules
├── id (PK)
├── survey_id (FK → surveys)
├── schedule_type
├── schedule_config (JSONB)
├── status
├── last_sent_at
├── next_send_at
└── timestamps
```

### Key Design Decisions

**1. JSONB for Questions and Responses**
- Flexible schema for varying question types
- Easy to query with PostgreSQL JSONB operators
- No need to create question/response tables

**2. Token-Based Survey Access**
- No authentication required for respondents
- Unique tokens prevent unauthorized access
- Tokens can expire for time-sensitive surveys

**3. Multi-Tenancy via Company ID**
- RLS policies ensure data isolation
- Single database for all companies
- Scalable architecture

**4. Status Tracking**
- Survey links track: pending → opened → completed
- Survey status: draft → active → paused → completed
- Enables accurate analytics

## Security Model

### Row Level Security (RLS)

All tables have RLS enabled with policies:

**Admin Access**
```sql
-- Admins can only access their company's data
surveys WHERE company_id IN (
  SELECT company_id FROM admin_users WHERE id = auth.uid()
)
```

**Public Access (Survey Respondents)**
```sql
-- Anyone can view survey links (needed for surveys)
survey_links FOR SELECT USING (true)

-- Anyone can insert responses (needed for submissions)
survey_responses FOR INSERT WITH CHECK (true)
```

### Authentication

- **Admin users**: Supabase Auth with email/password
- **Survey respondents**: No authentication (token-based access)
- **API routes**: Protected via Supabase session validation

### Data Privacy

- Survey responses linked to email (if provided)
- No PII stored in responses table (only in survey_links)
- Respondent metadata encrypted in transit
- RLS prevents cross-company data access

## Frontend Architecture

### Component Structure

```
src/
├── app/
│   ├── (public routes)
│   │   ├── page.tsx              # Landing page
│   │   └── survey/[token]/       # Survey completion
│   ├── admin/
│   │   ├── login/                # Auth pages
│   │   ├── signup/
│   │   └── dashboard/            # Protected admin area
│   │       ├── layout.tsx        # Sidebar + auth check
│   │       ├── page.tsx          # Dashboard home
│   │       ├── surveys/          # Survey CRUD
│   │       ├── send/             # Send interface
│   │       └── responses/        # View responses
│   └── api/                      # API routes
├── components/
│   └── ui/                       # Shadcn UI components
├── lib/
│   ├── supabase/                 # DB clients
│   ├── auth.ts                   # Auth helpers
│   └── utils.ts                  # Utilities
└── types/
    └── database.ts               # TypeScript types
```

### State Management

- **Server State**: React Server Components (default)
- **Client State**: React hooks (useState, useEffect)
- **Auth State**: Supabase Auth session
- **No global state library**: Not needed for this app size

### Routing

- **App Router**: Next.js 14 with React Server Components
- **Dynamic Routes**: `[token]` and `[id]` for surveys
- **Protected Routes**: Layout-level auth checks
- **API Routes**: REST endpoints for operations

## API Design

### Public Endpoints

**GET /api/survey/[token]**
- Returns survey details for a given token
- Checks expiration and status
- Marks link as "opened"

**POST /api/survey/[token]/submit**
- Submits survey responses
- Validates all questions answered
- Marks link as "completed"

### Protected Endpoints (Require Auth)

**POST /api/admin/signup**
- Creates admin account
- Creates company if new
- Atomic transaction (rollback on error)

**POST /api/admin/send-survey**
- Generates unique survey links
- Sends emails to recipients
- Returns link creation status

## Technology Choices

### Why Next.js?
- ✅ Server-side rendering for SEO
- ✅ API routes built-in
- ✅ App Router for modern React patterns
- ✅ TypeScript support out of the box

### Why Supabase?
- ✅ PostgreSQL with powerful querying
- ✅ Built-in authentication
- ✅ Row Level Security for multi-tenancy
- ✅ Real-time capabilities (future use)
- ✅ Auto-generated REST API

### Why Shadcn UI?
- ✅ Beautiful, accessible components
- ✅ Built on Radix UI primitives
- ✅ Full customization via Tailwind
- ✅ Copy-paste components (no package bloat)
- ✅ TypeScript-first

### Why Nodemailer?
- ✅ Works with any SMTP provider
- ✅ Simple API for sending emails
- ✅ Template support
- ✅ Error handling built-in

## Scalability Considerations

### Current Architecture (MVP)
- Handles 1,000s of surveys
- 100,000s of responses
- Multiple admin users per company
- Real-time dashboard updates

### Future Scaling Options

**Database**
- Add read replicas for analytics queries
- Partition large tables by company_id
- Add caching layer (Redis) for frequently accessed data

**Email Sending**
- Queue system (Bull/BullMQ) for bulk sending
- Rate limiting per SMTP provider
- Batch sending with delays

**Frontend**
- CDN for static assets
- Image optimization
- Code splitting by route

**AI Integration**
- Separate microservice for AI processing
- Queue-based response analysis
- Caching of generated insights

## Monitoring & Observability

### Recommended Tools

**Application Monitoring**
- Vercel Analytics (built-in)
- Sentry for error tracking
- Custom logging to Supabase

**Database Monitoring**
- Supabase dashboard
- Query performance metrics
- Connection pool monitoring

**Email Monitoring**
- SMTP provider dashboard
- Delivery rate tracking
- Bounce/complaint handling

## Future Architecture Enhancements

### Phase 2: AI Integration

```
┌─────────────────────────────────────┐
│  OpenRouter API                     │
│  (DeepSeek or other model)         │
└──────────────┬──────────────────────┘
               │
               │ Semantic Analysis
               │
┌──────────────▼──────────────────────┐
│  AI Service (Background Job)        │
│  • Sentiment analysis              │
│  • Theme extraction                │
│  • Insight generation              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  insights table                     │
│  • survey_id                        │
│  • type (sentiment/theme/summary)   │
│  • content (JSONB)                  │
│  • confidence_score                 │
└─────────────────────────────────────┘
```

### Phase 3: Recurring Surveys

- Cron-based scheduler (Vercel Cron or external)
- Survey schedule processor
- Automatic link generation
- Email queue management

### Phase 4: Advanced Analytics

- Data warehouse integration
- Custom reporting dashboard
- Export capabilities (CSV, PDF)
- Visualization library integration

## Development Workflow

### Local Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Lint code
```

### Testing Strategy (Future)
- Unit tests: Vitest
- Integration tests: Playwright
- E2E tests: Cypress
- Database tests: pg-mem

### Deployment
- Automatic via Vercel on push to main
- Preview deployments for PRs
- Environment variables via Vercel dashboard
- Database migrations via Supabase dashboard

## Conclusion

This architecture provides:
- ✅ Scalable foundation
- ✅ Security by default
- ✅ Clean separation of concerns
- ✅ Easy to maintain and extend
- ✅ Modern development experience

The system is designed to grow from MVP to enterprise-scale with minimal refactoring.

