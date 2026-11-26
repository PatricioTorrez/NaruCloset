'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cancelReservation, completeReservation, confirmReservation } from '@/lib/actions/inventory';
import { Button } from '@/components/ui/button';
import { ConfirmAction } from '@/components/ui/confirm';
import { Dialog } from '@/components/ui/dialog';
import { Field, FormMessage, Select } from '@/components/ui/form';
import { PAYMENT_LABEL } from '@/lib/format';

export function ReservationActions({ id, status }: { id: string; status: 'pending' | 'confirmed' | string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [payment, setPayment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      {status === 'pending' && (
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await confirmReservation(id);
              if (!r.ok) setError(r.error);
              router.refresh();
            })
          }
        >
          Confirmar
        </Button>
      )}
      <Button size="sm" onClick={() => setOpen(true)}>
        Completar venta
      </Button>
      <ConfirmAction
        trigger="Cancelar apartado"
        triggerVariant="ghost"
        title="Cancelar apartado"
        description="Las unidades vuelven a estar disponibles. Queda registrado en el historial."
        confirmLabel="Cancelar apartado"
        reasonLabel="Motivo"
        action={(reason) => cancelReservation(id, reason)}
        onDone={() => router.refresh()}
      />
      {error && !open && <FormMessage tone="error">{error}</FormMessage>}

      <Dialog open={open} onClose={() => setOpen(false)} title="Completar venta">
        <div className="flex flex-col gap-4">
          <p className="text-[0.9375rem] text-muted">
            Se registra una venta con los precios del apartado y se descuentan las unidades del inventario.
          </p>
          <Field label="Método de pago" htmlFor="pm" optional>
            <Select id="pm" value={payment} onChange={(e) => setPayment(e.target.value)}>
              <option value="">Sin especificar</option>
              {Object.entries(PAYMENT_LABEL).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Volver
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await completeReservation(id, payment || null);
                  if (r.ok && r.data) router.push(`/admin/ventas/${r.data.saleId}?registrada=1`);
                  else if (!r.ok) setError(r.error);
                })
              }
            >
              {pending ? 'Registrando…' : 'Registrar venta'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
