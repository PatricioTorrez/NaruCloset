# Base de datos — Naru Closet

> Estado: **esquema diseñado (Fase 1)**. Se implementa con migraciones en la Fase 2. Si la implementación difiere, este documento se corrige en el mismo cambio.

## 1. Convenciones

- PostgreSQL (Supabase). Esquema `public` para tablas; esquema `private` para funciones auxiliares que no se exponen por la API.
- Claves primarias `uuid` (`gen_random_uuid()`). Los folios legibles (`sale_number`, `reservation_number`) son `bigint generated always as identity`.
- Todas las fechas son `timestamptz` (UTC); se muestran en la zona horaria configurada en `store_settings.timezone`.
- Dinero: `numeric(10,2)` en MXN. Nunca `float`.
- Nombres de tablas y columnas en inglés y `snake_case`; textos visibles en español.
- `created_at` y `updated_at` se mantienen con un trigger `set_updated_at`.
- Borrado: la mayoría de las FK usan `on delete restrict`. Lo que tiene historial se archiva, no se borra.

## 2. Tipos enumerados

| Tipo | Valores |
|---|---|
| `user_role` | `owner`, `staff` |
| `product_audience` | `women`, `men`, `unisex` *(unisex aparece en ambas colecciones)* |
| `movement_type` | `stock_entry`, `sale`, `sale_cancellation`, `return`, `reservation`, `reservation_release`, `manual_adjustment`, `admin_correction` |
| `sale_status` | `completed`, `partially_returned`, `returned`, `cancelled` |
| `reservation_status` | `pending`, `confirmed`, `completed`, `cancelled`, `expired` |
| `payment_method` | `cash`, `transfer`, `card`, `other` |

## 3. Tablas

### Usuarios y configuración

**`profiles`** — 1:1 con `auth.users`
| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid PK | FK → `auth.users.id` |
| full_name | text | no nulo |
| role | user_role | no nulo, default `staff` |
| is_active | boolean | default `true`. Para quitar acceso se desactiva; no se borra (conserva la autoría del historial) |
| created_at, updated_at | timestamptz | |

**`store_settings`** — una sola fila (`id boolean PK default true check (id)`)
| Columna | Tipo | Notas |
|---|---|---|
| store_name | text | default `Naru Closet` |
| slogan | text | default `Tu estilo, a tu manera.` |
| description, about_text | text | nulos hasta que el negocio los defina |
| logo_path | text | ruta en Storage; nulo = logotipo tipográfico |
| instagram_handle | text | |
| whatsapp_enabled | boolean | default `false` |
| whatsapp_number | text | formato E.164; obligatorio si `whatsapp_enabled` (check) |
| contact_email, contact_phone | text | |
| currency | char(3) | default `MXN` |
| timezone | text | default `America/Mexico_City` (configurable) |
| show_sold_out_products | boolean | default `true` (D-005) |
| low_stock_threshold | int | default `2`, check ≥ 0 |
| reservations_hold_stock | boolean | default `true` (D-002) |
| reservation_default_days | int | nulo = sin plazo sugerido |
| delivery_info, pickup_info | text | nulos; **no se inventan políticas** |
| updated_at, updated_by | | |

### Catálogo

**`categories`**: id, name (único), slug (único), description, sort_order, is_active, timestamps.

**`colors`**: id, name (único), hex (`^#[0-9A-Fa-f]{6}$`), sort_order, is_active.

**`sizes`**: id, name (único: `XS`, `M`, `30`, `Única`…), sort_order (orden de visualización), is_active.

**`products`**
| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid PK | |
| name | text | no nulo |
| slug | text | único, `^[a-z0-9]+(-[a-z0-9]+)*$` |
| description | text | |
| category_id | uuid | FK → categories, restrict |
| audience | product_audience | no nulo |
| price | numeric(10,2) | > 0. Precio regular |
| sale_price | numeric(10,2) | nulo o `0 < sale_price < price`. Si existe, se muestra como precio actual y `price` aparece tachado como "precio anterior" |
| is_active | boolean | visible en el catálogo |
| is_new, is_featured | boolean | |
| archived_at | timestamptz | no nulo = archivado (baja lógica; nunca visible) |
| created_by | uuid | FK → profiles |
| created_at, updated_at | | |

**`product_variants`**
| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid PK | |
| product_id | uuid | FK → products, restrict |
| color_id | uuid | FK → colors, restrict |
| size_id | uuid | FK → sizes, restrict |
| sku | text | único, opcional |
| stock_on_hand | int | default 0, **check ≥ 0**. Unidades físicas |
| stock_reserved | int | default 0, **check ≥ 0 y ≤ stock_on_hand**. Unidades comprometidas por apartados |
| stock_available | int | **generada**: `stock_on_hand - stock_reserved` |
| is_active | boolean | |
| | | **unique (product_id, color_id, size_id)**: sin combinaciones duplicadas |

Las columnas `stock_*` **no se pueden actualizar** fuera de las funciones de inventario (ver §6).

**`product_images`**
| Columna | Tipo | Reglas |
|---|---|---|
| id | uuid PK | |
| product_id | uuid | FK → products, cascade (las imágenes no son historial) |
| color_id | uuid | opcional: permite que la galería muestre las fotos del color seleccionado |
| storage_path, thumb_path | text | rutas en el bucket `product-images` |
| width, height | int | > 0 |
| alt_text | text | |
| sort_order | int | |
| is_primary | boolean | índice único parcial: **máximo una principal por producto** |

### Inventario

**`stock_entries`** (auxiliar, justificada: una recepción incluye varias variantes)
id, received_at, supplier (opcional), notes, created_by, created_at.

**`stock_entry_items`**
id, stock_entry_id, variant_id, quantity (> 0), unit_cost (numeric, opcional, **solo para el panel**).

**`inventory_movements`** — **solo inserción**
| Columna | Tipo | Notas |
|---|---|---|
| id | bigint identity PK | orden cronológico estable |
| variant_id | uuid | FK restrict. El producto se obtiene por la variante (sin duplicar datos) |
| movement_type | movement_type | |
| on_hand_delta, reserved_delta | int | check: no pueden ser ambos 0 |
| on_hand_before, on_hand_after | int | check `after = before + delta`, ambos ≥ 0 |
| reserved_before, reserved_after | int | ídem |
| reason | text | **obligatorio** en `manual_adjustment` y `admin_correction` (check) |
| stock_entry_id, sale_id, sale_return_id, reservation_id | uuid | referencia opcional al documento origen |
| created_by | uuid | FK → profiles |
| created_at | timestamptz | default `now()` |

Ningún rol tiene `UPDATE` ni `DELETE` sobre esta tabla. Un error se corrige con un nuevo movimiento `admin_correction`.

### Ventas

**`sales`**: id, sale_number (folio), sold_at, status, payment_method (opcional), customer_reference (opcional), notes, total (calculado por la función), reservation_id (opcional, si viene de un apartado), cancelled_at, cancelled_by, cancel_reason, created_by, created_at.

**`sale_items`**: id, sale_id, variant_id, **product_name, color_name, size_name** (copia al momento de la venta), quantity (> 0), unit_price (≥ 0, precio aplicado), line_total (generada), returned_quantity (default 0, check ≤ quantity).

**`sale_returns`**: id, sale_id, returned_at, reason (obligatorio), created_by.
**`sale_return_items`**: id, sale_return_id, sale_item_id, quantity (> 0).

Las ventas **nunca se borran**: se cancelan (`cancel_sale`) o se registran devoluciones (`register_return`).

### Apartados

**`reservations`**: id, reservation_number (folio), customer_name, customer_contact (opcional), status, expires_at (opcional), **holds_stock** (copia de la política vigente al crearse, para que cambiar la configuración no deje reservas inconsistentes), notes, sale_id (cuando se completa), timestamps, created_by.

**`reservation_items`**: id, reservation_id, variant_id, quantity (> 0), unit_price (precio al apartar).

## 4. Índices principales

- `products (category_id)`, `products (audience)`, `products (created_at desc)`; índice parcial para el catálogo `where is_active and archived_at is null`.
- `products using gin (name gin_trgm_ops)` para la búsqueda por nombre (extensión `pg_trgm`).
- `product_variants (product_id)`, `(color_id)`, `(size_id)`.
- `product_images (product_id, sort_order)`.
- `inventory_movements (variant_id, created_at desc)`, `(created_at desc)`.
- `sales (sold_at desc)`, `sale_items (sale_id)`, `sale_items (variant_id)`.
- `reservations (status, expires_at)`, `reservation_items (reservation_id)`, `reservation_items (variant_id)`.

## 5. Funciones de inventario (RPC)

Todas son `security definer`, con `set search_path = ''`. Verifican el rol al inicio, bloquean las variantes **en orden de id** con `SELECT … FOR UPDATE` y escriben un movimiento por cada variante afectada. Si algo falla, toda la operación se revierte.

| Función | Rol | Efecto |
|---|---|---|
| `register_stock_entry(received_at, supplier, notes, items[])` | staff+ | `on_hand += qty` → `stock_entry` |
| `register_sale(items[], payment_method, sold_at, customer_reference, notes)` | staff+ | Valida `qty ≤ stock_available`; `on_hand -= qty` → `sale` |
| `cancel_sale(sale_id, reason)` | staff+ | Devuelve las unidades no devueltas; estado `cancelled` → `sale_cancellation` |
| `register_return(sale_id, items[], reason)` | staff+ | `on_hand += qty`; actualiza `returned_quantity` y el estado → `return` |
| `create_reservation(customer, contact, expires_at, items[], notes)` | staff+ | Si la política retiene existencias: valida disponible y `reserved += qty` → `reservation` |
| `confirm_reservation(id)` | staff+ | Cambia el estado de `pending` a `confirmed` |
| `cancel_reservation(id, reason)` | staff+ | Si retenía existencias: `reserved -= qty` → `reservation_release` |
| `complete_reservation(id, payment_method)` | staff+ | En la misma transacción libera la reserva y crea la venta |
| `expire_reservations()` | sistema (`pg_cron`) | Vence los apartados con `expires_at < now()` y los libera (D-003) |
| `adjust_stock(variant_id, new_on_hand, reason, type)` | **owner** | Ajuste manual o corrección con motivo obligatorio |

Política de disponibilidad (D-002): `stock_available = on_hand − reserved`. Ventas y nuevos apartados nunca superan `stock_available`, así que no se pueden vender unidades apartadas.

## 6. Protección de existencias

- Las restricciones `CHECK` hacen que la base de datos rechace existencias negativas aunque exista un error en el código.
- Un trigger `BEFORE UPDATE` en `product_variants` rechaza cambios a `stock_on_hand` o `stock_reserved` si no vienen de una función de inventario (bandera de transacción `naru.inventory_op`).
- `INSERT` de variantes: siempre con existencias 0. Las existencias iniciales se cargan con una entrada de mercancía, para que quede en el historial.

## 7. Extensibilidad de variantes

Para agregar un atributo (por ejemplo, corte o material): crear un catálogo `fits`, agregar `fit_id` nullable a `product_variants` y reemplazar la restricción única por `(product_id, color_id, size_id, fit_id)` con `nulls not distinct`. Las existencias y el historial no cambian.

## 8. Relaciones (resumen)

```
auth.users 1─1 profiles
categories 1─N products 1─N product_variants N─1 colors / sizes
products 1─N product_images
product_variants 1─N inventory_movements
stock_entries 1─N stock_entry_items N─1 product_variants
sales 1─N sale_items N─1 product_variants
sales 1─N sale_returns 1─N sale_return_items N─1 sale_items
reservations 1─N reservation_items N─1 product_variants
reservations 0..1─1 sales
```
