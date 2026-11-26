import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader, Panel } from '@/components/admin/page-header';
import { SalesChart } from '@/components/admin/sales-chart';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { createClient } from '@/lib/supabase/server';
import { getStoreTimezone } from '@/lib/queries/admin';
import { formatDateTime, formatPrice, MOVEMENT_LABEL } from '@/lib/format';

export const metadata: Metadata = { title: 'Resumen' };

const DAYS = 30;

type Dashboard = {
  total_products: number;
  active_products: number;
  sold_out_products: number;
  low_stock_products: number;
  units_available: number;
  units_on_hand: number;
  sales_count: number;
  sales_count_period: number;
  revenue: number;
  revenue_period: number;
  open_reservations: number;
  top_products: { name: string; units: number; revenue: number }[];
  low_stock_list: { id: string; name: string; available: number }[];
  sales_by_day: { day: string; revenue: number; units: number }[];
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const tz = await getStoreTimezone();
  const [{ data, error }, { data: movements }] = await Promise.all([
    supabase.rpc('admin_dashboard', { p_days: DAYS }),
    supabase
      .from('inventory_movements')
      .select('id, movement_type, on_hand_delta, reserved_delta, created_at, variant:product_variants(product:products(name), color:colors(name), size:sizes(name))')
      .order('id', { ascending: false })
      .limit(8),
  ]);
  if (error) throw new Error(error.message);
  const d = data as unknown as Dashboard;

  return (
    <>
      <PageHeader
        title="Resumen"
        actions={
          <>
            <ButtonLink href="/admin/ventas/nueva">Registrar venta</ButtonLink>
            <ButtonLink href="/admin/entradas/nueva" variant="secondary">
              Registrar entrada
            </ButtonLink>
          </>
        }
      />

      {/* Indicadores */}
      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-4">
        <Stat label={`Ingresos ${DAYS} días`} value={formatPrice(d.revenue_period)} sub={`${d.sales_count_period} ventas`} />
        <Stat label="Unidades disponibles" value={d.units_available} sub={`${d.units_on_hand} en tienda`} />
        <Stat label="Productos activos" value={d.active_products} sub={`de ${d.total_products} en catálogo`} />
        <Stat label="Apartados abiertos" value={d.open_reservations} href="/admin/apartados" />
        <Stat label="Agotados" value={d.sold_out_products} href="/admin/inventario?filtro=bajo" />
        <Stat label="Pocas existencias" value={d.low_stock_products} href="/admin/inventario?filtro=bajo" />
        <Stat label="Ventas registradas" value={d.sales_count} href="/admin/ventas" />
        <Stat label="Ingresos totales" value={formatPrice(d.revenue)} sub="neto de devoluciones" />
      </dl>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title={`Ingresos por día, últimos ${DAYS} días`}>
          {d.sales_count_period === 0 ? (
            <EmptyState title="Sin ventas en este periodo" className="py-10" />
          ) : (
            <SalesChart data={d.sales_by_day.map((x) => ({ ...x, revenue: Number(x.revenue) }))} days={DAYS} />
          )}
        </Panel>

        <Panel title="Más vendidos">
          {d.top_products.length === 0 ? (
            <p className="text-sm text-muted">Aún no hay ventas.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {d.top_products.map((p) => (
                <li key={p.name} className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="shrink-0 text-sm text-muted tabular-nums">
                    {p.units} pzs, {formatPrice(p.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Requieren reabasto">
          {d.low_stock_list.length === 0 ? (
            <p className="text-sm text-muted">Todo con existencias suficientes.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {d.low_stock_list.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
                  <Link href={`/admin/productos/${p.id}`} className="min-w-0 truncate hover:underline">
                    {p.name}
                  </Link>
                  <span className="shrink-0 text-sm tabular-nums">{p.available === 0 ? 'Agotado' : `${p.available} disp.`}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Movimientos recientes"
          actions={<Link href="/admin/movimientos" className="text-sm underline underline-offset-4">Ver todos</Link>}
        >
          {!movements || movements.length === 0 ? (
            <p className="text-sm text-muted">Sin movimientos todavía.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {movements.map((m) => (
                <li key={m.id} className="flex items-baseline justify-between gap-3 text-[0.9375rem]">
                  <span className="min-w-0">
                    <span className="block truncate">
                      {m.variant?.product?.name} <span className="text-muted">/ {m.variant?.color?.name} / {m.variant?.size?.name}</span>
                    </span>
                    <span className="text-xs text-muted">
                      {MOVEMENT_LABEL[m.movement_type]}, {formatDateTime(m.created_at, tz)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">
                    {m.on_hand_delta !== 0 ? (m.on_hand_delta > 0 ? `+${m.on_hand_delta}` : m.on_hand_delta) : `${m.reserved_delta > 0 ? '+' : ''}${m.reserved_delta} apart.`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: string | number; sub?: string; href?: string }) {
  const content = (
    <>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-display mt-1 text-[1.75rem] leading-tight tabular-nums">{value}</dd>
      {sub && <dd className="text-xs text-muted">{sub}</dd>}
    </>
  );
  return (
    <div className="bg-white">
      {href ? (
        <Link href={href} className="block h-full p-4 transition-colors duration-150 hover:bg-ivory md:p-5">
          {content}
        </Link>
      ) : (
        <div className="p-4 md:p-5">{content}</div>
      )}
    </div>
  );
}
