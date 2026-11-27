import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { VariantManager } from '@/components/admin/variant-manager';
import { ImageManager } from '@/components/admin/image-manager';
import { ProductDangerZone } from '@/components/admin/product-danger-zone';
import { FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { createClient } from '@/lib/supabase/server';
import { uuid } from '@/lib/validations/schemas';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Editar producto' };

export default async function EditProductPage(props: PageProps<'/admin/productos/[id]'>) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const parsedId = uuid.safeParse(id);
  if (!parsedId.success) notFound();

  const supabase = await createClient();
  const [product, categories, colors, sizes] = await Promise.all([
    supabase
      .from('products')
      .select(
        `*, variants:product_variants(id, sku, stock_on_hand, stock_reserved, stock_available, is_active, color:colors(id, name, hex, sort_order), size:sizes(id, name, sort_order)),
         images:product_images(id, storage_path, thumb_path, alt_text, color_id, sort_order, is_primary, width, height)`,
      )
      .eq('id', parsedId.data)
      .maybeSingle(),
    supabase.from('categories').select('id, name').order('sort_order').order('name'),
    supabase.from('colors').select('id, name, hex').eq('is_active', true).order('sort_order').order('name'),
    supabase.from('sizes').select('id, name').eq('is_active', true).order('sort_order').order('name'),
  ]);
  if (product.error) throw new Error(product.error.message);
  if (!product.data) notFound();
  const p = product.data;

  const variants = [...p.variants].sort(
    (a, b) => (a.color?.sort_order ?? 0) - (b.color?.sort_order ?? 0) || (a.size?.sort_order ?? 0) - (b.size?.sort_order ?? 0),
  );
  const images = [...p.images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <PageHeader
        title={p.name}
        back={{ href: '/admin/productos', label: 'Productos' }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {p.archived_at ? <Badge>Archivado</Badge> : p.is_active ? <Badge tone="success">Visible</Badge> : <Badge>Oculto</Badge>}
            {p.is_active && !p.archived_at && (
              <Link href={`/producto/${p.slug}`} target="_blank" className="underline underline-offset-4">
                Ver en el sitio
              </Link>
            )}
          </span>
        }
      />
      {sp.creado && (
        <div className="mb-6">
          <FormMessage tone="success">Producto creado. Ahora agregue variantes y fotografías.</FormMessage>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Panel title="Información">
          <ProductForm
            product={{ ...p, price: Number(p.price), sale_price: p.sale_price === null ? null : Number(p.sale_price) }}
            categories={categories.data ?? []}
          />
        </Panel>

        <Panel title="Variantes e inventario">
          <VariantManager
            productId={p.id}
            variants={variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              is_active: v.is_active,
              stock_on_hand: v.stock_on_hand,
              stock_reserved: v.stock_reserved,
              stock_available: v.stock_available ?? 0,
              color: v.color!,
              size: v.size!,
            }))}
            colors={colors.data ?? []}
            sizes={sizes.data ?? []}
          />
        </Panel>

        <Panel title="Fotografías">
          <ImageManager productId={p.id} productName={p.name} images={images} colors={colors.data ?? []} />
        </Panel>

        <ProductDangerZone productId={p.id} archived={Boolean(p.archived_at)} />
      </div>
    </>
  );
}
