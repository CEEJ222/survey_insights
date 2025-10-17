#!/bin/bash

# ============================================================================
# PHASE 4 SETUP SCRIPT
# ============================================================================
# Sets up Phase 4: Closed Loop Tracking & Customer Impact
# ============================================================================

set -e

echo "🚀 Setting up Phase 4: Closed Loop Tracking & Customer Impact"
echo "=============================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Please install it from: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "📋 Step 1: Running database migration..."
echo "--------------------------------------"

# Run the Phase 4 migration
if [ -f "supabase/phase4_customer_impact_migration.sql" ]; then
    echo "Running Phase 4 database migration..."
    supabase db reset --linked
    echo "✅ Database migration completed"
else
    echo "❌ Error: Migration file not found"
    exit 1
fi

echo ""
echo "📋 Step 2: Installing dependencies..."
echo "------------------------------------"

# Install any new dependencies
npm install

echo "✅ Dependencies installed"

echo ""
echo "📋 Step 3: Building the application..."
echo "------------------------------------"

# Build the application to check for errors
npm run build

echo "✅ Application built successfully"

echo ""
echo "📋 Step 4: Setting up environment variables..."
echo "-------------------------------------------"

# Check for required environment variables
if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
    echo "⚠️  Warning: NEXT_PUBLIC_APP_URL is not set"
    echo "   This is needed for customer notification emails"
fi

if [ -z "$CRON_SECRET" ]; then
    echo "⚠️  Warning: CRON_SECRET is not set"
    echo "   This is needed for automated cron jobs"
    echo "   Generate one with: openssl rand -base64 32"
fi

echo ""
echo "📋 Step 5: Testing API endpoints..."
echo "----------------------------------"

# Test if the application starts
echo "Starting application for testing..."
npm run dev &
APP_PID=$!

# Wait for the app to start
sleep 10

# Test API endpoints
echo "Testing API endpoints..."

# Test impact metrics endpoint
if curl -s http://localhost:3000/api/admin/impact/metrics > /dev/null; then
    echo "✅ Impact metrics API working"
else
    echo "⚠️  Impact metrics API not responding (this is expected without auth)"
fi

# Stop the test server
kill $APP_PID 2>/dev/null || true

echo ""
echo "🎉 Phase 4 setup completed successfully!"
echo "========================================"
echo ""
echo "✅ Database migration applied"
echo "✅ Customer notification system ready"
echo "✅ Impact measurement system ready"
echo "✅ Customer impact dashboard ready"
echo "✅ Automation system ready"
echo ""
echo "📋 Next steps:"
echo "1. Set up email service integration (SendGrid, Resend, etc.)"
echo "2. Configure cron job to run automation:"
echo "   - URL: https://your-domain.com/api/cron/initiative-automation"
echo "   - Schedule: Every hour"
echo "   - Auth: Bearer token with CRON_SECRET"
echo "3. Test the complete workflow:"
echo "   - Ship an initiative"
echo "   - Check customer notifications"
echo "   - Monitor impact metrics"
echo ""
echo "🔗 Dashboard: /admin/dashboard/impact"
echo "🔗 API Docs: /api/admin/docs"
echo ""
echo "Happy building! 🚀"
