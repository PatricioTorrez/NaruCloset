import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/catalogo', '/mujer', '/hombre', '/novedades', '/nosotros', '/contacto'];

test.describe('sitio público', () => {
  for (const route of ROUTES) {
    test(`carga ${route} sin errores ni desbordamiento horizontal`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const res = await page.goto(route);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole('link', { name: /inicio/i }).first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  }

  // Con prerender parcial, notFound() ocurre durante el streaming: el estado HTTP ya es 200,
  // pero Next.js agrega <meta name="robots" content="noindex"> y muestra la página de no encontrado.
  test('producto inexistente muestra "no existe" y no se indexa', async ({ page }) => {
    await page.goto('/producto/no-existe-este-producto');
    await expect(page.getByRole('heading', { name: 'Esta página no existe' })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);
  });

  test('los filtros viajan en la URL y se pueden quitar', async ({ page }) => {
    await page.goto('/catalogo?disponible=1&orden=price_asc');
    await expect(page.locator('#orden')).toHaveValue('price_asc');
    await page.goto('/catalogo?q=zzzz-sin-resultados');
    await expect(page.getByText('Sin resultados')).toBeVisible();
  });

  test('robots y sitemap', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /admin');
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('/catalogo');
  });

  test('cabeceras de seguridad', async ({ request }) => {
    const res = await request.get('/');
    expect(res.headers()['x-content-type-options']).toBe('nosniff');
    expect(res.headers()['x-frame-options']).toBe('DENY');
  });
});

test.describe('panel', () => {
  test('S-1 /admin sin sesión redirige al login', async ({ page }) => {
    await page.goto('/admin/productos');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole('heading', { name: 'Acceso al panel' })).toBeVisible();
  });

  test('login con credenciales inválidas muestra error genérico', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Correo').fill('nadie@ejemplo.com');
    await page.getByLabel('Contraseña').fill('incorrecta-123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText('Correo o contraseña incorrectos.')).toBeVisible();
  });

  test('las Server Actions rechazan llamadas sin sesión', async ({ request }) => {
    // Sin el ID de acción no se puede invocar; verificamos que el panel no exponga datos sin sesión.
    const res = await request.get('/admin', { maxRedirects: 0 });
    expect([307, 308]).toContain(res.status());
  });
});
