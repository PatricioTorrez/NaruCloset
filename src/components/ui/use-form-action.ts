'use client';

import { useActionState, useTransition, type FormEvent } from 'react';

/**
 * Envía un formulario a una Server Action sin el reinicio automático de React 19
 * (que vacía los campos tras cada envío, incluso cuando la validación falla).
 * Devuelve [estado, onSubmit, pendiente].
 */
export function useFormAction<S>(action: (prev: S | null, formData: FormData) => Promise<S>) {
  const [state, dispatch, pending] = useActionState<S | null, FormData>(action, null);
  const [transitioning, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return [state, onSubmit, pending || transitioning] as const;
}
