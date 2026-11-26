# Sistema de diseño — Naru Closet

> Concepto: **Warm Minimalism (minimalismo cálido)**. Boutique contemporánea con estética editorial, sin género dominante.
> La identidad (paleta, tipografías, logotipo) no se modifica sin autorización del dueño.

## 1. Color

| Token | Hex | Uso |
|---|---|---|
| `ivory` | #F5F1EB | Fondo principal (~55 %) |
| `white` | #FFFFFF | Superficies, tarjetas (~20 %) |
| `sand` | #DCCFC0 | Fondos secundarios, bloques (~10 %) |
| `espresso` | #302B28 | Texto principal, botones primarios (~10 %) |
| `mocha` | #A68D7B | Elementos complementarios |
| `rose` | #B98280 | Acentos discretos; **nunca dominante** |
| `border` | #E8E1D8 | Bordes y separadores |
| `muted` | #70645B | Texto secundario |

### Contraste medido (WCAG 2.x)

| Texto \ Fondo | Ivory | White | Sand | Espresso |
|---|---|---|---|---|
| Espresso | **12.4** | **14.0** | **9.1** | — |
| Muted | **5.1** | **5.7** | 3.75 ⚠ | 2.4 ✗ |
| Mocha | 2.8 ✗ | 3.1 ⚠ | 2.0 ✗ | 4.5 |
| Rose | 2.8 ✗ | 3.2 ⚠ | 2.1 ✗ | 4.4 ⚠ |
| White | — | — | 1.5 ✗ | **14.0** |

AA exige 4.5 para texto normal y 3.0 para texto grande (≥ 24 px, o ≥ 18.66 px en negrita) y componentes de interfaz.

**Reglas que se derivan:**
- **Mocha y Rose no se usan para texto normal ni para información crítica** (precios, disponibilidad). Sirven para líneas, puntos, fondos de etiqueta con texto espresso, iconos decorativos y titulares grandes sobre blanco (≥ 3.0).
- Sobre `sand`, el texto secundario va en `espresso`, no en `muted`.
- La etiqueta "Agotado" y los indicadores de disponibilidad usan texto `espresso` o `muted` sobre ivory o blanco, nunca solo color: siempre van acompañados de texto.
- *Propuesta pendiente de autorización:* si se necesita rosa para texto pequeño, definir un tono más oscuro (≈ #8E5F5D). No se aplica sin aprobación.

## 2. Tipografía

Fuentes autoalojadas con `next/font/google`: **Playfair Display** (titulares editoriales) y **DM Sans** (interfaz, productos, precios, botones).

| Estilo | Fuente | Tamaño móvil → escritorio | Peso | Interlineado |
|---|---|---|---|---|
| Display (hero) | Playfair | 40 → 64 px | 500 | 1.05 |
| H1 | Playfair | 32 → 48 px | 500 | 1.1 |
| H2 | Playfair | 24 → 32 px | 500 | 1.2 |
| H3 | DM Sans | 18 → 20 px | 500 | 1.3 |
| Cuerpo | DM Sans | 16 px | 400 | 1.6 |
| Pequeño | DM Sans | 14 px | 400 | 1.5 |
| Etiqueta / overline | DM Sans | 12 px, mayúsculas, tracking 0.12em | 500 | 1.4 |
| Precio | DM Sans | 16 → 18 px, `tabular-nums` | 500 | — |

## 3. Espaciado, rejilla y forma

- Escala de 8 px (más 4 px para ajustes finos): 4, 8, 16, 24, 32, 48, 64, 96, 128.
- Contenedor máximo de 1280 px; márgenes laterales de 16 px (móvil), 24 px (tablet) y 32 px (escritorio).
- Rejilla de productos: 2 columnas en móvil, 3 en tablet y 4 en escritorio; separación de 16 a 24 px.
- Fotos de producto en **4:5** (`aspect-[4/5]`, `object-cover`). Las fotos originales no se deforman; si no hay foto, se muestra un marcador sand con el logotipo.
- Radios: 8 px (inputs, botones), 12 px (tarjetas, diálogos). Las fotos de producto de la rejilla llevan un radio mínimo o ninguno, por estética editorial.
- Sombras: casi ninguna. Bordes `border` de 1 px; los elementos flotantes (menús, diálogos) usan como máximo `0 8px 24px rgb(48 43 40 / 0.08)`.

## 4. Componentes base

| Componente | Notas |
|---|---|
| Botón primario | Fondo espresso, texto blanco, alto 48 px en móvil (objetivo táctil) |
| Botón secundario | Borde espresso, fondo transparente |
| Botón de texto | Subrayado al pasar el cursor |
| Tarjeta de producto | Foto 4:5, nombre, precio (y precio anterior tachado en muted), etiquetas "Nuevo" o "Agotado" |
| Selector de color | Círculos de 32 px con el hex, anillo espresso cuando está seleccionado y nombre accesible; tachados si no hay existencias |
| Selector de talla | Botones con borde; deshabilitados y tachados si la combinación no tiene existencias |
| Indicador de disponibilidad | Texto: "Disponible", "Últimas piezas" (≤ `low_stock_threshold`) o "Agotado" |
| Filtros | Hoja inferior en móvil; barra lateral en escritorio |
| Tablas del panel | En móvil se convierten en listas de tarjetas |
| Diálogo de confirmación | Obligatorio en cancelar venta, archivar, ajustes y borrar imágenes |
| Notificaciones | Toasts discretos abajo al centro (móvil) o abajo a la derecha (escritorio) |
| Estados | Esqueleto de carga, estado vacío con mensaje y acción real, y error con opción de reintentar |

## 5. Logotipo

Provisional y solo tipográfico mientras no existan archivos oficiales:
- Principal: `naru closet.` en Playfair Display, minúsculas, con el punto final.
- Secundario: `NARU` / `C L O S E T` en DM Sans, mayúsculas con tracking amplio.
- Sin iconos de perchas, vestidos ni bolsas.

## 6. Movimiento

- Duración de 180 a 250 ms. Curva de salida `cubic-bezier(0.22, 1, 0.36, 1)` para entradas; `ease-out` para cambios de estado.
- Solo se animan `transform` y `opacity`.
- Usos: aparición sutil de secciones, hover de tarjeta (escala de la foto de 1 a 1.03), transición entre fotos de la galería, menú móvil, diálogos y selección de talla o color.
- `prefers-reduced-motion: reduce` desactiva los desplazamientos y conserva solo los cambios de opacidad.
- Nada de animaciones en bucle, parallax ni animaciones que muevan el contenido ya cargado.
- Las skills de `.claude/skills/` (animate, review-animations, mobile-native, break-ui) se usan como criterio de revisión.

## 7. Accesibilidad

- Contraste AA según la tabla del §1.
- Foco visible: anillo de 2 px espresso con 2 px de separación.
- Objetivos táctiles de al menos 44 × 44 px.
- `alt` en todas las fotos de producto (nombre + color).
- Formularios con `label` visibles y errores asociados con `aria-describedby`.
- Idioma `lang="es-MX"`.
