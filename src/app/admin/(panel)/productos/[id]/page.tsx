import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { ProductColorsManager } from '@/components/admin/product-colors-manager';
import { ProductDangerZone } from '@/components/admin/product-danger-zone';
import { ButtonLink } from '@/components/ui/button';
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
  const [product, categories, colors] = await Promise.all([
    supabase
      .from('products')
      .select(
        `*, variants:product_variants(id, color_id, stock_on_hand),
         colors:product_colors(price, sort_order, color:colors(id, name, hex, sort_order)),
         images:product_images(id, storage_path, thumb_path, alt_text, color_id, sort_order, is_primary, width, height)`,
      )
      .eq('id', parsedId.data)
      .maybeSingle(),
    supabase.from('categories').select('id, name, icon').order('sort_order').order('name'),
    supabase.from('colors').select('id, name, hex').eq('is_active', true).order('sort_order').order('name'),
  ]);
  if (product.error) throw new Error(product.error.message);
  if (!product.data) notFound();
  const p = product.data;

  const images = [...p.images].sort((a, b) => a.sort_order - b.sort_order);
  const productColors = [...p.colors]
    .filter((c) => c.color)
    .sort((a, b) => a.sort_order - b.sort_order || a.color!.sort_order - b.color!.sort_order)
    .map((c) => ({
      color: c.color!,
      price: c.price === null ? null : Number(c.price),
      stockSizes: p.variants.filter((v) => v.color_id === c.color!.id).length,
    }));
  const totalOnHand = p.variants.reduce((n, v) => n + v.stock_on_hand, 0);

  return (
    <>
      <PageHeader
        title={p.name}
        back={{ href: '/admin/productos', label: 'Productos' }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {p.archived_at ? <Badge>Archivado</Badge> : p.is_active ? <Badge tone="success">Visible en la tienda</Badge> : <Badge>Oculto</Badge>}
            {p.is_new && <Badge tone="new">Novedad</Badge>}
            {p.is_active && !p.archived_at && (
              <Link href={`/producto/${p.slug}`} target="_blank" className="underline underline-offset-4">
                Ver en el sitio
              </Link>
            )}
          </span>
        }
        actions={<ButtonLink href={`/admin/inventario?producto=${p.id}`} variant="secondary">Tallas e inventario</ButtonLink>}
      />
      {sp.creado && (
        <div className="mb-6">
          <FormMessage tone={sp.aviso ? 'error' : 'success'}>
            {sp.aviso === 'colores'
              ? 'Producto creado, pero no se pudieron guardar los colores. Agréguelos abajo.'
              : sp.aviso === 'fotos'
                ? 'Producto creado, pero algunas fotos no se subieron. Súbalas de nuevo abajo.'
                : 'Producto creado.'}
          </FormMessage>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <Panel title="Información">
          <ProductForm
            product={{ ...p, price: Number(p.price), sale_price: p.sale_price === null ? null : Number(p.sale_price) }}
            categories={categories.data ?? []}
          />
        </Panel>

        <Panel
          title="Colores y fotografías"
          actions={<span className="text-sm text-muted tabular-nums">{totalOnHand} piezas en tienda</span>}
        >
          <ProductColorsManager
            productId={p.id}
            productName={p.name}
            basePrice={Number(p.sale_price ?? p.price)}
            productColors={productColors}
            images={images}
            allColors={colors.data ?? []}
          />
        </Panel>

        <ProductDangerZone productId={p.id} archived={Boolean(p.archived_at)} />
      </div>
    </>
  );
}
