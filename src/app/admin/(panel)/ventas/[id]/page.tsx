import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { FormMessage } from '@/components/ui/form';
import { createClient } from '@/lib/supabase/server';
import { getStoreTimezone } from '@/lib/queries/admin';
import { formatDateTime, formatPrice, PAYMENT_LABEL } from '@/lib/format';
import { uuid } from '@/lib/validations/schemas';
import { SaleStatusBadge } from '@/components/admin/status-badges';
import { SaleActions } from './sale-actions';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Detalle de venta' };

export default async function SaleDetailPage(props: PageProps<'/admin/ventas/[id]'>) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  if (!uuid.safeParse(id).success) notFound();

  const supabase = await createClient();
  const tz = await getStoreTimezone();
  const { data: sale, error } = await supabase
    .from('sales')
    .select(
      `*, seller:profiles!sales_created_by_fkey(full_name), canceller:profiles!sales_cancelled_by_fkey(full_name),
       items:sale_items(id, product_name, color_name, size_name, quantity, unit_price, line_total, returned_quantity),
       returns:sale_returns(id, returned_at, reason, items:sale_return_items(quantity, sale_item_id))`,
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!sale) notFound();

  const net = sale.items.reduce((s, i) => s + Number(i.unit_price) * (i.quantity - i.returned_quantity), 0);
  const itemName = new Map(sale.items.map((i) => [i.id, `${i.product_name} / ${i.color_name} / ${i.size_name}`]));

  return (
    <>
      <PageHeader
        title={`Venta #${sale.sale_number}`}
        back={{ href: '/admin/ventas', label: 'Ventas' }}
        description={<SaleStatusBadge status={sale.status} />}
        actions={
          sale.status !== 'cancelled' && (
            <SaleActions
              saleId={sale.id}
              canReturn={sale.status === 'completed' || sale.status === 'partially_returned'}
              items={sale.items
                .filter((i) => i.quantity - i.returned_quantity > 0)
                .map((i) => ({ id: i.id, label: itemName.get(i.id)!, max: i.quantity - i.returned_quantity }))}
            />
          )
        }
      />
      {sp.registrada && <div className="mb-6"><FormMessage tone="success">Venta registrada. Las existencias se descontaron.</FormMessage></div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel title="Productos">
          <ul className="divide-y divide-line">
            {sale.items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{i.product_name}</p>
                  <p className="text-sm text-muted">
                    {i.color_name} / {i.size_name}, {i.quantity} × {formatPrice(i.unit_price)}
                    {i.returned_quantity > 0 && `, ${i.returned_quantity} devuelta(s)`}
                  </p>
                </div>
                <span className="tabular-nums">{formatPrice(i.line_total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-1 border-t border-line pt-4 text-right tabular-nums">
            <div className="flex justify-between">
              <dt className="text-muted">Total original</dt>
              <dd>{formatPrice(sale.total)}</dd>
            </div>
            {net !== Number(sale.total) && sale.status !== 'cancelled' && (
              <div className="flex justify-between">
                <dt className="text-muted">Neto tras devoluciones</dt>
                <dd className="font-medium">{formatPrice(net)}</dd>
              </div>
            )}
          </dl>
        </Panel>

        <Panel title="Datos">
          <dl className="flex flex-col gap-3 text-[0.9375rem]">
            <Item label="Fecha">{formatDateTime(sale.sold_at, tz)}</Item>
            <Item label="Método de pago">{sale.payment_method ? PAYMENT_LABEL[sale.payment_method] : '—'}</Item>
            <Item label="Cliente">{sale.customer_reference ?? '—'}</Item>
            <Item label="Registró">{sale.seller?.full_name ?? '—'}</Item>
            {sale.notes && <Item label="Notas">{sale.notes}</Item>}
            {sale.reservation_id && (
              <Item label="Origen">
                <Link href={`/admin/apartados/${sale.reservation_id}`} className="underline underline-offset-4">
                  Apartado
                </Link>
              </Item>
            )}
            {sale.status === 'cancelled' && (
              <Item label="Cancelación">
                {sale.cancelled_at && formatDateTime(sale.cancelled_at, tz)}, {sale.canceller?.full_name}: {sale.cancel_reason}
              </Item>
            )}
          </dl>
        </Panel>
      </div>

      {sale.returns.length > 0 && (
        <div className="mt-6">
          <Panel title="Devoluciones">
            <ul className="divide-y divide-line">
              {sale.returns.map((r) => (
                <li key={r.id} className="py-3 text-[0.9375rem]">
                  <p className="text-sm text-muted">{formatDateTime(r.returned_at, tz)}</p>
                  <p>{r.reason}</p>
                  <ul className="mt-1 text-sm text-muted">
                    {r.items.map((ri) => (
                      <li key={ri.sale_item_id}>
                        {ri.quantity} × {itemName.get(ri.sale_item_id)}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
      <p className="mt-6 text-sm">
        <Link href={`/admin/movimientos?venta=${sale.id}`} className="underline underline-offset-4">
          Ver movimientos de inventario de esta venta
        </Link>
      </p>
    </>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}
