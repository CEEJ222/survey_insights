import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const apiDocumentation = {
      title: "Survey Insights Admin API",
      version: "1.0.0",
      description: "Comprehensive API for managing strategy, themes, and customer insights",
      baseUrl: "/api/admin",
      
      authentication: {
        type: "Bearer Token",
        description: "All endpoints require a valid Bearer token in the Authorization header",
        example: "Authorization: Bearer <your-token>"
      },

      endpoints: {
        strategy: {
          "POST /strategy": {
            description: "Create a new strategy version",
            parameters: {
              body: {
                title: "string (required, min 5 chars)",
                description: "string (optional)",
                target_customer_description: "string (required, min 10 chars)",
                target_customer_segments: "string[] (optional)",
                problems_we_solve: "string[] (required, min 1 item)",
                problems_we_dont_solve: "string[] (optional)",
                how_we_win: "string (optional)",
                strategic_keywords: "StrategicKeyword[] (optional)",
                competitors: "Competitor[] (optional)",
                update_reason: "string (required, min 10 chars)",
                what_we_learned: "string (optional)"
              }
            },
            responses: {
              "201": "Strategy created successfully",
              "400": "Validation error",
              "401": "Unauthorized",
              "500": "Internal server error"
            }
          },
          "GET /strategy/current": {
            description: "Get the current active strategy",
            responses: {
              "200": "Current strategy returned",
              "404": "No active strategy found",
              "500": "Internal server error"
            }
          },
          "GET /strategy/history": {
            description: "Get strategy version history",
            responses: {
              "200": "Strategy history returned",
              "500": "Internal server error"
            }
          }
        },

        themes: {
          "GET /themes": {
            description: "Get themes with strategic scoring",
            parameters: {
              query: {
                company_id: "string (required)",
                sort: "string (optional: 'strategic_priority' | 'customer_signal' | 'strategic_alignment')",
                filter: "string (optional: 'all' | 'in_strategy' | 'off_strategy' | 'needs_review')"
              }
            },
            responses: {
              "200": "Themes returned with strategic scoring",
              "400": "Missing company_id",
              "500": "Internal server error"
            }
          },
          "POST /themes": {
            description: "Trigger theme discovery or strategic analysis",
            parameters: {
              body: {
                company_id: "string (required)",
                action: "string (required: 'discover_themes' | 'analyze_strategic')"
              }
            },
            responses: {
              "200": "Action completed successfully",
              "400": "Invalid action or missing company_id",
              "500": "Internal server error"
            }
          },
          "GET /themes/[id]": {
            description: "Get detailed theme information",
            parameters: {
              path: {
                id: "string (required) - Theme ID"
              }
            },
            responses: {
              "200": "Theme details returned",
              "404": "Theme not found",
              "500": "Internal server error"
            }
          },
          "PATCH /themes/[id]": {
            description: "Update theme (PM notes, recommendations, etc.)",
            parameters: {
              path: {
                id: "string (required) - Theme ID"
              },
              headers: {
                Authorization: "Bearer <token> (required)"
              },
              body: {
                pm_notes: "string (optional)",
                declined_reason: "string (optional)",
                recommendation: "string (optional)",
                strategic_alignment_score: "number (optional)",
                final_priority_score: "number (optional)"
              }
            },
            responses: {
              "200": "Theme updated successfully",
              "400": "No valid fields to update",
              "401": "Unauthorized",
              "404": "Theme not found",
              "500": "Internal server error"
            }
          },
          "POST /themes/[id]/review": {
            description: "PM review decision for theme",
            parameters: {
              path: {
                id: "string (required) - Theme ID"
              },
              headers: {
                Authorization: "Bearer <token> (required)"
              },
              body: {
                decision: "string (required: 'approve' | 'decline' | 'explore_lightweight' | 'needs_more_research')",
                notes: "string (optional)",
                declined_reason: "string (optional, required if decision is 'decline')"
              }
            },
            responses: {
              "200": "Review decision recorded successfully",
              "400": "Invalid decision or missing required fields",
              "401": "Unauthorized",
              "404": "Theme not found",
              "500": "Internal server error"
            }
          },
          "GET /themes/strategic-health": {
            description: "Get strategic health metrics for themes",
            parameters: {
              query: {
                company_id: "string (required)"
              }
            },
            responses: {
              "200": "Strategic health metrics returned",
              "400": "Missing company_id",
              "500": "Internal server error"
            }
          },
          "GET /themes/strategic-summary": {
            description: "Get comprehensive strategic summary and insights",
            parameters: {
              query: {
                company_id: "string (required)",
                timeframe: "string (optional, default: '30') - Days to analyze"
              }
            },
            responses: {
              "200": "Strategic summary returned",
              "400": "Missing company_id",
              "500": "Internal server error"
            }
          }
        },

        strategic_scoring: {
          "POST /strategic-scoring/calculate": {
            description: "Calculate strategic alignment scores for themes",
            parameters: {
              body: {
                company_id: "string (required)",
                theme_ids: "string[] (optional) - Specific themes to process",
                batch_id: "string (optional) - Custom batch identifier"
              }
            },
            responses: {
              "200": "Strategic scoring completed",
              "400": "Missing company_id or no active strategy",
              "500": "Internal server error"
            }
          },
          "GET /strategic-scoring/batch/[batch-id]": {
            description: "Get batch processing status",
            parameters: {
              path: {
                batch_id: "string (required) - Batch ID"
              }
            },
            responses: {
              "200": "Batch status returned",
              "400": "Missing batch_id",
              "500": "Internal server error"
            }
          },
          "POST /strategic-scoring/recalculate": {
            description: "Recalculate strategic alignment for all themes",
            parameters: {
              body: {
                company_id: "string (required)",
                force_recalculate: "boolean (optional, default: false)"
              }
            },
            responses: {
              "200": "Recalculation completed",
              "400": "Missing company_id or no active strategy",
              "500": "Internal server error"
            }
          }
        },

        objectives: {
          "GET /objectives": {
            description: "Get all objectives (OKRs) for the company",
            parameters: {
              query: {
                company_id: "string (required)",
                status: "string (optional)",
                quarter: "string (optional)"
              }
            },
            responses: {
              "200": "Objectives returned",
              "400": "Missing company_id",
              "500": "Internal server error"
            }
          },
          "POST /objectives": {
            description: "Create a new objective (OKR)",
            parameters: {
              headers: {
                Authorization: "Bearer <token> (required)"
              },
              body: {
                objective: "string (required)",
                quarter: "string (required)",
                key_results: "KeyResult[] (optional)",
                owner_id: "string (optional)",
                starts_at: "string (optional)",
                ends_at: "string (optional)"
              }
            },
            responses: {
              "201": "Objective created successfully",
              "400": "Validation error",
              "401": "Unauthorized",
              "500": "Internal server error"
            }
          },
          "PUT /objectives/[id]/progress": {
            description: "Update OKR progress",
            parameters: {
              path: {
                id: "string (required) - Objective ID"
              },
              headers: {
                Authorization: "Bearer <token> (required)"
              },
              body: {
                key_results: "KeyResultProgress[] (required)"
              }
            },
            responses: {
              "200": "Progress updated successfully",
              "400": "Validation error",
              "401": "Unauthorized",
              "404": "Objective not found",
              "500": "Internal server error"
            }
          }
        },

        vision: {
          "GET /vision/current": {
            description: "Get the current active vision",
            responses: {
              "200": "Current vision returned",
              "404": "No active vision found",
              "500": "Internal server error"
            }
          },
          "POST /vision": {
            description: "Create a new vision version",
            parameters: {
              headers: {
                Authorization: "Bearer <token> (required)"
              },
              body: {
                vision_statement: "string (required)",
                mission_statement: "string (optional)"
              }
            },
            responses: {
              "201": "Vision created successfully",
              "400": "Validation error",
              "401": "Unauthorized",
              "500": "Internal server error"
            }
          }
        }
      },

      data_types: {
        StrategicKeyword: {
          keyword: "string",
          weight: "number (-1.0 to +1.0)",
          reasoning: "string"
        },
        Competitor: {
          name: "string",
          their_strength: "string",
          our_differentiation: "string"
        },
        KeyResult: {
          metric: "string",
          baseline: "number",
          target: "number",
          current: "number (optional)",
          unit: "string"
        },
        KeyResultProgress: {
          metric: "string",
          current: "number",
          unit: "string",
          updated_at: "string (ISO date)"
        }
      },

      rate_limiting: {
        description: "API requests are rate-limited to prevent abuse",
        limits: {
          strategic_scoring: "10 requests per minute",
          theme_discovery: "5 requests per minute",
          general_api: "100 requests per minute"
        }
      },

      error_responses: {
        "400": "Bad Request - Invalid input or missing required parameters",
        "401": "Unauthorized - Invalid or missing authentication token",
        "403": "Forbidden - Insufficient permissions",
        "404": "Not Found - Resource not found",
        "429": "Too Many Requests - Rate limit exceeded",
        "500": "Internal Server Error - Server error occurred"
      },

      examples: {
        create_strategy: {
          url: "POST /api/admin/strategy",
          headers: {
            "Authorization": "Bearer your-token-here",
            "Content-Type": "application/json"
          },
          body: {
            title: "Q1 2024 Product Strategy",
            description: "Focus on customer retention and new feature adoption",
            target_customer_description: "Mid-market SaaS companies with 50-500 employees",
            problems_we_solve: ["Complex feedback analysis", "Strategic alignment"],
            update_reason: "Customer feedback indicates need for better strategic alignment"
          }
        },
        review_theme: {
          url: "POST /api/admin/themes/theme-id-123/review",
          headers: {
            "Authorization": "Bearer your-token-here",
            "Content-Type": "application/json"
          },
          body: {
            decision: "approve",
            notes: "High customer demand aligns with our strategic focus"
          }
        }
      }
    }

    return NextResponse.json(apiDocumentation)
  } catch (error) {
    console.error('Error generating API documentation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
