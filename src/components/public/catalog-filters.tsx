'use client';

import Form from 'next/form';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/cn';
import type { CatalogQuery, CategoryOption, ColorOption, SizeOption } from '@/lib/queries/catalog';

type Props = {
  basePath: string;
  query: CatalogQuery;
  categories: CategoryOption[];
  colors: ColorOption[];
  sizes: SizeOption[];
  total: number;
};

function activeCount(q: CatalogQuery) {
  return (q.category ? 1 : 0) + (q.sizeIds?.length ?? 0) + (q.colorIds?.length ?? 0) + (q.onlyAvailable ? 1 : 0);
}

export function CatalogFilters(props: Props) {
  const [open, setOpen] = useState(false);
  const count = activeCount(props.query);

  return (
    <>
      {/* Barra superior: búsqueda + orden + filtros (móvil) */}
      <Toolbar {...props} onOpenFilters={() => setOpen(true)} filterCount={count} />

      {/* Barra lateral en escritorio */}
      <aside aria-label="Filtros" className="hidden lg:block">
        <FilterForm {...props} autoSubmit />
      </aside>

      <Dialog open={open} onClose={() => setOpen(false)} title="Filtrar" variant="sheet">
        <FilterForm {...props} onSubmitted={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function HiddenCarry({ query, except }: { query: CatalogQuery; except: Array<'q' | 'orden' | 'filters'> }) {
  return (
    <>
      {!except.includes('q') && query.search && <input type="hidden" name="q" value={query.search} />}
      {!except.includes('orden') && query.sort && query.sort !== 'new' && (
        <input type="hidden" name="orden" value={query.sort} />
      )}
      {!except.includes('filters') && (
        <>
          {query.category && <input type="hidden" name="categoria" value={query.category} />}
          {query.sizeIds?.map((id) => <input key={id} type="hidden" name="talla" value={id} />)}
          {query.colorIds?.map((id) => <input key={id} type="hidden" name="color" value={id} />)}
          {query.onlyAvailable && <input type="hidden" name="disponible" value="1" />}
        </>
      )}
    </>
  );
}

function Toolbar({
  basePath,
  query,
  total,
  onOpenFilters,
  filterCount,
}: Props & { onOpenFilters: () => void; filterCount: number }) {
  return (
    <div className="flex flex-col gap-3 lg:col-span-2 lg:flex-row lg:items-center lg:justify-between">
      <Form action={basePath} className="flex w-full gap-2 lg:max-w-md" role="search">
        <HiddenCarry query={query} except={['q']} />
        <label htmlFor="buscar" className="sr-only">
          Buscar por nombre
        </label>
        <input
          id="buscar"
          name="q"
          type="search"
          defaultValue={query.search}
          placeholder="Buscar por nombre"
          maxLength={80}
          className="h-11 w-full rounded-md border border-line bg-white px-3.5 placeholder:text-muted/70 focus:border-espresso focus:outline-none"
        />
        <Button type="submit" variant="secondary" className="h-11 shrink-0">
          Buscar
        </Button>
      </Form>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {total === 1 ? '1 producto' : `${total} productos`}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="h-11 lg:hidden" onClick={onOpenFilters}>
            <SlidersHorizontal className="size-4" />
            Filtros{filterCount > 0 && ` (${filterCount})`}
          </Button>
          <SortSelect basePath={basePath} query={query} />
        </div>
      </div>
    </div>
  );
}

function SortSelect({ basePath, query }: { basePath: string; query: CatalogQuery }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <Form action={basePath} ref={ref}>
      <HiddenCarry query={query} except={['orden']} />
      <label htmlFor="orden" className="sr-only">
        Ordenar
      </label>
      <select
        id="orden"
        name="orden"
        defaultValue={query.sort ?? 'new'}
        onChange={() => ref.current?.requestSubmit()}
        className="h-11 rounded-md border border-line bg-white pr-8 pl-3 text-sm focus:border-espresso focus:outline-none"
      >
        <option value="new">Más recientes</option>
        <option value="price_asc">Precio: menor a mayor</option>
        <option value="price_desc">Precio: mayor a menor</option>
      </select>
      <noscript>
        <button type="submit" className="ml-2 underline">
          Ordenar
        </button>
      </noscript>
    </Form>
  );
}

function FilterForm({
  basePath,
  query,
  categories,
  colors,
  sizes,
  autoSubmit = false,
  onSubmitted,
}: Props & { autoSubmit?: boolean; onSubmitted?: () => void }) {
  const ref = useRef<HTMLFormElement>(null);
  const submit = () => autoSubmit && ref.current?.requestSubmit();

  return (
    <Form action={basePath} ref={ref} onSubmit={() => onSubmitted?.()} className="flex flex-col gap-8">
      <HiddenCarry query={query} except={['filters']} />

      {categories.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-medium">Categoría</legend>
          <div className="flex flex-col">
            <RadioRow name="categoria" value="" label="Todas" defaultChecked={!query.category} onChange={submit} />
            {categories.map((c) => (
              <RadioRow
                key={c.id}
                name="categoria"
                value={c.slug}
                label={c.name}
                defaultChecked={query.category === c.slug}
                onChange={submit}
              />
            ))}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-medium">Talla</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <label key={s.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="talla"
                  value={s.id}
                  defaultChecked={query.sizeIds?.includes(s.id)}
                  onChange={submit}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'inline-flex h-11 min-w-11 items-center justify-center rounded-md border border-line bg-white px-3 text-sm',
                    'transition-colors duration-150 peer-checked:border-espresso peer-checked:bg-espresso peer-checked:text-white',
                    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-espresso',
                  )}
                >
                  {s.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-medium">Color</legend>
          <div className="flex flex-col">
            {colors.map((c) => (
              <label key={c.id} className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem]">
                <input
                  type="checkbox"
                  name="color"
                  value={c.id}
                  defaultChecked={query.colorIds?.includes(c.id)}
                  onChange={submit}
                  className="size-[18px] accent-espresso"
                />
                <span className="size-5 rounded-full border border-line" style={{ backgroundColor: c.hex }} aria-hidden />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem]">
        <input
          type="checkbox"
          name="disponible"
          value="1"
          defaultChecked={query.onlyAvailable}
          onChange={submit}
          className="size-[18px] accent-espresso"
        />
        Solo disponibles
      </label>

      <div className={cn('flex gap-3', autoSubmit && 'lg:hidden')}>
        <Button type="submit" className="flex-1">
          Ver resultados
        </Button>
      </div>
      <Link
        href={query.search ? `${basePath}?q=${encodeURIComponent(query.search)}` : basePath}
        className="-mt-4 py-2 text-sm text-muted underline underline-offset-4"
        onClick={() => onSubmitted?.()}
      >
        Quitar filtros
      </Link>
      {autoSubmit && (
        <noscript>
          <button type="submit" className="underline">
            Aplicar filtros
          </button>
        </noscript>
      )}
    </Form>
  );
}

function RadioRow({
  name,
  value,
  label,
  defaultChecked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[0.9375rem]">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} onChange={onChange} className="size-[18px] accent-espresso" />
      {label}
    </label>
  );
}
