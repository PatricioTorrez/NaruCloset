import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { AttributeManager } from './attribute-manager';
import { createClient } from '@/lib/supabase/server';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Colores y tallas' };

export default async function AttributesPage() {
  const supabase = await createClient();
  const [colors, sizes] = await Promise.all([
    supabase.from('colors').select('*').order('sort_order').order('name'),
    supabase.from('sizes').select('*').order('sort_order').order('name'),
  ]);
  if (colors.error || sizes.error) throw new Error('No se pudieron cargar los atributos.');

  return (
    <>
      <PageHeader
        title="Colores y tallas"
        description="Cada variante de producto combina un color y una talla. Desactive en lugar de eliminar si ya se usan."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <AttributeManager kind="colors" items={colors.data} />
        <AttributeManager kind="sizes" items={sizes.data.map((s) => ({ ...s, hex: null }))} />
      </div>
    </>
  );
}
