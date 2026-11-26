'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { adjustStock } from '@/lib/actions/inventory';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, FormMessage, Input, Select, Textarea } from '@/components/ui/form';

/** Ajuste manual (solo owner). El motivo es obligatorio y queda en el historial. */
export function AdjustStockButton({ variantId, label, onHand, reserved }: { variantId: string; label: string; onHand: number; reserved: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(onHand);
  const [type, setType] = useState<'manual_adjustment' | 'admin_correction'>('manual_adjustment');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const delta = value - onHand;

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Ajustar
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Ajustar existencias">
        <div className="flex flex-col gap-4">
          <p className="text-[0.9375rem]">{label}</p>
          <p className="text-sm text-muted">
            Actualmente: {onHand} en tienda{reserved > 0 && `, ${reserved} apartadas (no puede bajar de ${reserved})`}.
          </p>
          <Field label="Nueva cantidad en tienda" htmlFor="adj-value">
            <Input id="adj-value" type="number" min={reserved} value={value} onChange={(e) => setValue(Math.max(0, Number.parseInt(e.target.value || '0', 10)))} />
          </Field>
          <Field label="Tipo" htmlFor="adj-type">
            <Select id="adj-type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="manual_adjustment">Ajuste manual (conteo físico, daño, pérdida)</option>
              <option value="admin_correction">Corrección administrativa (error de captura)</option>
            </Select>
          </Field>
          <Field label="Motivo" htmlFor="adj-reason" hint="Obligatorio.">
            <Textarea id="adj-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </Field>
          {delta !== 0 && (
            <p className="text-sm tabular-nums">
              Cambio: <span className="font-medium">{delta > 0 ? `+${delta}` : delta}</span> unidades
            </p>
          )}
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Volver</Button>
            <Button
              disabled={pending || delta === 0 || reason.trim().length < 3 || value < reserved}
              onClick={() =>
                startTransition(async () => {
                  const r = await adjustStock({ variant_id: variantId, new_on_hand: value, reason, type });
                  if (r.ok) {
                    setOpen(false);
                    setReason('');
                    router.refresh();
                  } else setError(r.error);
                })
              }
            >
              {pending ? 'Guardando…' : 'Registrar ajuste'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
