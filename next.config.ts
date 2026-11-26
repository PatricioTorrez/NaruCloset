import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Perfiles de caché del proyecto (docs/ARCHITECTURE.md A6).
  cacheLife: {
    // Catálogo y disponibilidad: se invalida con updateTag al guardar; 60 s de respaldo.
    catalog: { stale: 30, revalidate: 60, expire: 3600 },
    // Configuración de la tienda: cambia poco; también se invalida al guardar.
    settings: { stale: 300, revalidate: 3600, expire: 86400 },
  },
  images: {
    // Las fotos ya se optimizan a WebP en el navegador antes de subirlas (A5);
    // así no dependemos de la cuota de optimización del proveedor.
    unoptimized: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
