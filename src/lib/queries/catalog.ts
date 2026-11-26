import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import type { Database } from '@/types/database';

/**
 * Lecturas del catálogo público. Todas usan el cliente anónimo (RLS) y caché etiquetada:
 *   'catalog'          → cualquier cambio de productos, variantes, fotos o existencias
 *   `product:${slug}`  → un producto concreto
 *   'settings'         → configuración de la tienda
 * Las Server Actions del panel llaman updateTag() con estas etiquetas (lib/revalidate.ts).
 */

export type Audience = Database['public']['Enums']['product_audience'];
export type StoreSettings = Database['public']['Tables']['store_settings']['Row'];

export type PublicSettings = Pick<
  StoreSettings,
  | 'store_name'
  | 'slogan'
  | 'description'
  | 'about_text'
  | 'instagram_handle'
  | 'whatsapp_enabled'
  | 'whatsapp_number'
  | 'contact_email'
  | 'contact_phone'
  | 'show_sold_out_products'
  | 'low_stock_threshold'
  | 'delivery_info'
  | 'pickup_info'
  | 'currency'
>;

export async function getSettings(): Promise<PublicSettings> {
  'use cache';
  cacheLife('settings');
  cacheTag('settings');

  const { data, error } = await createPublicClient()
    .from('store_settings')
    .select(
      'store_name, slogan, description, about_text, instagram_handle, whatsapp_enabled, whatsapp_number, contact_email, contact_phone, show_sold_out_products, low_stock_threshold, delivery_info, pickup_info, currency',
    )
    .single();
  if (error) throw new Error(`settings: ${error.message}`);
  return data;
}

export type CategoryOption = { id: string; name: string; slug: string };
export type ColorOption = { id: string; name: string; hex: string };
export type SizeOption = { id: string; name: string };

export async function getFilterOptions(): Promise<{
  categories: CategoryOption[];
  colors: ColorOption[];
  sizes: SizeOption[];
}> {
  'use cache';
  cacheLife('catalog');
  cacheTag('catalog');

  const supabase = createPublicClient();
  const [categories, colors, sizes] = await Promise.all([
    supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order').order('name'),
    supabase.from('colors').select('id, name, hex').eq('is_active', true).order('sort_order').order('name'),
    supabase.from('sizes').select('id, name').eq('is_active', true).order('sort_order').order('name'),
  ]);
  if (categories.error || colors.error || sizes.error) {
    throw new Error('filter options: no se pudieron cargar');
  }
  return { categories: categories.data, colors: colors.data, sizes: sizes.data };
}

export type CatalogQuery = {
  search?: string;
  category?: string;
  audience?: Audience;
  sizeIds?: string[];
  colorIds?: string[];
  onlyAvailable?: boolean;
  onlyNew?: boolean;
  onlyFeatured?: boolean;
  sort?: 'new' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
};

export type CatalogItem = Database['public']['Functions']['catalog_products']['Returns'][number];

export async function searchCatalog(query: CatalogQuery): Promise<{ items: CatalogItem[]; total: number }> {
  'use cache';
  cacheLife('catalog');
  cacheTag('catalog');

  const pageSize = query.pageSize ?? 24;
  const page = Math.max(1, query.page ?? 1);

  const { data, error } = await createPublicClient().rpc('catalog_products', {
    p_search: query.search || undefined,
    p_category: query.category || undefined,
    p_audience: query.audience,
    p_size_ids: query.sizeIds?.length ? query.sizeIds : undefined,
    p_color_ids: query.colorIds?.length ? query.colorIds : undefined,
    p_only_available: query.onlyAvailable ?? false,
    p_only_new: query.onlyNew ?? false,
    p_only_featured: query.onlyFeatured ?? false,
    p_sort: query.sort ?? 'new',
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) throw new Error(`catalog: ${error.message}`);
  return { items: data ?? [], total: Number(data?.[0]?.total_count ?? 0) };
}

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  audience: Audience;
  price: number;
  sale_price: number | null;
  is_new: boolean;
  category: CategoryOption;
  images: { id: string; storage_path: string; thumb_path: string; alt_text: string | null; color_id: string | null; width: number; height: number }[];
  variants: {
    id: string;
    stock_available: number;
    color: ColorOption & { sort_order: number };
    size: SizeOption & { sort_order: number };
  }[];
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  'use cache';
  cacheLife('catalog');
  cacheTag('catalog', `product:${slug}`);

  const { data, error } = await createPublicClient()
    .from('products')
    .select(
      `id, slug, name, description, audience, price, sale_price, is_new,
       category:categories!inner(id, name, slug),
       images:product_images(id, storage_path, thumb_path, alt_text, color_id, width, height, sort_order, is_primary),
       variants:product_variants(id, stock_available, is_active,
         color:colors!inner(id, name, hex, sort_order),
         size:sizes!inner(id, name, sort_order))`,
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`product: ${error.message}`);
  if (!data) return null;

  const images = [...data.images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const variants = data.variants
    .filter((v) => v.is_active)
    .map((v) => ({ id: v.id, stock_available: v.stock_available ?? 0, color: v.color, size: v.size }))
    .sort((a, b) => a.color.sort_order - b.color.sort_order || a.size.sort_order - b.size.sort_order);

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    audience: data.audience,
    price: Number(data.price),
    sale_price: data.sale_price === null ? null : Number(data.sale_price),
    is_new: data.is_new,
    category: data.category,
    images,
    variants,
  };
}

export async function getRelatedProducts(productId: string, categorySlug: string): Promise<CatalogItem[]> {
  'use cache';
  cacheLife('catalog');
  cacheTag('catalog');

  const { items } = await searchCatalog({ category: categorySlug, pageSize: 5 });
  return items.filter((p) => p.id !== productId).slice(0, 4);
}

export async function getAllProductSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  'use cache';
  cacheLife('catalog');
  cacheTag('catalog');

  const { data, error } = await createPublicClient()
    .from('products')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5000);
  if (error) throw new Error(`slugs: ${error.message}`);
  return data;
}
