# API Documentation - Unified Feedback Platform

## Overview

The Unified Feedback Platform provides a comprehensive REST API for managing customer feedback, strategic themes, and AI-powered insights. This documentation covers all available endpoints, request/response formats, and authentication requirements.

## Base URL

```
Production: https://your-domain.com/api/admin
Development: http://localhost:3000/api/admin
```

## Authentication

All API endpoints require authentication using Bearer tokens:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting an Authentication Token

1. Login via the admin interface
2. Extract the JWT token from the session
3. Include the token in the Authorization header for all API requests

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

API requests are rate limited to:
- 1000 requests per hour per authenticated user
- 100 requests per minute for AI-powered endpoints

## Core Endpoints

### Themes Management

#### List Themes
```http
GET /api/admin/themes?company_id={company_id}&sort={sort}&filter={filter}
```

**Parameters:**
- `company_id` (required): Company identifier
- `sort` (optional): Sort by field (`strategic_priority`, `customer_signal`, `strategic_alignment`, `created_at`)
- `filter` (optional): Filter themes (`all`, `in_strategy`, `off_strategy`, `needs_review`)

**Response:**
```json
{
  "themes": [
    {
      "id": "theme-uuid",
      "name": "Theme Name",
      "description": "Theme description",
      "customerCount": 10,
      "mentionCount": 15,
      "sentiment": 0.8,
      "priority": 85,
      "finalPriority": 76,
      "strategicAlignment": 90,
      "strategicReasoning": "Strategic reasoning text",
      "strategicConflicts": ["Conflict 1", "Conflict 2"],
      "strategicOpportunities": ["Opportunity 1", "Opportunity 2"],
      "recommendation": "high_priority",
      "pmNotes": "PM notes",
      "declinedReason": null,
      "tags": ["tag1", "tag2"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Single Theme
```http
GET /api/admin/themes/{theme_id}
```

**Response:**
```json
{
  "theme": {
    "id": "theme-uuid",
    "name": "Theme Name",
    "description": "Theme description",
    // ... complete theme object
  }
}
```

#### Update Theme
```http
PATCH /api/admin/themes/{theme_id}
```

**Request Body:**
```json
{
  "title": "Updated Theme Name",
  "description": "Updated description",
  "pm_notes": "Updated PM notes"
}
```

#### Delete Theme
```http
DELETE /api/admin/themes/{theme_id}
```

#### Theme Review
```http
POST /api/admin/themes/{theme_id}/review
```

**Request Body:**
```json
{
  "decision": "approve|explore_lightweight|needs_more_research|decline",
  "notes": "Review notes",
  "declined_reason": "Reason for decline (required if decision is decline)"
}
```

### Strategic Scoring

#### Calculate Strategic Alignment
```http
POST /api/admin/strategic-scoring/calculate
```

**Request Body:**
```json
{
  "company_id": "company-uuid",
  "theme_id": "theme-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "theme_id": "theme-uuid",
  "alignment_score": 85,
  "recommendation": "high_priority",
  "message": "Strategic alignment calculated successfully"
}
```

#### Recalculate All Themes
```http
POST /api/admin/strategic-scoring/recalculate
```

**Request Body:**
```json
{
  "company_id": "company-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "themes_recalculated": 25,
  "message": "Recalculated strategic alignment for 25 themes"
}
```

### Strategic Intelligence

#### Get Strategic Insights
```http
GET /api/admin/strategic-intelligence/insights?company_id={company_id}&type={type}
```

**Parameters:**
- `company_id` (required): Company identifier
- `type` (optional): Insight type (`opportunity`, `conflict`, `gap`, `recommendation`)

**Response:**
```json
{
  "insights": [
    {
      "type": "opportunity",
      "title": "Market Opportunity",
      "description": "Description of the opportunity",
      "confidence_score": 85,
      "impact_score": 90,
      "related_themes": ["theme-1", "theme-2"],
      "related_strategy_elements": ["problems_we_solve"],
      "ai_reasoning": "AI reasoning for this insight"
    }
  ]
}
```

#### Competitive Analysis
```http
GET /api/admin/strategic-intelligence/competitive-analysis?company_id={company_id}
```

**Response:**
```json
{
  "analysis": [
    {
      "competitor_name": "Competitor A",
      "our_differentiation": "Our unique value proposition",
      "their_strength": "Their competitive advantage",
      "ai_analysis": "AI-generated competitive analysis",
      "strategic_implications": [
        "Implication 1",
        "Implication 2"
      ]
    }
  ]
}
```

#### Weekly Strategic Report
```http
GET /api/admin/strategic-intelligence/weekly-report?company_id={company_id}
```

**Response:**
```json
{
  "report": {
    "overall_health_summary": "Overall strategic health summary",
    "key_insights": [
      {
        "type": "recommendation",
        "title": "Key Recommendation",
        "description": "Recommendation description",
        "confidence_score": 90,
        "impact_score": 85,
        "ai_reasoning": "Reasoning for recommendation"
      }
    ],
    "top_aligned_themes": [
      {
        "theme_id": "theme-uuid",
        "name": "Theme Name",
        "strategic_alignment_score": 95
      }
    ],
    "top_conflicted_themes": [
      {
        "theme_id": "theme-uuid",
        "name": "Theme Name",
        "strategic_alignment_score": 30,
        "customer_signal": 85
      }
    ],
    "strategic_recommendations": [
      "Recommendation 1",
      "Recommendation 2"
    ],
    "action_items": [
      "Action item 1",
      "Action item 2"
    ]
  }
}
```

### Strategy Management

#### Create Strategy
```http
POST /api/admin/strategy
```

**Request Body:**
```json
{
  "company_id": "company-uuid",
  "title": "Product Strategy Title",
  "description": "Strategy description",
  "target_customer_description": "Target customer description",
  "problems_we_solve": ["Problem 1", "Problem 2"],
  "problems_we_dont_solve": ["Problem 3"],
  "how_we_win": "How we win in the market",
  "strategic_keywords": [
    {
      "keyword": "innovation",
      "weight": 0.8
    }
  ],
  "competitors": [
    {
      "name": "Competitor Name",
      "their_strength": "Their strength",
      "our_differentiation": "Our differentiation"
    }
  ]
}
```

#### Get Current Strategy
```http
GET /api/admin/strategy?company_id={company_id}
```

### Strategic Health

#### Get Strategic Health Metrics
```http
GET /api/admin/themes/strategic-health?company_id={company_id}
```

**Response:**
```json
{
  "total": 50,
  "aligned": 35,
  "conflicted": 10,
  "needsReview": 5,
  "strategyHealthScore": 75
}
```

#### Strategic Summary
```http
GET /api/admin/themes/strategic-summary?company_id={company_id}&timeframe={days}
```

**Response:**
```json
{
  "summary": {
    "period": "7 days",
    "totalThemes": 25,
    "alignedThemes": 18,
    "conflictedThemes": 4,
    "needsReviewThemes": 3
  },
  "metrics": {
    "averageAlignment": 78,
    "averagePriority": 72,
    "trendDirection": "improving"
  },
  "insights": [
    {
      "type": "trend",
      "title": "Alignment Trend",
      "description": "Strategic alignment has improved 15% this week"
    }
  ],
  "trends": [
    {
      "metric": "strategic_alignment",
      "trend": "up",
      "change": 15,
      "period": "7 days"
    }
  ],
  "recommendations": [
    "Focus on themes with high customer signal but low strategic alignment",
    "Review conflicted themes for potential strategy updates"
  ]
}
```

### AI Model Performance

#### Get AI Performance Dashboard
```http
GET /api/admin/ai-model-performance/dashboard?company_id={company_id}
```

**Response:**
```json
{
  "dashboardData": {
    "latestPerformanceMetrics": [
      {
        "metric_name": "accuracy",
        "value": 0.92,
        "timestamp": "2024-01-01T00:00:00Z",
        "model_version": "gpt-4o",
        "context": "strategic_alignment"
      }
    ],
    "latestBenchmarkResults": [
      {
        "model_version": "gpt-4o",
        "test_dataset_id": "test-dataset-1",
        "accuracy": 0.92,
        "precision": 0.89,
        "recall": 0.91,
        "f1_score": 0.90,
        "latency_ms": 1250,
        "cost_per_inference": 0.0025,
        "timestamp": "2024-01-01T00:00:00Z"
      }
    ],
    "costSummary": {
      "totalCostLast30Days": "12.50",
      "totalTokensLast30Days": 5000000,
      "cacheHitRate": "75.5"
    }
  }
}
```

### API Documentation

#### Get OpenAPI Specification
```http
GET /api/admin/docs
```

**Response:**
Returns the complete OpenAPI 3.0 specification for the API.

## Error Handling

### Common Error Codes

- `INVALID_COMPANY_ID` - Company ID is missing or invalid
- `THEME_NOT_FOUND` - Theme with specified ID not found
- `STRATEGY_NOT_FOUND` - No active strategy found for company
- `AI_SERVICE_ERROR` - AI service is unavailable
- `VALIDATION_ERROR` - Request data validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions

### Error Response Example
```json
{
  "error": "Theme not found",
  "code": "THEME_NOT_FOUND",
  "details": {
    "theme_id": "non-existent-id",
    "company_id": "company-uuid"
  }
}
```

## Pagination

For endpoints that return lists, pagination is supported:

```http
GET /api/admin/themes?company_id={company_id}&page=1&limit=20
```

**Response:**
```json
{
  "themes": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering and Sorting

### Theme Filtering
- `filter=all` - All themes
- `filter=in_strategy` - Themes aligned with strategy
- `filter=off_strategy` - Themes not aligned with strategy
- `filter=needs_review` - Themes requiring PM review

### Theme Sorting
- `sort=strategic_priority` - Sort by strategic priority (default)
- `sort=customer_signal` - Sort by customer signal strength
- `sort=strategic_alignment` - Sort by strategic alignment score
- `sort=created_at` - Sort by creation date

## Webhooks

The API supports webhooks for real-time notifications:

### Webhook Events
- `theme.created` - New theme discovered
- `theme.updated` - Theme updated
- `theme.reviewed` - Theme review completed
- `strategy.updated` - Strategy updated
- `ai.analysis.completed` - AI analysis completed

### Webhook Payload Example
```json
{
  "event": "theme.reviewed",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "theme_id": "theme-uuid",
    "decision": "approve",
    "reviewed_by": "user-uuid"
  }
}
```

## SDK and Client Libraries

### JavaScript/TypeScript
```javascript
import { UnifiedFeedbackAPI } from '@unified-feedback/api-client'

const client = new UnifiedFeedbackAPI({
  baseURL: 'https://api.your-domain.com',
  apiKey: 'your-api-key'
})

const themes = await client.themes.list({
  companyId: 'company-uuid',
  filter: 'in_strategy'
})
```

### Python
```python
from unified_feedback import UnifiedFeedbackClient

client = UnifiedFeedbackClient(
    base_url='https://api.your-domain.com',
    api_key='your-api-key'
)

themes = client.themes.list(
    company_id='company-uuid',
    filter='in_strategy'
)
```

## Rate Limiting and Best Practices

### Rate Limits
- 1000 requests per hour per authenticated user
- 100 requests per minute for AI-powered endpoints
- Burst allowance of 10 requests per second

### Best Practices
1. **Use pagination** for large datasets
2. **Cache responses** when appropriate
3. **Handle errors gracefully** with proper retry logic
4. **Use webhooks** for real-time updates instead of polling
5. **Monitor rate limits** and implement backoff strategies

## Support and Resources

### Documentation
- [API Reference](https://docs.your-domain.com/api)
- [Integration Guide](https://docs.your-domain.com/integration)
- [Webhook Guide](https://docs.your-domain.com/webhooks)

### Support
- Email: api-support@your-domain.com
- Documentation: https://docs.your-domain.com
- Status Page: https://status.your-domain.com

### Changelog
- [API Changelog](https://docs.your-domain.com/changelog)
- [Version History](https://docs.your-domain.com/versions)
