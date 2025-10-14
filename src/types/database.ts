export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_id: string
          email: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          email?: string
          full_name?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      surveys: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          questions: Json
          status: string
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
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      survey_links: {
        Row: {
          id: string
          survey_id: string
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
          responses: Json
          metadata: Json | null
          submitted_at: string
        }
        Insert: {
          id?: string
          survey_link_id: string
          survey_id: string
          responses: Json
          metadata?: Json | null
          submitted_at?: string
        }
        Update: {
          id?: string
          survey_link_id?: string
          survey_id?: string
          responses?: Json
          metadata?: Json | null
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
    }
  }
}

export interface SurveyQuestion {
  id: string
  text: string
  order: number
}

export interface SurveyResponses {
  [questionId: string]: string
}

