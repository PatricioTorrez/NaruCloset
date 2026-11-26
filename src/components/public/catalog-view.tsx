import Link from 'next/link';
import { Suspense } from 'react';
import { CatalogFilters } from './catalog-filters';
import { ProductGrid } from './product-card';
import { EmptyState, Skeleton } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/button';
import { getFilterOptions, searchCatalog } from '@/lib/queries/catalog';
import { catalogHref, parseCatalogParams, type CatalogPreset, type RawSearchParams } from '@/lib/catalog-params';

type Props = {
  title: string;
  intro?: string;
  basePath: string;
  preset?: CatalogPreset;
  searchParams: Promise<RawSearchParams>;
};

/** Vista de catálogo compartida por /catalogo, /mujer, /hombre y /novedades. */
export function CatalogView({ title, intro, basePath, preset, searchParams }: Props) {
  return (
    <div className="container-page pt-10 md:pt-14">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none lowercase">{title}</h1>
        {intro && <p className="mt-4 text-muted">{intro}</p>}
      </header>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogResults basePath={basePath} preset={preset} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CatalogResults({
  basePath,
  preset,
  searchParams,
}: Pick<Props, 'basePath' | 'preset' | 'searchParams'>) {
  const query = parseCatalogParams(await searchParams, preset);
  const [{ items, total }, options] = await Promise.all([searchCatalog(query), getFilterOptions()]);
  const page = query.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / (query.pageSize ?? 24)));
  const filtered =
    Boolean(query.search || query.category || query.onlyAvailable) ||
    (query.sizeIds?.length ?? 0) > 0 ||
    (query.colorIds?.length ?? 0) > 0;

  return (
    <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[220px_1fr]">
      <CatalogFilters basePath={basePath} query={query} total={total} {...options} />
      <section aria-label="Resultados" className="min-w-0">
        {items.length === 0 ? (
          filtered ? (
            <EmptyState
              title="Sin resultados"
              description="Ningún producto coincide con estos filtros. Prueba con otra talla, color o categoría."
              action={
                <ButtonLink href={basePath} variant="secondary">
                  Quitar filtros
                </ButtonLink>
              }
            />
          ) : (
            <EmptyState
              title="Todavía no hay productos aquí"
              description="Estamos preparando esta colección. Vuelve pronto."
            />
          )
        ) : (
          <>
            <ProductGrid products={items} priorityCount={4} />
            {pages > 1 && (
              <nav aria-label="Paginación" className="mt-14 flex items-center justify-center gap-4 text-[0.9375rem]">
                {page > 1 ? (
                  <Link href={catalogHref(basePath, query, page - 1)} className="py-2 underline underline-offset-4">
                    Anterior
                  </Link>
                ) : (
                  <span className="py-2 text-muted/60">Anterior</span>
                )}
                <span className="text-muted tabular-nums">
                  Página {page} de {pages}
                </span>
                {page < pages ? (
                  <Link href={catalogHref(basePath, query, page + 1)} className="py-2 underline underline-offset-4">
                    Siguiente
                  </Link>
                ) : (
                  <span className="py-2 text-muted/60">Siguiente</span>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
      <div className="hidden flex-col gap-3 lg:flex">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/5] w-full rounded-sm" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
