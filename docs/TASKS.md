# Tareas — Naru Closet

> Lista granular de trabajo. Mover las tareas entre secciones conforme avanzan; no borrar las finalizadas.
> Formato: `- [ ] ID — descripción` · finalizadas con fecha `(AAAA-MM-DD)`.
> Una tarea solo pasa a **Finalizadas** cuando está verificada (pruebas, build, revisión).

## En curso

_(ninguna; siguiente: F2-01)_

## Bloqueadas

_(ninguna)_

## Pendientes


### Fase 2 — Fundamentos (rama `fase-2-fundamentos`)
- [ ] F2-01 — Crear app Next.js + TypeScript + Tailwind + ESLint
- [ ] F2-02 — Tokens de marca (colores, tipografías Playfair Display / DM Sans, espaciado 8 px)
- [ ] F2-03 — shadcn/ui base
- [ ] F2-04 — Supabase local (Docker) + `.env.example`
- [ ] F2-05 — Migraciones: esquema base
- [ ] F2-06 — Migraciones: RLS + `is_admin()`
- [ ] F2-07 — Funciones PostgreSQL de inventario (entradas, ventas, cancelación, devolución, apartados, ajustes)
- [ ] F2-08 — Bucket `product-images` y políticas de Storage
- [ ] F2-09 — Pruebas pgTAP: RLS, inventario, concurrencia
- [ ] F2-10 — Autenticación del panel (login, middleware, verificación de rol en servidor)

### Fase 3 — Catálogo público
- [ ] F3-01 — Layout público (header, menú móvil, footer)
- [ ] F3-02 — Inicio
- [ ] F3-03 — Catálogo con búsqueda, filtros y orden reales
- [ ] F3-04 — Colecciones mujer / hombre / novedades
- [ ] F3-05 — Detalle de producto (galería, selector color/talla, disponibilidad por variante)
- [ ] F3-06 — Botón WhatsApp configurable
- [ ] F3-07 — Nosotros / Contacto
- [ ] F3-08 — Pruebas visuales y E2E responsive

### Fase 4 — Panel administrativo
- [ ] F4-01 — Layout del panel
- [ ] F4-02 — Dashboard con datos reales
- [ ] F4-03 — Productos (crear, editar, archivar, visibilidad)
- [ ] F4-04 — Variantes, colores y tallas
- [ ] F4-05 — Categorías
- [ ] F4-06 — Fotografías (subida WebP 4:5, miniaturas, reordenar, principal)
- [ ] F4-07 — Configuración de la tienda

### Fase 5 — Inventario
- [ ] F5-01 — Entradas de mercancía
- [ ] F5-02 — Ventas (registro, cancelación, devolución)
- [ ] F5-03 — Apartados (estados, vencimiento, liberación)
- [ ] F5-04 — Ajustes manuales con motivo obligatorio
- [ ] F5-05 — Historial de movimientos
- [ ] F5-06 — Pruebas de inventario (8 escenarios de `PROJECT_BRIEF.md` §13)

### Fase 6 — Optimización y lanzamiento
- [ ] F6-01 — SEO: metadatos, Open Graph, sitemap, robots, datos estructurados
- [ ] F6-02 — Rendimiento (Lighthouse)
- [ ] F6-03 — Auditoría de seguridad
- [ ] F6-04 — QA final y corrección de errores
- [ ] F6-05 — Guía de despliegue (requiere decisión D-001)

## Finalizadas

- [x] F1-01 — Auditoría inicial del proyecto y plan por fases (2026-11-26)
- [x] F1-02 — Archivos de contexto: `CLAUDE.md`, `PROJECT_CONTEXT.md`, `PROJECT_BRIEF.md`, `TASKS.md`, `DECISIONS.md`, `SESSION_LOG.md` (2026-11-26)
- [x] F1-03 — Aprobación de decisiones D-001…D-011 (2026-11-26)
- [x] F1-04 — `git init`, rama `main`, `.gitignore` (2026-11-26)
- [x] F1-05…F1-11 — README, ARCHITECTURE, DATABASE, DESIGN_SYSTEM (con contraste medido), SECURITY, QA, ROADMAP, CHANGELOG (2026-11-26)
- [x] F1-12 — Primer commit y push a `main` (2026-11-26)
