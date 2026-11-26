// Tipos de la base de datos. Regenerar con: npm run db:types
// (Escritos a mano a partir de supabase/migrations hasta tener el proyecto conectado.)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel<FK extends string, Col extends string, Ref extends string, One extends boolean = false> = {
  foreignKeyName: FK;
  columns: [Col];
  isOneToOne: One;
  referencedRelation: Ref;
  referencedColumns: ['id'];
};

type Enums = {
  movement_type:
    | 'stock_entry'
    | 'sale'
    | 'sale_cancellation'
    | 'return'
    | 'reservation'
    | 'reservation_release'
    | 'manual_adjustment'
    | 'admin_correction';
  payment_method: 'cash' | 'transfer' | 'card' | 'other';
  product_audience: 'women' | 'men' | 'unisex';
  reservation_status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
  sale_status: 'completed' | 'partially_returned' | 'returned' | 'cancelled';
  user_role: 'owner' | 'staff';
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: '13.0.5' };
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; role: Enums['user_role']; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id: string; full_name: string; role?: Enums['user_role']; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: string; full_name?: string; role?: Enums['user_role']; is_active?: boolean; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      store_settings: {
        Row: {
          id: boolean;
          store_name: string;
          slogan: string | null;
          description: string | null;
          about_text: string | null;
          logo_path: string | null;
          instagram_handle: string | null;
          whatsapp_enabled: boolean;
          whatsapp_number: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          currency: string;
          timezone: string;
          show_sold_out_products: boolean;
          low_stock_threshold: number;
          reservations_hold_stock: boolean;
          reservation_default_days: number | null;
          delivery_info: string | null;
          pickup_info: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Partial<Database['public']['Tables']['store_settings']['Row']>;
        Update: Partial<Database['public']['Tables']['store_settings']['Row']>;
        Relationships: [Rel<'store_settings_updated_by_fkey', 'updated_by', 'profiles'>];
      };
      categories: {
        Row: { id: string; name: string; slug: string; description: string | null; sort_order: number; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; slug: string; description?: string | null; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; slug?: string; description?: string | null; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      colors: {
        Row: { id: string; name: string; hex: string; sort_order: number; is_active: boolean; created_at: string };
        Insert: { id?: string; name: string; hex: string; sort_order?: number; is_active?: boolean; created_at?: string };
        Update: { id?: string; name?: string; hex?: string; sort_order?: number; is_active?: boolean; created_at?: string };
        Relationships: [];
      };
      sizes: {
        Row: { id: string; name: string; sort_order: number; is_active: boolean; created_at: string };
        Insert: { id?: string; name: string; sort_order?: number; is_active?: boolean; created_at?: string };
        Update: { id?: string; name?: string; sort_order?: number; is_active?: boolean; created_at?: string };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category_id: string;
          audience: Enums['product_audience'];
          price: number;
          sale_price: number | null;
          is_active: boolean;
          is_new: boolean;
          is_featured: boolean;
          archived_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          category_id: string;
          audience: Enums['product_audience'];
          price: number;
          sale_price?: number | null;
          is_active?: boolean;
          is_new?: boolean;
          is_featured?: boolean;
          archived_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
        Relationships: [
          Rel<'products_category_id_fkey', 'category_id', 'categories'>,
          Rel<'products_created_by_fkey', 'created_by', 'profiles'>,
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          color_id: string;
          size_id: string;
          sku: string | null;
          stock_on_hand: number;
          stock_reserved: number;
          stock_available: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: { id?: string; product_id: string; color_id: string; size_id: string; sku?: string | null; is_active?: boolean };
        Update: { sku?: string | null; is_active?: boolean };
        Relationships: [
          Rel<'product_variants_product_id_fkey', 'product_id', 'products'>,
          Rel<'product_variants_color_id_fkey', 'color_id', 'colors'>,
          Rel<'product_variants_size_id_fkey', 'size_id', 'sizes'>,
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          color_id: string | null;
          storage_path: string;
          thumb_path: string;
          width: number;
          height: number;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          color_id?: string | null;
          storage_path: string;
          thumb_path: string;
          width: number;
          height: number;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>;
        Relationships: [
          Rel<'product_images_product_id_fkey', 'product_id', 'products'>,
          Rel<'product_images_color_id_fkey', 'color_id', 'colors'>,
        ];
      };
      stock_entries: {
        Row: { id: string; received_at: string; supplier: string | null; notes: string | null; created_by: string | null; created_at: string };
        Insert: never;
        Update: never;
        Relationships: [Rel<'stock_entries_created_by_fkey', 'created_by', 'profiles'>];
      };
      stock_entry_items: {
        Row: { id: string; stock_entry_id: string; variant_id: string; quantity: number };
        Insert: never;
        Update: never;
        Relationships: [
          Rel<'stock_entry_items_stock_entry_id_fkey', 'stock_entry_id', 'stock_entries'>,
          Rel<'stock_entry_items_variant_id_fkey', 'variant_id', 'product_variants'>,
        ];
      };
      stock_entry_item_costs: {
        Row: { stock_entry_item_id: string; unit_cost: number };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: 'stock_entry_item_costs_stock_entry_item_id_fkey';
            columns: ['stock_entry_item_id'];
            isOneToOne: true;
            referencedRelation: 'stock_entry_items';
            referencedColumns: ['id'];
          },
        ];
      };
      sales: {
        Row: {
          id: string;
          sale_number: number;
          sold_at: string;
          status: Enums['sale_status'];
          payment_method: Enums['payment_method'] | null;
          customer_reference: string | null;
          notes: string | null;
          total: number;
          reservation_id: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          cancel_reason: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          Rel<'sales_reservation_fk', 'reservation_id', 'reservations'>,
          Rel<'sales_created_by_fkey', 'created_by', 'profiles'>,
          Rel<'sales_cancelled_by_fkey', 'cancelled_by', 'profiles'>,
        ];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          variant_id: string;
          product_name: string;
          color_name: string;
          size_name: string;
          quantity: number;
          unit_price: number;
          line_total: number | null;
          returned_quantity: number;
        };
        Insert: never;
        Update: never;
        Relationships: [
          Rel<'sale_items_sale_id_fkey', 'sale_id', 'sales'>,
          Rel<'sale_items_variant_id_fkey', 'variant_id', 'product_variants'>,
        ];
      };
      sale_returns: {
        Row: { id: string; sale_id: string; returned_at: string; reason: string; created_by: string | null; created_at: string };
        Insert: never;
        Update: never;
        Relationships: [Rel<'sale_returns_sale_id_fkey', 'sale_id', 'sales'>];
      };
      sale_return_items: {
        Row: { id: string; sale_return_id: string; sale_item_id: string; quantity: number };
        Insert: never;
        Update: never;
        Relationships: [
          Rel<'sale_return_items_sale_return_id_fkey', 'sale_return_id', 'sale_returns'>,
          Rel<'sale_return_items_sale_item_id_fkey', 'sale_item_id', 'sale_items'>,
        ];
      };
      reservations: {
        Row: {
          id: string;
          reservation_number: number;
          customer_name: string;
          customer_contact: string | null;
          status: Enums['reservation_status'];
          expires_at: string | null;
          holds_stock: boolean;
          notes: string | null;
          sale_id: string | null;
          closed_reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          Rel<'reservations_sale_id_fkey', 'sale_id', 'sales'>,
          Rel<'reservations_created_by_fkey', 'created_by', 'profiles'>,
        ];
      };
      reservation_items: {
        Row: { id: string; reservation_id: string; variant_id: string; quantity: number; unit_price: number };
        Insert: never;
        Update: never;
        Relationships: [
          Rel<'reservation_items_reservation_id_fkey', 'reservation_id', 'reservations'>,
          Rel<'reservation_items_variant_id_fkey', 'variant_id', 'product_variants'>,
        ];
      };
      inventory_movements: {
        Row: {
          id: number;
          variant_id: string;
          movement_type: Enums['movement_type'];
          on_hand_delta: number;
          reserved_delta: number;
          on_hand_before: number;
          on_hand_after: number;
          reserved_before: number;
          reserved_after: number;
          reason: string | null;
          stock_entry_id: string | null;
          sale_id: string | null;
          sale_return_id: string | null;
          reservation_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          Rel<'inventory_movements_variant_id_fkey', 'variant_id', 'product_variants'>,
          Rel<'inventory_movements_stock_entry_id_fkey', 'stock_entry_id', 'stock_entries'>,
          Rel<'inventory_movements_sale_id_fkey', 'sale_id', 'sales'>,
          Rel<'inventory_movements_sale_return_id_fkey', 'sale_return_id', 'sale_returns'>,
          Rel<'inventory_movements_reservation_id_fkey', 'reservation_id', 'reservations'>,
          Rel<'inventory_movements_created_by_fkey', 'created_by', 'profiles'>,
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_dashboard: { Args: { p_days?: number }; Returns: Json };
      current_admin: {
        Args: never;
        Returns: { id: string; full_name: string; role: Enums['user_role'] }[];
      };
      catalog_products: {
        Args: {
          p_search?: string;
          p_category?: string;
          p_audience?: Enums['product_audience'];
          p_size_ids?: string[];
          p_color_ids?: string[];
          p_only_available?: boolean;
          p_only_new?: boolean;
          p_only_featured?: boolean;
          p_sort?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          slug: string;
          name: string;
          category_name: string;
          category_slug: string;
          audience: Enums['product_audience'];
          price: number;
          sale_price: number | null;
          is_new: boolean;
          is_featured: boolean;
          created_at: string;
          total_available: number;
          primary_image: string | null;
          primary_thumb: string | null;
          primary_image_alt: string | null;
          total_count: number;
        }[];
      };
      register_stock_entry: {
        Args: { p_items: Json; p_received_at?: string; p_supplier?: string; p_notes?: string };
        Returns: string;
      };
      register_sale: {
        Args: {
          p_items: Json;
          p_payment_method?: Enums['payment_method'];
          p_sold_at?: string;
          p_customer_reference?: string;
          p_notes?: string;
        };
        Returns: string;
      };
      cancel_sale: { Args: { p_sale_id: string; p_reason: string }; Returns: undefined };
      register_return: { Args: { p_sale_id: string; p_items: Json; p_reason: string }; Returns: string };
      create_reservation: {
        Args: { p_customer_name: string; p_items: Json; p_customer_contact?: string; p_expires_at?: string; p_notes?: string };
        Returns: string;
      };
      confirm_reservation: { Args: { p_reservation_id: string }; Returns: undefined };
      cancel_reservation: { Args: { p_reservation_id: string; p_reason: string }; Returns: undefined };
      complete_reservation: {
        Args: { p_reservation_id: string; p_payment_method?: Enums['payment_method']; p_notes?: string };
        Returns: string;
      };
      adjust_stock: {
        Args: { p_variant_id: string; p_new_on_hand: number; p_reason: string; p_type?: Enums['movement_type'] };
        Returns: undefined;
      };
    };
    Enums: Enums;
    CompositeTypes: { [_ in never]: never };
  };
};
