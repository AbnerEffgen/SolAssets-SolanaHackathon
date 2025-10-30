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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      market_orders: {
        Row: {
          buyer_profile_id: string
          buyer_wallet: string
          created_at: string
          fill_transaction_hash: string | null
          filled_quantity: number | null
          id: string
          price: number
          quantity: number
          seller_profile_id: string | null
          seller_wallet: string | null
          status: Database["public"]["Enums"]["order_status"]
          token_id: string
          updated_at: string
        }
        Insert: {
          buyer_profile_id: string
          buyer_wallet: string
          created_at?: string
          fill_transaction_hash?: string | null
          filled_quantity?: number | null
          id?: string
          price: number
          quantity: number
          seller_profile_id?: string | null
          seller_wallet?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          token_id: string
          updated_at?: string
        }
        Update: {
          buyer_profile_id?: string
          buyer_wallet?: string
          created_at?: string
          fill_transaction_hash?: string | null
          filled_quantity?: number | null
          id?: string
          price?: number
          quantity?: number
          seller_profile_id?: string | null
          seller_wallet?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          token_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_orders_buyer_profile_id_fkey"
            columns: ["buyer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_orders_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_orders_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      market_trades: {
        Row: {
          buyer_profile_id: string
          created_at: string
          id: string
          order_id: string
          price: number
          quantity: number
          seller_profile_id: string
          token_id: string
          transaction_hash: string | null
        }
        Insert: {
          buyer_profile_id: string
          created_at?: string
          id?: string
          order_id: string
          price: number
          quantity: number
          seller_profile_id: string
          token_id: string
          transaction_hash?: string | null
        }
        Update: {
          buyer_profile_id?: string
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          quantity?: number
          seller_profile_id?: string
          token_id?: string
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_trades_buyer_profile_id_fkey"
            columns: ["buyer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_trades_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "market_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_trades_seller_profile_id_fkey"
            columns: ["seller_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_trades_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          asset_id: string | null
          created_at: string
          creator_id: string
          deadline: string
          description: string
          id: string
          status: Database["public"]["Enums"]["proposal_status"]
          title: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          creator_id: string
          deadline: string
          description: string
          id?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          title: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          creator_id?: string
          deadline?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "rwa_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rwa_assets: {
        Row: {
          created_at: string
          description: string | null
          document_requirements: string | null
          id: string
          location: string | null
          name: string
          owner_wallet: string | null
          rejection_reason: string | null
          status: string
          token_code: string
          updated_at: string
          valuation: number | null
          yield_rate: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_requirements?: string | null
          id?: string
          location?: string | null
          name: string
          owner_wallet?: string | null
          rejection_reason?: string | null
          status: string
          token_code: string
          updated_at?: string
          valuation?: number | null
          yield_rate?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_requirements?: string | null
          id?: string
          location?: string | null
          name?: string
          owner_wallet?: string | null
          rejection_reason?: string | null
          status?: string
          token_code?: string
          updated_at?: string
          valuation?: number | null
          yield_rate?: number | null
        }
        Relationships: []
      }
      rwa_documents: {
        Row: {
          asset_id: string
          id: string
          name: string
          profile_id: string | null
          reviewer_notes: string | null
          status: string
          submitted_at: string
          url: string | null
        }
        Insert: {
          asset_id: string
          id?: string
          name: string
          profile_id?: string | null
          reviewer_notes?: string | null
          status: string
          submitted_at?: string
          url?: string | null
        }
        Update: {
          asset_id?: string
          id?: string
          name?: string
          profile_id?: string | null
          reviewer_notes?: string | null
          status?: string
          submitted_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rwa_documents_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "rwa_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rwa_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          created_at: string
          description: string | null
          id: string
          mint_address: string | null
          name: string
          profile_id: string
          quantity: number
          status: Database["public"]["Enums"]["token_status"]
          tag: string
          transaction_hash: string | null
          type: Database["public"]["Enums"]["token_type"]
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          mint_address?: string | null
          name: string
          profile_id: string
          quantity: number
          status?: Database["public"]["Enums"]["token_status"]
          tag: string
          transaction_hash?: string | null
          type: Database["public"]["Enums"]["token_type"]
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          mint_address?: string | null
          name?: string
          profile_id?: string
          quantity?: number
          status?: Database["public"]["Enums"]["token_status"]
          tag?: string
          transaction_hash?: string | null
          type?: Database["public"]["Enums"]["token_type"]
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          vote: boolean
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          vote: boolean
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          vote?: boolean
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      debug_profile_check: {
        Args: never
        Returns: {
          current_auth_uid: string
          profile_exists_for_auth_uid: boolean
          profile_id_in_table: string
        }[]
      }
    }
    Enums: {
      order_status: "open" | "partial" | "filled" | "cancelled"
      proposal_status: "Ativa" | "Aprovada" | "Rejeitada" | "Encerrada"
      token_status: "Ativo" | "Pendente" | "Falhou"
      token_type: "Fungível" | "Não-fungível"
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
      order_status: ["open", "partial", "filled", "cancelled"],
      proposal_status: ["Ativa", "Aprovada", "Rejeitada", "Encerrada"],
      token_status: ["Ativo", "Pendente", "Falhou"],
      token_type: ["Fungível", "Não-fungível"],
    },
  },
} as const
