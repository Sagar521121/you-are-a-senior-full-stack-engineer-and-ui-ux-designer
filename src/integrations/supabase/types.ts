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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      event_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          prom_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          prom_date: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          prom_date?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          status: Database["public"]["Enums"]["invite_status"] | null
          to_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          status?: Database["public"]["Enums"]["invite_status"] | null
          to_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          status?: Database["public"]["Enums"]["invite_status"] | null
          to_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          daily_invites_used: number | null
          first_name: string
          fun_prompt: string | null
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          is_premium: boolean | null
          last_invite_reset_date: string | null
          stream: string
          university: string
          updated_at: string
          user_id: string
          year: Database["public"]["Enums"]["year_type"]
        }
        Insert: {
          created_at?: string
          daily_invites_used?: number | null
          first_name: string
          fun_prompt?: string | null
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          is_premium?: boolean | null
          last_invite_reset_date?: string | null
          stream: string
          university: string
          updated_at?: string
          user_id: string
          year: Database["public"]["Enums"]["year_type"]
        }
        Update: {
          created_at?: string
          daily_invites_used?: number | null
          first_name?: string
          fun_prompt?: string | null
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          is_premium?: boolean | null
          last_invite_reset_date?: string | null
          stream?: string
          university?: string
          updated_at?: string
          user_id?: string
          year?: Database["public"]["Enums"]["year_type"]
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
        }
        Relationships: []
      }
      skipped_profiles: {
        Row: {
          created_at: string
          id: string
          skipped_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skipped_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skipped_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_stream:
            | Database["public"]["Enums"]["preference_type"]
            | null
          preferred_year: Database["public"]["Enums"]["preference_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_stream?:
            | Database["public"]["Enums"]["preference_type"]
            | null
          preferred_year?: Database["public"]["Enums"]["preference_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_stream?:
            | Database["public"]["Enums"]["preference_type"]
            | null
          preferred_year?: Database["public"]["Enums"]["preference_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gender_type: "boy" | "girl"
      invite_status: "pending" | "accepted" | "rejected"
      preference_type: "same" | "different" | "any"
      year_type: "1st" | "2nd" | "3rd" | "4th"
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
      gender_type: ["boy", "girl"],
      invite_status: ["pending", "accepted", "rejected"],
      preference_type: ["same", "different", "any"],
      year_type: ["1st", "2nd", "3rd", "4th"],
    },
  },
} as const
