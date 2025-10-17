# Common Problems & Solutions

This document outlines common issues encountered during development and their solutions to prevent future problems.

## Table of Contents
- [Middleware Issues](#middleware-issues)
- [TypeScript Build Errors](#typescript-build-errors)
- [Authentication Problems](#authentication-problems)
- [Database Connection Issues](#database-connection-issues)
- [Development Server Issues](#development-server-issues)
- [AI Tag System Issues](#ai-tag-system-issues)
- [Redis Cache Issues](#redis-cache-issues)

## Middleware Issues

### Problem: Middleware Not Running
**Symptoms:**
- API routes are called directly without middleware interception
- No middleware console logs appear in server output
- Authentication fails even with valid tokens
- API routes return 500 errors because they expect middleware headers
- Browser shows "GET http://localhost:3000/api/admin/customers 500 (Internal Server Error)"
- Surveys page works fine, but Customers and Settings pages fail

**Root Causes:**
1. **TypeScript compilation errors** - Middleware fails to compile due to type errors
2. **Missing type annotations** - Middleware function parameters not properly typed
3. **Import path issues** - Incorrect import paths in middleware file
4. **Next.js not loading middleware** - Middleware file exists but Next.js doesn't recognize it
5. **Page routes bypass middleware** - Some API routes may not match the middleware matcher pattern

**Solutions:**

#### 1. Fix TypeScript Errors First
```bash
# Always run build to check for TypeScript errors
npm run build
```

**Common TypeScript errors in middleware:**
```typescript
// ❌ WRONG - Missing type annotation
export function middleware(request) {
  // ...
}

// ✅ CORRECT - Proper type annotation
export function middleware(request: NextRequest) {
  // ...
}
```

#### 2. Ensure Proper Middleware File Structure
```typescript
// middleware.ts (must be in root directory)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE RUNNING FOR:', request.nextUrl.pathname)
  
  // Your middleware logic here
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/admin/:path*',
  ],
}
```

#### 3. Check Import Paths
```typescript
// ❌ WRONG - Relative imports may fail in Edge Runtime
import { supabaseAdmin } from '@/lib/supabase/server'

// ✅ CORRECT - Use direct imports for Edge Runtime compatibility
import { createClient } from '@supabase/supabase-js'
```

#### 4. Verify Middleware is Loading
Add console logs to verify middleware execution:
```typescript
export async function middleware(request: NextRequest) {
  console.log('🚀 MIDDLEWARE LOADED AND RUNNING FOR:', request.nextUrl.pathname)
  console.log('🚀 MIDDLEWARE TIMESTAMP:', new Date().toISOString())
  
  // Your logic here
}
```

#### 5. Test Middleware Execution
```bash
# Start dev server
npm run dev

# Test API endpoint
curl -X GET http://localhost:3000/api/admin/users -H "Content-Type: application/json" -v

# Check server logs for middleware console output
```

### Problem: Middleware File Exists But Not Loading
**Symptoms:**
- Middleware file exists in root directory
- Build succeeds without errors
- Server starts successfully
- API routes return 404 or 500 errors
- No middleware console logs appear anywhere
- curl tests show no middleware execution

**Critical Diagnosis Steps:**

1. **Check if middleware is actually loaded:**
   ```bash
   # Look for middleware compilation in build output
   npm run build | grep middleware
   
   # Check if .next/server/middleware.js exists
   ls -la .next/server/middleware*
   ```

2. **Verify middleware file location:**
   ```bash
   # Must be in PROJECT ROOT, not in src/
   ls -la middleware.ts
   ```

3. **Test with absolute minimal middleware:**
   ```typescript
   // middleware.ts
   import { NextResponse } from 'next/server'
   import type { NextRequest } from 'next/server'

   export function middleware(request: NextRequest) {
     console.log('MIDDLEWARE RUNNING')
     return NextResponse.next()
   }

   export const config = {
     matcher: ['/api/admin/:path*'],
   }
   ```

4. **Force complete rebuild:**
   ```bash
   rm -rf .next
   pkill -f "next dev"
   npm run build
   npm run dev
   ```

5. **Check for conflicting files:**
   ```bash
   # Remove any old middleware files
   rm middleware.js middleware-test*.ts
   ```

**If middleware still doesn't load:**
- The API routes may be using `headers()` which prevents middleware from running in dev mode
- Check if API routes are calling `headers()` directly - this forces dynamic rendering and may bypass middleware
- The middleware matcher pattern may not match your routes
- There may be a Next.js version compatibility issue

**Solution 1: Direct Authentication in API Routes (Current Implementation)**

This project uses direct authentication in API routes instead of middleware for better reliability:

```typescript
// API route with direct authentication (no middleware needed)
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Continue with API logic...
    // Use user.id and user.email as needed
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Solution 2: Remove headers() usage (if using middleware)**

Since the middleware is supposed to set the headers, API routes should NOT be calling `headers()` directly. Instead, they should use the `getAuthenticatedUser(request)` helper which reads from middleware-set headers.

```typescript
// ❌ WRONG - This prevents middleware from running properly
export async function GET() {
  const headersList = headers()
  const authHeader = headersList.get('authorization')
  // ...
}

// ✅ CORRECT - Use request parameter and middleware helper
export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request)
  // ...
}
```

### Problem: New Pages Not Using Middleware
**Symptoms:**
- New API routes bypass middleware authentication
- Inconsistent authentication across routes
- Some routes work, others don't

**Solutions:**

#### 1. Update Middleware Matcher
When adding new API routes, update the middleware config:
```typescript
export const config = {
  matcher: [
    '/api/admin/:path*',           // Existing admin routes
    '/api/admin/new-route/:path*', // Add new routes here
  ],
}
```

#### 2. Ensure Consistent Route Structure
```typescript
// ✅ CORRECT - Use middleware authentication
export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request) // Uses middleware headers
  // ... rest of logic
}

// ❌ WRONG - Duplicate authentication logic
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  // ... manual auth logic (bypasses middleware)
}
```

#### 3. Use Auth Middleware Helper
Always use the `getAuthenticatedUser` helper in API routes:
```typescript
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthenticatedUser(request)
    // ... rest of logic
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }
}
```

## TypeScript Build Errors

### Problem: Build Fails with Type Errors
**Symptoms:**
- `npm run build` fails with TypeScript errors
- Middleware not loading due to compilation errors
- Development server shows type errors

**Common Solutions:**

#### 1. Fix Missing Type Annotations
```typescript
// ❌ WRONG
const { data: adminUser } = await supabase.from('admin_users').select('company_id').single()

// ✅ CORRECT
const { data: adminUser } = await supabase.from('admin_users').select('company_id').single()
// Use type assertion if needed
const companyId = (adminUser as any).company_id
```

#### 2. Fix Array Type Issues
```typescript
// ❌ WRONG
const items = data?.map(item => item.property)

// ✅ CORRECT
const items = (data as any[])?.map(item => item.property)
```

#### 3. Fix Object Property Access
```typescript
// ❌ WRONG
if (object.property) { ... }

// ✅ CORRECT
if ((object as any).property) { ... }
```

### Problem: Supabase Type Issues
**Symptoms:**
- Supabase query results have `never` type
- Property access fails with TypeScript errors

**Solutions:**
```typescript
// Use type assertions for Supabase results
const { data, error } = await supabase
  .from('table')
  .select('*')
  .single()

if (data) {
  const typedData = data as any
  // Use typedData.property instead of data.property
}
```

## Authentication Problems

### Problem: Customer Detail Page Not Loading (Middleware Removed)
**Symptoms:**
- Customer list page loads fine
- Clicking "View Profile" button does nothing or shows error
- Browser console shows "AuthSessionMissingError: Auth session missing!"
- API route returns 500 error instead of customer data
- Other admin pages work fine (surveys, users, etc.)

**Root Cause:**
The customer detail API route (`/api/admin/customers/[id]/route.ts`) was still using the old middleware authentication approach (`getAuthenticatedUser(request)`) while the middleware had been removed from the project. Other API routes had been updated to use direct Bearer token authentication.

**Solution:**
Update the customer detail API route to use the same authentication pattern as other working API routes:

```typescript
// ❌ WRONG - Using old middleware approach
import { getAuthenticatedUser } from '@/lib/auth-middleware'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthenticatedUser(request) // This fails when middleware is removed
  // ...
}

// ✅ CORRECT - Use direct Bearer token authentication
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id
    
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    console.log('🔑 User authenticated:', user.id, user.email)
    
    // Continue with API logic...
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Diagnosis Steps:**
1. Check terminal logs for "AuthSessionMissingError"
2. Verify which API routes are failing vs working
3. Compare authentication patterns between working and failing routes
4. Update failing routes to match working authentication pattern

### Problem: API Routes Not Authenticated
**Symptoms:**
- API routes return 500 errors instead of 401
- Authentication headers not being set
- Middleware not running

**Solutions:**

#### 1. Check Middleware Configuration
Ensure middleware is properly configured and running:
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  console.log('🔍 MIDDLEWARE RUNNING FOR:', request.nextUrl.pathname)
  
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    // Authentication logic here
  }
  
  return NextResponse.next()
}
```

#### 2. Verify API Route Implementation
```typescript
// API route should use middleware headers
export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request) // Gets headers from middleware
  // ... rest of logic
}
```

#### 3. Test Authentication Flow
```bash
# Test without auth (should return 401)
curl -X GET http://localhost:3000/api/admin/users

# Test with auth (should work)
curl -X GET http://localhost:3000/api/admin/users -H "Authorization: Bearer YOUR_TOKEN"
```

## Database Connection Issues

### Problem: Supabase Connection Fails
**Symptoms:**
- Database queries fail
- Connection timeouts
- Environment variables not loaded

**Solutions:**

#### 1. Check Environment Variables
```bash
# Verify .env.local exists and has correct values
cat .env.local
```

#### 2. Verify Supabase Configuration
```typescript
// Check Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing')
```

## Development Server Issues

### Problem: Server Not Starting
**Symptoms:**
- `npm run dev` fails
- Port conflicts
- Build errors preventing server start

**Solutions:**

#### 1. Clear Build Cache
```bash
rm -rf .next
npm run dev
```

#### 2. Check for Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Kill conflicting processes
pkill -f "next dev"
```

#### 3. Verify Dependencies
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Prevention Checklist

### Before Adding New API Routes:
- [ ] Update middleware matcher if needed
- [ ] Use `getAuthenticatedUser` helper
- [ ] Don't duplicate authentication logic
- [ ] Test with and without authentication

### Before Deploying:
- [ ] Run `npm run build` to check for TypeScript errors
- [ ] Test all API endpoints
- [ ] Verify middleware is running
- [ ] Check authentication flow

### When Middleware Issues Occur:
- [ ] Check TypeScript compilation first
- [ ] Verify middleware file location and syntax
- [ ] Test middleware with console logs
- [ ] Check import paths for Edge Runtime compatibility

## Quick Debug Commands

```bash
# Check build status
npm run build

# Start dev server with verbose output
npm run dev

# Test API endpoint
curl -X GET http://localhost:3000/api/admin/users -v

# Check server logs for middleware output
# Look for: "🚀 MIDDLEWARE RUNNING FOR:"
```

## Emergency Fixes

### If Middleware Completely Broken:
1. **Check TypeScript errors first:**
   ```bash
   npm run build
   ```

2. **Verify middleware file:**
   ```bash
   ls -la middleware.ts
   cat middleware.ts
   ```

3. **Test minimal middleware:**
   ```typescript
   import { NextResponse } from 'next/server'
   import type { NextRequest } from 'next/server'

   export function middleware(request: NextRequest) {
     console.log('🚀 TEST MIDDLEWARE:', request.nextUrl.pathname)
     return NextResponse.next()
   }

   export const config = {
     matcher: ['/api/admin/:path*'],
   }
   ```

4. **Restart development server:**
   ```bash
   pkill -f "next dev"
   npm run dev
   ```

## AI Tag System Issues

### Problem: AI Tags Not Normalizing (Underscores vs Hyphens vs Spaces)
**Symptoms:**
- Tags appear with underscores like `user_friendly` instead of spaces
- Inconsistent formatting between `user_friendly` and `user-friendly` and `user friendly`
- AI generating tags with hyphens when spaces are expected
- Old cached AI responses interfering with new normalization rules

**Root Causes:**
1. **Cached AI responses** - Redis cache contains old responses with different formatting rules
2. **Inconsistent AI prompts** - AI prompts not clearly specifying the desired format
3. **Mixed normalization approaches** - System switching between hardcoded rules and AI-based normalization

**Solutions:**

#### 1. Clear Redis Cache
```bash
# Create a script to clear Upstash Redis cache
# clear_cache.js
const { Redis } = require('@upstash/redis/cloudflare')

const redis = Redis.fromEnv()

async function clearCache() {
  try {
    const keys = await redis.keys('normalize:*')
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`✅ Cleared ${keys.length} cache keys`)
    } else {
      console.log('No cache keys found')
    }
  } catch (error) {
    console.error('❌ Error clearing cache:', error)
  }
}

clearCache()
```

#### 2. Update AI Prompts Consistently
Ensure all AI prompts specify the exact format desired:
```typescript
// ✅ CORRECT - Clear format specification
const prompt = `Extract 3-5 relevant tags from the feedback. Tags should be:
- Lowercase
- Single words or short phrases (max 2 words)
- ALWAYS use spaces for multi-word tags (e.g., "feature request")
- NEVER use underscores - use spaces or hyphens only
- Categories like: feature names, issue types, emotions, topics`
```

#### 3. Remove Hardcoded Merge Rules
Replace hardcoded tag merging with pure AI intelligence:
```typescript
// ❌ WRONG - Hardcoded rules
const mergeRules = {
  "accuracy": ["accurate", "accuracy-precision"],
  "user_friendly": ["user-friendly", "user friendly"]
}

// ✅ CORRECT - Let AI handle semantic merging
const prompt = `Merge similar concepts intelligently - use your AI knowledge to identify semantic duplicates.`
```

### Problem: Duplicate Tag Detection Finding Zero Duplicates
**Symptoms:**
- Duplicate detection system returns empty results
- Obvious duplicates like "accuracy" vs "accurate" not detected
- AI normalization working so well it prevents duplicates from being created
- System shows "Found 0 duplicate groups" when duplicates exist

**Root Causes:**
1. **AI normalization preventing duplicates** - The real-time normalization is working too well
2. **Duplicate detection running on already-normalized data** - No raw duplicates left to detect
3. **Overly aggressive normalization** - AI merging similar tags during creation

**Solutions:**

#### 1. Check if Normalization is Working Too Well
```bash
# Query the database to see actual tag distribution
# If you see mostly unique tags, normalization is working
SELECT normalized_name, COUNT(*) as count 
FROM tags 
WHERE company_id = 'your-company-id' 
GROUP BY normalized_name 
ORDER BY count DESC;
```

#### 2. Focus on Real-time Normalization
Instead of separate duplicate detection, rely on the AI normalization during tag creation:
```typescript
// The AI normalization in processTags() is the primary deduplication mechanism
const normalizedTags = await this.normalizeTags(rawTags)
// This handles duplicates in real-time, making separate detection redundant
```

#### 3. Clean Database for Testing
If testing with a clean slate:
```javascript
// nuke_all_tags.js - Delete all tags for testing
const { createClient } = require('@supabase/supabase-js')

async function nukeAllTags() {
  const supabase = createClient(url, serviceKey)
  
  // Delete all tag usages first (foreign key constraint)
  await supabase.from('tag_usages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  // Delete all tags
  await supabase.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  console.log('✅ All tags deleted')
}
```

### Problem: 500 Errors When Processing Survey Responses
**Symptoms:**
- "Process Existing Responses" button causes 500 Internal Server Error
- Terminal shows `SyntaxError: "[object Object]" is not valid JSON`
- Redis cache corruption causing JSON parsing failures
- AI processing failing due to cached data corruption

**Root Causes:**
1. **Corrupted Redis cache entries** - Cache contains non-JSON objects
2. **Missing error handling** - JSON.parse() calls not wrapped in try-catch
3. **Cache data type mismatches** - Expecting strings but getting objects

**Solutions:**

#### 1. Add Robust Error Handling
```typescript
// ✅ CORRECT - Safe JSON parsing with error handling
try {
  let cached = await redis.get(cacheKey)
  if (cached && typeof cached === 'string') {
    const parsed = JSON.parse(cached)
    return parsed
  }
} catch (error) {
  console.warn('Cache corruption detected, falling back to AI call')
  // Continue with AI call instead of failing
}
```

#### 2. Clear Corrupted Cache
```javascript
// Clear specific corrupted cache patterns
const corruptedKeys = await redis.keys('normalize:*')
await redis.del(...corruptedKeys)
```

#### 3. Implement Cache Validation
```typescript
function isValidCacheData(data: any): boolean {
  return data && typeof data === 'string' && data.startsWith('{')
}
```

## Redis Cache Issues

### Problem: Cache Corruption Causing JSON Parse Errors
**Symptoms:**
- `SyntaxError: "[object Object]" is not valid JSON`
- `SyntaxError: Unexpected token 'p', "planswift,"... is not valid JSON`
- AI processing failing with cached data
- Inconsistent behavior between requests

**Root Causes:**
1. **Mixed data types in cache** - Objects being stored as strings
2. **Cache serialization issues** - Data not properly JSON stringified
3. **Race conditions** - Multiple processes writing to same cache keys

**Solutions:**

#### 1. Validate Cache Data Before Parsing
```typescript
async function getCachedData(key: string) {
  try {
    const cached = await redis.get(key)
    
    // Validate cache data type
    if (!cached || typeof cached !== 'string') {
      return null
    }
    
    // Validate JSON format
    if (!cached.startsWith('{') && !cached.startsWith('[')) {
      console.warn(`Invalid cache data format for key ${key}`)
      return null
    }
    
    return JSON.parse(cached)
  } catch (error) {
    console.warn(`Cache corruption for key ${key}:`, error.message)
    return null
  }
}
```

#### 2. Clear All Cache Keys
```javascript
// clear_all_cache.js
const { Redis } = require('@upstash/redis/cloudflare')
const redis = Redis.fromEnv()

async function clearAllCache() {
  const keys = await redis.keys('*')
  if (keys.length > 0) {
    await redis.del(...keys)
    console.log(`✅ Cleared ${keys.length} cache keys`)
  }
}
```

#### 3. Implement Cache TTL
```typescript
// Set reasonable expiration times to prevent stale data
await redis.setex(cacheKey, 3600, JSON.stringify(data)) // 1 hour TTL
```

### Problem: AI Using Old Cached Responses
**Symptoms:**
- AI generating tags with old formatting (hyphens instead of spaces)
- Prompt changes not taking effect
- Inconsistent tag formats despite updated prompts
- Cache serving stale responses

**Solutions:**

#### 1. Clear Cache After Prompt Changes
```bash
# Always clear cache after updating AI prompts
node clear_cache.js
```

#### 2. Use Cache Versioning
```typescript
// Include version in cache keys to force refresh
const cacheKey = `normalize:v2:${tagHash}`
```

#### 3. Add Cache Invalidation
```typescript
// Invalidate specific cache patterns when prompts change
await redis.del(...(await redis.keys('normalize:*')))
```

---

**Remember:** Always fix TypeScript errors first, as they prevent middleware from loading. The middleware is the foundation of authentication in this application.

**AI System Tips:**
- Clear Redis cache after changing AI prompts
- Use robust error handling for JSON parsing
- Let AI handle semantic normalization instead of hardcoded rules
- Monitor cache health and implement proper TTL
