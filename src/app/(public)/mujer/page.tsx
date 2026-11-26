import type { Metadata } from 'next';
import { CatalogView } from '@/components/public/catalog-view';

export const metadata: Metadata = {
  title: 'Mujer',
  description: 'Prendas de la colección para mujer.',
  alternates: { canonical: '/mujer' },
};

export default function Page(props: PageProps<'/mujer'>) {
  return (
    <CatalogView
      title="Mujer"
      intro="Prendas de la colección para mujer."
      basePath="/mujer"
      preset={{ audience: 'women' }}
      searchParams={props.searchParams}
    />
  );
}
