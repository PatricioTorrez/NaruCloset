import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Cell, DataTable, PageHeader, Row } from '@/components/admin/page-header';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { SaleStatusBadge } from '@/components/admin/status-badges';
import { createClient } from '@/lib/supabase/server';
import { getStoreTimezone } from '@/lib/queries/admin';
import { formatDateTime, formatPrice, PAYMENT_LABEL } from '@/lib/format';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Ventas' };

export default async function SalesPage() {
  const supabase = await createClient();
  const tz = await getStoreTimezone();
  const { data: sales, error } = await supabase
    .from('sales')
    .select('id, sale_number, sold_at, status, payment_method, total, customer_reference, items:sale_items(quantity, returned_quantity, unit_price)')
    .order('sold_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader
        title="Ventas"
        description="Las ventas no se borran: se cancelan o se registran devoluciones, y todo queda en el historial."
        actions={
          <ButtonLink href="/admin/ventas/nueva">
            <Plus className="size-4" aria-hidden /> Registrar venta
          </ButtonLink>
        }
      />
      <DataTable
        head={['Folio', 'Fecha', 'Cliente', 'Pago', 'Total', 'Estado']}
        empty={sales.length === 0 && <EmptyState title="Sin ventas registradas" />}
      >
        {sales.map((s) => {
          const net = s.items.reduce((sum, i) => sum + Number(i.unit_price) * (i.quantity - i.returned_quantity), 0);
          return (
            <Row key={s.id}>
              <Cell label="Folio">
                <Link href={`/admin/ventas/${s.id}`} className="font-medium tabular-nums hover:underline">
                  #{s.sale_number}
                </Link>
              </Cell>
              <Cell label="Fecha" className="whitespace-nowrap">{formatDateTime(s.sold_at, tz)}</Cell>
              <Cell label="Cliente">{s.customer_reference ?? <span className="text-muted">—</span>}</Cell>
              <Cell label="Pago">{s.payment_method ? PAYMENT_LABEL[s.payment_method] : <span className="text-muted">—</span>}</Cell>
              <Cell label="Total" className="tabular-nums">
                {s.status === 'cancelled' ? (
                  <span className="text-muted line-through">{formatPrice(s.total)}</span>
                ) : net !== Number(s.total) ? (
                  <span>
                    {formatPrice(net)} <span className="text-sm text-muted line-through">{formatPrice(s.total)}</span>
                  </span>
                ) : (
                  formatPrice(s.total)
                )}
              </Cell>
              <Cell label="Estado"><SaleStatusBadge status={s.status} /></Cell>
            </Row>
          );
        })}
      </DataTable>
    </>
  );
}
