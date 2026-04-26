export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      orders: {
        Row: {
          checkout_fingerprint: string | null;
          created_at: string;
          customer_email: string;
          customer_name: string;
          id: string;
          items: Json;
          order_number: string;
          payment_status: string;
          preorder: boolean;
          shipping_address: Json | null;
          status: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          total_amount: number;
        };
        Insert: {
          checkout_fingerprint?: string | null;
          created_at?: string;
          customer_email?: string;
          customer_name?: string;
          id?: string;
          items?: Json;
          order_number: string;
          payment_status?: string;
          preorder?: boolean;
          shipping_address?: Json | null;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          total_amount: number;
        };
        Update: {
          checkout_fingerprint?: string | null;
          created_at?: string;
          customer_email?: string;
          customer_name?: string;
          id?: string;
          items?: Json;
          order_number?: string;
          payment_status?: string;
          preorder?: boolean;
          shipping_address?: Json | null;
          status?: Database["public"]["Enums"]["order_status"];
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          total_amount?: number;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          created_at: string;
          id: string;
          image_url: string;
          product_id: string;
          sort_order: number;
          storage_path: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url: string;
          product_id: string;
          sort_order?: number;
          storage_path?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string;
          product_id?: string;
          sort_order?: number;
          storage_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_videos: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          sort_order: number;
          storage_path: string | null;
          video_url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          sort_order?: number;
          storage_path?: string | null;
          video_url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          sort_order?: number;
          storage_path?: string | null;
          video_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_videos_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          category: string;
          colors: string[];
          created_at: string;
          description: string;
          featured_homepage: boolean;
          id: string;
          is_active: boolean;
          is_preorder: boolean;
          name: string;
          price: number;
          sizes: string[];
          slug: string;
          status: Database["public"]["Enums"]["product_status"];
          stock_quantity: number;
          updated_at: string;
        };
        Insert: {
          category: string;
          colors?: string[];
          created_at?: string;
          description?: string;
          featured_homepage?: boolean;
          id?: string;
          is_active?: boolean;
          is_preorder?: boolean;
          name: string;
          price: number;
          sizes?: string[];
          slug: string;
          status?: Database["public"]["Enums"]["product_status"];
          stock_quantity?: number;
          updated_at?: string;
        };
        Update: {
          category?: string;
          colors?: string[];
          created_at?: string;
          description?: string;
          featured_homepage?: boolean;
          id?: string;
          is_active?: boolean;
          is_preorder?: boolean;
          name?: string;
          price?: number;
          sizes?: string[];
          slug?: string;
          status?: Database["public"]["Enums"]["product_status"];
          stock_quantity?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          allow_promotion_codes: boolean;
          created_at: string;
          delivery_notes: string;
          enable_automatic_tax: boolean;
          estimated_tax_rate: number;
          free_shipping_threshold: number | null;
          id: string;
          shipping_flat_rate: number;
          updated_at: string;
        };
        Insert: {
          allow_promotion_codes?: boolean;
          created_at?: string;
          delivery_notes?: string;
          enable_automatic_tax?: boolean;
          estimated_tax_rate?: number;
          free_shipping_threshold?: number | null;
          id?: string;
          shipping_flat_rate?: number;
          updated_at?: string;
        };
        Update: {
          allow_promotion_codes?: boolean;
          created_at?: string;
          delivery_notes?: string;
          enable_automatic_tax?: boolean;
          estimated_tax_rate?: number;
          free_shipping_threshold?: number | null;
          id?: string;
          shipping_flat_rate?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: "admin" | "employee";
      order_status: "draft" | "paid" | "processing" | "shipped" | "delivered" | "canceled";
      product_status: "active" | "sold_out" | "draft";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "employee"],
      order_status: ["draft", "paid", "processing", "shipped", "delivered", "canceled"],
      product_status: ["active", "sold_out", "draft"],
    },
  },
} as const;
