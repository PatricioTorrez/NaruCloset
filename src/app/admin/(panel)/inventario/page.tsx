import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form';
import { Badge, EmptyState } from '@/components/ui/misc';
import { PageHeader } from '@/components/admin/page-header';
import { getAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { publicImageUrl } from '@/lib/env';
import { formatPrice } from '@/lib/format';
import { AUDIENCES, CategoryIcon } from '@/lib/icons';
import { cn } from '@/lib/cn';
import { AddColorsButton, AddStockButton, EditStockButton, RemoveProductButton, VisibilityToggle } from './inventory-controls';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Inventario' };

export default async function InventoryPage(props: PageProps<'/admin/inventario'>) {
  const sp = await props.searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim().toLowerCase().slice(0, 80) : '';
  const onlyLow = sp.filtro === 'bajo';
  const focusId = typeof sp.producto === 'string' ? sp.producto : null;
  const supabase = await createClient();
  const [admin, products, sizes, allColors, { data: settings }] = await Promise.all([
    getAdmin(),
    supabase
      .from('products')
      .select(
        `id, name, price, sale_price, audience, is_active, created_at,
         category:categories(name, icon),
         colors:product_colors(price, sort_order, color:colors(id, name, hex, sort_order)),
         variants:product_variants(id, color_id, is_active, stock_on_hand, stock_reserved, stock_available, size:sizes(id, name, sort_order)),
         images:product_images(thumb_path, color_id, is_primary, sort_order)`,
      )
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase.from('sizes').select('id, name').eq('is_active', true).order('sort_order').order('name'),
    supabase.from('colors').select('id, name, hex').eq('is_active', true).order('sort_order').order('name'),
    supabase.from('store_settings').select('low_stock_threshold').single(),
  ]);
  if (products.error) throw new Error(products.error.message);
  const threshold = settings?.low_stock_threshold ?? 2;
  const isOwner = admin?.role === 'owner';

  const list = products.data
    .map((p) => {
      const colors = [...p.colors]
        .filter((c) => c.color)
        .sort((a, b) => a.sort_order - b.sort_order || a.color!.sort_order - b.color!.sort_order)
        .map((c) => {
          const variants = p.variants
            .filter((v) => v.color_id === c.color!.id && v.size)
            .sort((a, b) => a.size!.sort_order - b.size!.sort_order);
          return { color: c.color!, price: Number(c.price ?? p.sale_price ?? p.price), variants };
        });
      const images = [...p.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order);
      const active = p.variants.filter((v) => v.is_active);
      return {
        ...p,
        colors,
        thumb: publicImageUrl(images[0]?.thumb_path),
        hasPhotos: images.length > 0,
        onHand: active.reduce((n, v) => n + v.stock_on_hand, 0),
        // Sin piezas ni apartados en ninguna talla (activa o no): se puede quitar.
        empty: p.variants.every((v) => v.stock_on_hand === 0 && v.stock_reserved === 0),
        available: active.reduce((n, v) => n + (v.stock_available ?? 0), 0),
        low: active.some((v) => (v.stock_available ?? 0) <= threshold),
      };
    })
    .filter((p) => !q || `${p.name} ${p.category?.name ?? ''} ${p.colors.map((c) => c.color.name).join(' ')}`.toLowerCase().includes(q))
    .filter((p) => !onlyLow || p.low)
    // El producto recién creado va primero.
    .sort((a, b) => Number(b.id === focusId) - Number(a.id === focusId));

  const visibleCount = list.filter((p) => p.is_active).length;

  return (
    <>
      <PageHeader
        title="Inventario"
        description="Tallas y piezas de cada color. El ojo indica si el producto se muestra en la tienda."
        actions={
          <>
            <ButtonLink href="/admin/productos/nuevo" variant="secondary">Nuevo producto</ButtonLink>
            <ButtonLink href="/admin/entradas/nueva" variant="ghost">Entrada de varios productos</ButtonLink>
          </>
        }
      />
      {sp.creado && focusId && (
        <div className="mb-6">
          <FormMessage tone="success">
            Producto creado y oculto. Agregue las piezas de cada color y, cuando esté listo, toque el ojo para mostrarlo en la tienda.
          </FormMessage>
        </div>
      )}
      <form className="mb-5 flex flex-wrap items-center gap-3" role="search">
        <label htmlFor="q" className="sr-only">Buscar</label>
        <input id="q" name="q" defaultValue={q} placeholder="Producto, categoría o color" className="h-11 w-full max-w-xs rounded-md border border-line bg-white px-3.5 focus:border-espresso focus:outline-none" />
        {onlyLow && <input type="hidden" name="filtro" value="bajo" />}
        <Link href={onlyLow ? '/admin/inventario' : '/admin/inventario?filtro=bajo'} className={'inline-flex h-9 items-center rounded-md px-3 text-sm ' + (onlyLow ? 'bg-espresso text-white' : 'border border-line bg-white hover:border-mocha')}>
          Pocas existencias (≤ {threshold})
        </Link>
      </form>
      <p className="mb-4 text-sm text-muted tabular-nums">
        {list.length} productos · {visibleCount} visibles en la tienda · {list.reduce((n, p) => n + p.onHand, 0)} piezas en tienda
      </p>

      {list.length === 0 ? (
        <EmptyState title="Sin resultados" />
      ) : (
        <ul className="flex flex-col gap-4">
          {list.map((p) => {
            const audience = AUDIENCES[p.audience];
            return (
              <li
                key={p.id}
                id={`p-${p.id}`}
                className={cn('overflow-hidden rounded-lg border bg-white', p.id === focusId ? 'border-espresso' : 'border-line')}
              >
                <div className="flex flex-wrap items-center gap-4 border-b border-line p-4">
                  <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-sm bg-sand/50">
                    {p.thumb && <Image src={p.thumb} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/productos/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <CategoryIcon icon={p.category?.icon} className="size-4" />
                        {p.category?.name}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <audience.Icon className="size-4" aria-hidden strokeWidth={1.5} />
                        {audience.label}
                      </span>
                      <span className="tabular-nums">{p.available} disponibles</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <VisibilityToggle productId={p.id} productName={p.name} visible={p.is_active} available={p.available} hasPhotos={p.hasPhotos} />
                    {p.empty && <RemoveProductButton productId={p.id} productName={p.name} />}
                    <ButtonLink href={`/admin/productos/${p.id}`} variant="ghost" size="sm">
                      Editar
                    </ButtonLink>
                  </div>
                </div>

                {p.colors.length === 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <p className="text-sm text-muted">Este producto aún no tiene colores. Agregue uno para capturar sus tallas y piezas.</p>
                    <AddColorsButton productId={p.id} productName={p.name} colors={allColors.data ?? []} prominent />
                  </div>
                ) : (
                  <>
                  <ul className="divide-y divide-line">
                    {p.colors.map((c, ci) => (
                      <li key={c.color.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-start">
                        <div className="flex min-w-44 items-center gap-2.5">
                          <span className="size-6 shrink-0 rounded-full border border-line" style={{ backgroundColor: c.color.hex }} aria-hidden />
                          <div>
                            <p className="text-[0.9375rem] font-medium">{c.color.name}</p>
                            <p className="text-sm text-muted tabular-nums">{formatPrice(c.price)}</p>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-wrap gap-2">
                          {c.variants.length === 0 && <p className="self-center text-sm text-muted">Sin tallas todavía.</p>}
                          {c.variants.map((v) => {
                            const avail = v.stock_available ?? 0;
                            return (
                              <div
                                key={v.id}
                                className={cn(
                                  'flex min-w-20 flex-col items-center rounded-md border px-2.5 py-1.5 text-center',
                                  !v.is_active
                                    ? 'border-dashed border-line text-muted'
                                    : avail === 0
                                      ? 'border-line bg-ivory text-muted'
                                      : avail <= threshold
                                        ? 'border-[#e3cfae] bg-[#f8efe1]'
                                        : 'border-line',
                                )}
                                title={!v.is_active ? 'Talla inactiva' : undefined}
                              >
                                <span className="text-xs text-muted">{v.size!.name}</span>
                                <span className="text-lg leading-tight font-medium tabular-nums">{v.stock_on_hand}</span>
                                {v.stock_reserved > 0 && <span className="text-[0.6875rem] text-muted">{v.stock_reserved} apart.</span>}
                                {avail === 0 && v.is_active && <Badge tone="soldout" className="mt-0.5 h-5 px-1.5 text-[0.625rem]">Agotada</Badge>}
                                <span className="mt-0.5 flex">
                                  <Link href={`/admin/movimientos?variante=${v.id}`} className="px-1 text-[0.6875rem] text-muted underline-offset-2 hover:underline">
                                    Historial
                                  </Link>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-end">
                          {isOwner && c.variants.length > 0 && (
                            <EditStockButton
                              productName={p.name}
                              color={c.color}
                              variants={c.variants.map((v) => ({ id: v.id, size: v.size!.name, onHand: v.stock_on_hand, reserved: v.stock_reserved }))}
                            />
                          )}
                          <AddStockButton
                            productId={p.id}
                            productName={p.name}
                            color={c.color}
                            sizes={sizes.data ?? []}
                            current={Object.fromEntries(c.variants.map((v) => [v.size!.id, v.stock_on_hand]))}
                            autoOpen={Boolean(sp.creado) && p.id === focusId && ci === 0}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-line px-4 py-2">
                    <AddColorsButton
                      productId={p.id}
                      productName={p.name}
                      colors={(allColors.data ?? []).filter((x) => !p.colors.some((c) => c.color.id === x.id))}
                    />
                  </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
