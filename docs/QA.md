# QA — Naru Closet

> Una funcionalidad está **terminada** solo cuando su casilla está marcada con una prueba automatizada o con una verificación manual documentada (fecha y responsable).

## 1. Herramientas

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| Base de datos | pgTAP (`supabase test db`) | Restricciones, RLS, funciones de inventario, concurrencia |
| Unidad | Vitest | Esquemas Zod, formato MXN y fechas, utilidades de imágenes |
| Extremo a extremo | Playwright | Flujos del catálogo y del panel en móvil (390 px), tablet (768 px) y escritorio (1440 px) |
| Estático | `tsc --noEmit`, ESLint, `next build` | Sin errores ni advertencias ignoradas |
| Auditoría | Lighthouse | Rendimiento, accesibilidad y SEO del sitio público (Fase 6) |

**Puerta de calidad para cada cambio:** `npm run typecheck && npm run lint && npm run test && npm run build`, más `supabase test db` si cambió SQL.

## 2. Pruebas de inventario (obligatorias, pgTAP)

- [ ] I-1 Una entrada aumenta solo las existencias de la variante indicada.
- [ ] I-2 Una venta descuenta las existencias correctas.
- [ ] I-3 Operar una variante no modifica otra del mismo producto.
- [ ] I-4 Vender más que `stock_available` falla y no deja cambios parciales.
- [ ] I-5 Cancelación y devolución restauran existencias y generan su movimiento.
- [ ] I-6 Dos ventas simultáneas de la última unidad: exactamente una tiene éxito.
- [ ] I-7 En cada movimiento se cumple `after = before + delta`, y la suma de deltas coincide con las existencias actuales.
- [ ] I-8 Con `reservations_hold_stock = true`, las unidades apartadas no se pueden vender; al cancelar o vencer el apartado se liberan.
- [ ] I-9 Los ajustes sin motivo fallan; `staff` no puede hacer ajustes.
- [ ] I-10 `UPDATE` directo de `stock_on_hand` fuera de las funciones falla.

## 3. Pruebas de seguridad

- [ ] S-1 `/admin` sin sesión redirige al login.
- [ ] S-2 Un usuario autenticado sin perfil, o con perfil inactivo, no accede al panel ni a las RPC.
- [ ] S-3 `anon` no puede leer ventas, movimientos, apartados, costos ni perfiles (pgTAP con `set role anon`).
- [ ] S-4 `anon` no puede insertar ni actualizar productos o variantes usando la clave publishable.
- [ ] S-5 `anon` no puede subir ni borrar archivos en `product-images`.
- [ ] S-6 `staff` no puede cambiar la configuración, ver costos ni ajustar inventario.
- [ ] S-7 El bundle del cliente no contiene `SUPABASE_SECRET_KEY` (búsqueda en `.next/static`).
- [ ] S-8 Los productos inactivos o archivados no aparecen ni son accesibles por URL (404).

## 4. Pruebas funcionales (Playwright)

- [ ] F-1 Crear, editar, desactivar y archivar un producto.
- [ ] F-2 Crear variantes; rechazar una combinación duplicada.
- [ ] F-3 Subir, reordenar, marcar como principal y eliminar fotos.
- [ ] F-4 Registrar una entrada, una venta, una cancelación y una devolución desde el panel.
- [ ] F-5 Crear, confirmar, completar y cancelar apartados.
- [ ] F-6 El historial muestra todos los movimientos anteriores con usuario y motivo.
- [ ] F-7 El dashboard coincide con los datos reales de la base.
- [ ] F-8 El catálogo filtra por categoría, colección, talla y color, ordena y busca con datos reales.
- [ ] F-9 En el detalle de producto, la disponibilidad cambia al elegir color y talla; una variante con 0 existencias nunca aparece como disponible.
- [ ] F-10 El botón de WhatsApp solo aparece si está habilitado, incluye el producto y la variante, y no aparece si está agotado.

## 5. Pruebas visuales

- [ ] V-1 Móvil, tablet y escritorio en todas las rutas públicas y del panel.
- [ ] V-2 Fotos verticales, horizontales y productos sin foto.
- [ ] V-3 Nombres y descripciones muy largos (skill `break-ui`).
- [ ] V-4 Producto agotado, catálogo vacío, sin resultados de filtro.
- [ ] V-5 Error de carga (Supabase no disponible): mensaje claro, sin pantalla rota.
- [ ] V-6 `prefers-reduced-motion` respetado.
- [ ] V-7 Navegación completa con teclado y foco visible.

## 6. Criterios de aceptación por fase

Ver `ROADMAP.md`. Una fase se cierra solo con su puerta de calidad en verde y revisión del dueño.
