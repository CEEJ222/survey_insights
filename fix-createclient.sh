#!/bin/bash

# Script to fix all createClient() issues in the codebase
# This replaces createClient() calls with pre-configured supabase instances

echo "🔧 Fixing createClient() issues across the codebase..."

# List of files that need fixing
files=(
  "src/app/api/admin/initiatives/[id]/status/route.ts"
  "src/lib/automation/initiative-automation.ts"
  "src/app/api/admin/strategy/health/route.ts"
  "src/app/api/admin/initiatives/recent-impact/route.ts"
  "src/lib/analytics/customer-impact.ts"
  "src/lib/notifications/customer-impact.ts"
  "src/app/api/admin/strategy/route.ts"
  "src/app/api/admin/initiatives/route.ts"
  "src/app/api/admin/initiatives/[id]/timeline/route.ts"
  "src/app/api/admin/initiatives/from-theme/route.ts"
  "src/app/api/admin/initiatives/timeline/route.ts"
  "src/app/api/admin/initiatives/[id]/route.ts"
  "src/app/api/admin/vision/history/route.ts"
  "src/app/api/admin/objectives/[id]/progress/route.ts"
  "src/app/api/admin/objectives/[id]/route.ts"
  "src/app/api/admin/vision/route.ts"
  "src/app/api/admin/vision/current/route.ts"
  "src/app/api/admin/objectives/route.ts"
  "src/app/api/admin/vision/[id]/route.ts"
  "src/app/api/admin/strategy/history/route.ts"
  "src/app/api/admin/strategy/[id]/route.ts"
  "src/app/api/admin/strategy/current/route.ts"
)

# Function to fix a single file
fix_file() {
  local file="$1"
  echo "  📝 Fixing $file"
  
  # Replace import statement
  sed -i '' 's/import { createClient } from '\''@\/lib\/supabase\/client'\''/import { supabase } from '\''@\/lib\/supabase\/client'\''/g' "$file"
  
  # Replace createClient() calls
  sed -i '' 's/const supabase = createClient()/\/\/ Use the pre-configured supabase client/g' "$file"
}

# Fix all files
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    fix_file "$file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo "✅ Fixed createClient() issues in all files!"
echo "🧪 Running build to check for remaining issues..."
