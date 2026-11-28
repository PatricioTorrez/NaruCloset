# Colores por producto, inventario con visibilidad y rediseño público

Fecha: 2026-11-27 · Aprobado por el dueño en conversación.

## Por qué

El dueño quiere publicar **un solo producto con varios colores** (p. ej. un suéter en negro, rojo y beige),
cada color con sus fotos y, si se quiere, su propio precio; capturar tallas y cantidades desde **Inventario**,
y decidir ahí con un **ojito** si el producto se muestra en la tienda. Además, categorías ya hechas con íconos
y un sitio público rediseñado (Inicio estilo "Lookbook tipo app", Producto estilo "Boutique editorial";
maqueta en `.superpowers/brainstorm/…/sitio-publico-elegida.html`).

## Decisiones

| Tema | Decisión |
|---|---|
| Variantes | Un producto → varios **colores** (`product_colors`), cada uno con fotos (`product_images.color_id`, ya existía) y **precio opcional**. Las tallas y existencias siguen siendo variantes color × talla. |
| Precio | `private.effective_price` = precio del color › precio promocional › precio. Ventas y apartados lo usan sin más cambios. |
| Formulario de producto | Nombre, slug, categoría (mosaico con ícono), colección (mosaico con ícono), precio, promoción, descripción, **Novedad**, y sección **Colores** (color + precio opcional + fotos). Se quitan "Visible" y "Destacar". |
| Novedad | Se conserva la casilla. Lo marcado como novedad aparece primero en el orden "recientes". `is_featured` queda en la base sin uso en el panel (no se borra nada). |
| Visibilidad | Producto nuevo nace **oculto**. En Inventario, ojo abierto = visible / ojo tachado = oculto; cada cambio pide confirmación en un modal. |
| Inventario | Agrupado por producto y color. "Agregar existencias" por color: elige tallas y cantidades; el servidor crea las variantes faltantes (con 0) y registra una **entrada de mercancía** con la función transaccional existente. |
| Íconos | Lucide + `@lucide/lab` (aprobado). Categorías guardan una clave de ícono (`categories.icon`). Colecciones: Mujer = vestido, Hombre = camisa, Unisex = playera. |
| Datos precargados | Categorías: Blusas, Playeras, Camisas, Suéteres, Sudaderas, Abrigos (existente), Vestidos, Faldas, Pantalones, Shorts, Calzado, Accesorios. Tallas XS–XXL y Unitalla. Colores básicos. Todo con `on conflict do nothing`. |
| Público | Inicio: encabezado con buscador y selector Todo/Mujer/Hombre, categorías en círculos con ícono, portada mosaico, tarjetas con cambio de color, barra inferior en móvil. Producto: galería apilada (escritorio) / foto + miniaturas (móvil), tarjetas de color con foto y precio, tallas, disponibilidad, WhatsApp. |

## No metas

- No se cambia paleta ni tipografías (Warm Minimalism).
- No se borra ni modifica historial de inventario; no hay escritura directa de existencias.

## Enfoques considerados

1. **Colores como entidad del producto (`product_colors`)** — elegido: precio y fotos por color sin duplicar productos.
2. Un producto por color agrupado por "modelo" — descartado: duplica descripción, slug y catálogo.
3. Precio en cada variante color × talla — descartado: obliga a repetir el precio en cada talla.
