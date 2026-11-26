import type { Metadata } from 'next';
import { CatalogView } from '@/components/public/catalog-view';

export const metadata: Metadata = {
  title: 'Hombre',
  description: 'Prendas de la colección para hombre.',
  alternates: { canonical: '/hombre' },
};

export default function Page(props: PageProps<'/hombre'>) {
  return (
    <CatalogView
      title="Hombre"
      intro="Prendas de la colección para hombre."
      basePath="/hombre"
      preset={{ audience: 'men' }}
      searchParams={props.searchParams}
    />
  );
}
