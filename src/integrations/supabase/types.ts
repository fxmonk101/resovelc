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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_profiles: {
        Row: {
          account_number: string
          address: string | null
          business_balance: number
          business_name: string
          city: string | null
          created_at: string
          ein: string | null
          employees: number | null
          id: string
          industry: string
          is_verified: boolean
          monthly_revenue: number | null
          state: string | null
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          account_number?: string
          address?: string | null
          business_balance?: number
          business_name: string
          city?: string | null
          created_at?: string
          ein?: string | null
          employees?: number | null
          id?: string
          industry: string
          is_verified?: boolean
          monthly_revenue?: number | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          account_number?: string
          address?: string | null
          business_balance?: number
          business_name?: string
          city?: string | null
          created_at?: string
          ein?: string | null
          employees?: number | null
          id?: string
          industry?: string
          is_verified?: boolean
          monthly_revenue?: number | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      credit_card_applications: {
        Row: {
          admin_notes: string | null
          annual_income: number | null
          card_type: string
          created_at: string
          employment_status: string | null
          id: string
          reference: string
          requested_limit: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          annual_income?: number | null
          card_type: string
          created_at?: string
          employment_status?: string | null
          id?: string
          reference?: string
          requested_limit: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          annual_income?: number | null
          card_type?: string
          created_at?: string
          employment_status?: string | null
          id?: string
          reference?: string
          requested_limit?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          application_id: string | null
          available_credit: number
          card_number: string
          card_type: string
          created_at: string
          credit_limit: number
          current_balance: number
          cvv: string
          expiry: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          available_credit?: number
          card_number?: string
          card_type: string
          created_at?: string
          credit_limit?: number
          current_balance?: number
          cvv?: string
          expiry?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          available_credit?: number
          card_number?: string
          card_type?: string
          created_at?: string
          credit_limit?: number
          current_balance?: number
          cvv?: string
          expiry?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "credit_card_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_applications: {
        Row: {
          admin_notes: string | null
          amount_requested: number
          approved_amount: number | null
          created_at: string
          hardship_description: string | null
          household_income: number | null
          household_size: number | null
          id: string
          program: string
          purpose: string
          reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_requested: number
          approved_amount?: number | null
          created_at?: string
          hardship_description?: string | null
          household_income?: number | null
          household_size?: number | null
          id?: string
          program: string
          purpose: string
          reference?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_requested?: number
          approved_amount?: number | null
          created_at?: string
          hardship_description?: string | null
          household_income?: number | null
          household_size?: number | null
          id?: string
          program?: string
          purpose?: string
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loan_applications: {
        Row: {
          admin_notes: string | null
          amount: number
          annual_income: number | null
          approved_amount: number | null
          created_at: string
          employer: string | null
          employment_status: string | null
          id: string
          interest_rate: number | null
          loan_type: string
          purpose: string
          reference: string
          status: string
          term_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          annual_income?: number | null
          approved_amount?: number | null
          created_at?: string
          employer?: string | null
          employment_status?: string | null
          id?: string
          interest_rate?: number | null
          loan_type: string
          purpose: string
          reference?: string
          status?: string
          term_months: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          annual_income?: number | null
          approved_amount?: number | null
          created_at?: string
          employer?: string | null
          employment_status?: string | null
          id?: string
          interest_rate?: number | null
          loan_type?: string
          purpose?: string
          reference?: string
          status?: string
          term_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_number: string
          account_type: string
          balance: number
          country: string | null
          created_at: string
          currency: string
          first_name: string
          id: string
          is_verified: boolean
          last_name: string
          middle_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          account_number?: string
          account_type?: string
          balance?: number
          country?: string | null
          created_at?: string
          currency?: string
          first_name: string
          id?: string
          is_verified?: boolean
          last_name: string
          middle_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          account_number?: string
          account_type?: string
          balance?: number
          country?: string | null
          created_at?: string
          currency?: string
          first_name?: string
          id?: string
          is_verified?: boolean
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          reference: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          reference?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          reference?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_find_user_by_email: {
        Args: { _email: string }
        Returns: {
          email: string
          first_name: string
          last_name: string
          user_id: string
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          account_number: string
          balance: number
          card_count: number
          created_at: string
          email: string
          first_name: string
          grant_count: number
          is_admin: boolean
          is_verified: boolean
          last_name: string
          loan_count: number
          user_id: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_username_available: { Args: { _username: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
