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
| D-009 | La Fase 1 va directo a `main` (repositorio vacío). Desde la Fase 2: una rama y un PR por fase | 2026-11-26 |
| D-010 | Desarrollo con Supabase local (Docker) primero. Al pasar a la nube se agrega una tarea anti-pausa gratuita | 2026-11-26 |
| D-011 | Sin material de marca: espacios neutros y textos editables, sin fotos de stock que parezcan productos reales | 2026-11-26 |
| D-012 | El proyecto se sube a `github.com/PatricioTorrez/NaruCloset`, rama `main` | 2026-11-26 |
| D-013 | Mantener los archivos MD de contexto (`PROJECT_CONTEXT`, `TASKS`, `DECISIONS`, `SESSION_LOG`) actualizados en cada sesión | 2026-11-26 |

## Decisiones técnicas de arquitectura

Ver `ARCHITECTURE.md` §2 (A1–A10). Las más importantes:
- El inventario solo se modifica con funciones PostgreSQL transaccionales con bloqueo de fila.
- Restricciones `CHECK` contra existencias negativas; `inventory_movements` solo admite inserciones.
- Las ventas conservan el precio y los nombres al momento de la operación y nunca se borran.
- Las imágenes se convierten a WebP 4:5 en el navegador.
- Registro público desactivado; los administradores entran por invitación.
