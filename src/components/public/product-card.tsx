'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/misc';
import { formatPrice } from '@/lib/format';
import { publicImageUrl } from '@/lib/env';
import { cn } from '@/lib/cn';
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

/**
 * Tarjeta del catálogo. Los puntos de color cambian la foto y el precio sin salir de la lista;
 * el enlace del producto abre ese color.
 */
export function ProductCard({ product, priority = false }: { product: CatalogItem; priority?: boolean }) {
  const [colorIndex, setColorIndex] = useState(0);
  const soldOut = product.total_available <= 0;
  const color = product.colors[colorIndex] ?? null;
  const src = publicImageUrl(color?.thumb ?? product.primary_thumb ?? product.primary_image);
  const regular = Number(product.price);
  const sale = product.sale_price === null ? null : Number(product.sale_price);
  // Si el color tiene precio propio se muestra ese; si no, el del producto (con promoción, si hay).
  const colorPrice = color?.price ?? sale ?? regular;
  const onSale = sale !== null && colorPrice === sale;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white">
      <div className="relative aspect-[4/5] overflow-hidden bg-sand/40">
        {src ? (
          <Image
            key={src}
            src={src}
            alt={product.primary_image_alt || `${product.name}${color ? `, ${color.name}` : ''}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            priority={priority}
            className={cn(
              'animate-fade-in object-cover transition-transform duration-[400ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.03]',
              soldOut && 'opacity-70',
            )}
          />
        ) : (
          <ImagePlaceholder />
        )}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {soldOut && <Badge tone="soldout">Agotado</Badge>}
          {!soldOut && product.is_new && <Badge tone="new">Novedad</Badge>}
          {!soldOut && onSale && <Badge tone="sale">Promoción</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5 pb-3">
        <h3 className="text-[0.9375rem] leading-snug">
          <Link
            href={`/producto/${product.slug}${color && colorIndex > 0 ? `?color=${color.id}` : ''}`}
            className="after:absolute after:inset-0"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="text-[0.9375rem]">
            {onSale ? <ProductPrice price={regular} salePrice={sale} /> : <span className="font-medium tabular-nums">{formatPrice(colorPrice)}</span>}
          </div>
          {product.colors.length > 1 && (
            <div className="relative z-10 flex gap-1" role="radiogroup" aria-label={`Colores de ${product.name}`}>
              {product.colors.slice(0, 5).map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={i === colorIndex}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => setColorIndex(i)}
                  className="flex size-7 items-center justify-center rounded-full"
                >
                  <span
                    className={cn(
                      'size-4 rounded-full border border-espresso/15 ring-offset-2 transition-shadow duration-150',
                      i === colorIndex && 'ring-[1.5px] ring-espresso',
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                </button>
              ))}
              {product.colors.length > 5 && <span className="self-center text-xs text-muted">+{product.colors.length - 5}</span>}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: CatalogItem[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
