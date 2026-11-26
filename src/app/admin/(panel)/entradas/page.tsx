import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import { Cell, DataTable, PageHeader, Row } from '@/components/admin/page-header';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { FormMessage } from '@/components/ui/form';
import { createClient } from '@/lib/supabase/server';
import { getAdmin } from '@/lib/auth/admin';
import { getStoreTimezone } from '@/lib/queries/admin';
import { formatDateTime, formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Entradas de mercancía' };

export default async function EntriesPage(props: PageProps<'/admin/entradas'>) {
  const sp = await props.searchParams;
  const supabase = await createClient();
  const [admin, tz] = await Promise.all([getAdmin(), getStoreTimezone()]);
  const isOwner = admin?.role === 'owner';

  const { data: entries, error } = await supabase
    .from('stock_entries')
    .select(
      'id, received_at, supplier, notes, created_by_profile:profiles(full_name), items:stock_entry_items(id, quantity, variant:product_variants(product:products(name), color:colors(name), size:sizes(name)))',
    )
    .order('received_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);

  // Costos: solo visibles para el owner (RLS devuelve vacío para staff).
  const costs = new Map<string, number>();
  if (isOwner) {
    const ids = entries.flatMap((e) => e.items.map((i) => i.id));
    if (ids.length) {
      const { data } = await supabase.from('stock_entry_item_costs').select('stock_entry_item_id, unit_cost').in('stock_entry_item_id', ids);
      for (const c of data ?? []) costs.set(c.stock_entry_item_id, Number(c.unit_cost));
    }
  }

  return (
    <>
      <PageHeader
        title="Entradas de mercancía"
        description="Cada entrada aumenta las existencias de las variantes recibidas."
        actions={
          <ButtonLink href="/admin/entradas/nueva">
            <Plus className="size-4" aria-hidden /> Registrar entrada
          </ButtonLink>
        }
      />
      {sp.registrada && <div className="mb-4"><FormMessage tone="success">Entrada registrada. Las existencias se actualizaron.</FormMessage></div>}
      <DataTable
        head={['Fecha', 'Productos', 'Unidades', isOwner ? 'Costo total' : 'Proveedor', 'Registró']}
        empty={entries.length === 0 && <EmptyState title="Sin entradas" description="Registre la mercancía que llega para cargar existencias." />}
      >
        {entries.map((e) => {
          const units = e.items.reduce((s, i) => s + i.quantity, 0);
          const totalCost = e.items.reduce((s, i) => s + (costs.get(i.id) ?? 0) * i.quantity, 0);
          const hasCost = e.items.some((i) => costs.has(i.id));
          return (
            <Row key={e.id}>
              <Cell label="Fecha" className="whitespace-nowrap">{formatDateTime(e.received_at, tz)}</Cell>
              <Cell label="Productos">
                <ul className="text-sm max-md:text-right">
                  {e.items.slice(0, 4).map((i) => (
                    <li key={i.id}>
                      {i.quantity} × {i.variant?.product?.name} <span className="text-muted">/ {i.variant?.color?.name} / {i.variant?.size?.name}</span>
                    </li>
                  ))}
                  {e.items.length > 4 && <li className="text-muted">y {e.items.length - 4} más</li>}
                </ul>
                {e.notes && <p className="mt-1 text-sm text-muted">{e.notes}</p>}
              </Cell>
              <Cell label="Unidades" className="tabular-nums">{units}</Cell>
              <Cell label={isOwner ? 'Costo total' : 'Proveedor'}>
                {isOwner ? (hasCost ? formatPrice(totalCost) : <span className="text-muted">—</span>) : e.supplier ?? <span className="text-muted">—</span>}
                {isOwner && e.supplier && <p className="text-sm text-muted">{e.supplier}</p>}
              </Cell>
              <Cell label="Registró" className="text-sm text-muted">{e.created_by_profile?.full_name ?? '—'}</Cell>
            </Row>
          );
        })}
      </DataTable>
    </>
  );
}
