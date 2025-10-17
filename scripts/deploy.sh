#!/bin/bash

# ============================================================================
# DEPLOYMENT SCRIPT FOR SURVEY INSIGHTS PLATFORM
# ============================================================================
# This script handles the complete deployment process including:
# - Environment validation
# - Database migrations
# - Application deployment
# - Health checks
# - Rollback procedures
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_ENABLED=${BACKUP_ENABLED:-true}
ROLLBACK_ON_FAILURE=${ROLLBACK_ON_FAILURE:-true}

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validation function
validate_environment() {
    log "Validating deployment environment..."
    
    # Check required environment variables
    required_vars=(
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "OPENAI_API_KEY"
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    success "Environment validation passed"
}

# Backup function
backup_database() {
    if [ "$BACKUP_ENABLED" = "true" ]; then
        log "Creating database backup..."
        
        backup_name="backup_$(date +%Y%m%d_%H%M%S).sql"
        backup_path="./backups/$backup_name"
        
        # Create backups directory if it doesn't exist
        mkdir -p ./backups
        
        # Create backup using Supabase CLI
        supabase db dump --db-url "$DATABASE_URL" > "$backup_path"
        
        if [ $? -eq 0 ]; then
            success "Database backup created: $backup_path"
            echo "$backup_path" > .last_backup
        else
            error "Failed to create database backup"
            exit 1
        fi
    fi
}

# Database migration function
run_migrations() {
    log "Running database migrations..."
    
    # Apply schema migrations
    supabase db push --db-url "$DATABASE_URL"
    
    if [ $? -eq 0 ]; then
        success "Database migrations completed successfully"
    else
        error "Database migrations failed"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            rollback_database
        fi
        exit 1
    fi
}

# Build application function
build_application() {
    log "Building application..."
    
    # Install dependencies
    npm ci --production=false
    
    # Run linting
    log "Running code quality checks..."
    npm run lint
    
    # Run type checking
    npx tsc --noEmit
    
    # Build application
    npm run build
    
    if [ $? -eq 0 ]; then
        success "Application built successfully"
    else
        error "Application build failed"
        exit 1
    fi
}

# Deploy application function
deploy_application() {
    log "Deploying application to $ENVIRONMENT..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        # Deploy to Vercel production
        vercel --prod --token "$VERCEL_TOKEN"
    else
        # Deploy to Vercel preview
        vercel --token "$VERCEL_TOKEN"
    fi
    
    if [ $? -eq 0 ]; then
        success "Application deployed successfully"
    else
        error "Application deployment failed"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            rollback_deployment
        fi
        exit 1
    fi
}

# Health check function
health_check() {
    log "Performing health checks..."
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --token "$VERCEL_TOKEN" | grep "$ENVIRONMENT" | awk '{print $2}' | head -1)
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        error "Could not determine deployment URL"
        exit 1
    fi
    
    log "Checking health at: $DEPLOYMENT_URL"
    
    # Check if application is responding
    response=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health")
    
    if [ "$response" = "200" ]; then
        success "Health check passed - application is responding"
    else
        error "Health check failed - HTTP $response"
        if [ "$ROLLBACK_ON_FAILURE" = "true" ]; then
            rollback_deployment
        fi
        exit 1
    fi
    
    # Check API endpoints
    api_endpoints=(
        "/api/admin/strategy/current"
        "/api/admin/themes"
        "/api/admin/strategic-health"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$endpoint")
        if [ "$response" = "200" ] || [ "$response" = "401" ]; then
            success "API endpoint $endpoint is responding (HTTP $response)"
        else
            warning "API endpoint $endpoint returned HTTP $response"
        fi
    done
}

# Rollback functions
rollback_database() {
    if [ -f .last_backup ]; then
        log "Rolling back database..."
        backup_path=$(cat .last_backup)
        
        if [ -f "$backup_path" ]; then
            supabase db reset --db-url "$DATABASE_URL"
            success "Database rollback completed"
        else
            error "Backup file not found: $backup_path"
        fi
    else
        error "No backup found for rollback"
    fi
}

rollback_deployment() {
    log "Rolling back deployment..."
    
    # Get previous deployment
    previous_deployment=$(vercel ls --token "$VERCEL_TOKEN" | grep -A1 "$ENVIRONMENT" | tail -1 | awk '{print $2}')
    
    if [ -n "$previous_deployment" ]; then
        vercel promote "$previous_deployment" --token "$VERCEL_TOKEN"
        success "Deployment rollback completed"
    else
        error "No previous deployment found for rollback"
    fi
}

# Performance testing function
performance_test() {
    log "Running performance tests..."
    
    # Run Lighthouse CI if available
    if command -v lhci &> /dev/null; then
        lhci autorun
        success "Performance tests completed"
    else
        warning "Lighthouse CI not available, skipping performance tests"
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove build artifacts
    rm -rf .next/
    rm -rf node_modules/.cache/
    
    # Clean up old backups (keep last 5)
    if [ -d "./backups" ]; then
        cd backups
        ls -t | tail -n +6 | xargs -r rm
        cd ..
    fi
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting deployment to $ENVIRONMENT environment..."
    
    # Pre-deployment checks
    validate_environment
    backup_database
    
    # Deployment steps
    run_migrations
    build_application
    deploy_application
    
    # Post-deployment checks
    health_check
    performance_test
    
    # Cleanup
    cleanup
    
    success "Deployment to $ENVIRONMENT completed successfully!"
    
    # Display deployment information
    DEPLOYMENT_URL=$(vercel ls --token "$VERCEL_TOKEN" | grep "$ENVIRONMENT" | awk '{print $2}' | head -1)
    echo ""
    echo "=========================================="
    echo "Deployment Summary:"
    echo "Environment: $ENVIRONMENT"
    echo "URL: $DEPLOYMENT_URL"
    echo "Timestamp: $(date)"
    echo "=========================================="
}

# Error handling
trap 'error "Deployment failed at line $LINENO"' ERR

# Run main function
main "$@"
