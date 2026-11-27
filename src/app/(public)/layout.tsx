import { Suspense } from 'react';
import { SiteHeader, SiteHeaderStatic } from '@/components/public/site-header';
import { SiteFooter } from '@/components/public/site-footer';
import { getSettings } from '@/lib/queries/catalog';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-espresso focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <Suspense fallback={<SiteHeaderStatic storeName={settings.store_name} />}>
        <SiteHeader storeName={settings.store_name} />
      </Suspense>
      <main id="contenido">{children}</main>
      <SiteFooter settings={settings} />
    </>
  );
}
