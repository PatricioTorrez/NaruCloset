import type { Metadata } from 'next';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { EmptyState } from '@/components/ui/misc';
import { createClient } from '@/lib/supabase/server';
import { getVariantOptions } from '@/lib/queries/admin';
import { ReservationForm } from './reservation-form';

export const metadata: Metadata = { title: 'Nuevo apartado' };

export default async function NewReservationPage() {
  const supabase = await createClient();
  const [variants, { data: settings }] = await Promise.all([
    getVariantOptions(),
    supabase.from('store_settings').select('reservations_hold_stock, reservation_default_days').single(),
  ]);
  const sellable = variants.some((v) => v.available > 0 && v.active && !v.archived);

  return (
    <>
      <PageHeader
        title="Nuevo apartado"
        back={{ href: '/admin/apartados', label: 'Apartados' }}
        description={
          settings?.reservations_hold_stock
            ? 'Política actual: las unidades apartadas dejan de estar disponibles para venta hasta completar, cancelar o vencer el apartado.'
            : 'Política actual: el apartado solo se registra; las unidades siguen disponibles para venta.'
        }
      />
      <Panel>
        {sellable ? (
          <ReservationForm variants={variants} defaultDays={settings?.reservation_default_days ?? null} />
        ) : (
          <EmptyState title="No hay existencias disponibles" description="Registre mercancía antes de crear apartados." />
        )}
      </Panel>
    </>
  );
}
