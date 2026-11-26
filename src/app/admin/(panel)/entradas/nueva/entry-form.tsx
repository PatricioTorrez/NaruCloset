'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { registerStockEntry } from '@/lib/actions/inventory';
import { LineItems, linesValid, type Line } from '@/components/admin/line-items';
import { Button } from '@/components/ui/button';
import { Field, FormMessage, Input, Textarea } from '@/components/ui/form';
import type { VariantOption } from '@/lib/queries/admin';

export function EntryForm({ variants }: { variants: VariantOption[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const units = lines.reduce((s, l) => s + l.quantity, 0);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const r = await registerStockEntry({
            received_at: receivedAt || undefined,
            supplier,
            notes,
            items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity, unit_cost: l.unitCost ?? '' })),
          });
          if (r.ok) router.push('/admin/entradas?registrada=1');
          else setError(r.error);
        });
      }}
    >
      <LineItems mode="entry" variants={variants} lines={lines} onChange={setLines} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Fecha de recepción" htmlFor="received_at" optional hint="Si la deja vacía se usa la fecha y hora actual.">
          <Input id="received_at" type="datetime-local" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
        </Field>
        <Field label="Proveedor" htmlFor="supplier" optional>
          <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Observaciones" htmlFor="notes" optional className="md:col-span-2">
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
        </Field>
      </div>
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <div>
        <Button type="submit" disabled={pending || !linesValid('entry', lines, variants)}>
          {pending ? 'Registrando…' : units > 0 ? `Registrar entrada de ${units} unidad${units === 1 ? '' : 'es'}` : 'Registrar entrada'}
        </Button>
      </div>
    </form>
  );
}
