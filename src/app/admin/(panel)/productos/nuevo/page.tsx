import type { Metadata } from 'next';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { ProductForm } from '@/components/admin/product-form';
import { createClient } from '@/lib/supabase/server';

// Panel: depende de la sesión en cada petición (sin navegación instantánea).
export const instant = false;

export const metadata: Metadata = { title: 'Nuevo producto' };

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from('categories').select('id, name').order('sort_order').order('name');

  return (
    <>
      <PageHeader
        title="Nuevo producto"
        back={{ href: '/admin/productos', label: 'Productos' }}
        description="Después de crearlo podrá agregar variantes de color y talla y sus fotografías."
      />
      <Panel>
        <ProductForm categories={categories ?? []} />
      </Panel>
    </>
  );
}
