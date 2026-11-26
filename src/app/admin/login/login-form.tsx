'use client';

import { useActionState } from 'react';
import { signIn } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Field, FormMessage, Input } from '@/components/ui/form';

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Correo" htmlFor="email" error={fe?.email?.[0]}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(fe?.email)}
          aria-describedby={fe?.email ? 'email-error' : undefined}
        />
      </Field>
      <Field label="Contraseña" htmlFor="password" error={fe?.password?.[0]}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(fe?.password)}
          aria-describedby={fe?.password ? 'password-error' : undefined}
        />
      </Field>
      {state && !state.ok && !fe && <FormMessage tone="error">{state.error}</FormMessage>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
