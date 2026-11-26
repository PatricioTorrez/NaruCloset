import Image from 'next/image';
import Link from 'next/link';
import { LogoStacked } from '@/components/brand/logo';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { ProductGrid } from '@/components/public/product-card';
import { getFilterOptions, getSettings, searchCatalog } from '@/lib/queries/catalog';
import { publicImageUrl } from '@/lib/env';

export default async function HomePage() {
  const [settings, featured, latest, { categories }] = await Promise.all([
    getSettings(),
    searchCatalog({ onlyFeatured: true, pageSize: 8 }),
    searchCatalog({ sort: 'new', pageSize: 8 }),
    getFilterOptions(),
  ]);

  const heroProduct = featured.items.find((p) => p.primary_image) ?? latest.items.find((p) => p.primary_image);
  const heroSrc = publicImageUrl(heroProduct?.primary_image);
  const newArrivals = latest.items.filter((p) => p.is_new);
  const isEmpty = latest.total === 0;

  return (
    <>
      {/* Hero editorial */}
      <section className="container-page grid items-end gap-8 pt-10 pb-16 md:grid-cols-[1.1fr_1fr] md:gap-12 md:pt-16 md:pb-24">
        <div className="flex flex-col gap-6 md:pb-10">
          <h1 className="font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.98] tracking-[-0.03em] text-balance">
            {settings.slogan || settings.store_name}
          </h1>
          {settings.description && (
            <p className="max-w-[46ch] text-[1.0625rem] text-muted">{settings.description}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/catalogo">Ver catálogo</ButtonLink>
            <ButtonLink href="/novedades" variant="secondary">
              Novedades
            </ButtonLink>
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand/60">
          {heroSrc && heroProduct ? (
            <Link href={`/producto/${heroProduct.slug}`} aria-label={`Ver ${heroProduct.name}`}>
              <Image
                src={heroSrc}
                alt={heroProduct.primary_image_alt || heroProduct.name}
                fill
                priority
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </Link>
          ) : (
            <div className="flex size-full items-center justify-center">
              <LogoStacked className="scale-150 text-espresso/50" />
            </div>
          )}
        </div>
      </section>

      {/* Colecciones con el mismo peso visual */}
      <section aria-label="Colecciones" className="container-page grid gap-4 md:grid-cols-2">
        {[
          { href: '/mujer', label: 'Mujer', tone: 'bg-sand/70' },
          { href: '/hombre', label: 'Hombre', tone: 'bg-white' },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`group flex aspect-[16/10] items-end justify-between rounded-sm border border-line p-6 md:p-8 ${c.tone}`}
          >
            <span className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none lowercase">{c.label}</span>
            <span className="text-[0.9375rem] underline-offset-4 group-hover:underline">Ver colección</span>
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
        <>
          {(newArrivals.length > 0 ? newArrivals : latest.items).length > 0 && (
            <section className="container-page mt-24">
              <SectionHeading
                title={newArrivals.length > 0 ? 'Recién llegado' : 'Lo más reciente'}
                href="/novedades"
                linkLabel="Ver novedades"
              />
              <ProductGrid products={(newArrivals.length > 0 ? newArrivals : latest.items).slice(0, 8)} />
            </section>
          )}

          {featured.items.length > 0 && (
            <section className="container-page mt-24">
              <SectionHeading title="Favoritos de la casa" href="/catalogo" linkLabel="Ver todo" />
              <ProductGrid products={featured.items} />
            </section>
          )}
        </>
      )}

      {categories.length > 0 && (
        <section className="container-page mt-24" aria-labelledby="categorias">
          <h2 id="categorias" className="font-display mb-6 text-3xl md:text-4xl">
            Categorías
          </h2>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/catalogo?categoria=${c.slug}`}
                  className="font-display text-2xl text-muted transition-colors duration-200 hover:text-espresso md:text-3xl"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-page mt-24">
        <div className="grid gap-8 rounded-sm bg-white px-6 py-12 md:grid-cols-[1fr_1fr] md:px-12 md:py-16">
          <h2 className="font-display text-3xl leading-tight md:text-[2.75rem]">Ropa para el día a día, con personalidad propia.</h2>
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
    <div className="mb-8 flex items-end justify-between gap-4">
      <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
      <Link href={href} className="shrink-0 py-2 text-[0.9375rem] underline underline-offset-4">
        {linkLabel}
      </Link>
    </div>
  );
}
