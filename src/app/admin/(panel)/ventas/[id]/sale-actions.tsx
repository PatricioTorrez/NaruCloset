'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cancelSale, registerReturn } from '@/lib/actions/inventory';
import { Button } from '@/components/ui/button';
import { ConfirmAction } from '@/components/ui/confirm';
import { Dialog } from '@/components/ui/dialog';
import { Field, FormMessage, Input, Textarea } from '@/components/ui/form';

export function SaleActions({
  saleId,
  canReturn,
  items,
}: {
  saleId: string;
  canReturn: boolean;
  items: { id: string; label: string; max: number }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = Object.entries(qty).filter(([, q]) => q > 0);

  return (
    <>
      {canReturn && items.length > 0 && (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Registrar devolución
        </Button>
      )}
      <ConfirmAction
        trigger="Cancelar venta"
        triggerVariant="danger"
        title="Cancelar venta"
        description="Las unidades no devueltas regresan al inventario. La venta queda registrada como cancelada."
        confirmLabel="Cancelar venta"
        reasonLabel="Motivo de la cancelación"
        action={(r) => cancelSale(saleId, r)}
        onDone={() => router.refresh()}
      />

      <Dialog open={open} onClose={() => setOpen(false)} title="Registrar devolución">
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-3">
            {items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 text-[0.9375rem]">{i.label}</span>
                <label className="flex shrink-0 items-center gap-2 text-sm text-muted">
                  Devolver
                  <Input
                    type="number"
                    min={0}
                    max={i.max}
                    value={qty[i.id] ?? 0}
                    onChange={(e) => setQty({ ...qty, [i.id]: Math.min(i.max, Math.max(0, Number.parseInt(e.target.value || '0', 10))) })}
                    className="w-20"
                  />
                  de {i.max}
                </label>
              </li>
            ))}
          </ul>
          <Field label="Motivo" htmlFor="return-reason" hint="Obligatorio. Queda en el historial.">
            <Textarea id="return-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </Field>
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Volver
            </Button>
            <Button
              disabled={pending || selected.length === 0 || reason.trim().length < 3}
              onClick={() =>
                startTransition(async () => {
                  const r = await registerReturn({
                    sale_id: saleId,
                    reason,
                    items: selected.map(([sale_item_id, quantity]) => ({ sale_item_id, quantity })),
                  });
                  if (r.ok) {
                    setOpen(false);
                    setQty({});
                    setReason('');
                    router.refresh();
                  } else setError(r.error);
                })
              }
            >
              {pending ? 'Registrando…' : 'Registrar devolución'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
