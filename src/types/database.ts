// ============================================================================
// UNIFIED FEEDBACK PLATFORM - TYPESCRIPT TYPES
// ============================================================================
// Generated types matching schema_unified_platform.sql
// Keep in sync with database schema
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      
      admin_users: {
        Row: {
          id: string
          company_id: string
          email: string
          full_name: string | null
          role: 'company_admin' | 'admin' | 'user'
          is_active: boolean
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_id: string
          email: string
          full_name?: string | null
          role?: 'company_admin' | 'admin' | 'user'
          is_active?: boolean
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          email?: string
          full_name?: string | null
          role?: 'company_admin' | 'admin' | 'user'
          is_active?: boolean
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================================================
      // CUSTOMER TABLES
      // ============================================================================
      
      customers: {
        Row: {
          id: string
          company_id: string
          primary_email: string | null
          full_name: string | null
          company_name: string | null
          job_title: string | null
          industry: string | null
          company_size: string | null
          location: string | null
          subscription_tier: string | null
          account_status: string
          first_seen: string
          last_activity: string | null
          custom_fields: Json
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          primary_email?: string | null
          full_name?: string | null
          company_name?: string | null
          job_title?: string | null
          industry?: string | null
          company_size?: string | null
          location?: string | null
          subscription_tier?: string | null
          account_status?: string
          first_seen?: string
          last_activity?: string | null
          custom_fields?: Json
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          primary_email?: string | null
          full_name?: string | null
          company_name?: string | null
          job_title?: string | null
          industry?: string | null
          company_size?: string | null
          location?: string | null
          subscription_tier?: string | null
          account_status?: string
          first_seen?: string
          last_activity?: string | null
          custom_fields?: Json
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }

      customer_identifiers: {
        Row: {
          id: string
          customer_id: string
          identifier_type: string
          identifier_value: string
          confidence_score: number | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          identifier_type: string
          identifier_value: string
          confidence_score?: number | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          identifier_type?: string
          identifier_value?: string
          confidence_score?: number | null
          verified?: boolean
          created_at?: string
        }
      }

      customer_merges: {
        Row: {
          id: string
          primary_customer_id: string
          merged_customer_id: string
          merged_by: string | null
          merge_reason: string | null
          merged_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          primary_customer_id: string
          merged_customer_id: string
          merged_by?: string | null
          merge_reason?: string | null
          merged_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          primary_customer_id?: string
          merged_customer_id?: string
          merged_by?: string | null
          merge_reason?: string | null
          merged_data?: Json | null
          created_at?: string
        }
      }

      // ============================================================================
      // FEEDBACK ITEMS
      // ============================================================================

      feedback_items: {
        Row: {
          id: string
          customer_id: string | null
          company_id: string
          source_type: 'survey' | 'interview' | 'review' | 'reddit' | 'support_ticket'
          source_id: string
          source_table: string
          title: string | null
          content: string | null
          sentiment_score: number | null
          ai_summary: string | null
          ai_tags: string[]
          themes: string[]
          priority_score: number
          status: string
          assigned_to: string | null
          feedback_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          company_id: string
          source_type: 'survey' | 'interview' | 'review' | 'reddit' | 'support_ticket'
          source_id: string
          source_table: string
          title?: string | null
          content?: string | null
          sentiment_score?: number | null
          ai_summary?: string | null
          ai_tags?: string[]
          themes?: string[]
          priority_score?: number
          status?: string
          assigned_to?: string | null
          feedback_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          company_id?: string
          source_type?: 'survey' | 'interview' | 'review' | 'reddit' | 'support_ticket'
          source_id?: string
          source_table?: string
          title?: string | null
          content?: string | null
          sentiment_score?: number | null
          ai_summary?: string | null
          ai_tags?: string[]
          themes?: string[]
          priority_score?: number
          status?: string
          assigned_to?: string | null
          feedback_date?: string
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================================================
      // SURVEYS (Updated)
      // ============================================================================

      surveys: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          questions: Json
          status: string
          enable_ai_analysis: boolean
          ai_summary_cache_key: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          questions: Json
          status?: string
          enable_ai_analysis?: boolean
          ai_summary_cache_key?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string | null
          questions?: Json
          status?: string
          enable_ai_analysis?: boolean
          ai_summary_cache_key?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      survey_links: {
        Row: {
          id: string
          survey_id: string
          customer_id: string | null
          token: string
          respondent_email: string | null
          respondent_name: string | null
          respondent_metadata: Json | null
          status: string
          opened_at: string | null
          completed_at: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          survey_id: string
          customer_id?: string | null
          token: string
          respondent_email?: string | null
          respondent_name?: string | null
          respondent_metadata?: Json | null
          status?: string
          opened_at?: string | null
          completed_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          survey_id?: string
          customer_id?: string | null
          token?: string
          respondent_email?: string | null
          respondent_name?: string | null
          respondent_metadata?: Json | null
          status?: string
          opened_at?: string | null
          completed_at?: string | null
          expires_at?: string | null
          created_at?: string
        }
      }

      survey_responses: {
        Row: {
          id: string
          survey_link_id: string
          survey_id: string
          customer_id: string | null
          responses: Json
          metadata: Json | null
          sentiment_score: number | null
          ai_tags: string[]
          priority_score: number | null
          submitted_at: string
        }
        Insert: {
          id?: string
          survey_link_id: string
          survey_id: string
          customer_id?: string | null
          responses: Json
          metadata?: Json | null
          sentiment_score?: number | null
          ai_tags?: string[]
          priority_score?: number | null
          submitted_at?: string
        }
        Update: {
          id?: string
          survey_link_id?: string
          survey_id?: string
          customer_id?: string | null
          responses?: Json
          metadata?: Json | null
          sentiment_score?: number | null
          ai_tags?: string[]
          priority_score?: number | null
          submitted_at?: string
        }
      }

      survey_schedules: {
        Row: {
          id: string
          survey_id: string
          schedule_type: string
          schedule_config: Json
          status: string
          last_sent_at: string | null
          next_send_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          survey_id: string
          schedule_type: string
          schedule_config: Json
          status?: string
          last_sent_at?: string | null
          next_send_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          survey_id?: string
          schedule_type?: string
          schedule_config?: Json
          status?: string
          last_sent_at?: string | null
          next_send_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================================================
      // INTERVIEWS
      // ============================================================================

      interviews: {
        Row: {
          id: string
          company_id: string
          customer_id: string | null
          title: string
          description: string | null
          interview_date: string | null
          duration_minutes: number | null
          interviewer_id: string | null
          participant_name: string | null
          participant_email: string | null
          notes: string | null
          recording_url: string | null
          transcript: string | null
          ai_summary: string | null
          key_quotes: Json | null
          themes: string[]
          sentiment_score: number | null
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_id?: string | null
          title: string
          description?: string | null
          interview_date?: string | null
          duration_minutes?: number | null
          interviewer_id?: string | null
          participant_name?: string | null
          participant_email?: string | null
          notes?: string | null
          recording_url?: string | null
          transcript?: string | null
          ai_summary?: string | null
          key_quotes?: Json | null
          themes?: string[]
          sentiment_score?: number | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string | null
          title?: string
          description?: string | null
          interview_date?: string | null
          duration_minutes?: number | null
          interviewer_id?: string | null
          participant_name?: string | null
          participant_email?: string | null
          notes?: string | null
          recording_url?: string | null
          transcript?: string | null
          ai_summary?: string | null
          key_quotes?: Json | null
          themes?: string[]
          sentiment_score?: number | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================================================
      // REVIEWS
      // ============================================================================

      reviews: {
        Row: {
          id: string
          company_id: string
          customer_id: string | null
          platform: string
          platform_review_id: string | null
          review_url: string | null
          title: string | null
          content: string
          rating: number | null
          author_name: string | null
          sentiment_score: number | null
          ai_summary: string | null
          themes: string[]
          ai_tags: string[]
          priority_score: number | null
          company_response: string | null
          responded_at: string | null
          responded_by: string | null
          review_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_id?: string | null
          platform: string
          platform_review_id?: string | null
          review_url?: string | null
          title?: string | null
          content: string
          rating?: number | null
          author_name?: string | null
          sentiment_score?: number | null
          ai_summary?: string | null
          themes?: string[]
          ai_tags?: string[]
          priority_score?: number | null
          company_response?: string | null
          responded_at?: string | null
          responded_by?: string | null
          review_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string | null
          platform?: string
          platform_review_id?: string | null
          review_url?: string | null
          title?: string | null
          content?: string
          rating?: number | null
          author_name?: string | null
          sentiment_score?: number | null
          ai_summary?: string | null
          themes?: string[]
          ai_tags?: string[]
          priority_score?: number | null
          company_response?: string | null
          responded_at?: string | null
          responded_by?: string | null
          review_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================================================
      // REDDIT
      // ============================================================================

      reddit_mentions: {
        Row: {
          id: string
          company_id: string
          customer_id: string | null
          reddit_post_id: string | null
          reddit_comment_id: string | null
          subreddit: string | null
          author: string | null
          post_title: string | null
          content: string
          url: string | null
          upvotes: number
          relevance_score: number | null
          sentiment_score: number | null
          ai_summary: string | null
          themes: string[]
          mentioned_features: string[]
          mentioned_competitors: string[]
          post_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_id?: string | null
          reddit_post_id?: string | null
          reddit_comment_id?: string | null
          subreddit?: string | null
          author?: string | null
          post_title?: string | null
          content: string
          url?: string | null
          upvotes?: number
          relevance_score?: number | null
          sentiment_score?: number | null
          ai_summary?: string | null
          themes?: string[]
          mentioned_features?: string[]
          mentioned_competitors?: string[]
          post_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string | null
          reddit_post_id?: string | null
          reddit_comment_id?: string | null
          subreddit?: string | null
          author?: string | null
          post_title?: string | null
          content?: string
          url?: string | null
          upvotes?: number
          relevance_score?: number | null
          sentiment_score?: number | null
          ai_summary?: string | null
          themes?: string[]
          mentioned_features?: string[]
          mentioned_competitors?: string[]
          post_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ============================================================================
      // AI INFRASTRUCTURE
      // ============================================================================

      ai_insights: {
        Row: {
          id: string
          company_id: string
          insight_type: string
          title: string
          description: string | null
          supporting_feedback_ids: string[]
          confidence_score: number | null
          impact_score: number | null
          insight_data: Json | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          insight_type: string
          title: string
          description?: string | null
          supporting_feedback_ids?: string[]
          confidence_score?: number | null
          impact_score?: number | null
          insight_data?: Json | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          insight_type?: string
          title?: string
          description?: string | null
          supporting_feedback_ids?: string[]
          confidence_score?: number | null
          impact_score?: number | null
          insight_data?: Json | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          expires_at?: string | null
        }
      }

      ai_cost_logs: {
        Row: {
          id: string
          company_id: string
          provider: string
          model: string
          request_type: string | null
          prompt_tokens: number | null
          completion_tokens: number | null
          total_tokens: number | null
          estimated_cost: number | null
          cache_hit: boolean
          cache_key: string | null
          related_table: string | null
          related_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          provider: string
          model: string
          request_type?: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          total_tokens?: number | null
          estimated_cost?: number | null
          cache_hit?: boolean
          cache_key?: string | null
          related_table?: string | null
          related_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          provider?: string
          model?: string
          request_type?: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          total_tokens?: number | null
          estimated_cost?: number | null
          cache_hit?: boolean
          cache_key?: string | null
          related_table?: string | null
          related_id?: string | null
          created_at?: string
        }
      }

      customer_health_scores: {
        Row: {
          id: string
          customer_id: string
          company_id: string
          health_score: number
          churn_risk_score: number
          sentiment_trend: string | null
          feedback_frequency: string | null
          recent_negative_feedback_count: number
          days_since_last_activity: number | null
          risk_factors: Json | null
          recommendations: Json | null
          calculated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          company_id: string
          health_score: number
          churn_risk_score: number
          sentiment_trend?: string | null
          feedback_frequency?: string | null
          recent_negative_feedback_count?: number
          days_since_last_activity?: number | null
          risk_factors?: Json | null
          recommendations?: Json | null
          calculated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          company_id?: string
          health_score?: number
          churn_risk_score?: number
          sentiment_trend?: string | null
          feedback_frequency?: string | null
          recent_negative_feedback_count?: number
          days_since_last_activity?: number | null
          risk_factors?: Json | null
          recommendations?: Json | null
          calculated_at?: string
          expires_at?: string | null
        }
      }

      // ============================================================================
      // PRIVACY & COMPLIANCE
      // ============================================================================

      privacy_requests: {
        Row: {
          id: string
          company_id: string
          customer_id: string | null
          request_type: 'data_export' | 'data_deletion' | 'opt_out_sharing' | 'correction'
          requestor_email: string
          status: string
          processed_by: string | null
          processed_at: string | null
          completion_date: string | null
          export_file_url: string | null
          deletion_confirmation_sent: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          customer_id?: string | null
          request_type: 'data_export' | 'data_deletion' | 'opt_out_sharing' | 'correction'
          requestor_email: string
          status?: string
          processed_by?: string | null
          processed_at?: string | null
          completion_date?: string | null
          export_file_url?: string | null
          deletion_confirmation_sent?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          customer_id?: string | null
          request_type?: 'data_export' | 'data_deletion' | 'opt_out_sharing' | 'correction'
          requestor_email?: string
          status?: string
          processed_by?: string | null
          processed_at?: string | null
          completion_date?: string | null
          export_file_url?: string | null
          deletion_confirmation_sent?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      pii_detection_logs: {
        Row: {
          id: string
          company_id: string
          source_table: string
          source_id: string
          detected_pii_types: string[]
          content_snippet: string | null
          action_taken: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          source_table: string
          source_id: string
          detected_pii_types?: string[]
          content_snippet?: string | null
          action_taken?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          source_table?: string
          source_id?: string
          detected_pii_types?: string[]
          content_snippet?: string | null
          action_taken?: string | null
          created_at?: string
        }
      }
    }
    
    Views: {
      customer_feedback_summary: {
        Row: {
          customer_id: string
          full_name: string | null
          primary_email: string | null
          company_id: string
          total_feedback_count: number
          avg_sentiment: number | null
          last_feedback_date: string | null
          high_priority_count: number
        }
      }
    }
  }
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface SurveyQuestion {
  id: string
  text: string
  type: 'open_ended' | 'multiple_choice' | 'rating' | 'matrix'
  order: number
  options?: string[] // For multiple choice
  required?: boolean
}

export interface SurveyResponses {
  [questionId: string]: string | number | string[]
}

export interface AIInsightData {
  theme?: string
  pattern?: string
  recommendation?: string
  affectedCustomers?: string[]
  estimatedImpact?: string
  [key: string]: any
}

export interface CustomerRiskFactor {
  factor: string
  weight: number
  description: string
}

export interface CustomerRecommendation {
  action: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  expected_impact: string
}

export interface InterviewKeyQuote {
  quote: string
  timestamp?: string
  theme?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Common use cases
export type Customer = Tables<'customers'>
export type FeedbackItem = Tables<'feedback_items'>
export type Survey = Tables<'surveys'>
export type SurveyResponse = Tables<'survey_responses'>
export type Interview = Tables<'interviews'>
export type Review = Tables<'reviews'>
export type AIInsight = Tables<'ai_insights'>
export type CustomerHealthScore = Tables<'customer_health_scores'>

