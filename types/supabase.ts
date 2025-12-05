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
      organizations: {
        Row: {
          id: string
          name: string
          subscription_tier: 'trial' | 'basic' | 'pro' | 'solo' | 'professional' | 'practice'
          subscription_status: 'active' | 'canceled' | 'cancelled' | 'past_due' | 'trialing'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          documents_used: number
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subscription_tier?: 'trial' | 'basic' | 'pro' | 'solo' | 'professional' | 'practice'
          subscription_status?: 'active' | 'canceled' | 'cancelled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          documents_used?: number
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subscription_tier?: 'trial' | 'basic' | 'pro' | 'solo' | 'professional' | 'practice'
          subscription_status?: 'active' | 'canceled' | 'cancelled' | 'past_due' | 'trialing'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          documents_used?: number
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string | null
          role: 'owner' | 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          email: string
          full_name?: string | null
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          full_name?: string | null
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_profiles_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_profiles_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
      document_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          state: string
          form_schema: Json
          prompt_template: string | null
          is_active: boolean
          estimated_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          description?: string | null
          category: string
          state: string
          form_schema?: Json | null
          prompt_template?: string | null
          is_active?: boolean
          estimated_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          state?: string
          form_schema?: Json | null
          prompt_template?: string | null
          is_active?: boolean
          estimated_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          id: string
          organization_id: string
          user_id: string | null
          template_id: string | null
          title: string
          form_data: Json
          file_url: string | null
          pdf_url: string | null
          file_size: number | null
          status: 'draft' | 'generating' | 'generated' | 'error' | 'downloaded'
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id?: string | null
          template_id?: string | null
          title: string
          form_data: Json
          file_url?: string | null
          pdf_url?: string | null
          file_size?: number | null
          status?: 'draft' | 'generating' | 'generated' | 'error' | 'downloaded'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string | null
          template_id?: string | null
          title?: string
          form_data?: Json
          file_url?: string | null
          pdf_url?: string | null
          file_size?: number | null
          status?: 'draft' | 'generating' | 'generated' | 'error' | 'downloaded'
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'generated_documents_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'generated_documents_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'generated_documents_template_id_fkey'
            columns: ['template_id']
            referencedRelation: 'document_templates'
            referencedColumns: ['id']
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          organization_id: string | null
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      usage_tracking: {
        Row: {
          id: string
          organization_id: string
          month: string
          documents_generated: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          month: string
          documents_generated?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          month?: string
          documents_generated?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'usage_tracking_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
      feedback: {
        Row: {
          id: string
          document_id: string
          user_id: string
          rating: number
          would_recommend: boolean
          suggestions: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          user_id: string
          rating: number
          would_recommend: boolean
          suggestions?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          user_id?: string
          rating?: number
          would_recommend?: boolean
          suggestions?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'feedback_document_id_fkey'
            columns: ['document_id']
            referencedRelation: 'generated_documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'feedback_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
