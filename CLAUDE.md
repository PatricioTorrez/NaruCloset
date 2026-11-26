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

No avanzar a otra fase sin la aprobación del usuario. No tomar decisiones marcadas como *Pendiente* en `DECISIONS.md`.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Lucide · Supabase (Postgres, Auth, Storage, RLS) · Zod · React Hook Form · Recharts.
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

_(Se completan en la Fase 2, cuando exista la aplicación.)_
