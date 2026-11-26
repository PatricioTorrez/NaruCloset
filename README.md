# Naru Closet

Catálogo web oficial y panel administrativo de **Naru Closet**, marca de ropa para mujer y hombre.

- **Sitio público:** catálogo con fotos, precios, tallas, colores y disponibilidad por variante, con contacto opcional por WhatsApp. No tiene carrito ni pagos en línea; la entrega se coordina directamente con el cliente.
- **Panel privado (`/admin`):** productos, variantes, fotografías, inventario por variante, entradas, ventas, apartados, historial de movimientos y configuración.

> **Estado:** Fase 1 completada (planificación). La aplicación se construye a partir de la Fase 2. Ver [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Tecnologías

Next.js · React · TypeScript · Tailwind CSS · shadcn/ui · Supabase (PostgreSQL, Auth, Storage, RLS) · Zod · React Hook Form.

## Requisitos

- Node.js 20 o superior (desarrollado con 24) y npm.
- Docker Desktop, para correr Supabase en local.
- Supabase CLI, que se usa con `npx supabase`.

## Instalación y ejecución local

> Las instrucciones se completan en la Fase 2, cuando exista la aplicación.

```bash
npm install
cp .env.example .env.local      # completar valores
npx supabase start              # base de datos local (Docker)
npx supabase db reset           # aplica migraciones y datos de desarrollo
npm run dev
```

## Configuración

Variables de entorno: ver [`docs/ARCHITECTURE.md` §4](docs/ARCHITECTURE.md#4-variables-de-entorno). Los datos del negocio (WhatsApp, Instagram, eslogan, políticas) se editan desde `/admin/configuracion`.

## Despliegue

Pendiente de definir en la Fase 6 (decisión D-001). El plan Hobby de Vercel no permite uso comercial; ver `docs/ARCHITECTURE.md` §5.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) | Estado actual del proyecto |
| [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) | Requisitos del negocio |
| [`docs/TASKS.md`](docs/TASKS.md) | Tareas pendientes y finalizadas |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Registro de decisiones |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitectura |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Esquema de base de datos |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Seguridad |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Sistema de diseño |
| [`docs/QA.md`](docs/QA.md) | Pruebas y criterios de aceptación |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Fases |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Cambios |
