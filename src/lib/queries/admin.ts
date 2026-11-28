import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type VariantOption = {
  id: string;
  productId: string;
  productName: string;
  colorName: string;
  colorHex: string;
  sizeName: string;
  onHand: number;
  reserved: number;
  available: number;
  price: number;
  archived: boolean;
  active: boolean;
};

/** Todas las variantes (para formularios de entradas, ventas y apartados). Panel únicamente. */
export async function getVariantOptions(): Promise<VariantOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_variants')
    .select(
      'id, color_id, stock_on_hand, stock_reserved, stock_available, is_active, product:products!inner(id, name, price, sale_price, archived_at, colors:product_colors(color_id, price)), color:colors!inner(name, hex, sort_order), size:sizes!inner(name, sort_order)',
    )
    .limit(3000);
  if (error) throw new Error(error.message);

  return data
    .map((v) => ({
      id: v.id,
      productId: v.product.id,
      productName: v.product.name,
      colorName: v.color.name,
      colorHex: v.color.hex,
      sizeName: v.size.name,
      onHand: v.stock_on_hand,
      reserved: v.stock_reserved,
      available: v.stock_available ?? 0,
      // Precio vigente: el del color si tiene uno propio; si no, promoción o precio del producto.
      price: Number(
        v.product.colors.find((c) => c.color_id === v.color_id)?.price ?? v.product.sale_price ?? v.product.price,
      ),
      archived: Boolean(v.product.archived_at),
      active: v.is_active,
      _order: [v.color.sort_order, v.size.sort_order] as const,
    }))
    .sort(
      (a, b) =>
        a.productName.localeCompare(b.productName, 'es') || a._order[0] - b._order[0] || a._order[1] - b._order[1],
    )
    .map(({ _order, ...rest }) => {
      void _order;
      return rest;
    });
}

export async function getStoreTimezone(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.from('store_settings').select('timezone').single();
  return data?.timezone ?? 'America/Mexico_City';
}
