# Seguridad — Naru Closet

> Estado: **diseño aprobado (Fase 1)**. Cada control se marca como implementado en `QA.md` cuando tenga una prueba que lo verifique.

## 1. Autenticación

- Supabase Auth con correo y contraseña. Las contraseñas las gestiona Supabase; nunca se guardan en tablas propias.
- **Registro público desactivado.** Los usuarios se crean por invitación desde el panel de Supabase. El primer `owner` se crea con un script de servidor que usa `SUPABASE_SECRET_KEY`.
- La sesión vive en cookies httpOnly gestionadas por `@supabase/ssr`. El middleware solo refresca la sesión.
- En el servidor la identidad se verifica con `supabase.auth.getUser()` o `getClaims()`, que validan contra Auth. Nunca se confía en `getSession()` para autorizar.

## 2. Autorización: capas

| Capa | Control |
|---|---|
| Middleware | Redirige `/admin/*` (excepto `/admin/login`) sin sesión a `/admin/login`. Es comodidad, no seguridad |
| Layout del panel | `requireAdmin()`: usuario válido y perfil activo con rol `owner` o `staff`; si no, redirige |
| Server Actions | Cada acción vuelve a llamar a `requireAdmin()` o `requireOwner()` y valida la entrada con Zod |
| Funciones RPC | Verifican `private.current_role()` antes de tocar datos |
| RLS | Última barrera: aunque alguien llame la API con la clave publishable, solo ve y modifica lo que su rol permite |

## 3. Roles (D-004)

| Acción | Visitante | staff | owner |
|---|:-:|:-:|:-:|
| Ver catálogo público | ✓ | ✓ | ✓ |
| Gestionar productos, variantes, fotos, categorías, colores y tallas | | ✓ | ✓ |
| Entradas, ventas, cancelaciones, devoluciones, apartados | | ✓ | ✓ |
| Ver costos de adquisición | | | ✓ |
| Ajustes manuales y correcciones de inventario | | | ✓ |
| Configuración de la tienda y usuarios | | | ✓ |

## 4. Políticas RLS

RLS está **activado en todas las tablas** de `public`. Funciones auxiliares en el esquema `private` (no expuesto): `is_admin()`, `is_owner()`.

| Tabla | anon / authenticated sin rol | staff | owner |
|---|---|---|---|
| categories, colors, sizes | SELECT activos | ALL | ALL |
| products | SELECT `is_active and archived_at is null` | ALL (sin DELETE si hay historial, lo impiden las FK) | ALL |
| product_variants | SELECT activas de productos visibles | INSERT/UPDATE de datos no relacionados con existencias | ídem |
| product_images | SELECT de productos visibles | ALL | ALL |
| store_settings | SELECT (vista `public_store_settings`, sin `updated_by`) | SELECT | SELECT/UPDATE |
| profiles | — | SELECT el propio | SELECT/UPDATE |
| stock_entries, stock_entry_items | — | SELECT (sin `unit_cost`, mediante una vista) | SELECT |
| inventory_movements | — | SELECT | SELECT |
| sales, sale_items, sale_returns*, reservations* | — | SELECT | SELECT |

- Ningún rol tiene INSERT/UPDATE/DELETE directo sobre movimientos, ventas, apartados o existencias: solo se escriben a través de las funciones RPC.
- La información interna (costos, ventas, movimientos, apartados, clientes) **nunca** es legible para `anon`.

## 5. Storage

- Bucket `product-images`: **lectura pública** (son las fotos del catálogo).
- INSERT/UPDATE/DELETE en `storage.objects` solo si `bucket_id = 'product-images' and private.is_admin()`.
- Límites del bucket: tamaño máximo de 1 MB por archivo; tipos `image/webp`, `image/jpeg`, `image/png`.
- Rutas: `products/{product_id}/{image_id}.webp` y `…_thumb.webp`. El id aleatorio evita que se adivinen nombres.
- Aceptado: una foto de un producto archivado sigue accesible si alguien conserva su URL. No contiene información sensible.

## 6. Datos y secretos

- `.env*` está en `.gitignore`; solo se versiona `.env.example` sin valores.
- `SUPABASE_SECRET_KEY` nunca lleva el prefijo `NEXT_PUBLIC_` y solo se usa en scripts. Se agregará una regla de lint que impida importar `lib/supabase/admin` desde código cliente.
- Datos de clientes mínimos: nombre o referencia y un contacto opcional en apartados. No se guardan datos de pago.
- Los errores que ve el usuario son mensajes genéricos en español; el detalle técnico solo va a los logs del servidor, sin datos personales.

## 7. Concurrencia

- Las operaciones de inventario bloquean las filas de las variantes (`FOR UPDATE`) en orden de `id`, lo que evita sobreventa e interbloqueos.
- Las restricciones `CHECK` son la red de seguridad final.
- La prueba pgTAP de concurrencia (ver `QA.md`) ejecuta dos ventas simultáneas de la última unidad: solo una debe tener éxito.

## 8. Cabeceras HTTP (Fase 6)

`Content-Security-Policy` (solo el propio dominio, Supabase y Google Fonts autoalojadas por `next/font`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`.
