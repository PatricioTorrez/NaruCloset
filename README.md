# Naru Closet

Catálogo web oficial y panel administrativo de **Naru Closet**, marca de ropa para mujer y hombre.

- **Sitio público:** catálogo con fotos, precios, tallas, colores y disponibilidad por variante, con contacto opcional por WhatsApp. No tiene carrito ni pagos en línea; la entrega se coordina directamente con el cliente.
- **Panel privado (`/admin`):** productos, variantes, fotografías, inventario por variante, entradas, ventas, apartados, historial de movimientos y configuración.

> **Estado:** Fases 1–4 completas y verificadas; Fase 5 verificada a nivel de base de datos; Fase 6 en curso. Ver [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Tecnologías

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL, Auth, Storage, RLS) · Zod · Vitest · pgTAP · Playwright.

## Requisitos

- Node.js 20.9 o superior (desarrollado con 24) y npm.
- Un proyecto de Supabase (plan gratuito). No se usa Docker.

## Instalación y ejecución local

```bash
npm install
npx supabase login                       # sesión de la CLI (abre el navegador)
npx supabase link --project-ref <ref>    # vincula el proyecto
cp .env.example .env.local               # completar valores (ver docs/ARCHITECTURE.md §4)
npm run db:push                          # aplica supabase/migrations
npm run test:db                          # pruebas de inventario y seguridad
npm run dev                              # http://localhost:3000
```

**Primer usuario del panel:** créelo en Supabase (*Authentication → Users → Add user*, con *Auto Confirm User*) y luego ejecute `npm run create-owner -- correo@ejemplo.com "Nombre"`. Desactive el registro público en *Authentication → Sign In / Providers*.

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
