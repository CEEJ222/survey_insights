# Developer Guide - Unified Feedback Platform

## Overview

This guide provides comprehensive information for developers working on the Unified Feedback Platform. It covers architecture, development setup, coding standards, and contribution guidelines.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [API Development](#api-development)
6. [Frontend Development](#frontend-development)
7. [AI Integration](#ai-integration)
8. [Database Management](#database-management)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Contributing](#contributing)

## Architecture Overview

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components
- **State Management**: React hooks + Context
- **Testing**: Jest + Testing Library + Playwright

#### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API routes
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Caching**: Redis (Upstash)

#### AI/ML
- **Primary**: OpenAI GPT-4o
- **Fallback**: OpenAI GPT-4o-mini
- **Caching**: Redis for response caching
- **Cost Tracking**: Custom implementation

#### Infrastructure
- **Hosting**: Vercel (recommended) or custom server
- **Database**: Supabase (PostgreSQL)
- **Redis**: Upstash
- **Monitoring**: Prometheus + Grafana
- **CI/CD**: GitHub Actions

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   Database      │    │   OpenAI API    │
│   State Mgmt    │    │   (Supabase)    │    │   Redis Cache   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- PostgreSQL (or Supabase account)
- Redis instance (or Upstash account)
- OpenAI API key

### Environment Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/survey_insights.git
   cd survey_insights
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure Environment Variables**
   ```env
   # Database
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # AI Services
   OPENAI_API_KEY=your_openai_api_key
   
   # Caching
   UPSTASH_REDIS_REST_URL=your_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_redis_token
   
   # Optional
   AI_ENABLE_COST_TRACKING=true
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

5. **Database Setup**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Seed test data (optional)
   npm run db:seed
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

### Development Tools

#### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- GitLens

#### Useful Commands
```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run type-check       # Run TypeScript type checking

# Testing
npm run test             # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run end-to-end tests

# Database
npm run db:migrate       # Run database migrations
npm run db:reset         # Reset database
npm run db:seed          # Seed database with test data
```

## Project Structure

```
survey_insights/
├── src/
│   ├── app/                    # Next.js 13+ app directory
│   │   ├── api/               # API routes
│   │   │   └── admin/         # Admin API endpoints
│   │   ├── admin/             # Admin dashboard pages
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable React components
│   │   ├── ui/               # Base UI components
│   │   └── *.tsx             # Feature components
│   ├── lib/                  # Utility libraries
│   │   ├── ai/               # AI integration modules
│   │   ├── supabase/         # Database client setup
│   │   └── utils.ts          # General utilities
│   └── types/                # TypeScript type definitions
├── __tests__/                # Test files
│   ├── api/                  # API integration tests
│   ├── components/           # Component unit tests
│   ├── e2e/                  # End-to-end tests
│   └── lib/                  # Library unit tests
├── supabase/                 # Database schema and migrations
├── public/                   # Static assets
├── README/                   # Documentation
└── package.json              # Dependencies and scripts
```

### Key Directories

#### `/src/app/api/admin/`
Contains all API endpoints for the admin interface:
- `themes/` - Theme management endpoints
- `strategy/` - Strategy management endpoints
- `strategic-scoring/` - Strategic alignment calculation
- `strategic-intelligence/` - AI insights and analysis

#### `/src/components/`
Reusable React components:
- `ui/` - Base UI components (buttons, inputs, etc.)
- Feature-specific components (StrategicAnalysisModal, etc.)

#### `/src/lib/ai/`
AI integration modules:
- `theme-discovery.ts` - Theme discovery engine
- `strategic-intelligence.ts` - Strategic insights
- `model-optimization.ts` - AI model performance

#### `/src/types/`
TypeScript type definitions:
- `database.ts` - Database schema types
- API request/response types
- Component prop types

## Coding Standards

### TypeScript Guidelines

#### Type Safety
```typescript
// ✅ Good: Explicit types
interface Theme {
  id: string
  name: string
  strategicAlignment: number
}

// ❌ Bad: Any types
const theme: any = { ... }

// ✅ Good: Strict null checks
function processTheme(theme: Theme | null): string {
  if (!theme) {
    throw new Error('Theme is required')
  }
  return theme.name
}
```

#### API Response Types
```typescript
// ✅ Good: Consistent API response structure
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Usage
const response: ApiResponse<Theme[]> = await fetchThemes()
```

### React Component Standards

#### Component Structure
```typescript
// ✅ Good: Well-structured component
interface StrategicAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  theme: Theme
  onThemeReview: (themeId: string, review: ThemeReview) => void
}

export default function StrategicAnalysisModal({
  isOpen,
  onClose,
  theme,
  onThemeReview
}: StrategicAnalysisModalProps) {
  // Hooks at the top
  const [isLoading, setIsLoading] = useState(false)
  
  // Event handlers
  const handleSubmit = useCallback(async () => {
    // Implementation
  }, [theme, onThemeReview])
  
  // Early returns
  if (!isOpen) return null
  
  // Render
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Component content */}
    </Dialog>
  )
}
```

#### State Management
```typescript
// ✅ Good: Use appropriate state management
const [themes, setThemes] = useState<Theme[]>([])
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

// ✅ Good: Use useCallback for event handlers
const handleThemeUpdate = useCallback((updatedTheme: Theme) => {
  setThemes(prev => prev.map(theme => 
    theme.id === updatedTheme.id ? updatedTheme : theme
  ))
}, [])
```

### API Development Standards

#### Error Handling
```typescript
// ✅ Good: Consistent error handling
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }
    
    const themes = await fetchThemes(companyId)
    
    return NextResponse.json({ themes })
  } catch (error) {
    console.error('Error fetching themes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Input Validation
```typescript
// ✅ Good: Validate input data
function validateThemeData(data: unknown): Theme {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid theme data')
  }
  
  const theme = data as Record<string, unknown>
  
  if (!theme.name || typeof theme.name !== 'string') {
    throw new Error('Theme name is required')
  }
  
  return theme as Theme
}
```

### Database Standards

#### Query Patterns
```typescript
// ✅ Good: Use typed queries
const { data: themes, error } = await supabase
  .from('themes')
  .select('*')
  .eq('company_id', companyId)
  .order('created_at', { ascending: false })

if (error) {
  throw new Error(`Failed to fetch themes: ${error.message}`)
}

return themes as Theme[]
```

#### Error Handling
```typescript
// ✅ Good: Handle database errors
try {
  const { data, error } = await supabase
    .from('themes')
    .insert(themeData)
    
  if (error) {
    console.error('Database error:', error)
    throw new Error('Failed to create theme')
  }
  
  return data
} catch (error) {
  console.error('Error creating theme:', error)
  throw error
}
```

## API Development

### Creating New Endpoints

#### 1. Create Route File
```typescript
// src/app/api/admin/new-feature/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Implementation
  } catch (error) {
    console.error('Error in new-feature GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Implementation
  } catch (error) {
    console.error('Error in new-feature POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

#### 2. Add Types
```typescript
// src/types/database.ts
export interface NewFeature {
  id: string
  name: string
  // ... other fields
}

export interface NewFeatureRequest {
  name: string
  // ... other fields
}
```

#### 3. Add Tests
```typescript
// __tests__/api/admin/new-feature.test.ts
import { describe, it, expect } from '@jest/globals'

describe('New Feature API', () => {
  it('should create new feature', async () => {
    // Test implementation
  })
})
```

### Authentication and Authorization

#### Admin User Verification
```typescript
import { getAdminUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data: adminUser, error } = await getAdminUser(token)
    
    if (error || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Continue with authorized logic
  } catch (error) {
    // Error handling
  }
}
```

### Caching Strategies

#### Redis Caching
```typescript
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function getCachedData(key: string, fetcher: () => Promise<any>) {
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached as string)
  }
  
  const data = await fetcher()
  await redis.set(key, JSON.stringify(data), { ex: 3600 }) // 1 hour
  return data
}
```

## Frontend Development

### Component Development

#### Creating New Components
```typescript
// src/components/NewFeature.tsx
'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface NewFeatureProps {
  data: any[]
  onUpdate: (item: any) => void
}

export default function NewFeature({ data, onUpdate }: NewFeatureProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleAction = useCallback(async () => {
    setIsLoading(true)
    try {
      // Implementation
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Feature</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  )
}
```

#### Using UI Components
```typescript
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Use consistent component patterns
<Button variant="default" size="sm" onClick={handleClick}>
  Action
</Button>

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

### State Management

#### Local State
```typescript
// ✅ Good: Use appropriate state hooks
const [themes, setThemes] = useState<Theme[]>([])
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

#### Server State
```typescript
// ✅ Good: Use useEffect for data fetching
useEffect(() => {
  const fetchThemes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/themes?company_id=${companyId}`)
      const data = await response.json()
      setThemes(data.themes)
    } catch (error) {
      setError('Failed to fetch themes')
    } finally {
      setIsLoading(false)
    }
  }
  
  fetchThemes()
}, [companyId])
```

### Form Handling

#### Controlled Components
```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  priority: 'medium'
})

const handleInputChange = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // Submit logic
}
```

## AI Integration

### OpenAI Integration

#### Basic Usage
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateAnalysis(prompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are an expert product strategist.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    })
    
    return response.choices[0].message.content
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
}
```

#### Cost Tracking
```typescript
export async function trackAICost(requestType: string, usage: any) {
  if (process.env.AI_ENABLE_COST_TRACKING !== 'true') return
  
  const estimatedCost = calculateCost('gpt-4o', usage.total_tokens)
  
  await supabaseAdmin.from('ai_cost_logs').insert({
    company_id: companyId,
    provider: 'openai',
    model: 'gpt-4o',
    request_type: requestType,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    total_tokens: usage.total_tokens,
    estimated_cost: estimatedCost,
    cache_hit: false,
    related_table: 'themes',
    related_id: themeId,
  })
}
```

### Caching AI Responses

#### Redis Caching
```typescript
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export async function getCachedAIResponse(key: string, fetcher: () => Promise<any>) {
  const cached = await redis.get(key)
  if (cached) {
    console.log('📋 Using cached AI response')
    return JSON.parse(cached as string)
  }
  
  const response = await fetcher()
  await redis.set(key, JSON.stringify(response), { ex: 3600 }) // 1 hour
  return response
}
```

## Database Management

### Schema Design

#### Table Structure
```sql
-- Example: themes table
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  description TEXT,
  priority_score INTEGER DEFAULT 0,
  strategic_alignment_score INTEGER,
  strategic_reasoning TEXT,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_themes_company_id ON themes(company_id);
CREATE INDEX idx_themes_priority_score ON themes(priority_score DESC);
CREATE INDEX idx_themes_strategic_alignment_score ON themes(strategic_alignment_score DESC);
```

#### Migrations
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql
ALTER TABLE themes ADD COLUMN new_feature TEXT;

-- Update existing records
UPDATE themes SET new_feature = 'default_value' WHERE new_feature IS NULL;

-- Add index if needed
CREATE INDEX idx_themes_new_feature ON themes(new_feature);
```

### Query Optimization

#### Efficient Queries
```typescript
// ✅ Good: Use specific selects
const { data } = await supabase
  .from('themes')
  .select('id, title, priority_score, strategic_alignment_score')
  .eq('company_id', companyId)
  .order('priority_score', { ascending: false })
  .limit(20)

// ✅ Good: Use appropriate indexes
const { data } = await supabase
  .from('themes')
  .select('*')
  .eq('company_id', companyId)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
```

#### Batch Operations
```typescript
// ✅ Good: Batch updates
const updates = themes.map(theme => ({
  id: theme.id,
  strategic_alignment_score: theme.strategic_alignment_score
}))

await supabase
  .from('themes')
  .upsert(updates)
```

## Testing

### Unit Testing

#### Component Tests
```typescript
// __tests__/components/StrategicAnalysisModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import StrategicAnalysisModal from '@/components/StrategicAnalysisModal'

describe('StrategicAnalysisModal', () => {
  it('should render modal when open', () => {
    render(
      <StrategicAnalysisModal
        isOpen={true}
        onClose={jest.fn()}
        theme={mockTheme}
        onThemeReview={jest.fn()}
      />
    )
    
    expect(screen.getByText('Strategic Analysis')).toBeInTheDocument()
  })
})
```

#### API Tests
```typescript
// __tests__/api/admin/themes.test.ts
import { GET } from '@/app/api/admin/themes/route'

describe('Themes API', () => {
  it('should return themes for company', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/themes?company_id=test-company')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.themes).toBeDefined()
  })
})
```

### Integration Testing

#### Database Integration
```typescript
describe('Database Integration', () => {
  it('should create and retrieve theme', async () => {
    const themeData = { title: 'Test Theme', company_id: 'test-company' }
    
    const { data: created } = await supabase
      .from('themes')
      .insert(themeData)
      .select()
      .single()
    
    expect(created.title).toBe('Test Theme')
    
    const { data: retrieved } = await supabase
      .from('themes')
      .select('*')
      .eq('id', created.id)
      .single()
    
    expect(retrieved.title).toBe('Test Theme')
  })
})
```

### End-to-End Testing

#### Playwright Tests
```typescript
// __tests__/e2e/themes-workflow.test.ts
import { test, expect } from '@playwright/test'

test('should complete themes workflow', async ({ page }) => {
  await page.goto('/admin/dashboard/themes')
  
  await page.click('[data-testid="run-discovery-button"]')
  await page.waitForSelector('[data-testid="discovery-complete"]')
  
  await page.click('[data-testid="theme-card"]:first-child')
  await page.waitForSelector('[data-testid="strategic-analysis-modal"]')
  
  await page.selectOption('[data-testid="review-decision-select"]', 'approve')
  await page.click('[data-testid="submit-review-button"]')
  
  await expect(page.locator('[data-testid="review-success"]')).toBeVisible()
})
```

## Deployment

### Environment Configuration

#### Production Environment
```env
# Production environment variables
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
OPENAI_API_KEY=your_production_openai_key
UPSTASH_REDIS_REST_URL=https://your-production-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_production_redis_token
```

#### Build Process
```bash
# Build for production
npm run build

# Start production server
npm run start

# Or deploy to Vercel
vercel --prod
```

### CI/CD Pipeline

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run test:ci
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Monitoring and Logging

#### Error Tracking
```typescript
// Add error tracking
export async function GET(request: NextRequest) {
  try {
    // Implementation
  } catch (error) {
    console.error('API Error:', {
      endpoint: '/api/admin/themes',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes**
   - Write code following coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/new-feature
   ```

### Code Review Process

1. **Automated Checks**
   - All tests must pass
   - Code must pass linting
   - TypeScript must compile without errors
   - Coverage thresholds must be met

2. **Manual Review**
   - Code follows established patterns
   - Documentation is updated
   - Performance implications considered
   - Security implications reviewed

3. **Approval and Merge**
   - At least one approval required
   - All discussions resolved
   - CI/CD pipeline passes

### Commit Message Format

```
type(scope): description

feat(api): add theme discovery endpoint
fix(ui): resolve modal closing issue
docs(readme): update installation instructions
test(components): add StrategicAnalysisModal tests
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/) - API testing
- [TablePlus](https://tableplus.com/) - Database management
- [RedisInsight](https://redis.com/redis-enterprise/redis-insight/) - Redis management

### Community
- [GitHub Discussions](https://github.com/your-org/survey_insights/discussions)
- [Discord Server](https://discord.gg/your-server)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/survey-insights)

This developer guide provides a comprehensive foundation for contributing to the Unified Feedback Platform. Follow these guidelines to ensure consistent, high-quality code and smooth collaboration with the development team.
