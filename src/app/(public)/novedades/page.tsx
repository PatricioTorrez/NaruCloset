import type { Metadata } from 'next';
import { CatalogView } from '@/components/public/catalog-view';

export const metadata: Metadata = {
  title: 'Novedades',
  description: 'Lo más nuevo en Naru Closet.',
  alternates: { canonical: '/novedades' },
};

export default function Page(props: PageProps<'/novedades'>) {
  return (
    <CatalogView
      title="Novedades"
      intro="Lo más nuevo en Naru Closet."
      basePath="/novedades"
      preset={{ onlyNew: true }}
      searchParams={props.searchParams}
    />
  );
}
