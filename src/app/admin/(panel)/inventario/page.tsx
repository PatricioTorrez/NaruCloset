import type { Metadata } from 'next';
import Link from 'next/link';
import { Cell, DataTable, PageHeader, Row } from '@/components/admin/page-header';
import { ButtonLink } from '@/components/ui/button';
import { Badge, EmptyState } from '@/components/ui/misc';
import { getAdmin } from '@/lib/auth/admin';
import { createClient } from '@/lib/supabase/server';
import { getVariantOptions } from '@/lib/queries/admin';
import { AdjustStockButton } from './adjust-stock';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Inventario' };

export default async function InventoryPage(props: PageProps<'/admin/inventario'>) {
  const sp = await props.searchParams;
  const q = typeof sp.q === 'string' ? sp.q.trim().toLowerCase().slice(0, 80) : '';
  const onlyLow = sp.filtro === 'bajo';
  const supabase = await createClient();
  const [admin, variants, { data: settings }] = await Promise.all([
    getAdmin(),
    getVariantOptions(),
    supabase.from('store_settings').select('low_stock_threshold').single(),
  ]);
  const threshold = settings?.low_stock_threshold ?? 2;
  const isOwner = admin?.role === 'owner';

  const rows = variants
    .filter((v) => !v.archived)
    .filter((v) => !q || `${v.productName} ${v.colorName} ${v.sizeName}`.toLowerCase().includes(q))
    .filter((v) => !onlyLow || (v.active && v.available <= threshold));

  const totals = rows.reduce((t, v) => ({ onHand: t.onHand + v.onHand, reserved: t.reserved + v.reserved, available: t.available + v.available }), { onHand: 0, reserved: 0, available: 0 });

  return (
    <>
      <PageHeader
        title="Inventario"
        description="Existencias por variante. En tienda = unidades físicas; apartadas = comprometidas; disponibles = lo que se puede vender."
        actions={<ButtonLink href="/admin/entradas/nueva" variant="secondary">Registrar entrada</ButtonLink>}
      />
      <form className="mb-5 flex flex-wrap items-center gap-3" role="search">
        <label htmlFor="q" className="sr-only">Buscar</label>
        <input id="q" name="q" defaultValue={q} placeholder="Producto, color o talla" className="h-11 w-full max-w-xs rounded-md border border-line bg-white px-3.5 focus:border-espresso focus:outline-none" />
        {onlyLow && <input type="hidden" name="filtro" value="bajo" />}
        <Link href={onlyLow ? '/admin/inventario' : '/admin/inventario?filtro=bajo'} className={'inline-flex h-9 items-center rounded-md px-3 text-sm ' + (onlyLow ? 'bg-espresso text-white' : 'border border-line bg-white hover:border-mocha')}>
          Pocas existencias (≤ {threshold})
        </Link>
      </form>
      <p className="mb-3 text-sm text-muted tabular-nums">
        {rows.length} variantes, {totals.onHand} en tienda, {totals.reserved} apartadas, {totals.available} disponibles
      </p>
      <DataTable
        head={['Producto', 'Variante', 'En tienda', 'Apartadas', 'Disponibles', '']}
        empty={rows.length === 0 && <EmptyState title="Sin resultados" />}
      >
        {rows.map((v) => (
          <Row key={v.id} className={!v.active ? 'text-muted' : ''}>
            <Cell label="Producto">
              <Link href={`/admin/productos/${v.productId}`} className="font-medium hover:underline">{v.productName}</Link>
            </Cell>
            <Cell label="Variante">
              <span className="flex items-center gap-2">
                <span className="size-3.5 rounded-full border border-line" style={{ backgroundColor: v.colorHex }} aria-hidden />
                {v.colorName} / {v.sizeName}
                {!v.active && <Badge>Inactiva</Badge>}
              </span>
            </Cell>
            <Cell label="En tienda" className="tabular-nums">{v.onHand}</Cell>
            <Cell label="Apartadas" className="tabular-nums">{v.reserved}</Cell>
            <Cell label="Disponibles" className="tabular-nums">
              <span className="flex items-center gap-2">
                <span className="font-medium">{v.available}</span>
                {v.active && v.available === 0 && <Badge tone="soldout">Agotada</Badge>}
                {v.active && v.available > 0 && v.available <= threshold && <Badge tone="warning">Pocas</Badge>}
              </span>
            </Cell>
            <Cell label="Acciones" className="text-right">
              <div className="flex justify-end gap-1">
                <Link href={`/admin/movimientos?variante=${v.id}`} className="inline-flex h-9 items-center rounded-md px-2.5 text-sm hover:bg-sand/50">Historial</Link>
                {isOwner && <AdjustStockButton variantId={v.id} label={`${v.productName} / ${v.colorName} / ${v.sizeName}`} onHand={v.onHand} reserved={v.reserved} />}
              </div>
            </Cell>
          </Row>
        ))}
      </DataTable>
    </>
  );
}
