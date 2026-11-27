// Generado con: npm run db:types
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      colors: {
        Row: {
          created_at: string
          hex: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          hex: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          hex?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          movement_type: Database["public"]["Enums"]["movement_type"]
          on_hand_after: number
          on_hand_before: number
          on_hand_delta: number
          reason: string | null
          reservation_id: string | null
          reserved_after: number
          reserved_before: number
          reserved_delta: number
          sale_id: string | null
          sale_return_id: string | null
          stock_entry_id: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: never
          movement_type: Database["public"]["Enums"]["movement_type"]
          on_hand_after: number
          on_hand_before: number
          on_hand_delta: number
          reason?: string | null
          reservation_id?: string | null
          reserved_after: number
          reserved_before: number
          reserved_delta: number
          sale_id?: string | null
          sale_return_id?: string | null
          stock_entry_id?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: never
          movement_type?: Database["public"]["Enums"]["movement_type"]
          on_hand_after?: number
          on_hand_before?: number
          on_hand_delta?: number
          reason?: string | null
          reservation_id?: string | null
          reserved_after?: number
          reserved_before?: number
          reserved_delta?: number
          sale_id?: string | null
          sale_return_id?: string | null
          stock_entry_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_sale_return_id_fkey"
            columns: ["sale_return_id"]
            isOneToOne: false
            referencedRelation: "sale_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_stock_entry_id_fkey"
            columns: ["stock_entry_id"]
            isOneToOne: false
            referencedRelation: "stock_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          color_id: string | null
          created_at: string
          height: number
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          storage_path: string
          thumb_path: string
          width: number
        }
        Insert: {
          alt_text?: string | null
          color_id?: string | null
          created_at?: string
          height: number
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          storage_path: string
          thumb_path: string
          width: number
        }
        Update: {
          alt_text?: string | null
          color_id?: string | null
          created_at?: string
          height?: number
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          storage_path?: string
          thumb_path?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          color_id: string
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          size_id: string
          sku: string | null
          stock_available: number | null
          stock_on_hand: number
          stock_reserved: number
          updated_at: string
        }
        Insert: {
          color_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          size_id: string
          sku?: string | null
          stock_available?: number | null
          stock_on_hand?: number
          stock_reserved?: number
          updated_at?: string
        }
        Update: {
          color_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          size_id?: string
          sku?: string | null
          stock_available?: number | null
          stock_on_hand?: number
          stock_reserved?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          audience: Database["public"]["Enums"]["product_audience"]
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_new: boolean
          name: string
          price: number
          sale_price: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          audience: Database["public"]["Enums"]["product_audience"]
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          name: string
          price: number
          sale_price?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          audience?: Database["public"]["Enums"]["product_audience"]
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          name?: string
          price?: number
          sale_price?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reservation_items: {
        Row: {
          id: string
          quantity: number
          reservation_id: string
          unit_price: number
          variant_id: string
        }
        Insert: {
          id?: string
          quantity: number
          reservation_id: string
          unit_price: number
          variant_id: string
        }
        Update: {
          id?: string
          quantity?: number
          reservation_id?: string
          unit_price?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_items_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          closed_reason: string | null
          created_at: string
          created_by: string | null
          customer_contact: string | null
          customer_name: string
          expires_at: string | null
          holds_stock: boolean
          id: string
          notes: string | null
          reservation_number: number
          sale_id: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
        }
        Insert: {
          closed_reason?: string | null
          created_at?: string
          created_by?: string | null
          customer_contact?: string | null
          customer_name: string
          expires_at?: string | null
          holds_stock: boolean
          id?: string
          notes?: string | null
          reservation_number?: never
          sale_id?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Update: {
          closed_reason?: string | null
          created_at?: string
          created_by?: string | null
          customer_contact?: string | null
          customer_name?: string
          expires_at?: string | null
          holds_stock?: boolean
          id?: string
          notes?: string | null
          reservation_number?: never
          sale_id?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          color_name: string
          id: string
          line_total: number | null
          product_name: string
          quantity: number
          returned_quantity: number
          sale_id: string
          size_name: string
          unit_price: number
          variant_id: string
        }
        Insert: {
          color_name: string
          id?: string
          line_total?: number | null
          product_name: string
          quantity: number
          returned_quantity?: number
          sale_id: string
          size_name: string
          unit_price: number
          variant_id: string
        }
        Update: {
          color_name?: string
          id?: string
          line_total?: number | null
          product_name?: string
          quantity?: number
          returned_quantity?: number
          sale_id?: string
          size_name?: string
          unit_price?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_return_items: {
        Row: {
          id: string
          quantity: number
          sale_item_id: string
          sale_return_id: string
        }
        Insert: {
          id?: string
          quantity: number
          sale_item_id: string
          sale_return_id: string
        }
        Update: {
          id?: string
          quantity?: number
          sale_item_id?: string
          sale_return_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_return_items_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_return_items_sale_return_id_fkey"
            columns: ["sale_return_id"]
            isOneToOne: false
            referencedRelation: "sale_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_returns: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          reason: string
          returned_at: string
          sale_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          reason: string
          returned_at?: string
          sale_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string
          returned_at?: string
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          created_by: string | null
          customer_reference: string | null
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          reservation_id: string | null
          sale_number: number
          sold_at: string
          status: Database["public"]["Enums"]["sale_status"]
          total: number
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_reference?: string | null
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reservation_id?: string | null
          sale_number?: never
          sold_at?: string
          status?: Database["public"]["Enums"]["sale_status"]
          total: number
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_reference?: string | null
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          reservation_id?: string | null
          sale_number?: never
          sold_at?: string
          status?: Database["public"]["Enums"]["sale_status"]
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_reservation_fk"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      sizes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      stock_entries: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          received_at: string
          supplier: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          received_at?: string
          supplier?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          received_at?: string
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_entry_item_costs: {
        Row: {
          stock_entry_item_id: string
          unit_cost: number
        }
        Insert: {
          stock_entry_item_id: string
          unit_cost: number
        }
        Update: {
          stock_entry_item_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_entry_item_costs_stock_entry_item_id_fkey"
            columns: ["stock_entry_item_id"]
            isOneToOne: true
            referencedRelation: "stock_entry_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_entry_items: {
        Row: {
          id: string
          quantity: number
          stock_entry_id: string
          variant_id: string
        }
        Insert: {
          id?: string
          quantity: number
          stock_entry_id: string
          variant_id: string
        }
        Update: {
          id?: string
          quantity?: number
          stock_entry_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_entry_items_stock_entry_id_fkey"
            columns: ["stock_entry_id"]
            isOneToOne: false
            referencedRelation: "stock_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_entry_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          about_text: string | null
          contact_email: string | null
          contact_phone: string | null
          currency: string
          delivery_info: string | null
          description: string | null
          id: boolean
          instagram_handle: string | null
          logo_path: string | null
          low_stock_threshold: number
          pickup_info: string | null
          reservation_default_days: number | null
          reservations_hold_stock: boolean
          show_sold_out_products: boolean
          slogan: string | null
          store_name: string
          timezone: string
          updated_at: string
          updated_by: string | null
          whatsapp_enabled: boolean
          whatsapp_number: string | null
        }
        Insert: {
          about_text?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          currency?: string
          delivery_info?: string | null
          description?: string | null
          id?: boolean
          instagram_handle?: string | null
          logo_path?: string | null
          low_stock_threshold?: number
          pickup_info?: string | null
          reservation_default_days?: number | null
          reservations_hold_stock?: boolean
          show_sold_out_products?: boolean
          slogan?: string | null
          store_name?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Update: {
          about_text?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          currency?: string
          delivery_info?: string | null
          description?: string | null
          id?: boolean
          instagram_handle?: string | null
          logo_path?: string | null
          low_stock_threshold?: number
          pickup_info?: string | null
          reservation_default_days?: number | null
          reservations_hold_stock?: boolean
          show_sold_out_products?: boolean
          slogan?: string | null
          store_name?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp_enabled?: boolean
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_updated_by_fkey"
            columns: ["updated_by"]
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
      adjust_stock: {
        Args: {
          p_new_on_hand: number
          p_reason: string
          p_type?: Database["public"]["Enums"]["movement_type"]
          p_variant_id: string
        }
        Returns: undefined
      }
      admin_dashboard: { Args: { p_days?: number }; Returns: Json }
      cancel_reservation: {
        Args: { p_reason: string; p_reservation_id: string }
        Returns: undefined
      }
      cancel_sale: {
        Args: { p_reason: string; p_sale_id: string }
        Returns: undefined
      }
      catalog_products: {
        Args: {
          p_audience?: Database["public"]["Enums"]["product_audience"]
          p_category?: string
          p_color_ids?: string[]
          p_limit?: number
          p_offset?: number
          p_only_available?: boolean
          p_only_featured?: boolean
          p_only_new?: boolean
          p_search?: string
          p_size_ids?: string[]
          p_sort?: string
        }
        Returns: {
          audience: Database["public"]["Enums"]["product_audience"]
          category_name: string
          category_slug: string
          created_at: string
          id: string
          is_featured: boolean
          is_new: boolean
          name: string
          price: number
          primary_image: string
          primary_image_alt: string
          primary_thumb: string
          sale_price: number
          slug: string
          total_available: number
          total_count: number
        }[]
      }
      complete_reservation: {
        Args: {
          p_notes?: string
          p_payment_method?: Database["public"]["Enums"]["payment_method"]
          p_reservation_id: string
        }
        Returns: string
      }
      confirm_reservation: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
      create_reservation: {
        Args: {
          p_customer_contact?: string
          p_customer_name: string
          p_expires_at?: string
          p_items: Json
          p_notes?: string
        }
        Returns: string
      }
      current_admin: {
        Args: never
        Returns: {
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      register_return: {
        Args: { p_items: Json; p_reason: string; p_sale_id: string }
        Returns: string
      }
      register_sale: {
        Args: {
          p_customer_reference?: string
          p_items: Json
          p_notes?: string
          p_payment_method?: Database["public"]["Enums"]["payment_method"]
          p_sold_at?: string
        }
        Returns: string
      }
      register_stock_entry: {
        Args: {
          p_items: Json
          p_notes?: string
          p_received_at?: string
          p_supplier?: string
        }
        Returns: string
      }
    }
    Enums: {
      movement_type:
        | "stock_entry"
        | "sale"
        | "sale_cancellation"
        | "return"
        | "reservation"
        | "reservation_release"
        | "manual_adjustment"
        | "admin_correction"
      payment_method: "cash" | "transfer" | "card" | "other"
      product_audience: "women" | "men" | "unisex"
      reservation_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "expired"
      sale_status: "completed" | "partially_returned" | "returned" | "cancelled"
      user_role: "owner" | "staff"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      movement_type: [
        "stock_entry",
        "sale",
        "sale_cancellation",
        "return",
        "reservation",
        "reservation_release",
        "manual_adjustment",
        "admin_correction",
      ],
      payment_method: ["cash", "transfer", "card", "other"],
      product_audience: ["women", "men", "unisex"],
      reservation_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "expired",
      ],
      sale_status: ["completed", "partially_returned", "returned", "cancelled"],
      user_role: ["owner", "staff"],
    },
  },
} as const
