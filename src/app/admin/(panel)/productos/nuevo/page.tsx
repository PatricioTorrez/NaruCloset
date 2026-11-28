import type { Metadata } from 'next';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { createClient } from '@/lib/supabase/server';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Nuevo producto' };

export default async function NewProductPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: colors }] = await Promise.all([
    supabase.from('categories').select('id, name, icon').order('sort_order').order('name'),
    supabase.from('colors').select('id, name, hex').eq('is_active', true).order('sort_order').order('name'),
  ]);

  return (
    <>
      <PageHeader
        title="Nuevo producto"
        back={{ href: '/admin/productos', label: 'Productos' }}
        description="Datos del modelo, sus colores y fotografías. Las tallas y cantidades se capturan después en Inventario; ahí también decide cuándo se muestra en la tienda."
      />
      <Panel>
        <ProductForm categories={categories ?? []} colors={colors ?? []} />
      </Panel>
    </>
  );
}
