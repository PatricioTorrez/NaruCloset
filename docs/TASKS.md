# Tareas — Naru Closet

> Lista granular de trabajo. Mover las tareas entre secciones conforme avanzan; no borrar las finalizadas.
> Formato: `- [ ] ID — descripción` · finalizadas con fecha `(AAAA-MM-DD)`.
> Una tarea solo pasa a **Finalizadas** cuando está verificada (pruebas, build, revisión).

## En curso

- [ ] R1-V — Rediseño 2026-11-27: verificado en Chrome (escritorio) de punta a punta con un producto de prueba (archivado después). **Falta revisarlo en teléfono y tablet**: Chrome no permitió angostar la ventana.
- [ ] F5-V — Probar entradas, ventas, devoluciones y apartados desde la interfaz con los primeros productos reales.
- [ ] F6-V — Revisión en teléfono real; Lighthouse; E2E Playwright (pendiente autorizar descarga de Chromium); decidir hosting (D-001).

## Bloqueadas

_(ninguna)_

## Pendientes

- [ ] F5-01…F5-05 (verificación de interfaz) — Ver "En curso". Implementado y cubierto por pgTAP.
- [ ] F6-02 — Rendimiento (Lighthouse).
- [ ] F6-05 — Guía de despliegue y despliegue (requiere decisión D-001 y autorización).
- [ ] D-014 — Decidir tono de rosa para texto (opcional).

## Finalizadas

- [x] R1-02 — Inventario: «Editar existencias» por color (owner, varias tallas en una operación con motivo; migración 9 `adjust_stock_many`) y botón para quitar un producto sin existencias (elimina o archiva si tiene historial). pgTAP 70/70; probado en Chrome (2026-11-27)
- [x] R1-01 — Migración 8 aplicada: `product_colors` (precio opcional por color), `categories.icon`, precio vigente por color, catálogo público con colores; 12 categorías, 7 tallas y 10 colores precargados. pgTAP 63/63 (2026-11-27)
- [x] F1-01 — Auditoría inicial del proyecto y plan por fases (2026-11-26)
- [x] F1-02 — Archivos de contexto: `CLAUDE.md`, `PROJECT_CONTEXT.md`, `PROJECT_BRIEF.md`, `TASKS.md`, `DECISIONS.md`, `SESSION_LOG.md` (2026-11-26)
- [x] F1-03 — Aprobación de decisiones D-001…D-011 (2026-11-26)
- [x] F1-04 — `git init`, rama `main`, `.gitignore` (2026-11-26)
- [x] F1-05…F1-11 — README, ARCHITECTURE, DATABASE, DESIGN_SYSTEM (con contraste medido), SECURITY, QA, ROADMAP, CHANGELOG (2026-11-26)
- [x] F1-12 — Primer commit y push a `main` (2026-11-26)
- [x] F2-01…F2-10 — Next.js 16, tokens de marca, primitivos de UI, 7 migraciones aplicadas en Supabase, RLS, funciones de inventario, Storage, pg_cron, login del panel. Verificado: 53 pruebas pgTAP + concurrencia (2026-11-26)
- [x] F3-01…F3-08 — Sitio público completo; verificado en Chrome (escritorio) con datos reales y limpieza posterior (2026-11-26)
- [x] F4-01…F4-07 — Panel: resumen, productos, variantes, categorías, colores y tallas, fotografías WebP, configuración y usuarios; verificado en Chrome con owner real (2026-11-26)
- [x] F5-01…F5-05 (lógica) — Entradas, ventas, cancelaciones, devoluciones, apartados, vencimiento, ajustes e historial; verificado con pgTAP (2026-11-26)
- [x] F6-01, F6-03, F6-04 — SEO (metadatos, OG, sitemap, robots, JSON-LD), cabeceras de seguridad, S-7 sin secretos en el bundle, corrección de errores encontrados en QA (2026-11-26)
