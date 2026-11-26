import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas E2E de solo lectura (no crean datos en la base).
 * Ejecutar con la app corriendo (`npm run build && npm start`) o dejar que Playwright la inicie.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'movil', use: { ...devices['Pixel 7'] } },
    { name: 'tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 } } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: 'npm run start', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120_000 },
});
