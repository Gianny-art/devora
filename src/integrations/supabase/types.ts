export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      collaboration_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      enterprise_alerts: {
        Row: {
          alert_type: string
          created_at: string
          enabled: boolean | null
          id: string
          threshold: number
          user_id: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          threshold?: number
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          threshold?: number
          user_id?: string
        }
        Relationships: []
      }
      enterprise_employees: {
        Row: {
          active: boolean | null
          created_at: string
          hired_at: string
          id: string
          name: string
          role: string
          salary: number
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          hired_at?: string
          id?: string
          name?: string
          role?: string
          salary?: number
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          hired_at?: string
          id?: string
          name?: string
          role?: string
          salary?: number
          user_id?: string
        }
        Relationships: []
      }
      enterprise_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          recurring: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          recurring?: boolean | null
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          recurring?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_profiles: {
        Row: {
          business_description: string | null
          company_name: string
          country: string
          created_at: string
          employee_count: number
          id: string
          logo_url: string | null
          phone: string | null
          plan: string
          plan_expires_at: string | null
          region: string
          sector: string
          selected_business_id: string | null
          site_id: string | null
          updated_at: string
          user_id: string
          visual_level: string | null
        }
        Insert: {
          business_description?: string | null
          company_name?: string
          country?: string
          created_at?: string
          employee_count?: number
          id?: string
          logo_url?: string | null
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          region?: string
          sector?: string
          selected_business_id?: string | null
          site_id?: string | null
          updated_at?: string
          user_id: string
          visual_level?: string | null
        }
        Update: {
          business_description?: string | null
          company_name?: string
          country?: string
          created_at?: string
          employee_count?: number
          id?: string
          logo_url?: string | null
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          region?: string
          sector?: string
          selected_business_id?: string | null
          site_id?: string | null
          updated_at?: string
          user_id?: string
          visual_level?: string | null
        }
        Relationships: []
      }
      enterprise_revenues: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          business_address: string | null
          business_category: string | null
          business_name: string
          business_phone: string | null
          business_rating: number | null
          business_website: string | null
          created_at: string
          has_website: boolean
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          opportunity_score: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_address?: string | null
          business_category?: string | null
          business_name: string
          business_phone?: string | null
          business_rating?: number | null
          business_website?: string | null
          created_at?: string
          has_website?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          opportunity_score?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_address?: string | null
          business_category?: string | null
          business_name?: string
          business_phone?: string | null
          business_rating?: number | null
          business_website?: string | null
          created_at?: string
          has_website?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          opportunity_score?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_xaf: number
          confirmed_at: string | null
          created_at: string
          external_reference: string
          id: string
          phone: string | null
          provider: string
          status: string
          tier: string
          user_id: string
        }
        Insert: {
          amount_xaf: number
          confirmed_at?: string | null
          created_at?: string
          external_reference: string
          id?: string
          phone?: string | null
          provider: string
          status?: string
          tier: string
          user_id: string
        }
        Update: {
          amount_xaf?: number
          confirmed_at?: string | null
          created_at?: string
          external_reference?: string
          id?: string
          phone?: string | null
          provider?: string
          status?: string
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          plan: string
          plan_expires_at: string | null
          scans_this_month: number
          updated_at: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          scans_this_month?: number
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          plan?: string
          plan_expires_at?: string | null
          scans_this_month?: number
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
      project_businesses: {
        Row: {
          added_at: string
          added_by: string
          id: string
          lead_id: string
          project_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          id?: string
          lead_id: string
          project_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          id?: string
          lead_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_businesses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_businesses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          joined_at: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          created_at: string
          id: string
          is_important: boolean
          message: string
          project_id: string
          read_by: string[]
          reply_to: string | null
          user_id: string
          voice_url: string | null
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_important?: boolean
          message: string
          project_id: string
          read_by?: string[]
          reply_to?: string | null
          user_id: string
          voice_url?: string | null
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_important?: boolean
          message?: string
          project_id?: string
          read_by?: string[]
          reply_to?: string | null
          user_id?: string
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "project_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription?: Json
          user_id?: string
        }
        Relationships: []
      }
      scan_businesses: {
        Row: {
          address: string
          category: string
          created_at: string
          has_website: boolean
          id: string
          lat: number
          lng: number
          name: string
          opportunity_score: number | null
          phone: string | null
          rating: number | null
          scan_id: string
          website: string | null
        }
        Insert: {
          address?: string
          category?: string
          created_at?: string
          has_website?: boolean
          id?: string
          lat?: number
          lng?: number
          name: string
          opportunity_score?: number | null
          phone?: string | null
          rating?: number | null
          scan_id: string
          website?: string | null
        }
        Update: {
          address?: string
          category?: string
          created_at?: string
          has_website?: boolean
          id?: string
          lat?: number
          lng?: number
          name?: string
          opportunity_score?: number | null
          phone?: string | null
          rating?: number | null
          scan_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_businesses_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          business_count: number
          created_at: string
          id: string
          lat: number
          lng: number
          radius: number
          user_id: string
        }
        Insert: {
          business_count?: number
          created_at?: string
          id?: string
          lat: number
          lng: number
          radius?: number
          user_id: string
        }
        Update: {
          business_count?: number
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          radius?: number
          user_id?: string
        }
        Relationships: []
      }
      scan_shares: {
        Row: {
          access: string
          created_at: string
          id: string
          owner_id: string
          scan_id: string
          token: string
        }
        Insert: {
          access?: string
          created_at?: string
          id?: string
          owner_id: string
          scan_id: string
          token?: string
        }
        Update: {
          access?: string
          created_at?: string
          id?: string
          owner_id?: string
          scan_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_shares_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
