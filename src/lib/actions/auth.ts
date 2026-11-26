'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/lib/errors';

const loginSchema = z.object({
  email: z.email('Escriba un correo válido.').max(254),
  password: z.string().min(1, 'Escriba su contraseña.').max(200),
});

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) {
    return { ok: false, error: 'Revise los datos.', fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Mensaje genérico: no revela si el correo existe.
    return { ok: false, error: 'Correo o contraseña incorrectos.' };
  }

  const { data: admin } = await supabase.rpc('current_admin').maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { ok: false, error: 'Su cuenta no tiene acceso al panel. Pida a quien administra la tienda que la active.' };
  }

  redirect('/admin');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
