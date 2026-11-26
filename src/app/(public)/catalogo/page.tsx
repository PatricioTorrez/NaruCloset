import type { Metadata } from 'next';
import { CatalogView } from '@/components/public/catalog-view';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Toda la colección de Naru Closet: busca por nombre y filtra por categoría, talla y color.',
  alternates: { canonical: '/catalogo' },
};

export default function Page(props: PageProps<'/catalogo'>) {
  return (
    <CatalogView
      title="Catálogo"
      intro="Toda la colección de Naru Closet: busca por nombre y filtra por categoría, talla y color."
      basePath="/catalogo"
      
      searchParams={props.searchParams}
    />
  );
}
