// Generado desde el proyecto de Supabase «Arca» (ref girbdumarikmcctawmql).
// No se edita a mano: se vuelve a generar cuando cambie el esquema.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          code: string
          is_active: boolean
          kind: Database["public"]["Enums"]["transaction_kind"]
          label: string
          sort_order: number
        }
        Insert: {
          code: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["transaction_kind"]
          label: string
          sort_order: number
        }
        Update: {
          code?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["transaction_kind"]
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      household_members: {
        Row: {
          created_at: string
          display_name: string
          household_id: string
          id: string
          idempotency_key: string
          joined_at: string
          left_at: string | null
          role: Database["public"]["Enums"]["household_role"]
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          display_name: string
          household_id: string
          id?: string
          idempotency_key: string
          joined_at?: string
          left_at?: string | null
          role: Database["public"]["Enums"]["household_role"]
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          display_name?: string
          household_id?: string
          id?: string
          idempotency_key?: string
          joined_at?: string
          left_at?: string | null
          role?: Database["public"]["Enums"]["household_role"]
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_fk"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          country: string
          created_at: string
          created_by: string
          currency: string
          id: string
          idempotency_key: string
          name: string
          time_zone: string
          updated_at: string
          version: number
        }
        Insert: {
          country?: string
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          idempotency_key: string
          name: string
          time_zone?: string
          updated_at?: string
          version?: number
        }
        Update: {
          country?: string
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          idempotency_key?: string
          name?: string
          time_zone?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      transaction_void_events: {
        Row: {
          action: Database["public"]["Enums"]["transaction_void_action"]
          created_at: string
          household_id: string
          id: string
          member_id: string
          reason: string | null
          transaction_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["transaction_void_action"]
          created_at?: string
          household_id: string
          id?: string
          member_id: string
          reason?: string | null
          transaction_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["transaction_void_action"]
          created_at?: string
          household_id?: string
          id?: string
          member_id?: string
          reason?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_void_events_household_fk"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_void_events_member_fk"
            columns: ["member_id", "household_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "transaction_void_events_transaction_fk"
            columns: ["transaction_id", "household_id"]
            isOneToOne: false
            referencedRelation: "household_transactions"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "transaction_void_events_transaction_fk"
            columns: ["transaction_id", "household_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id", "household_id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category_code: string
          created_at: string
          created_by_member_id: string
          household_id: string
          id: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          note: string | null
          occurred_on: string
          updated_at: string
          version: number
          void_reason: string | null
          voided_at: string | null
          voided_by_member_id: string | null
        }
        Insert: {
          amount: number
          category_code: string
          created_at?: string
          created_by_member_id: string
          household_id: string
          id?: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          note?: string | null
          occurred_on: string
          updated_at?: string
          version?: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by_member_id?: string | null
        }
        Update: {
          amount?: number
          category_code?: string
          created_at?: string
          created_by_member_id?: string
          household_id?: string
          id?: string
          idempotency_key?: string
          kind?: Database["public"]["Enums"]["transaction_kind"]
          note?: string | null
          occurred_on?: string
          updated_at?: string
          version?: number
          void_reason?: string | null
          voided_at?: string | null
          voided_by_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_author_fk"
            columns: ["created_by_member_id", "household_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "transactions_category_fk"
            columns: ["category_code", "kind"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["code", "kind"]
          },
          {
            foreignKeyName: "transactions_household_fk"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_voided_by_fk"
            columns: ["voided_by_member_id", "household_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id", "household_id"]
          },
        ]
      }
    }
    Views: {
      household_monthly_totals: {
        Row: {
          expense_count: number | null
          expense_total: number | null
          household_id: string | null
          income_count: number | null
          income_total: number | null
          month: string | null
          net_total: number | null
          transaction_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_household_fk"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_transactions: {
        Row: {
          amount: number | null
          author_display_name: string | null
          category_code: string | null
          category_label: string | null
          created_at: string | null
          created_by_member_id: string | null
          household_id: string | null
          id: string | null
          is_voided: boolean | null
          kind: Database["public"]["Enums"]["transaction_kind"] | null
          month: string | null
          note: string | null
          occurred_on: string | null
          signed_amount: number | null
          updated_at: string | null
          version: number | null
          void_reason: string | null
          voided_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_author_fk"
            columns: ["created_by_member_id", "household_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id", "household_id"]
          },
          {
            foreignKeyName: "transactions_category_fk"
            columns: ["category_code", "kind"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["code", "kind"]
          },
          {
            foreignKeyName: "transactions_household_fk"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_household: {
        Args: {
          p_display_name: string
          p_idempotency_key: string
          p_name: string
        }
        Returns: {
          country: string
          created_at: string
          created_by: string
          currency: string
          id: string
          idempotency_key: string
          name: string
          time_zone: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "households"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_transaction: {
        Args: {
          p_amount: number
          p_category_code: string
          p_household_id: string
          p_idempotency_key: string
          p_kind: Database["public"]["Enums"]["transaction_kind"]
          p_note?: string
          p_occurred_on: string
        }
        Returns: {
          amount: number
          category_code: string
          created_at: string
          created_by_member_id: string
          household_id: string
          id: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          note: string | null
          occurred_on: string
          updated_at: string
          version: number
          void_reason: string | null
          voided_at: string | null
          voided_by_member_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_month: { Args: never; Returns: string }
      restore_transaction: {
        Args: {
          p_expected_version: number
          p_household_id: string
          p_reason?: string
          p_transaction_id: string
        }
        Returns: {
          amount: number
          category_code: string
          created_at: string
          created_by_member_id: string
          household_id: string
          id: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          note: string | null
          occurred_on: string
          updated_at: string
          version: number
          void_reason: string | null
          voided_at: string | null
          voided_by_member_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      void_transaction: {
        Args: {
          p_expected_version: number
          p_household_id: string
          p_reason?: string
          p_transaction_id: string
        }
        Returns: {
          amount: number
          category_code: string
          created_at: string
          created_by_member_id: string
          household_id: string
          id: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          note: string | null
          occurred_on: string
          updated_at: string
          version: number
          void_reason: string | null
          voided_at: string | null
          voided_by_member_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      household_role: "adult" | "helper" | "learner"
      transaction_kind: "income" | "expense"
      transaction_void_action: "void" | "restore"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      household_role: ["adult", "helper", "learner"],
      transaction_kind: ["income", "expense"],
      transaction_void_action: ["void", "restore"],
    },
  },
} as const
