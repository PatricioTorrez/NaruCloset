import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Cell, DataTable, PageHeader, Row } from '@/components/admin/page-header';
import { ButtonLink } from '@/components/ui/button';
import { Badge, EmptyState } from '@/components/ui/misc';
import { FormMessage } from '@/components/ui/form';
import { createClient } from '@/lib/supabase/server';
import { AUDIENCE_LABEL, formatPrice } from '@/lib/format';
import { publicImageUrl } from '@/lib/env';

export const metadata: Metadata = { title: 'Productos' };

const STATUS = ['activos', 'inactivos', 'archivados', 'todos'] as const;

export default async function ProductsPage(props: PageProps<'/admin/productos'>) {
  const sp = await props.searchParams;
  const status = STATUS.includes(sp.estado as (typeof STATUS)[number]) ? (sp.estado as (typeof STATUS)[number]) : 'todos';
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 80) : '';

  const supabase = await createClient();
  let query = supabase
    .from('products')
    .select(
      'id, name, slug, price, sale_price, audience, is_active, is_new, is_featured, archived_at, category:categories(name), variants:product_variants(stock_available, stock_on_hand, is_active), images:product_images(thumb_path, is_primary, sort_order)',
    )
    .order('created_at', { ascending: false })
    .limit(200);
  if (status === 'activos') query = query.eq('is_active', true).is('archived_at', null);
  if (status === 'inactivos') query = query.eq('is_active', false).is('archived_at', null);
  if (status === 'archivados') query = query.not('archived_at', 'is', null);
  if (status === 'todos') query = query.is('archived_at', null);
  if (q) query = query.ilike('name', `%${q.replace(/[%_]/g, '')}%`);

  const { data: products, error } = await query;
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader
        title="Productos"
        description="Cree productos, sus variantes de color y talla, y sus fotografías. Las existencias se cargan con entradas de mercancía."
        actions={
          <ButtonLink href="/admin/productos/nuevo">
            <Plus className="size-4" aria-hidden /> Nuevo producto
          </ButtonLink>
        }
      />
      {sp.eliminado && <div className="mb-4"><FormMessage tone="success">Producto eliminado.</FormMessage></div>}

      <form className="mb-5 flex flex-wrap items-center gap-3" role="search">
        <label htmlFor="q" className="sr-only">Buscar</label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre"
          className="h-11 w-full max-w-xs rounded-md border border-line bg-white px-3.5 focus:border-espresso focus:outline-none"
        />
        <input type="hidden" name="estado" value={status} />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Estado">
          {STATUS.map((s) => (
            <Link
              key={s}
              href={`/admin/productos?estado=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              aria-current={status === s ? 'page' : undefined}
              className={
                'inline-flex h-9 items-center rounded-md px-3 text-sm capitalize ' +
                (status === s ? 'bg-espresso text-white' : 'hover:bg-sand/50')
              }
            >
              {s}
            </Link>
          ))}
        </div>
      </form>

      <DataTable
        head={['', 'Producto', 'Precio', 'Disponibles', 'Estado']}
        empty={
          products.length === 0 && (
            <EmptyState
              title={q ? 'Sin coincidencias' : 'Sin productos'}
              description={q ? 'Pruebe con otro nombre.' : 'Cree el primer producto del catálogo.'}
            />
          )
        }
      >
        {products.map((p) => {
          const available = p.variants.filter((v) => v.is_active).reduce((s, v) => s + (v.stock_available ?? 0), 0);
          const thumb = [...p.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];
          const src = publicImageUrl(thumb?.thumb_path);
          return (
            <Row key={p.id}>
              <Cell label="" className="w-16 max-md:hidden">
                <div className="relative aspect-[4/5] w-12 overflow-hidden rounded-sm bg-sand/50">
                  {src && <Image src={src} alt="" fill sizes="48px" className="object-cover" />}
                </div>
              </Cell>
              <Cell label="Producto">
                <span className="flex min-w-0 flex-col max-md:items-end">
                  <Link href={`/admin/productos/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <span className="text-sm text-muted">
                    {p.category?.name}, {AUDIENCE_LABEL[p.audience].toLowerCase()}
                  </span>
                </span>
              </Cell>
              <Cell label="Precio" className="tabular-nums">
                {p.sale_price ? (
                  <span>
                    {formatPrice(p.sale_price)} <span className="text-sm text-muted line-through">{formatPrice(p.price)}</span>
                  </span>
                ) : (
                  formatPrice(p.price)
                )}
              </Cell>
              <Cell label="Disponibles" className="tabular-nums">
                {p.variants.length === 0 ? <span className="text-sm text-muted">Sin variantes</span> : available}
              </Cell>
              <Cell label="Estado">
                <span className="flex flex-wrap gap-1">
                  {p.archived_at ? (
                    <Badge>Archivado</Badge>
                  ) : p.is_active ? (
                    <Badge tone="success">Visible</Badge>
                  ) : (
                    <Badge>Oculto</Badge>
                  )}
                  {!p.archived_at && p.variants.length > 0 && available === 0 && <Badge tone="soldout">Agotado</Badge>}
                  {p.is_new && <Badge tone="new">Nuevo</Badge>}
                  {p.is_featured && <Badge tone="sale">Destacado</Badge>}
                </span>
              </Cell>
            </Row>
          );
        })}
      </DataTable>
    </>
  );
}
