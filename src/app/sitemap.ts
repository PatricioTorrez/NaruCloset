import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { getAllProductSlugs } from '@/lib/queries/catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const staticRoutes = ['', '/catalogo', '/mujer', '/hombre', '/novedades', '/nosotros', '/contacto'].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'daily' as const,
    priority: path === '' ? 1 : 0.8,
  }));
  const products = (await getAllProductSlugs()).map((p) => ({
    url: `${base}/producto/${p.slug}`,
    lastModified: p.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  return [...staticRoutes, ...products];
}
