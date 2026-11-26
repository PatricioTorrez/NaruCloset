import type { Metadata } from 'next';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { EmptyState } from '@/components/ui/misc';
import { getVariantOptions } from '@/lib/queries/admin';
import { SaleForm } from './sale-form';

export const metadata: Metadata = { title: 'Nueva venta' };

export default async function NewSalePage() {
  const variants = await getVariantOptions();
  const sellable = variants.some((v) => v.available > 0 && !v.archived && v.active);
  return (
    <>
      <PageHeader
        title="Registrar venta"
        back={{ href: '/admin/ventas', label: 'Ventas' }}
        description="Al confirmar se descuentan las unidades. No es posible vender más de lo disponible."
      />
      <Panel>
        {sellable ? (
          <SaleForm variants={variants} />
        ) : (
          <EmptyState title="No hay existencias disponibles" description="Registre una entrada de mercancía primero." />
        )}
      </Panel>
    </>
  );
}
