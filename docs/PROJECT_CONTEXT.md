# Contexto del proyecto — Naru Closet

> **Leer primero en cada sesión.** Fotografía breve del estado actual. Se actualiza al terminar cada sesión de trabajo.
> Última actualización: 2026-11-26

## Qué es

Catálogo web público + panel administrativo privado para **Naru Closet**, marca de ropa para mujer y hombre, venta local, promoción por Instagram, contacto opcional por WhatsApp.
**No** es una tienda con carrito/checkout/pagos en línea.

Especificación completa: [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) (fuente de verdad de requisitos).

## Estado actual

- **Fases 2–5 y parte de la 6:** código implementado; TypeScript, ESLint y Vitest en verde.
- **Sin verificar contra la base:** falta `.env.local` con el proyecto Supabase en la nube (D-016, sin Docker). Hasta entonces no se han aplicado migraciones ni corrido `test:db`, `test:concurrency`, `build` ni E2E.
- **Repositorio:** `github.com/PatricioTorrez/NaruCloset` (privado), commits directos a `main` (D-015).
- **Hosting:** se decide en la Fase 6 (D-001).
- **Decisiones:** D-001…D-019 aprobadas. Pendiente: D-014 (tono de rosa para texto).

## Stack previsto

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Lucide · Supabase (Postgres, Auth, Storage, RLS) · Zod · Vitest · pgTAP · Playwright.

## Entorno de desarrollo verificado (2026-11-26)

Node 24.19 · npm 11.17 · Git 2.56 · Docker 29.7 · Supabase CLI 3.4.0 (vía `npx`) · `gh` autenticado. pnpm no instalado → se usa npm.

## Contenido existente en la carpeta

- `.claude/skills/` — skills de diseño/animación (emilkowalski/skills). Usar como criterios de UI.
- `.agents/skills/`, `.aider-desk/skills/` — duplicados de las mismas skills.
- `.idea/` — configuración de WebStorm (`workspace.xml` no se versiona).

## Siguiente paso

1. El dueño crea el proyecto Supabase y `.env.local`.
2. `npm run db:push` → `npm run test:db` → `npm run test:concurrency` → `npm run create-owner` → `npm run build` → E2E y revisión visual.
3. Corregir lo que falle, cerrar fases en `TASKS.md`, completar Fase 6.

## Archivos de seguimiento

| Archivo | Propósito |
|---|---|
| `PROJECT_CONTEXT.md` | Este archivo: estado actual en una página |
| `PROJECT_BRIEF.md` | Requisitos completos del negocio (prompt maestro) |
| `TASKS.md` | Tareas en curso, pendientes, bloqueadas y finalizadas |
| `DECISIONS.md` | Decisiones aprobadas y pendientes de aprobación |
| `SESSION_LOG.md` | Bitácora breve de cada sesión de trabajo |
| `ROADMAP.md` | Fases de alto nivel |
| `CHANGELOG.md` | Cambios relevantes |
| `ARCHITECTURE.md` · `DATABASE.md` · `SECURITY.md` · `DESIGN_SYSTEM.md` · `QA.md` | Documentación técnica |
