// Variables públicas. Se leen con acceso estático para que Next.js las incruste en el cliente.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. En local: copie .env.example a .env.local. En Vercel: Settings → Environment Variables.',
  );
}

export const env = {
  supabaseUrl: url,
  supabasePublishableKey: publishableKey,
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
} as const;

export const STORAGE_BUCKET = 'product-images';

export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${env.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}
