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
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
      }
      industries: {
        Row: {
          id: string
          name: string
          default_services: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          default_services?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          default_services?: Json
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          domain: string
          industry: string
          industry_id: string | null
          city: string
          status: 'planning' | 'in_progress' | 'review' | 'launched'
          assigned_to: string | null
          domain_registered_date: string | null
          launch_date: string | null
          phone_number: string | null
          email: string | null
          service_pages_count: number
          area_pages_count: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          industry: string
          industry_id?: string | null
          city: string
          status?: 'planning' | 'in_progress' | 'review' | 'launched'
          assigned_to?: string | null
          domain_registered_date?: string | null
          launch_date?: string | null
          phone_number?: string | null
          email?: string | null
          service_pages_count?: number
          area_pages_count?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          industry?: string
          industry_id?: string | null
          city?: string
          status?: 'planning' | 'in_progress' | 'review' | 'launched'
          assigned_to?: string | null
          domain_registered_date?: string | null
          launch_date?: string | null
          phone_number?: string | null
          email?: string | null
          service_pages_count?: number
          area_pages_count?: number
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      checklist_items: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          category: string
          is_completed: boolean
          assigned_to: string | null
          completed_by: string | null
          order_index: number
          completed_at: string | null
          due_date: string | null
          priority: 'high' | 'medium' | 'low' | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          category: string
          is_completed?: boolean
          assigned_to?: string | null
          completed_by?: string | null
          order_index: number
          completed_at?: string | null
          due_date?: string | null
          priority?: 'high' | 'medium' | 'low' | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          category?: string
          is_completed?: boolean
          assigned_to?: string | null
          completed_by?: string | null
          order_index?: number
          completed_at?: string | null
          due_date?: string | null
          priority?: 'high' | 'medium' | 'low' | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      checklist_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          order_index: number
          industry_id: string | null
          color: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          order_index: number
          industry_id?: string | null
          color?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          order_index?: number
          industry_id?: string | null
          color?: string | null
          is_active?: boolean
        }
      }
      checklist_categories: {
        Row: {
          id: string
          name: string
          color: string
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      checklist_item_comments: {
        Row: {
          id: string
          checklist_item_id: string
          user_id: string
          comment_text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          checklist_item_id: string
          user_id: string
          comment_text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          checklist_item_id?: string
          user_id?: string
          comment_text?: string
          created_at?: string
          updated_at?: string
        }
      }
      service_pages: {
        Row: {
          id: string
          project_id: string
          service_name: string
          slug: string
          is_completed: boolean
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          service_name: string
          slug: string
          is_completed?: boolean
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          service_name?: string
          slug?: string
          is_completed?: boolean
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      area_pages: {
        Row: {
          id: string
          project_id: string
          area_name: string
          slug: string
          is_completed: boolean
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          area_name: string
          slug: string
          is_completed?: boolean
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          area_name?: string
          slug?: string
          is_completed?: boolean
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          project_id: string
          user_id: string
          action: string
          entity_type: 'project' | 'task' | 'service_page' | 'area_page'
          entity_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          action: string
          entity_type: 'project' | 'task' | 'service_page' | 'area_page'
          entity_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          action?: string
          entity_type?: 'project' | 'task' | 'service_page' | 'area_page'
          entity_id?: string | null
          created_at?: string
        }
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
