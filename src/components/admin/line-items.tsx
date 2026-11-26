'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/form';
import { formatPrice } from '@/lib/format';
import type { VariantOption } from '@/lib/queries/admin';
import { cn } from '@/lib/cn';

export type Line = { variantId: string; quantity: number; unitPrice?: number; unitCost?: number | '' };

type Mode = 'entry' | 'sale' | 'reservation';

/**
 * Editor de líneas (variante + cantidad [+ precio/costo]). Muestra disponibilidad para
 * ventas y apartados, y bloquea cantidades mayores a lo disponible (la base lo verifica de nuevo).
 */
export function LineItems({
  mode,
  variants,
  lines,
  onChange,
}: {
  mode: Mode;
  variants: VariantOption[];
  lines: Line[];
  onChange: (lines: Line[]) => void;
}) {
  const [query, setQuery] = useState('');
  const byId = useMemo(() => new Map(variants.map((v) => [v.id, v])), [variants]);
  const chosen = useMemo(() => new Set(lines.map((l) => l.variantId)), [lines]);

  const results = useMemo(() => {
    const q = query
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .trim();
    if (!q) return [];
    return variants
      .filter((v) => !v.archived && v.active && !chosen.has(v.id))
      .filter((v) => mode === 'entry' || v.available > 0)
      .filter((v) =>
        `${v.productName} ${v.colorName} ${v.sizeName}`
          .normalize('NFD')
          .replace(/\p{M}/gu, '')
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 12);
  }, [query, variants, chosen, mode]);

  const update = (i: number, patch: Partial<Line>) => onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <label htmlFor="variant-search" className="mb-1.5 block text-sm font-medium">
          Agregar producto
        </label>
        <Input
          id="variant-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque por producto, color o talla"
          autoComplete="off"
          aria-controls="variant-results"
        />
        {query && (
          <ul id="variant-results" className="mt-1 max-h-72 overflow-y-auto rounded-md border border-line bg-white shadow-[var(--shadow-float)]">
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted">
                {mode === 'entry' ? 'Sin coincidencias.' : 'Sin coincidencias con existencias disponibles.'}
              </li>
            ) : (
              results.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[0.9375rem] hover:bg-ivory"
                    onClick={() => {
                      onChange([...lines, { variantId: v.id, quantity: 1, unitPrice: v.price, unitCost: '' }]);
                      setQuery('');
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-3.5 shrink-0 rounded-full border border-line" style={{ backgroundColor: v.colorHex }} aria-hidden />
                      <span className="truncate">
                        {v.productName} <span className="text-muted">/ {v.colorName} / {v.sizeName}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-sm text-muted tabular-nums">
                      {mode === 'entry' ? `${v.onHand} en tienda` : `${v.available} disp.`}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {lines.length > 0 && (
        <ul className="divide-y divide-line rounded-md border border-line bg-white">
          {lines.map((l, i) => {
            const v = byId.get(l.variantId);
            if (!v) return null;
            const over = mode !== 'entry' && l.quantity > v.available;
            return (
              <li key={l.variantId} className="flex flex-col gap-3 p-3 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{v.productName}</p>
                  <p className="text-sm text-muted">
                    {v.colorName} / {v.sizeName} ·{' '}
                    {mode === 'entry' ? `${v.onHand} en tienda` : `${v.available} disponibles`}
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex flex-col gap-1 text-xs text-muted">
                    Cantidad
                    <Input
                      type="number"
                      min={1}
                      max={mode === 'entry' ? 10000 : v.available}
                      value={l.quantity}
                      onChange={(e) => update(i, { quantity: Math.max(1, Number.parseInt(e.target.value || '1', 10)) })}
                      className={cn('w-24', over && 'border-danger')}
                      aria-invalid={over}
                    />
                  </label>
                  {mode === 'sale' && (
                    <label className="flex flex-col gap-1 text-xs text-muted">
                      Precio unitario
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={l.unitPrice ?? ''}
                        onChange={(e) => update(i, { unitPrice: Number(e.target.value) })}
                        className="w-32"
                      />
                    </label>
                  )}
                  {mode === 'entry' && (
                    <label className="flex flex-col gap-1 text-xs text-muted">
                      Costo unitario (opcional)
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={l.unitCost ?? ''}
                        onChange={(e) => update(i, { unitCost: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-36"
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => onChange(lines.filter((_, idx) => idx !== i))}
                    className="inline-flex size-11 items-center justify-center rounded-md hover:bg-sand/50"
                    aria-label={`Quitar ${v.productName} ${v.colorName} ${v.sizeName}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {over && <p className="text-sm text-danger md:basis-full">Solo hay {v.available} disponibles.</p>}
              </li>
            );
          })}
        </ul>
      )}
      {mode === 'sale' && lines.length > 0 && (
        <p className="text-right text-lg tabular-nums">
          Total:{' '}
          <span className="font-medium">{formatPrice(lines.reduce((s, l) => s + (l.unitPrice ?? 0) * l.quantity, 0))}</span>
        </p>
      )}
    </div>
  );
}

export function linesValid(mode: Mode, lines: Line[], variants: VariantOption[]) {
  if (lines.length === 0) return false;
  const byId = new Map(variants.map((v) => [v.id, v]));
  return lines.every((l) => {
    const v = byId.get(l.variantId);
    if (!v || l.quantity < 1) return false;
    if (mode !== 'entry' && l.quantity > v.available) return false;
    if (mode === 'sale' && (l.unitPrice === undefined || Number.isNaN(l.unitPrice) || l.unitPrice < 0)) return false;
    return true;
  });
}
