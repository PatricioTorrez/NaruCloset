import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Cell, DataTable, PageHeader, Row } from '@/components/admin/page-header';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { ReservationStatusBadge } from '@/components/admin/status-badges';
import { createClient } from '@/lib/supabase/server';
import { getStoreTimezone } from '@/lib/queries/admin';
import { formatDateTime } from '@/lib/format';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Apartados' };

const FILTERS = { abiertos: ['pending', 'confirmed'], cerrados: ['completed', 'cancelled', 'expired'] } as const;

export default async function ReservationsPage(props: PageProps<'/admin/apartados'>) {
  const sp = await props.searchParams;
  const filter = sp.estado === 'cerrados' ? 'cerrados' : 'abiertos';
  const supabase = await createClient();
  const tz = await getStoreTimezone();

  const { data, error } = await supabase
    .from('reservations')
    .select('id, reservation_number, customer_name, status, expires_at, holds_stock, created_at, items:reservation_items(quantity)')
    .in('status', [...FILTERS[filter]])
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  return (
    <>
      <PageHeader
        title="Apartados"
        description="Productos reservados para clientes. Los vencidos se liberan automáticamente cada 15 minutos."
        actions={
          <ButtonLink href="/admin/apartados/nuevo">
            <Plus className="size-4" aria-hidden /> Nuevo apartado
          </ButtonLink>
        }
      />
      <div className="mb-5 flex gap-1" role="group" aria-label="Filtro">
        {(['abiertos', 'cerrados'] as const).map((f) => (
          <Link
            key={f}
            href={`/admin/apartados?estado=${f}`}
            aria-current={filter === f ? 'page' : undefined}
            className={'inline-flex h-9 items-center rounded-md px-3 text-sm capitalize ' + (filter === f ? 'bg-espresso text-white' : 'hover:bg-sand/50')}
          >
            {f}
          </Link>
        ))}
      </div>
      <DataTable
        head={['Folio', 'Cliente', 'Piezas', 'Fecha límite', 'Estado']}
        empty={data.length === 0 && <EmptyState title={filter === 'abiertos' ? 'Sin apartados abiertos' : 'Sin apartados cerrados'} />}
      >
        {data.map((r) => (
          <Row key={r.id}>
            <Cell label="Folio">
              <Link href={`/admin/apartados/${r.id}`} className="font-medium tabular-nums hover:underline">
                #{r.reservation_number}
              </Link>
            </Cell>
            <Cell label="Cliente">{r.customer_name}</Cell>
            <Cell label="Piezas" className="tabular-nums">{r.items.reduce((s, i) => s + i.quantity, 0)}</Cell>
            <Cell label="Fecha límite" className="whitespace-nowrap">
              {r.expires_at ? formatDateTime(r.expires_at, tz) : <span className="text-muted">Sin límite</span>}
            </Cell>
            <Cell label="Estado"><ReservationStatusBadge status={r.status} /></Cell>
          </Row>
        ))}
      </DataTable>
    </>
  );
}
