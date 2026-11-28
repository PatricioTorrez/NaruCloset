# Decisiones — Naru Closet

> Registro de decisiones técnicas y de negocio. Las decisiones aprobadas no se cambian en silencio: si se revierte una, se agrega una nueva entrada que la reemplace.
> Estados: **Pendiente** · **Aprobada** · **Rechazada** · **Reemplazada por D-XXX**

## Pendientes de aprobación

| ID | Tema | Recomendación | Estado |
|---|---|---|---|
| D-014 | Tono de rosa más oscuro (≈ #8E5F5D) para texto pequeño, porque Dusty Rose no alcanza contraste AA (ver `DESIGN_SYSTEM.md` §1) | Solo si se necesita rosa en texto; por ahora el rosa se limita a acentos no textuales | Pendiente |

## Aprobadas

El dueño aprobó el 2026-11-26 todas las recomendaciones de la auditoría ("Tú dale").

| ID | Decisión | Fecha |
|---|---|---|
| D-000 | Stack: Next.js + TypeScript + Tailwind + Supabase, según `PROJECT_BRIEF.md` §4 | 2026-11-26 |
| D-001 | Hosting: se decide en la Fase 6. El código se mantiene portable (Vercel Hobby no permite uso comercial) | 2026-11-26 |
| D-002 | Los apartados **comprometen existencias** por defecto (`stock_reserved`); se puede configurar. Cada apartado guarda la política vigente al crearse (`holds_stock`) | 2026-11-26 |
| D-003 | Los apartados vencen **automáticamente** con `pg_cron` y se liberan con movimiento en el historial | 2026-11-26 |
| D-004 | Roles `owner` y `staff`. Solo `owner` puede cambiar la configuración, ver costos, hacer ajustes de inventario y gestionar usuarios | 2026-11-26 |
| D-005 | Los productos agotados se muestran por defecto con la etiqueta "Agotado" (configurable) | 2026-11-26 |
| D-006 | Las tallas son un catálogo editable desde el panel (letras, números o talla única) | 2026-11-26 |
| D-007 | Variantes = color + talla, extensibles con una migración (`DATABASE.md` §7) | 2026-11-26 |
| D-008 | Se versiona solo `.claude/skills/`; `.agents/` y `.aider-desk/` se excluyen | 2026-11-26 |
| D-009 | ~~Una rama y un PR por fase~~ **Reemplazada por D-015** | 2026-11-26 |
| D-010 | Desarrollo con Supabase local (Docker) primero. Al pasar a la nube se agrega una tarea anti-pausa gratuita | 2026-11-26 |
| D-011 | Sin material de marca: espacios neutros y textos editables, sin fotos de stock que parezcan productos reales | 2026-11-26 |
| D-012 | El proyecto se sube a `github.com/PatricioTorrez/NaruCloset`, rama `main` | 2026-11-26 |
| D-015 | **Sin ramas por fase.** Todo el trabajo va con commit y push directo a `main` del repositorio NaruCloset. Las fases se completan una tras otra sin esperar revisión intermedia | 2026-11-26 |
| D-016 | **Sin Docker.** La base de desarrollo y producción es un proyecto Supabase en la nube (plan gratuito). Migraciones con `npm run db:push`, pruebas SQL con un runner propio en Node (`npm run test:db`) | 2026-11-26 |
| D-017 | Sin shadcn/ui, React Hook Form ni Recharts: primitivos propios con `<dialog>` nativo, `useActionState` + Zod en servidor y una gráfica HTML propia. Menos dependencias, mismo resultado | 2026-11-26 |
| D-018 | Next.js 16 con Cache Components: catálogo con `use cache` + `cacheTag`, invalidado con `updateTag` desde las Server Actions; perfil `catalog` (revalidación 60 s) | 2026-11-26 |
| D-019 | Gráfica del panel en Dusty Rose: única serie; mejor croma de la paleta, banda de luminosidad y contraste ≥ 3:1 validados | 2026-11-26 |
| D-020 | El rol `service_role` recibe privilegios explícitos (migración 7): los proyectos nuevos de Supabase no los conceden. Solo lo usan scripts de servidor | 2026-11-26 |
| D-021 | Panel con `instant = false` en cada página y `loading.tsx`: depende de la sesión en cada petición; `createClient()` llama `connection()` | 2026-11-26 |
| D-022 | El primer owner lo crea el dueño en Supabase (Authentication → Users) y `npm run create-owner` solo lo promueve: los scripts nunca manejan contraseñas | 2026-11-26 |
| D-023 | Un producto tiene varios **colores** (`product_colors`), cada uno con sus fotos y **precio opcional**; precio vigente = color › promoción › precio. Spec: `docs/superpowers/specs/2026-11-27-colores-inventario-rediseno-design.md` | 2026-11-27 |
| D-024 | Formulario de producto sin "Visible" ni "Destacar"; se conserva **Novedad** (va primero en "recientes"). Un producto nuevo nace oculto | 2026-11-27 |
| D-025 | La visibilidad se decide en **Inventario** con un ojo (abierto = visible, tachado = oculto) y modal de confirmación; ahí se capturan tallas y piezas por color (entrada de mercancía transaccional) | 2026-11-27 |
| D-026 | Íconos: Lucide + `@lucide/lab` (dependencia aprobada); categorías guardan la clave en `categories.icon` | 2026-11-27 |
| D-027 | Sitio público: Inicio estilo "Lookbook tipo app" (opción B) y Producto estilo "Boutique editorial" (opción A); misma paleta y tipografías | 2026-11-27 |
| D-028 | Inventario: el owner corrige existencias de varias tallas a la vez con `adjust_stock_many` (todo o nada, motivo obligatorio); reemplaza el botón «Ajustar» por talla | 2026-11-27 |
| D-029 | Un producto sin piezas ni apartados muestra «Quitar»: se elimina si nunca tuvo movimientos; si los tuvo, se archiva | 2026-11-27 |
| D-030 | En el sitio público, la píldora «Todo» lleva al inicio (botón visible para volver) | 2026-11-27 |
| D-013 | Mantener los archivos MD de contexto (`PROJECT_CONTEXT`, `TASKS`, `DECISIONS`, `SESSION_LOG`) actualizados en cada sesión | 2026-11-26 |

## Decisiones técnicas de arquitectura

Ver `ARCHITECTURE.md` §2 (A1–A10). Las más importantes:
- El inventario solo se modifica con funciones PostgreSQL transaccionales con bloqueo de fila.
- Restricciones `CHECK` contra existencias negativas; `inventory_movements` solo admite inserciones.
- Las ventas conservan el precio y los nombres al momento de la operación y nunca se borran.
- Las imágenes se convierten a WebP 4:5 en el navegador.
- Registro público desactivado; los administradores entran por invitación.
