import Image from 'next/image';
import Link from 'next/link';
import { LogoStacked } from '@/components/brand/logo';
import { ButtonLink } from '@/components/ui/button';
import { Suspense } from 'react';
import { EmptyState, Skeleton } from '@/components/ui/misc';
import { ProductGrid } from '@/components/public/product-card';
import { getFilterOptions, getSettings, searchCatalog } from '@/lib/queries/catalog';
import { publicImageUrl } from '@/lib/env';
import { AUDIENCES, CategoryIcon } from '@/lib/icons';
import { cn } from '@/lib/cn';

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeSkeleton() {
  return (
    <section className="container-page pt-5">
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="size-[67px] shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="mt-4 aspect-[4/3] w-full rounded-2xl md:aspect-auto md:h-[min(calc(100dvh-220px),620px)]" />
    </section>
  );
}

async function HomeContent() {
  const [settings, latest, { categories }] = await Promise.all([
    getSettings(),
    searchCatalog({ sort: 'new', pageSize: 12 }),
    getFilterOptions(),
  ]);

  const withImage = latest.items.filter((p) => p.primary_image);
  const hero = withImage[0];
  const heroSrc = publicImageUrl(hero?.primary_image);
  // Mosaico: una prenda por categoría (las más recientes con foto).
  const tiles = withImage
    .slice(1)
    .filter((p, i, arr) => arr.findIndex((x) => x.category_slug === p.category_slug) === i)
    .slice(0, 4);
  const newArrivals = latest.items.filter((p) => p.is_new);
  const isEmpty = latest.total === 0;

  return (
    <>
      {categories.length > 0 && (
        <nav aria-label="Categorías" className="container-page pt-5">
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
            {categories.map((c) => (
              <li key={c.id} className="shrink-0">
                <Link
                  href={`/catalogo?categoria=${c.slug}`}
                  className="group flex w-[76px] flex-col items-center gap-2 text-center text-xs md:w-[84px] md:text-[0.8125rem]"
                >
                  <span className="rounded-full bg-[conic-gradient(var(--color-rose),var(--color-mocha),var(--color-sand),var(--color-rose))] p-[2.5px] transition-transform duration-200 group-hover:scale-105">
                    <span className="flex size-[62px] items-center justify-center rounded-full border-2 border-ivory bg-white md:size-[68px]">
                      <CategoryIcon icon={c.icon} className="size-7" />
                    </span>
                  </span>
                  <span className="leading-tight">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Portada en mosaico */}
      <section
        className={cn(
          'container-page mt-4 grid grid-cols-2 gap-2.5 md:mt-6 md:gap-3',
          // El mosaico se adapta a cuántas prendas con foto hay: 0 → portada sola; 1–2 → una columna; 3–4 → dos.
          tiles.length === 0 ? 'md:grid-cols-1' : tiles.length <= 2 ? 'md:grid-cols-[2fr_1fr]' : 'md:grid-cols-[2fr_1fr_1fr]',
          tiles.length === 1 ? 'md:grid-rows-1' : 'md:grid-rows-2',
          tiles.length === 3 && '[&>a:last-child]:md:col-span-2',
        )}
      >
        <div
          className={cn(
            'relative col-span-2 aspect-[4/3] overflow-hidden rounded-2xl bg-sand/60 md:col-span-1 md:aspect-auto md:min-h-[min(calc(100dvh-220px),620px)]',
            tiles.length > 1 && 'md:row-span-2',
          )}
        >
          {heroSrc && hero ? (
            <Link href={`/producto/${hero.slug}`} aria-label={`Ver ${hero.name}`}>
              <Image src={heroSrc} alt={hero.primary_image_alt || hero.name} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </Link>
          ) : (
            <div className="flex size-full items-center justify-center">
              <LogoStacked className="scale-150 text-espresso/40" />
            </div>
          )}
          <div className="absolute inset-x-3 bottom-3 flex flex-col gap-3 rounded-xl bg-white/92 p-4 backdrop-blur-sm md:inset-x-5 md:bottom-5 md:max-w-md md:p-6">
            <h1 className="font-display text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1.02] tracking-[-0.02em] text-balance">
              {settings.slogan || settings.store_name}
            </h1>
            {settings.description && <p className="hidden text-[0.9375rem] text-muted md:block">{settings.description}</p>}
            <div className="flex flex-wrap gap-2">
              <ButtonLink href="/novedades" size="sm" className="h-10 px-4">
                Ver novedades
              </ButtonLink>
              <ButtonLink href="/catalogo" size="sm" variant="ghost" className="h-10 px-4">
                Todo el catálogo
              </ButtonLink>
            </div>
          </div>
        </div>
        {tiles.map((p) => (
          <Link
            key={p.id}
            href={`/catalogo?categoria=${p.category_slug}`}
            className={cn('group relative aspect-square overflow-hidden rounded-2xl bg-sand/50 md:aspect-auto', tiles.length % 2 === 1 && 'max-md:last:col-span-2 max-md:last:aspect-[2/1]')}
          >
            <Image
              src={publicImageUrl(p.primary_thumb ?? p.primary_image)!}
              alt=""
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover transition-transform duration-[400ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.04]"
            />
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[0.8125rem]">
              <CategoryIcon icon={p.category_icon} className="size-4" />
              {p.category_name}
            </span>
          </Link>
        ))}
      </section>

      {isEmpty ? (
        <EmptyState
          className="mt-16"
          title="El catálogo se está preparando"
          description="Muy pronto encontrarás aquí las prendas de la temporada."
        />
      ) : (
        <section className="container-page mt-12 md:mt-16">
          <SectionHeading title={newArrivals.length > 0 ? 'Recién llegado' : 'Lo más reciente'} href="/novedades" linkLabel="Ver todo" />
          <ProductGrid products={latest.items.slice(0, 8)} priorityCount={2} />
        </section>
      )}

      {/* Colecciones */}
      <section aria-label="Colecciones" className="container-page mt-12 grid gap-3 md:mt-16 md:grid-cols-3">
        {(['women', 'men', 'unisex'] as const).map((key) => {
          const a = AUDIENCES[key];
          return (
            <Link
              key={key}
              href={key === 'women' ? '/mujer' : key === 'men' ? '/hombre' : '/catalogo'}
              className="flex items-center gap-4 rounded-xl border border-line bg-white px-5 py-4 transition-colors duration-200 hover:border-mocha"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-sand/70">
                <a.Icon className="size-6" aria-hidden strokeWidth={1.5} />
              </span>
              <span>
                <span className="font-display block text-2xl leading-tight">{a.label}</span>
                <span className="text-[0.8125rem] text-muted">{key === 'unisex' ? 'Para todos' : 'Ver colección'}</span>
              </span>
            </Link>
          );
        })}
      </section>

      <section className="container-page mt-12 md:mt-16">
        <div className="grid gap-6 rounded-2xl bg-white px-6 py-10 md:grid-cols-[1fr_1fr] md:px-12 md:py-14">
          <h2 className="font-display text-3xl leading-tight md:text-[2.5rem]">Ropa para el día a día, con personalidad propia.</h2>
          <div className="flex flex-col items-start gap-5 text-muted">
            <p>
              Mira las prendas, revisa tallas, colores y disponibilidad, y escríbenos para apartar o coordinar la
              entrega.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/nosotros" variant="secondary">
                Conoce la marca
              </ButtonLink>
              {settings.instagram_handle && (
                <ButtonLink
                  href={`https://instagram.com/${settings.instagram_handle}`}
                  variant="ghost"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Síguenos en Instagram
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="font-display text-[1.75rem] md:text-4xl">{title}</h2>
      <Link href={href} className="shrink-0 py-2 text-[0.9375rem] text-muted hover:text-espresso">
        {linkLabel}
      </Link>
    </div>
  );
}
