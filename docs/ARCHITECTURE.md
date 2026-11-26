# Arquitectura — Naru Closet

> Estado: **diseño aprobado (Fase 1)**. Todavía no existe código; este documento se actualiza conforme se implementa.

## 1. Visión general

```
Visitante ──►  Next.js · sitio público (Server Components, caché con invalidación)
                         │  lectura con clave publishable + RLS
                         ▼
                 Supabase Postgres ◄── Supabase Storage (bucket product-images)
                         ▲
                         │  RPC transaccionales (security definer + verificación de rol)
Administrador ─► Next.js · /admin (sesión Supabase Auth, middleware, Server Actions + Zod)
```

- **Un solo proyecto Next.js** (App Router) contiene el sitio público y el panel. No hay backend separado: la lógica de negocio crítica vive en **PostgreSQL**.
- **Lecturas:** Server Components consultan Supabase directamente. Las lecturas públicas están limitadas por RLS.
- **Escrituras:** formulario del panel → Server Action (valida con Zod y verifica sesión y rol) → función RPC de PostgreSQL (vuelve a verificar el rol y ejecuta todo en una transacción).
- **Inventario:** ninguna ruta del frontend actualiza `product_variants.stock_*` directamente. Solo las funciones descritas en `DATABASE.md` §5.

## 2. Decisiones técnicas

| # | Decisión | Motivo |
|---|---|---|
| A1 | La lógica de inventario está en funciones PostgreSQL, no en TypeScript | Atomicidad, bloqueo de fila y una sola fuente de verdad, incluso si algún día existe otro cliente |
| A2 | Defensa en profundidad: middleware → layout del panel → Server Action → RPC → RLS | Ocultar rutas no es seguridad; cada capa verifica por su cuenta |
| A3 | Server Actions en lugar de API REST propia | Menos superficie, tipado de extremo a extremo y protección CSRF integrada de Next.js |
| A4 | Tipos generados con `supabase gen types` | El esquema SQL es la fuente de verdad de los tipos |
| A5 | Imágenes convertidas a WebP 4:5 **en el navegador** antes de subirlas, con miniatura | Las transformaciones de Supabase son de pago y la optimización de Vercel tiene cuota; además se cumple el objetivo de 100–250 KB |
| A6 | Caché pública: datos etiquetados (`catalog`, `product:{slug}`, `settings`) que se invalidan desde cada Server Action, con revalidación de seguridad cada 60 s | Catálogo rápido sin mostrar disponibilidad vieja |
| A7 | Variantes = color + talla con catálogos `colors` y `sizes` | Cubre el negocio actual; agregar corte o material es una migración, no una reconstrucción (ver `DATABASE.md` §7) |
| A8 | Sin carrito ni pagos; el contacto es un enlace `wa.me` con el producto y la variante prellenados | Es el modelo de negocio definido |
| A9 | Código portable entre proveedores (sin APIs exclusivas de Vercel) | El hosting se decide en la Fase 6 (D-001) |
| A10 | npm como gestor de paquetes | Ya está instalado; pnpm no |

## 3. Estructura de carpetas (objetivo)

```
NaruCloset/
├─ CLAUDE.md · README.md · .env.example · .gitignore
├─ docs/                      # contexto, requisitos y documentación técnica
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/             # esquema, RLS, funciones, storage, cron
│  ├─ tests/                  # pgTAP: RLS, inventario, concurrencia
│  └─ seed.sql                # SOLO datos de desarrollo local
├─ src/
│  ├─ app/
│  │  ├─ (public)/            # layout público
│  │  │  ├─ page.tsx                    → /
│  │  │  ├─ catalogo/ · mujer/ · hombre/ · novedades/
│  │  │  ├─ producto/[slug]/
│  │  │  └─ nosotros/ · contacto/
│  │  ├─ admin/
│  │  │  ├─ login/
│  │  │  └─ (panel)/          # layout protegido
│  │  │     ├─ page.tsx                 → dashboard
│  │  │     ├─ productos/ · categorias/ · atributos/ (colores y tallas)
│  │  │     ├─ inventario/ · entradas/ · ventas/ · apartados/ · movimientos/
│  │  │     └─ configuracion/
│  │  ├─ sitemap.ts · robots.ts · layout.tsx · not-found.tsx
│  ├─ components/
│  │  ├─ ui/                  # primitivas (shadcn/ui adaptadas a la marca)
│  │  ├─ brand/               # logotipo tipográfico
│  │  ├─ public/              # tarjetas, galería, filtros, selector de variante
│  │  └─ admin/               # tablas, formularios, diálogos de confirmación
│  ├─ lib/
│  │  ├─ supabase/            # server.ts · browser.ts · middleware.ts
│  │  ├─ auth/                # requireAdmin(), requireOwner()
│  │  ├─ queries/             # lecturas (catálogo, panel)
│  │  ├─ actions/             # Server Actions → RPC
│  │  ├─ validations/         # esquemas Zod compartidos
│  │  ├─ images/              # recorte 4:5, conversión WebP, miniaturas
│  │  └─ format.ts            # MXN, fechas en zona de la tienda
│  ├─ types/database.ts       # generado
│  └─ middleware.ts
└─ tests/
   ├─ unit/                   # Vitest
   └─ e2e/                    # Playwright
```

## 4. Variables de entorno

| Variable | Alcance | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente + servidor | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | cliente + servidor | Clave publishable/anon. Es segura porque todo está protegido por RLS |
| `SUPABASE_SECRET_KEY` | **solo scripts del servidor** | Clave secret/service_role. Se usa únicamente para crear el primer usuario `owner`. Nunca lleva el prefijo `NEXT_PUBLIC_` ni se importa en código de cliente |
| `NEXT_PUBLIC_SITE_URL` | cliente + servidor | URL canónica para SEO, sitemap y Open Graph |

La configuración del negocio (WhatsApp, Instagram, eslogan, políticas) se guarda en la tabla `store_settings`, no en variables de entorno.

## 5. Servicios y límites de los planes gratuitos

> Verificar las condiciones vigentes antes del lanzamiento (Fase 6).

| Servicio | Plan | Limitación relevante | Mitigación |
|---|---|---|---|
| Supabase | Free | Pausa el proyecto tras ~7 días sin actividad; ~500 MB de base de datos; ~1 GB de Storage; sin transformaciones de imagen | Tarea programada gratuita que hace una consulta liviana (D-010); imágenes WebP comprimidas en el navegador |
| Vercel | Hobby | **No permite uso comercial** | Decidir proveedor en la Fase 6 (D-001); mantener el código portable |
| GitHub | Free | — | Repositorio privado |

## 6. Flujo de una operación de inventario (ejemplo: venta)

1. El administrador llena el formulario de venta en `/admin/ventas/nueva`.
2. La Server Action `createSale` valida con Zod y llama a `requireAdmin()`.
3. Se llama a `rpc('register_sale', {...})`.
4. PostgreSQL, en una sola transacción:
   - verifica que el usuario sea administrador activo;
   - bloquea las variantes involucradas en orden de `id` (`FOR UPDATE`) para evitar condiciones de carrera e interbloqueos;
   - comprueba que haya disponible; si no alcanza, revierte todo con un error claro;
   - inserta `sales` y `sale_items` con el precio y los nombres en ese momento;
   - descuenta `stock_on_hand`;
   - inserta un `inventory_movements` por línea con las existencias antes y después.
5. La Server Action invalida la caché del catálogo y del producto, y muestra la confirmación.
