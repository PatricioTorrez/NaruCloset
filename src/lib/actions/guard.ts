import 'server-only';
import { updateTag } from 'next/cache';
import { getAdmin, type Admin } from '@/lib/auth/admin';

/**
 * Verificación de permisos para Server Actions. A diferencia de requireAdmin(),
 * no redirige: devuelve null y la acción responde con un error comprensible.
 */
export async function actionAdmin(requireOwner = false): Promise<Admin | null> {
  const admin = await getAdmin();
  if (!admin) return null;
  if (requireOwner && admin.role !== 'owner') return null;
  return admin;
}

export const NOT_AUTHORIZED = { ok: false as const, error: 'No tiene permiso para realizar esta acción.' };

/** Invalida las cachés públicas afectadas por un cambio del panel. */
export function refreshCatalog(...slugs: Array<string | null | undefined>) {
  updateTag('catalog');
  for (const slug of slugs) if (slug) updateTag(`product:${slug}`);
}

export function refreshSettings() {
  updateTag('settings');
  updateTag('catalog');
}
