import type { Metadata } from 'next';
import Link from 'next/link';
import { Cell, DataTable, PageHeader, Row } from '@/components/admin/page-header';
import { EmptyState } from '@/components/ui/misc';
import { createClient } from '@/lib/supabase/server';
import { getStoreTimezone } from '@/lib/queries/admin';
import { formatDateTime, MOVEMENT_LABEL } from '@/lib/format';
import { uuid } from '@/lib/validations/schemas';
import type { Database } from '@/types/database';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Movimientos' };

type MovementType = Database['public']['Enums']['movement_type'];
const PAGE = 100;

function Delta({ n }: { n: number }) {
  if (n === 0) return <span className="text-muted">0</span>;
  return <span className={n > 0 ? 'text-success' : 'text-danger'}>{n > 0 ? `+${n}` : n}</span>;
}

export default async function MovementsPage(props: PageProps<'/admin/movimientos'>) {
  const sp = await props.searchParams;
  const variantId = typeof sp.variante === 'string' && uuid.safeParse(sp.variante).success ? sp.variante : null;
  const saleId = typeof sp.venta === 'string' && uuid.safeParse(sp.venta).success ? sp.venta : null;
  const type = typeof sp.tipo === 'string' && sp.tipo in MOVEMENT_LABEL ? (sp.tipo as MovementType) : null;
  const page = Math.max(1, Number.parseInt(typeof sp.pagina === 'string' ? sp.pagina : '1', 10) || 1);

  const supabase = await createClient();
  const tz = await getStoreTimezone();
  let query = supabase
    .from('inventory_movements')
    .select(
      'id, movement_type, on_hand_delta, reserved_delta, on_hand_before, on_hand_after, reserved_before, reserved_after, reason, sale_id, reservation_id, created_at, actor:profiles(full_name), variant:product_variants(id, product:products(id, name), color:colors(name), size:sizes(name))',
      { count: 'exact' },
    )
    .order('id', { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);
  if (variantId) query = query.eq('variant_id', variantId);
  if (saleId) query = query.eq('sale_id', saleId);
  if (type) query = query.eq('movement_type', type);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));
  const base = new URLSearchParams();
  if (variantId) base.set('variante', variantId);
  if (saleId) base.set('venta', saleId);
  if (type) base.set('tipo', type);
  const pageHref = (p: number) => {
    const s = new URLSearchParams(base);
    if (p > 1) s.set('pagina', String(p));
    return `/admin/movimientos${s.size ? `?${s}` : ''}`;
  };

  return (
    <>
      <PageHeader
        title="Movimientos de inventario"
        description="Historial inmutable: cada cambio de existencias con su motivo, el usuario y las cantidades antes y después."
      />
      <form className="mb-5 flex flex-wrap items-center gap-3">
        {variantId && <input type="hidden" name="variante" value={variantId} />}
        <label htmlFor="tipo" className="sr-only">Tipo</label>
        <select id="tipo" name="tipo" defaultValue={type ?? ''} className="h-11 rounded-md border border-line bg-white px-3 text-sm">
          <option value="">Todos los tipos</option>
          {Object.entries(MOVEMENT_LABEL).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-md border border-espresso px-4 text-sm">Filtrar</button>
        {(variantId || saleId || type) && (
          <Link href="/admin/movimientos" className="text-sm underline underline-offset-4">Quitar filtros</Link>
        )}
      </form>

      <DataTable
        head={['Fecha', 'Variante', 'Tipo', 'En tienda', 'Apartadas', 'Motivo', 'Usuario']}
        empty={data.length === 0 && <EmptyState title="Sin movimientos" />}
      >
        {data.map((m) => (
          <Row key={m.id}>
            <Cell label="Fecha" className="whitespace-nowrap text-sm">{formatDateTime(m.created_at, tz)}</Cell>
            <Cell label="Variante">
              <span className="flex flex-col max-md:items-end">
                <Link href={`/admin/productos/${m.variant?.product?.id}`} className="hover:underline">{m.variant?.product?.name}</Link>
                <span className="text-sm text-muted">{m.variant?.color?.name} / {m.variant?.size?.name}</span>
              </span>
            </Cell>
            <Cell label="Tipo" className="text-sm">
              {m.sale_id ? <Link href={`/admin/ventas/${m.sale_id}`} className="underline underline-offset-4">{MOVEMENT_LABEL[m.movement_type]}</Link>
                : m.reservation_id ? <Link href={`/admin/apartados/${m.reservation_id}`} className="underline underline-offset-4">{MOVEMENT_LABEL[m.movement_type]}</Link>
                : MOVEMENT_LABEL[m.movement_type]}
            </Cell>
            <Cell label="En tienda" className="whitespace-nowrap tabular-nums text-sm">
              {m.on_hand_before} → {m.on_hand_after} (<Delta n={m.on_hand_delta} />)
            </Cell>
            <Cell label="Apartadas" className="whitespace-nowrap tabular-nums text-sm">
              {m.reserved_delta === 0 ? <span className="text-muted">{m.reserved_after}</span> : <>{m.reserved_before} → {m.reserved_after} (<Delta n={m.reserved_delta} />)</>}
            </Cell>
            <Cell label="Motivo" className="max-w-56 text-sm text-muted">{m.reason ?? '—'}</Cell>
            <Cell label="Usuario" className="text-sm">{m.actor?.full_name ?? 'Sistema'}</Cell>
          </Row>
        ))}
      </DataTable>
      {pages > 1 && (
        <nav aria-label="Paginación" className="mt-6 flex items-center justify-center gap-4 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)} className="underline">Anterior</Link>}
          <span className="text-muted">Página {page} de {pages}</span>
          {page < pages && <Link href={pageHref(page + 1)} className="underline">Siguiente</Link>}
        </nav>
      )}
    </>
  );
}
