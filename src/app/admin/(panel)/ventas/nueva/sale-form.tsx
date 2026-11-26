'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { registerSale } from '@/lib/actions/inventory';
import { LineItems, linesValid, type Line } from '@/components/admin/line-items';
import { Button } from '@/components/ui/button';
import { Field, FormMessage, Input, Select, Textarea } from '@/components/ui/form';
import { PAYMENT_LABEL } from '@/lib/format';
import type { VariantOption } from '@/lib/queries/admin';

export function SaleForm({ variants }: { variants: VariantOption[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [payment, setPayment] = useState('');
  const [customer, setCustomer] = useState('');
  const [notes, setNotes] = useState('');
  const [soldAt, setSoldAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const r = await registerSale({
            sold_at: soldAt || undefined,
            payment_method: (payment || '') as '',
            customer_reference: customer,
            notes,
            items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity, unit_price: l.unitPrice ?? 0 })),
          });
          if (r.ok && r.data) router.push(`/admin/ventas/${r.data.id}?registrada=1`);
          else if (!r.ok) setError(r.error);
        });
      }}
    >
      <LineItems mode="sale" variants={variants} lines={lines} onChange={setLines} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Método de pago" htmlFor="payment" optional>
          <Select id="payment" value={payment} onChange={(e) => setPayment(e.target.value)}>
            <option value="">Sin especificar</option>
            {Object.entries(PAYMENT_LABEL).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fecha de la venta" htmlFor="sold_at" optional hint="Vacío = ahora.">
          <Input id="sold_at" type="datetime-local" value={soldAt} onChange={(e) => setSoldAt(e.target.value)} />
        </Field>
        <Field label="Cliente o referencia" htmlFor="customer" optional>
          <Input id="customer" value={customer} onChange={(e) => setCustomer(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Notas" htmlFor="notes" optional>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} className="min-h-11" />
        </Field>
      </div>
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <div>
        <Button type="submit" disabled={pending || !linesValid('sale', lines, variants)}>
          {pending ? 'Registrando…' : 'Registrar venta'}
        </Button>
      </div>
    </form>
  );
}
