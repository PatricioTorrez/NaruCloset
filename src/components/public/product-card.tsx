import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/misc';
import { formatPrice } from '@/lib/format';
import { publicImageUrl } from '@/lib/env';
import type { CatalogItem } from '@/lib/queries/catalog';

export function ProductPrice({ price, salePrice }: { price: number; salePrice: number | null }) {
  if (salePrice !== null && salePrice < price) {
    return (
      <span className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
        <span className="font-medium">{formatPrice(salePrice)}</span>
        <span className="text-[0.875rem] text-muted line-through">
          <span className="sr-only">Precio anterior: </span>
          {formatPrice(price)}
        </span>
      </span>
    );
  }
  return <span className="font-medium tabular-nums">{formatPrice(price)}</span>;
}

/** Espacio neutro para productos sin fotografía. */
export function ImagePlaceholder() {
  return (
    <div className="flex size-full items-center justify-center bg-sand/60">
      <Logo className="text-xl text-espresso/40" />
    </div>
  );
}

export function ProductCard({ product, priority = false }: { product: CatalogItem; priority?: boolean }) {
  const soldOut = product.total_available <= 0;
  const src = publicImageUrl(product.primary_thumb ?? product.primary_image);

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand/40">
        {src ? (
          <Image
            src={src}
            alt={product.primary_image_alt || product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            priority={priority}
            className={
              'object-cover transition-transform duration-[400ms] ease-[var(--ease-out-soft)] ' +
              'group-hover:scale-[1.03] ' +
              (soldOut ? 'opacity-70' : '')
            }
          />
        ) : (
          <ImagePlaceholder />
        )}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {soldOut && <Badge tone="soldout">Agotado</Badge>}
          {!soldOut && product.is_new && <Badge tone="new">Nuevo</Badge>}
          {!soldOut && product.sale_price !== null && <Badge tone="sale">Promoción</Badge>}
        </div>
      </div>
      <div className="flex flex-col gap-0.5 pt-3">
        <p className="text-[0.8125rem] text-muted">{product.category_name}</p>
        <h3 className="text-[0.9375rem] leading-snug">
          <Link href={`/producto/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <div className="text-[0.9375rem]">
          <ProductPrice price={Number(product.price)} salePrice={product.sale_price === null ? null : Number(product.sale_price)} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: CatalogItem[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
