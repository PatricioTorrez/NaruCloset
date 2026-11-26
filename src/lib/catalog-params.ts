import type { Audience, CatalogQuery } from '@/lib/queries/catalog';

export type RawSearchParams = Record<string, string | string[] | undefined>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SORTS = ['new', 'price_asc', 'price_desc'] as const;

function list(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : value.split(',')).filter((v) => UUID.test(v)).slice(0, 20);
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Convierte los parámetros de la URL (?q=&categoria=&talla=&color=&disponible=&orden=&pagina=) en una consulta segura. */
export function parseCatalogParams(sp: RawSearchParams, preset: Partial<CatalogQuery> = {}): CatalogQuery {
  const sort = first(sp.orden);
  const page = Number.parseInt(first(sp.pagina) ?? '1', 10);
  const category = first(sp.categoria);
  return {
    search: first(sp.q)?.trim().slice(0, 80) || undefined,
    category: category && /^[a-z0-9-]{1,80}$/.test(category) ? category : undefined,
    sizeIds: list(sp.talla),
    colorIds: list(sp.color),
    onlyAvailable: first(sp.disponible) === '1',
    sort: SORTS.includes(sort as (typeof SORTS)[number]) ? (sort as CatalogQuery['sort']) : 'new',
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 500) : 1,
    pageSize: 24,
    ...preset,
  };
}

export type CatalogPreset = { audience?: Audience; onlyNew?: boolean };

/** Construye la URL de una página manteniendo los filtros actuales. */
export function catalogHref(basePath: string, q: CatalogQuery, page: number): string {
  const params = new URLSearchParams();
  if (q.search) params.set('q', q.search);
  if (q.category) params.set('categoria', q.category);
  for (const id of q.sizeIds ?? []) params.append('talla', id);
  for (const id of q.colorIds ?? []) params.append('color', id);
  if (q.onlyAvailable) params.set('disponible', '1');
  if (q.sort && q.sort !== 'new') params.set('orden', q.sort);
  if (page > 1) params.set('pagina', String(page));
  const s = params.toString();
  return s ? `${basePath}?${s}` : basePath;
}
