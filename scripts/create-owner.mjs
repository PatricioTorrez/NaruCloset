#!/usr/bin/env node
/**
 * Crea (o promueve) el primer usuario owner del panel.
 * Uso:  node --env-file=.env.local scripts/create-owner.mjs correo@ejemplo.com "Nombre completo"
 * La contraseña se pide por la entrada estándar (no queda en el historial de la terminal).
 * Requiere SUPABASE_SECRET_KEY: solo se usa aquí, nunca en el frontend.
 */
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const [email, fullName] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!email || !fullName) {
  console.error('Uso: node --env-file=.env.local scripts/create-owner.mjs correo@ejemplo.com "Nombre completo"');
  process.exit(1);
}
if (!url || !secret) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local');
  process.exit(1);
}

const rl = createInterface({ input: stdin, output: stdout });
const password = await rl.question('Contraseña (mínimo 10 caracteres, letras y números): ');
rl.close();
if (password.length < 10 || !/[a-z]/i.test(password) || !/[0-9]/.test(password)) {
  console.error('La contraseña debe tener al menos 10 caracteres, con letras y números.');
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

let userId;
const created = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});
if (created.error) {
  if (!/already/i.test(created.error.message)) {
    console.error('No se pudo crear el usuario:', created.error.message);
    process.exit(1);
  }
  // Ya existe: buscarlo y promoverlo.
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
} else {
  userId = created.data.user.id;
}

const { error } = await admin.from('profiles').update({ role: 'owner', is_active: true, full_name: fullName }).eq('id', userId);
if (error) {
  console.error('No se pudo asignar el rol owner:', error.message);
  process.exit(1);
}
console.log(`Listo: ${email} es owner activo. Entre en /admin/login.`);
