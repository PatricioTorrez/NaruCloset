import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { EmptyState } from '@/components/ui/misc';
import { getVariantOptions } from '@/lib/queries/admin';
import { EntryForm } from './entry-form';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Nueva entrada' };

export default async function NewEntryPage() {
  const variants = await getVariantOptions();
  return (
    <>
      <PageHeader
        title="Nueva entrada de mercancía"
        back={{ href: '/admin/entradas', label: 'Entradas' }}
        description="Al confirmar, las existencias de cada variante aumentan y queda registrado en el historial."
      />
      <Panel>
        {variants.length === 0 ? (
          <EmptyState
            title="No hay variantes"
            description="Cree productos con sus combinaciones de color y talla antes de registrar mercancía."
            action={<Link href="/admin/productos" className="underline underline-offset-4">Ir a productos</Link>}
          />
        ) : (
          <EntryForm variants={variants} />
        )}
      </Panel>
    </>
  );
}
