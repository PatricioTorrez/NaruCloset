import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { ReservationStatusBadge } from '@/components/admin/status-badges';
import { createClient } from '@/lib/supabase/server';
import { getStoreTimezone } from '@/lib/queries/admin';
import { formatDateTime, formatPrice, isPast } from '@/lib/format';
import { uuid } from '@/lib/validations/schemas';
import { ReservationActions } from './reservation-actions';

export const metadata: Metadata = { title: 'Detalle de apartado' };

export default async function ReservationDetailPage(props: PageProps<'/admin/apartados/[id]'>) {
  const { id } = await props.params;
  if (!uuid.safeParse(id).success) notFound();
  const supabase = await createClient();
  const tz = await getStoreTimezone();

  const { data: r, error } = await supabase
    .from('reservations')
    .select(
      `*, creator:profiles!reservations_created_by_fkey(full_name),
       items:reservation_items(id, quantity, unit_price, variant:product_variants(stock_available, product:products(name), color:colors(name), size:sizes(name)))`,
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!r) notFound();

  const total = r.items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
  const open = r.status === 'pending' || r.status === 'confirmed';
  const expired = isPast(r.expires_at);

  return (
    <>
      <PageHeader
        title={`Apartado #${r.reservation_number}`}
        back={{ href: '/admin/apartados', label: 'Apartados' }}
        description={<ReservationStatusBadge status={r.status} />}
        actions={open && <ReservationActions id={r.id} status={r.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel title="Productos apartados">
          <ul className="divide-y divide-line">
            {r.items.map((i) => (
              <li key={i.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{i.variant?.product?.name}</p>
                  <p className="text-sm text-muted">
                    {i.variant?.color?.name} / {i.variant?.size?.name}, {i.quantity} × {formatPrice(i.unit_price)}
                  </p>
                </div>
                <span className="tabular-nums">{formatPrice(Number(i.unit_price) * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-line pt-4 text-right tabular-nums">
            Total al apartar: <span className="font-medium">{formatPrice(total)}</span>
          </p>
        </Panel>
        <Panel title="Datos">
          <dl className="flex flex-col gap-3 text-[0.9375rem]">
            <D label="Cliente">{r.customer_name}</D>
            <D label="Contacto">{r.customer_contact ?? '—'}</D>
            <D label="Creado">{formatDateTime(r.created_at, tz)}{r.creator?.full_name && `, ${r.creator.full_name}`}</D>
            <D label="Fecha límite">
              {r.expires_at ? formatDateTime(r.expires_at, tz) : 'Sin límite'}
              {open && expired && <span className="block text-sm text-danger">Vencido; se liberará en el próximo ciclo automático.</span>}
            </D>
            <D label="Existencias">{r.holds_stock ? 'Retiene las unidades' : 'Solo registro (no retiene)'}</D>
            {r.notes && <D label="Observaciones">{r.notes}</D>}
            {r.closed_reason && <D label="Motivo de cierre">{r.closed_reason}</D>}
            {r.sale_id && (
              <D label="Venta">
                <Link href={`/admin/ventas/${r.sale_id}`} className="underline underline-offset-4">
                  Ver venta generada
                </Link>
              </D>
            )}
          </dl>
        </Panel>
      </div>
    </>
  );
}

function D({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}
