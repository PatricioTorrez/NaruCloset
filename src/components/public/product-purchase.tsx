'use client';

import Image from 'next/image';
import { useMemo, useState, type ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { publicImageUrl } from '@/lib/env';
import { formatPrice, whatsappLink } from '@/lib/format';
import { ImagePlaceholder } from './product-card';
import type { ProductDetail } from '@/lib/queries/catalog';

type Props = {
  product: ProductDetail;
  productUrl: string;
  whatsapp: string | null;
  lowStockThreshold: number;
  /** Nombre, precio (render del servidor) */
  info: ReactNode;
  /** Descripción y datos adicionales */
  details?: ReactNode;
};

/** Galería + selección de color/talla + disponibilidad por variante + contacto por WhatsApp. */
export function ProductPurchase({ product, productUrl, whatsapp, lowStockThreshold, info, details }: Props) {
  const colors = useMemo(() => {
    const map = new Map<string, ProductDetail['variants'][number]['color']>();
    for (const v of product.variants) map.set(v.color.id, v.color);
    return [...map.values()].sort((a, b) => a.sort_order - b.sort_order);
  }, [product.variants]);

  const sizes = useMemo(() => {
    const map = new Map<string, ProductDetail['variants'][number]['size']>();
    for (const v of product.variants) map.set(v.size.id, v.size);
    return [...map.values()].sort((a, b) => a.sort_order - b.sort_order);
  }, [product.variants]);

  const stockOf = (colorId: string | null, sizeId: string | null) =>
    product.variants
      .filter((v) => (!colorId || v.color.id === colorId) && (!sizeId || v.size.id === sizeId))
      .reduce((sum, v) => sum + Math.max(0, v.stock_available), 0);

  // Preselecciona el primer color con existencias (o el primero).
  const [colorId, setColorId] = useState<string | null>(
    () => colors.find((c) => stockOf(c.id, null) > 0)?.id ?? colors[0]?.id ?? null,
  );
  const [sizeId, setSizeId] = useState<string | null>(() => (sizes.length === 1 ? sizes[0].id : null));

  const variant = product.variants.find((v) => v.color.id === colorId && v.size.id === sizeId) ?? null;
  const available = variant ? Math.max(0, variant.stock_available) : 0;
  const totalAvailable = stockOf(null, null);
  const selectedColor = colors.find((c) => c.id === colorId);
  const selectedSize = sizes.find((s) => s.id === sizeId);

  // Fotos del color elegido; si no hay fotos específicas, todas.
  const images = useMemo(() => {
    const forColor = product.images.filter((i) => i.color_id === colorId);
    const general = product.images.filter((i) => !i.color_id);
    const list = forColor.length > 0 ? [...forColor, ...general] : product.images;
    return list;
  }, [product.images, colorId]);
  const [imageIndex, setImageIndex] = useState(0);
  const current = images[Math.min(imageIndex, images.length - 1)];

  let status: { text: string; tone: 'ok' | 'low' | 'out' | 'idle' };
  if (totalAvailable === 0) status = { text: 'Agotado', tone: 'out' };
  else if (!variant) status = { text: 'Elige color y talla para ver la disponibilidad', tone: 'idle' };
  else if (available === 0) status = { text: 'Agotado en esta combinación', tone: 'out' };
  else if (available <= lowStockThreshold)
    status = { text: available === 1 ? 'Última pieza disponible' : `Últimas ${available} piezas`, tone: 'low' };
  else status = { text: 'Disponible', tone: 'ok' };

  const message = [
    `Hola, me interesa este producto de Naru Closet:`,
    `${product.name}`,
    selectedColor ? `Color: ${selectedColor.name}` : null,
    selectedSize ? `Talla: ${selectedSize.name}` : null,
    `Precio: ${formatPrice(product.sale_price ?? product.price)}`,
    productUrl,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:gap-12 lg:gap-16">
      {/* Galería */}
      <div className="flex flex-col gap-3 md:sticky md:top-24 md:self-start">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-sand/40">
          {current ? (
            <Image
              key={current.id}
              src={publicImageUrl(current.storage_path)!}
              alt={current.alt_text || `${product.name}${selectedColor ? `, color ${selectedColor.name}` : ''}`}
              fill
              priority
              sizes="(min-width: 768px) 55vw, 100vw"
              className="animate-fade-in object-cover"
            />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
        {images.length > 1 && (
          <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Fotografías">
            {images.map((img, i) => (
              <li key={img.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setImageIndex(i)}
                  aria-label={`Ver fotografía ${i + 1} de ${images.length}`}
                  aria-current={img.id === current?.id}
                  className={cn(
                    'relative block aspect-[4/5] w-16 overflow-hidden rounded-sm border-2 transition-colors duration-150 md:w-20',
                    img.id === current?.id ? 'border-espresso' : 'border-transparent hover:border-line',
                  )}
                >
                  <Image src={publicImageUrl(img.thumb_path)!} alt="" fill sizes="80px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Información y selección */}
      <div className="flex flex-col gap-7">
        {info}
        {colors.length > 0 && (
          <fieldset>
            <legend className="mb-3 text-sm">
              Color{selectedColor && <span className="text-muted">: {selectedColor.name}</span>}
            </legend>
            <div className="flex flex-wrap gap-3">
              {colors.map((c) => {
                const out = stockOf(c.id, null) === 0;
                return (
                  <label key={c.id} className="relative cursor-pointer" title={c.name}>
                    <input
                      type="radio"
                      name="color"
                      value={c.id}
                      checked={colorId === c.id}
                      onChange={() => {
                        setColorId(c.id);
                        setImageIndex(0);
                      }}
                      className="peer sr-only"
                      aria-label={`${c.name}${out ? ' (agotado)' : ''}`}
                    />
                    <span
                      className={cn(
                        'block size-10 rounded-full border border-line ring-offset-2 ring-offset-ivory transition-shadow duration-150',
                        'peer-checked:ring-2 peer-checked:ring-espresso peer-focus-visible:ring-2 peer-focus-visible:ring-mocha',
                        out && 'opacity-40',
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                    {out && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-1/2 h-px w-11 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-espresso/70"
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {sizes.length > 0 && (
          <fieldset>
            <legend className="mb-3 text-sm">Talla</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const exists = product.variants.some((v) => v.size.id === s.id && v.color.id === colorId);
                const stock = stockOf(colorId, s.id);
                const out = !exists || stock === 0;
                return (
                  <label key={s.id} className="cursor-pointer">
                    <input
                      type="radio"
                      name="size"
                      value={s.id}
                      checked={sizeId === s.id}
                      onChange={() => setSizeId(s.id)}
                      disabled={!exists}
                      className="peer sr-only"
                      aria-label={`${s.name}${out ? ' (agotado)' : ''}`}
                    />
                    <span
                      className={cn(
                        'inline-flex h-11 min-w-12 items-center justify-center rounded-md border px-3 text-sm transition-colors duration-150',
                        'peer-checked:border-espresso peer-checked:bg-espresso peer-checked:text-white',
                        'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso',
                        out ? 'border-line bg-transparent text-muted line-through' : 'border-line bg-white',
                        !exists && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      {s.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <p
          aria-live="polite"
          className={cn(
            'flex items-center gap-2 text-[0.9375rem]',
            status.tone === 'out' && 'text-espresso',
            status.tone === 'idle' && 'text-muted',
          )}
        >
          <span
            aria-hidden
            className={cn(
              'size-2 rounded-full',
              status.tone === 'ok' && 'bg-success',
              status.tone === 'low' && 'bg-mocha',
              status.tone === 'out' && 'bg-espresso',
              status.tone === 'idle' && 'bg-line',
            )}
          />
          {status.text}
        </p>

        {whatsapp ? (
          available > 0 && variant ? (
            <a
              href={whatsappLink(whatsapp, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-espresso px-6 font-medium text-white transition-colors duration-200 hover:bg-[#433c38] active:scale-[0.98]"
            >
              <MessageCircle className="size-5" />
              Pedir por WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-12 items-center justify-center rounded-md bg-espresso/40 px-6 font-medium text-white"
            >
              {totalAvailable === 0 || (variant && available === 0) ? 'Sin existencias' : 'Elige color y talla'}
            </button>
          )
        ) : null}
        {details}
      </div>
    </div>
  );
}
