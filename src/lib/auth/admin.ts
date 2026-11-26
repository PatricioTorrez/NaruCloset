import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AdminRole = 'owner' | 'staff';
export type Admin = { id: string; fullName: string; role: AdminRole };

/**
 * Usuario administrador de la petición actual, o null.
 * Verifica el JWT (getClaims) y que el perfil exista y esté activo (RPC current_admin).
 */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return null;

  const { data, error } = await supabase.rpc('current_admin').maybeSingle();
  if (error || !data) return null;
  return { id: data.id, fullName: data.full_name, role: data.role };
});

/** Para páginas del panel: redirige al login si no hay administrador activo. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect('/admin/login');
  return admin;
}

/** Para páginas exclusivas del owner. */
export async function requireOwner(): Promise<Admin> {
  const admin = await requireAdmin();
  if (admin.role !== 'owner') redirect('/admin');
  return admin;
}
