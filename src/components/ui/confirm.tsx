'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { Dialog } from './dialog';
import { Button } from './button';
import { Field, FormMessage, Textarea } from './form';
import type { ActionResult } from '@/lib/errors';

type ConfirmActionProps = {
  /** Texto del botón que abre la confirmación */
  trigger: ReactNode;
  triggerVariant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  /** Si se define, pide un motivo obligatorio (mínimo 3 caracteres). */
  reasonLabel?: string;
  action: (reason: string) => Promise<ActionResult<unknown>>;
  onDone?: () => void;
};

/** Confirmación para acciones importantes (cancelar, archivar, ajustar, eliminar). */
export function ConfirmAction({
  trigger,
  triggerVariant = 'secondary',
  title,
  description,
  confirmLabel,
  tone = 'danger',
  reasonLabel,
  action,
  onDone,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reasonMissing = Boolean(reasonLabel) && reason.trim().length < 3;

  function close() {
    setOpen(false);
    setReason('');
    setError(null);
  }

  return (
    <>
      <Button variant={triggerVariant} size="sm" onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <Dialog open={open} onClose={close} title={title}>
        <div className="flex flex-col gap-4">
          <div className="text-[0.9375rem] text-muted">{description}</div>
          {reasonLabel && (
            <Field label={reasonLabel} htmlFor="confirm-reason" hint="Mínimo 3 caracteres. Queda en el historial.">
              <Textarea
                id="confirm-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                aria-describedby="confirm-reason-hint"
              />
            </Field>
          )}
          {error && <FormMessage tone="error">{error}</FormMessage>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={close} disabled={pending}>
              Volver
            </Button>
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              disabled={pending || reasonMissing}
              onClick={() =>
                startTransition(async () => {
                  const result = await action(reason.trim());
                  if (result.ok) {
                    close();
                    onDone?.();
                  } else {
                    setError(result.error);
                  }
                })
              }
            >
              {pending ? 'Procesando…' : confirmLabel}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
