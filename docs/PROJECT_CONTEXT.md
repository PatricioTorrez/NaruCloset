# Contexto del proyecto — Naru Closet

> **Leer primero en cada sesión.** Fotografía breve del estado actual. Se actualiza al terminar cada sesión de trabajo.
> Última actualización: 2026-11-26

## Qué es

Catálogo web público + panel administrativo privado para **Naru Closet**, marca de ropa para mujer y hombre, venta local, promoción por Instagram, contacto opcional por WhatsApp.
**No** es una tienda con carrito/checkout/pagos en línea.

Especificación completa: [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) (fuente de verdad de requisitos).

## Estado actual

- **Fase:** 1 completada → siguiente: **Fase 2 — Fundamentos** (rama `fase-2-fundamentos`, PR a `main`).
- **Código de aplicación:** ninguno todavía; documentación técnica completa en `docs/`.
- **Repositorio:** `github.com/PatricioTorrez/NaruCloset` (privado), rama `main` con la Fase 1.
- **Supabase:** sin proyecto conectado. Desarrollo previsto en local con Docker.
- **Hosting:** se decide en la Fase 6 (D-001).
- **Decisiones D-001…D-013:** aprobadas. Pendiente: D-014 (tono de rosa para texto).

## Stack previsto

Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui · Lucide · Supabase (Postgres, Auth, Storage, RLS) · Zod · React Hook Form · Recharts · Vitest · pgTAP · Playwright.

## Entorno de desarrollo verificado (2026-11-26)

Node 24.19 · npm 11.17 · Git 2.56 · Docker 29.7 · Supabase CLI 3.4.0 (vía `npx`) · `gh` autenticado. pnpm no instalado → se usa npm.

## Contenido existente en la carpeta

- `.claude/skills/` — skills de diseño/animación (emilkowalski/skills). Usar como criterios de UI.
- `.agents/skills/`, `.aider-desk/skills/` — duplicados de las mismas skills.
- `.idea/` — configuración de WebStorm (`workspace.xml` no se versiona).

## Siguiente paso

Iniciar la Fase 2 cuando el dueño lo autorice: F2-01 (crear app Next.js) → F2-10. Ver `TASKS.md`.

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
