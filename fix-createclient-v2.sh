#!/bin/bash

# Better script to fix all createClient() issues
echo "🔧 Fixing createClient() issues properly..."

# Function to fix a single file
fix_file() {
  local file="$1"
  echo "  📝 Fixing $file"
  
  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "  ⚠️  File not found: $file"
    return
  fi
  
  # Replace client imports
  sed -i '' 's/import { createClient } from '\''@\/lib\/supabase\/client'\''/import { supabase } from '\''@\/lib\/supabase\/client'\''/g' "$file"
  
  # Replace server imports  
  sed -i '' 's/import { createClient } from '\''@\/lib\/supabase\/server'\''/import { supabaseAdmin } from '\''@\/lib\/supabase\/server'\''/g' "$file"
  
  # Replace createClient() calls with appropriate client
  if grep -q "from '@/lib/supabase/client'" "$file"; then
    sed -i '' 's/const supabase = createClient()/\/\/ Use the pre-configured supabase client/g' "$file"
    sed -i '' 's/supabase\./supabase\./g' "$file"  # Keep as supabase
  elif grep -q "from '@/lib/supabase/server'" "$file"; then
    sed -i '' 's/const supabase = createClient()/\/\/ Use the pre-configured supabase client/g' "$file"
    sed -i '' 's/supabase\./supabaseAdmin\./g' "$file"  # Change to supabaseAdmin
  fi
}

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

# Fix all files
for file in "${files[@]}"; do
  fix_file "$file"
done

echo "✅ Fixed createClient() issues in all files!"
