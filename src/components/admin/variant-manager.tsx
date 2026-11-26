'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createVariants, deleteVariant, updateVariant } from '@/lib/actions/catalog';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form';
import { Badge, EmptyState } from '@/components/ui/misc';
import { ConfirmAction } from '@/components/ui/confirm';
import { cn } from '@/lib/cn';

type Variant = {
  id: string;
  sku: string | null;
  is_active: boolean;
  stock_on_hand: number;
  stock_reserved: number;
  stock_available: number;
  color: { id: string; name: string; hex: string };
  size: { id: string; name: string };
};

export function VariantManager({
  productId,
  variants,
  colors,
  sizes,
}: {
  productId: string;
  variants: Variant[];
  colors: { id: string; name: string; hex: string }[];
  sizes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [selColors, setSelColors] = useState<string[]>([]);
  const [selSizes, setSelSizes] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const combos = selColors.length * selSizes.length;

  return (
    <div className="flex flex-col gap-6">
      {variants.length === 0 ? (
        <EmptyState
          title="Sin variantes"
          description="Cree combinaciones de color y talla. Cada una lleva sus propias existencias."
          className="py-8"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[0.9375rem]">
            <thead className="text-left text-sm text-muted">
              <tr className="border-b border-line">
                <th className="py-2 pr-3 font-normal">Color</th>
                <th className="py-2 pr-3 font-normal">Talla</th>
                <th className="py-2 pr-3 text-right font-normal">En tienda</th>
                <th className="py-2 pr-3 text-right font-normal">Apartadas</th>
                <th className="py-2 pr-3 text-right font-normal">Disponibles</th>
                <th className="py-2 pr-3 font-normal">Estado</th>
                <th className="py-2 font-normal" />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} className={cn('border-b border-line last:border-0', !v.is_active && 'text-muted')}>
                  <td className="py-2.5 pr-3">
                    <span className="flex items-center gap-2">
                      <span className="size-4 rounded-full border border-line" style={{ backgroundColor: v.color.hex }} aria-hidden />
                      {v.color.name}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">{v.size.name}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{v.stock_on_hand}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{v.stock_reserved}</td>
                  <td className="py-2.5 pr-3 text-right font-medium tabular-nums">{v.stock_available}</td>
                  <td className="py-2.5 pr-3">
                    {!v.is_active ? <Badge>Inactiva</Badge> : v.stock_available === 0 ? <Badge tone="soldout">Agotada</Badge> : <Badge tone="success">Activa</Badge>}
                  </td>
                  <td className="py-2.5">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/movimientos?variante=${v.id}`} className="inline-flex h-9 items-center rounded-md px-2.5 text-sm hover:bg-sand/50">
                        Historial
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const r = await updateVariant(v.id, { is_active: !v.is_active });
                            setMsg(r.ok ? null : { tone: 'error', text: r.error });
                            router.refresh();
                          })
                        }
                      >
                        {v.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                      {v.stock_on_hand === 0 && (
                        <ConfirmAction
                          trigger="Eliminar"
                          triggerVariant="ghost"
                          title={`Eliminar ${v.color.name} / ${v.size.name}`}
                          description="Solo se elimina si nunca tuvo movimientos. Si tiene historial, desactívela."
                          confirmLabel="Eliminar"
                          action={() => deleteVariant(v.id)}
                          onDone={() => router.refresh()}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-muted">
            Para cargar existencias registre una{' '}
            <Link href="/admin/entradas/nueva" className="text-espresso underline underline-offset-4">
              entrada de mercancía
            </Link>
            . Así queda en el historial.
          </p>
        </div>
      )}

      <div className="rounded-md border border-line bg-ivory/50 p-4">
        <p className="mb-3 text-sm font-medium">Agregar combinaciones</p>
        {colors.length === 0 || sizes.length === 0 ? (
          <p className="text-sm text-muted">
            Primero registre colores y tallas en{' '}
            <Link href="/admin/atributos" className="text-espresso underline underline-offset-4">
              Colores y tallas
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <fieldset>
              <legend className="mb-2 text-sm text-muted">Colores</legend>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <Chip key={c.id} active={selColors.includes(c.id)} onClick={() => setSelColors((l) => toggle(l, c.id))}>
                    <span className="size-3.5 rounded-full border border-line" style={{ backgroundColor: c.hex }} aria-hidden />
                    {c.name}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 text-sm text-muted">Tallas</legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <Chip key={s.id} active={selSizes.includes(s.id)} onClick={() => setSelSizes((l) => toggle(l, s.id))}>
                    {s.name}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <div>
              <Button
                disabled={pending || combos === 0}
                onClick={() =>
                  startTransition(async () => {
                    const r = await createVariants({ product_id: productId, color_ids: selColors, size_ids: selSizes });
                    setMsg(r.ok ? { tone: 'success', text: r.message ?? 'Listo.' } : { tone: 'error', text: r.error });
                    if (r.ok) {
                      setSelColors([]);
                      setSelSizes([]);
                      router.refresh();
                    }
                  })
                }
              >
                {combos === 0 ? 'Elija colores y tallas' : `Crear ${combos} combinación${combos === 1 ? '' : 'es'}`}
              </Button>
            </div>
          </div>
        )}
      </div>
      {msg && <FormMessage tone={msg.tone}>{msg.text}</FormMessage>}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors duration-150',
        active ? 'border-espresso bg-espresso text-white' : 'border-line bg-white hover:border-mocha',
      )}
    >
      {children}
    </button>
  );
}
