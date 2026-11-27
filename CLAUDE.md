# CLAUDE.md — Naru Closet

Catálogo web público + panel administrativo para la marca de ropa Naru Closet. No es una tienda con carrito ni pagos en línea.
Requisitos completos: `docs/PROJECT_BRIEF.md`.

## Protocolo de contexto (obligatorio)

**Al iniciar cada sesión**, leer en este orden:
1. `docs/PROJECT_CONTEXT.md` — estado actual y siguiente paso.
2. `docs/TASKS.md` — tareas en curso y pendientes.
3. `docs/DECISIONS.md` — decisiones aprobadas y pendientes.
4. La entrada más reciente de `docs/SESSION_LOG.md`.

**Al terminar una tarea o sesión**:
- Mover las tareas en `docs/TASKS.md`: solo a *Finalizadas* si están verificadas, con fecha.
- Registrar en `docs/DECISIONS.md` toda decisión nueva o aprobada.
- Agregar una entrada en `docs/SESSION_LOG.md` (hecho, pendiente, notas).
- Actualizar `docs/PROJECT_CONTEXT.md` (fase, estado, siguiente paso, fecha).
- Si cambió algo visible o importante, actualizar `docs/CHANGELOG.md`.

El dueño autorizó (2026-11-26) completar las fases 2–6 una tras otra. No tomar decisiones marcadas como *Pendiente* en `DECISIONS.md`.

@AGENTS.md

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Lucide · Supabase (Postgres, Auth, Storage, RLS) · Zod · Vitest · Playwright · pgTAP.
Sin shadcn/ui, React Hook Form ni Recharts (D-017): primitivos propios en `src/components/ui`.
Gestor de paquetes: **npm**.

## Reglas clave

- El inventario se controla **por variante** y solo cambia mediante funciones PostgreSQL transaccionales; nunca con varias peticiones desde el navegador.
- Sin existencias negativas (restricciones `CHECK`). El historial de movimientos no se edita ni se borra.
- Ventas y productos con historial no se borran: se cancelan, se registra la devolución o se archivan.
- La clave `service_role`/secret nunca llega al frontend. Los permisos se validan en el servidor y con RLS.
- El sitio público nunca muestra costos, márgenes ni historial de ventas.
- Identidad visual: Warm Minimalism, la paleta y tipografías de `docs/PROJECT_BRIEF.md` §3. No modificarla sin autorización.
- No agregar dependencias ni servicios de pago sin aprobación. No usar datos ficticios como si fueran reales.
- No desplegar a producción ni hacer operaciones destructivas en la base de datos sin autorización.
- Ninguna tarea se considera terminada sin verificar TypeScript, lint, build y pruebas.

## Comandos

Sin Docker (D-016). La base es Supabase en la nube; credenciales en `.env.local` (ver `.env.example`).

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run typecheck` | Tipos de rutas + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run test:db` | Pruebas pgTAP de inventario y RLS (BEGIN … ROLLBACK, no dejan datos) |
| `npm run test:concurrency` | Prueba I-6: ventas simultáneas de la última unidad |
| `npm run test:e2e` | Playwright (solo lectura) en móvil, tablet y escritorio |
| `npm run check` | Puerta de calidad: typecheck + lint + test + build |
| `npm run db:push` | Aplica migraciones a la base (operación sobre la base: pedir autorización) |
| `npm run db:types` | Regenera `src/types/database.ts` |
| `npm run create-owner -- correo "Nombre"` | Promueve a owner un usuario creado en Supabase (no maneja contraseñas) |

## Notas de la versión

- Next.js 16: leer `node_modules/next/dist/docs/` antes de usar APIs nuevas (ver `AGENTS.md`). `src/proxy.ts` reemplaza a middleware. Cache Components activo: lecturas públicas con `'use cache'` + `cacheTag`, invalidación con `updateTag` (en `src/lib/actions/guard.ts`); todo lo que lea cookies va dentro de `<Suspense>`.
- Git: commits y push directo a `main` (D-015).
