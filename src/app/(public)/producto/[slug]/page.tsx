import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProductPurchase } from '@/components/public/product-purchase';
import { ProductGrid, ProductPrice } from '@/components/public/product-card';
import { Badge, Skeleton } from '@/components/ui/misc';
import { getProductBySlug, getRelatedProducts, getSettings } from '@/lib/queries/catalog';
import { env, publicImageUrl } from '@/lib/env';
import { AUDIENCE_LABEL } from '@/lib/format';

export async function generateMetadata(props: PageProps<'/producto/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Producto no encontrado' };
  const image = publicImageUrl(product.images[0]?.storage_path);
  const description = product.description?.slice(0, 160) || `${product.name} en Naru Closet.`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: { title: product.name, description, images: image ? [{ url: image }] : undefined },
  };
}

export default function ProductPage(props: PageProps<'/producto/[slug]'>) {
  return (
    <div className="container-page pt-6 md:pt-10">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductContent params={props.params} />
      </Suspense>
    </div>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.category.slug);
  const totalAvailable = product.variants.reduce((s, v) => s + Math.max(0, v.stock_available), 0);
  const url = `${env.siteUrl}/producto/${product.slug}`;
  const whatsapp = settings.whatsapp_enabled && settings.whatsapp_number ? settings.whatsapp_number : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: product.images.map((i) => publicImageUrl(i.storage_path)),
    category: product.category.name,
    brand: { '@type': 'Brand', name: settings.store_name },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'MXN',
      price: (product.sale_price ?? product.price).toFixed(2),
      availability: totalAvailable > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // JSON serializado de datos propios; se escapa "<" para evitar cierre de etiqueta.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <nav aria-label="Ruta" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/catalogo" className="hover:underline">
              Catálogo
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/catalogo?categoria=${product.category.slug}`} className="hover:underline">
              {product.category.name}
            </Link>
          </li>
        </ol>
      </nav>

      <ProductPurchase
        product={product}
        productUrl={url}
        whatsapp={whatsapp}
        lowStockThreshold={settings.low_stock_threshold}
        info={
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {totalAvailable === 0 && <Badge tone="soldout">Agotado</Badge>}
              {product.is_new && <Badge tone="new">Nuevo</Badge>}
              {product.sale_price !== null && <Badge tone="sale">Promoción</Badge>}
            </div>
            <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-[1.08] text-balance break-words">
              {product.name}
            </h1>
            <div className="text-xl">
              <ProductPrice price={product.price} salePrice={product.sale_price} />
            </div>
            <p className="text-sm text-muted">
              {product.category.name}, {AUDIENCE_LABEL[product.audience].toLowerCase()}
            </p>
          </div>
        }
        details={
          <div className="flex flex-col gap-6 border-t border-line pt-6">
            {product.description && (
              <div className="max-w-[60ch] whitespace-pre-line text-[0.9375rem] text-muted">{product.description}</div>
            )}
            {(settings.pickup_info || settings.delivery_info) && (
              <div className="flex flex-col gap-2 text-[0.9375rem]">
                {settings.delivery_info && (
                  <p>
                    <span className="font-medium">Entrega: </span>
                    <span className="text-muted">{settings.delivery_info}</span>
                  </p>
                )}
                {settings.pickup_info && (
                  <p>
                    <span className="font-medium">Recolección: </span>
                    <span className="text-muted">{settings.pickup_info}</span>
                  </p>
                )}
              </div>
            )}
            {!whatsapp && (
              <p className="text-[0.9375rem] text-muted">
                ¿Te interesa? <Link href="/contacto" className="text-espresso underline underline-offset-4">Contáctanos</Link> para apartarlo.
              </p>
            )}
          </div>
        }
      />

      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="relacionados">
          <h2 id="relacionados" className="font-display mb-8 text-3xl">
            También te puede gustar
          </h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12">
      <Skeleton className="aspect-[4/5] w-full rounded-sm" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="mt-6 h-10 w-48" />
        <Skeleton className="h-11 w-64" />
      </div>
    </div>
  );
}
