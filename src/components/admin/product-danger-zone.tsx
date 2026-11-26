'use client';

import { useRouter } from 'next/navigation';
import { deleteProduct, setProductArchived } from '@/lib/actions/catalog';
import { ConfirmAction } from '@/components/ui/confirm';
import { Panel } from './page-header';

export function ProductDangerZone({ productId, archived }: { productId: string; archived: boolean }) {
  const router = useRouter();
  return (
    <Panel title="Archivar o eliminar">
      <div className="flex flex-col gap-4 text-[0.9375rem] text-muted md:flex-row md:items-center md:justify-between">
        <p className="max-w-xl">
          Archivar oculta el producto del catálogo y conserva todo su historial. Eliminar solo es posible si nunca tuvo
          movimientos, ventas ni apartados.
        </p>
        <div className="flex gap-2">
          <ConfirmAction
            trigger={archived ? 'Restaurar' : 'Archivar'}
            tone="primary"
            title={archived ? 'Restaurar producto' : 'Archivar producto'}
            description={
              archived
                ? 'El producto vuelve al panel como oculto. Actívelo cuando quiera mostrarlo.'
                : 'Dejará de mostrarse en el catálogo. Ventas, apartados y movimientos se conservan.'
            }
            confirmLabel={archived ? 'Restaurar' : 'Archivar'}
            action={() => setProductArchived(productId, !archived)}
            onDone={() => router.refresh()}
          />
          <ConfirmAction
            trigger="Eliminar"
            triggerVariant="danger"
            title="Eliminar producto"
            description="Se eliminan el producto, sus variantes sin historial y sus fotografías. No se puede deshacer."
            confirmLabel="Eliminar definitivamente"
            action={() => deleteProduct(productId)}
          />
        </div>
      </div>
    </Panel>
  );
}
