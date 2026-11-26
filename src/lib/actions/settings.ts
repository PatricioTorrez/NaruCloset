'use server';

import { createClient } from '@/lib/supabase/server';
import { actionAdmin, refreshSettings } from './guard';
import { friendlyError, type ActionResult } from '@/lib/errors';
import { fieldErrors, settingsSchema, uuid } from '@/lib/validations/schemas';

export async function saveSettings(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const admin = await actionAdmin(true);
  if (!admin) return { ok: false, error: 'Solo el owner puede cambiar la configuración.' };
  const parsed = settingsSchema.safeParse(Object.fromEntries(fd.entries()));
  if (!parsed.success) return { ok: false, error: 'Revise los campos marcados.', fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from('store_settings')
    .update({ ...parsed.data, updated_by: admin.id })
    .eq('id', true);
  if (error) return { ok: false, error: friendlyError(error) };
  refreshSettings();
  return { ok: true, message: 'Configuración guardada.' };
}

export async function updateUserAccess(
  userId: string,
  values: { role?: 'owner' | 'staff'; is_active?: boolean },
): Promise<ActionResult> {
  const admin = await actionAdmin(true);
  if (!admin) return { ok: false, error: 'Solo el owner puede gestionar usuarios.' };
  const patch: { role?: 'owner' | 'staff'; is_active?: boolean } = {};
  if (values.role === 'owner' || values.role === 'staff') patch.role = values.role;
  if (typeof values.is_active === 'boolean') patch.is_active = values.is_active;

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update(patch).eq('id', uuid.parse(userId));
  if (error) return { ok: false, error: friendlyError(error) };
  return { ok: true, message: 'Acceso actualizado.' };
}
