# Contexto del proyecto — Naru Closet

> **Leer primero en cada sesión.** Fotografía breve del estado actual. Se actualiza al terminar cada sesión de trabajo.
> Última actualización: 2026-11-27

## Qué es

Catálogo web público + panel administrativo privado para **Naru Closet**, marca de ropa para mujer y hombre, venta local, promoción por Instagram, contacto opcional por WhatsApp.
**No** es una tienda con carrito/checkout/pagos en línea.

Especificación completa: [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) (fuente de verdad de requisitos).

## Estado actual

- **Rediseño 2026-11-27 implementado** (D-023…D-027): colores por producto con precio y fotos, inventario con ojo de visibilidad, íconos, Inicio B + Producto A. Pruebas y build en verde; **falta revisión visual en navegador**.
- **Fases 2–4 completas y verificadas** contra Supabase en la nube (proyecto `yohrwgppkxonwzefiryh`, us-west-2).
- **Fase 5:** lógica verificada (53 pruebas pgTAP + concurrencia); falta probarla desde la interfaz con productos reales.
- **Fase 6:** SEO y seguridad listos; faltan Lighthouse, prueba en teléfono, E2E (descarga de Chromium no autorizada) y hosting (D-001).
- **Owner del panel:** creado (perfil activo). Registro público desactivado en Supabase.
- **Base de datos:** 8 migraciones. Sin productos reales todavía (2 de prueba del dueño); catálogo precargado de categorías, tallas y colores.
- **Repositorio:** commits directos a `main` (D-015).

## Stack previsto

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Lucide · Supabase (Postgres, Auth, Storage, RLS) · Zod · Vitest · pgTAP · Playwright.

## Entorno de desarrollo verificado (2026-11-26)

Node 24.19 · npm 11.17 · Git 2.56 · Docker 29.7 · Supabase CLI 3.4.0 (vía `npx`) · `gh` autenticado. pnpm no instalado → se usa npm.

## Contenido existente en la carpeta

- `.claude/skills/` — skills de diseño/animación (emilkowalski/skills). Usar como criterios de UI.
- `.agents/skills/`, `.aider-desk/skills/` — duplicados de las mismas skills.
- `.idea/` — configuración de WebStorm (`workspace.xml` no se versiona).

## Siguiente paso

0. Revisar el rediseño en teléfono y tablet (escritorio ya verificado; subido a `main` en 4fc1581).
1. El dueño carga sus primeros productos reales (categorías, colores, tallas, producto, variantes, fotos, entrada de mercancía).
2. Con esos datos, verificar desde la interfaz ventas, devoluciones y apartados (F5-V) y revisar en un teléfono.
3. Decidir hosting (D-001) y desplegar con autorización.

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
