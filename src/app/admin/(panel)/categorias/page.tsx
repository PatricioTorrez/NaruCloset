import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/page-header';
import { CategoryManager } from './category-manager';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Categorías' };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories, error }, { data: counts }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order').order('name'),
    supabase.from('products').select('category_id').is('archived_at', null),
  ]);
  if (error) throw new Error(error.message);

  const productCount = new Map<string, number>();
  for (const p of counts ?? []) productCount.set(p.category_id, (productCount.get(p.category_id) ?? 0) + 1);

  return (
    <>
      <PageHeader
        title="Categorías"
        description="Organizan el catálogo y aparecen como filtros en el sitio. Puede crear las que necesite."
      />
      <CategoryManager
        categories={categories.map((c) => ({ ...c, product_count: productCount.get(c.id) ?? 0 }))}
      />
    </>
  );
}
