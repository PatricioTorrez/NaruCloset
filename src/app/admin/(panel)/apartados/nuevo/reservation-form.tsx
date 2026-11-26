'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createReservation } from '@/lib/actions/inventory';
import { LineItems, linesValid, type Line } from '@/components/admin/line-items';
import { Button } from '@/components/ui/button';
import { Field, FormMessage, Input, Textarea } from '@/components/ui/form';
import type { VariantOption } from '@/lib/queries/admin';

function localDateTime(daysAhead: number) {
  const d = new Date(Date.now() + daysAhead * 86400000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function ReservationForm({ variants, defaultDays }: { variants: VariantOption[]; defaultDays: number | null }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState('');
  const [contact, setContact] = useState('');
  const [expires, setExpires] = useState(() => (defaultDays ? localDateTime(defaultDays) : ''));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fe, setFe] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const r = await createReservation({
            customer_name: customer,
            customer_contact: contact,
            expires_at: expires || undefined,
            notes,
            items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
          });
          if (r.ok && r.data) router.push(`/admin/apartados/${r.data.id}`);
          else if (!r.ok) {
            setError(r.error);
            setFe(r.fieldErrors ?? {});
          }
        });
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Cliente (nombre o referencia)" htmlFor="customer" error={fe.customer_name?.[0]}>
          <Input id="customer" value={customer} onChange={(e) => setCustomer(e.target.value)} maxLength={120} required />
        </Field>
        <Field label="Contacto" htmlFor="contact" optional hint="Teléfono o usuario de Instagram.">
          <Input id="contact" value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Fecha límite" htmlFor="expires" optional hint="Al vencer, se libera automáticamente.">
          <Input id="expires" type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </Field>
        <Field label="Observaciones" htmlFor="notes" optional>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} className="min-h-11" />
        </Field>
      </div>
      <LineItems mode="reservation" variants={variants} lines={lines} onChange={setLines} />
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <div>
        <Button type="submit" disabled={pending || !customer.trim() || !linesValid('reservation', lines, variants)}>
          {pending ? 'Creando…' : 'Crear apartado'}
        </Button>
      </div>
    </form>
  );
}
