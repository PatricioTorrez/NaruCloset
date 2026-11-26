import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="-ml-1 mb-2 inline-flex items-center gap-1 py-1 text-sm text-muted hover:text-espresso">
            <ChevronLeft className="size-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <h1 className="font-display text-3xl break-words md:text-4xl">{title}</h1>
        {description && <div className="mt-2 max-w-2xl text-[0.9375rem] text-muted">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-white">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          {title && <h2 className="text-base font-medium">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/**
 * Tabla responsive: en escritorio es una tabla; en móvil cada fila se convierte en tarjeta
 * (las celdas muestran su etiqueta con data-label).
 */
export function DataTable({ head, children, empty }: { head: string[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <table className="w-full border-collapse text-[0.9375rem] max-md:block">
        <thead className="border-b border-line bg-ivory/60 text-left text-sm text-muted max-md:hidden">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-md:block">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Row({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <tr
      className={
        'border-b border-line last:border-0 max-md:flex max-md:flex-col max-md:gap-1 max-md:px-4 max-md:py-3 ' + className
      }
    >
      {children}
    </tr>
  );
}

export function Cell({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <td
      data-label={label}
      className={
        'px-4 py-3 align-middle max-md:flex max-md:justify-between max-md:gap-4 max-md:p-0 ' +
        'max-md:before:shrink-0 max-md:before:text-sm max-md:before:text-muted max-md:before:content-[attr(data-label)] ' +
        className
      }
    >
      {children}
    </td>
  );
}
