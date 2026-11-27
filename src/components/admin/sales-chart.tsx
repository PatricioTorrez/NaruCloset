'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/format';

import type { Day } from '@/lib/chart-days';

/**
 * Ingresos por día (una serie). Barras finas con extremo redondeado de 4 px anclado a la base,
 * separación de 2 px, tooltip al pasar el cursor o enfocar, y tabla equivalente para lectores de pantalla.
 * Color: Dusty Rose (validado: banda de luminosidad y contraste ≥ 3:1 sobre blanco).
 */
export function SalesChart({ series, days }: { series: Day[]; days: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((d) => d.revenue));
  const label = (key: string) =>
    new Date(`${key}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  const active = hover !== null ? series[hover] : null;

  return (
    <figure className="flex flex-col gap-3">
      <div className="flex h-6 items-baseline justify-between text-sm" aria-hidden>
        {active ? (
          <span className="tabular-nums">
            {label(active.day)}: <span className="font-medium">{formatPrice(active.revenue)}</span>, {active.units} pieza(s)
          </span>
        ) : (
          <span className="text-muted">Máximo diario {formatPrice(max)}</span>
        )}
      </div>
      <div className="relative h-44 border-b border-line" onMouseLeave={() => setHover(null)} aria-hidden>
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-line" />
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {series.map((d, i) => (
            <div
              key={d.day}
              className="group flex h-full flex-1 cursor-default items-end"
              onMouseEnter={() => setHover(i)}
              tabIndex={-1}
            >
              <div
                className="w-full rounded-t-[4px] bg-rose transition-opacity duration-150"
                style={{
                  height: d.revenue > 0 ? `max(${(d.revenue / max) * 100}%, 3px)` : '0px',
                  opacity: hover === null || hover === i ? 1 : 0.45,
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted" aria-hidden>
        <span>{label(series[0].day)}</span>
        <span>{label(series[series.length - 1].day)}</span>
      </div>
      <figcaption className="sr-only">Ingresos por día en los últimos {days} días</figcaption>
      <details className="text-sm">
        <summary className="cursor-pointer py-1 text-muted">Ver como tabla</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-normal">Día</th>
              <th className="py-1 text-right font-normal">Ingresos</th>
              <th className="py-1 text-right font-normal">Piezas</th>
            </tr>
          </thead>
          <tbody>
            {series.filter((d) => d.revenue > 0 || d.units > 0).map((d) => (
              <tr key={d.day} className="border-t border-line">
                <td className="py-1">{label(d.day)}</td>
                <td className="py-1 text-right">{formatPrice(d.revenue)}</td>
                <td className="py-1 text-right">{d.units}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
