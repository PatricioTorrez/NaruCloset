#!/usr/bin/env node
/**
 * Promueve a owner activo un usuario que YA existe en Supabase Auth.
 * 1) Cree el usuario en Supabase: Authentication → Users → Add user → Create new user
 *    (correo + contraseña, marque "Auto Confirm User").
 * 2) Ejecute:  npm run create-owner -- correo@ejemplo.com "Nombre completo"
 * El script nunca recibe ni guarda contraseñas. Requiere SUPABASE_SECRET_KEY (solo terminal).
 */
import { createClient } from '@supabase/supabase-js';

const [email, fullName] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!email || !fullName) {
  console.error('Uso: npm run create-owner -- correo@ejemplo.com "Nombre completo"');
  process.exit(1);
}
if (!url || !secret) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local');
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
if (error) {
  console.error('No se pudo consultar usuarios:', error.message);
  process.exit(1);
}
const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`No existe el usuario ${email}. Créelo primero en Supabase (Authentication → Users → Add user).`);
  process.exit(1);
}

const { error: upd } = await admin
  .from('profiles')
  .update({ role: 'owner', is_active: true, full_name: fullName })
  .eq('id', user.id);
if (upd) {
  console.error('No se pudo asignar el rol owner:', upd.message);
  process.exit(1);
}
console.log(`Listo: ${email} es owner activo. Entre en /admin/login.`);
