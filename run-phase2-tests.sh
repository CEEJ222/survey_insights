#!/bin/bash

# Phase 2 Testing Runner
# Comprehensive testing script for strategic theme scoring

echo "🧪 Phase 2 Testing Runner"
echo "========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting Phase 2 testing..."

# Step 1: Check dependencies
print_status "1. Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "Dependencies not found. Installing..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_success "Dependencies found"
fi

# Step 2: Check environment variables
print_status "2. Checking environment variables..."
if [ -z "$OPENAI_API_KEY" ]; then
    print_warning "OPENAI_API_KEY not set. Please set it in your .env.local file"
fi

if [ -z "$SUPABASE_URL" ]; then
    print_warning "SUPABASE_URL not set. Please set it in your .env.local file"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    print_warning "SUPABASE_ANON_KEY not set. Please set it in your .env.local file"
fi

# Step 3: Run database setup
print_status "3. Setting up test data..."
if [ -f "setup-test-data.sql" ]; then
    print_status "Test data setup script found. Please run it manually in your database:"
    echo "psql -h your-host -U your-user -d your-database -f setup-test-data.sql"
    print_warning "Or copy the SQL and run it in your Supabase SQL editor"
else
    print_error "Test data setup script not found"
fi

# Step 4: Run the test script
print_status "4. Running Phase 2 test script..."
if [ -f "test-phase2.js" ]; then
    node test-phase2.js
    if [ $? -eq 0 ]; then
        print_success "Phase 2 test script completed successfully"
    else
        print_error "Phase 2 test script failed"
    fi
else
    print_error "Test script not found"
fi

# Step 5: Start development server (optional)
print_status "5. Development server options..."
echo ""
echo "To test the UI components:"
echo "1. Start the development server: npm run dev"
echo "2. Navigate to: http://localhost:3000/admin/dashboard/themes"
echo "3. Check the strategy health dashboard: http://localhost:3000/admin/dashboard/strategy-health"
echo ""

# Step 6: API testing
print_status "6. API testing options..."
echo ""
echo "To test API endpoints manually:"
echo "curl -X GET 'http://localhost:3000/api/admin/themes?company_id=test-company-phase2'"
echo "curl -X GET 'http://localhost:3000/api/admin/themes/strategic-health?company_id=test-company-phase2'"
echo ""

# Step 7: Manual testing checklist
print_status "7. Manual testing checklist..."
echo ""
echo "✅ Manual Testing Checklist:"
echo "   □ Navigate to themes dashboard"
echo "   □ Verify themes show strategic alignment scores"
echo "   □ Test sorting by strategic priority"
echo "   □ Test filtering (in-strategy, off-strategy, needs review)"
echo "   □ Click 'Analysis' button on a theme"
echo "   □ Verify strategic analysis modal opens"
echo "   □ Check conflicts and opportunities are displayed"
echo "   □ Navigate to strategy health dashboard"
echo "   □ Verify health metrics are calculated correctly"
echo "   □ Test 'Run Discovery' button"
echo "   □ Check console for AI scoring logs"
echo ""

# Step 8: Performance testing
print_status "8. Performance testing..."
echo ""
echo "To test performance:"
echo "1. Monitor AI response times (should be <3 seconds per theme)"
echo "2. Check memory usage during theme discovery"
echo "3. Verify caching is working (Redis)"
echo ""

# Step 9: Troubleshooting
print_status "9. Troubleshooting..."
echo ""
echo "Common issues and solutions:"
echo "• AI scoring not working: Check OpenAI API key and credits"
echo "• Strategic columns missing: Run minimal_v1_migration.sql"
echo "• No strategy found: Create test strategy in database"
echo "• Performance issues: Check Redis connection and AI costs"
echo ""

print_success "Phase 2 testing setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up test data in your database"
echo "2. Start the development server"
echo "3. Test the UI components manually"
echo "4. Run API tests"
echo "5. Check performance and AI scoring"
echo ""
echo "For detailed testing instructions, see: TESTING_GUIDE_PHASE_2.md"
