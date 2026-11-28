# Bitácora de sesiones — Naru Closet

> Una entrada por sesión de trabajo, la más reciente arriba. Breve: qué se hizo, qué quedó pendiente, qué se aprendió.

---

## 2026-11-27 — Sesión 2: colores por producto, inventario con ojo y rediseño público

**Hecho**
- Maqueta del sitio público con 2 opciones + la actual (`.superpowers/brainstorm/…`, ignorado en git). El dueño eligió Inicio B + Producto A.
- Migración 8 (`product_colors`, `categories.icon`, precio por color, catálogo con colores, datos precargados) probada en transacción y aplicada con autorización. Nueva prueba pgTAP `product_colors.sql`.
- `@lucide/lab` agregado (aprobado). Registro de íconos en `src/lib/icons.tsx`; selector de ícono en Categorías.
- Producto: mosaicos de categoría y colección con ícono, Novedad, sección de colores con precio y fotos; edición con panel "Colores y fotografías". Se eliminó `variant-manager`.
- Inventario: agrupado por producto y color, ojo de visibilidad con modal, "Agregar piezas" por talla (crea variantes y registra entrada).
- Público: encabezado con buscador y píldoras, categorías en círculos, portada mosaico, tarjetas con cambio de color, barra inferior móvil; producto con galería apilada y tarjetas de color con foto y precio.

**Verificación en Chrome (escritorio)**
- Producto «PRUEBA - borrar sueter» creado con 2 colores (Negro, Rojo con precio propio $590) y una foto por color; nació oculto y abrió «Agregar piezas». Piezas registradas, ojo con modal, tarjeta con cambio de color (foto y precio), página de producto abriendo en el color elegido. Luego se **archivó** (queda en el historial de movimientos).
- Corregido durante la prueba: cambios rápidos en las filas de color se pisaban (ahora se actualizan sobre el estado más reciente); el mosaico del inicio dejaba hueco con pocas prendas; «Todo» ahora lleva al inicio (pedido del dueño).

- Pedido del dueño: editar existencias y quitar productos sin existencias. Migración 9 (`adjust_stock_many`) aplicada con autorización; «Editar existencias» por color con motivos rápidos y botón de quitar (con modal). Probado: el producto de prueba se restauró, se llevó a 0 y se quitó (quedó archivado por tener historial).

- El dueño no encontraba «Editar existencias»: su producto no tenía colores. Ahora Inventario tiene «Agregar color» (destacado si el producto no tiene colores, y al pie de cada producto).

**Pendiente**
- Revisar en teléfono y tablet.
- ~~Commit y push~~ Hecho con autorización: commit 4fc1581 en `main`.

**Notas**
- La extensión de Chrome volvió a fallar (capturas con timeout y luego desconexión). Las páginas públicas se verificaron por HTTP (200 con el contenido nuevo).
- `supabase db push` en modo agente exige `--yes` aunque el dueño ya autorizó.

---

## 2026-11-26 — Sesión 1 (continuación): verificación contra Supabase

**Hecho**
- Proyecto Supabase vinculado con la CLI (sin Docker). `.env.local` generado sin mostrar claves. 7 migraciones aplicadas; tipos generados desde la base.
- 53 pruebas pgTAP y la prueba de concurrencia en verde. Build de producción en verde.
- Registro público desactivado en Supabase (desde Chrome). Owner creado por el dueño y promovido con el script.
- QA en Chrome con el owner: se encontraron y corrigieron estos errores:
  - Las casillas sin marcar invalidaban el formulario (Zod 4); se agregaron pruebas unitarias.
  - React 19 vaciaba el formulario tras un error de validación; nuevo hook `useFormAction`.
  - El formulario de categoría no se limpiaba al crear.
  - Al rol `service_role` le faltaban privilegios (migración 7).
  - Next 16 marcaba `Date.now()` y datos sin caché en el panel; se resolvió con `connection()`, `loading.tsx` e `instant = false`.
  - Las cifras de Playfair se veían como letras; ahora usan `lining-nums`.
  - El hero era demasiado alto en ventanas bajas.
  - Un producto agotado invitaba a apartarlo; ya no lo hace.

**Pendiente**
- Ventas, devoluciones y apartados desde la interfaz con datos reales; prueba en teléfono; Lighthouse; E2E; hosting.

**Notas**
- Las capturas de pantalla de Chrome dejaron de responder a mitad de la sesión (CDP timeout), aunque la página seguía funcionando; la verificación siguió por DOM y base de datos.
- Con prerender parcial, un producto inexistente devuelve 200 con la página "no existe" y `noindex`.

---

## 2026-11-26 — Sesión 1 (continuación): Fases 2–6 implementadas

**Hecho**
- El dueño pidió completar todas las fases y subir directo a `main` sin ramas (D-015) y no usar Docker (D-016): Supabase en la nube.
- Next.js 16.4 (Cache Components, `proxy.ts`), 6 migraciones SQL, sitio público completo, panel completo, pruebas pgTAP con runner propio sin Docker, prueba de concurrencia, E2E de solo lectura, SEO.
- Se quitaron dependencias sin uso (react-hook-form, resolvers); no se instaló shadcn ni Recharts (D-017).

**Pendiente**
- `.env.local` con credenciales → aplicar migraciones y ejecutar todas las verificaciones.

**Notas / riesgos**
- El build pre-renderiza el catálogo: necesita la base accesible durante el build.
- Los tipos `src/types/database.ts` están escritos a mano; regenerarlos con `npm run db:types` (requiere `npx supabase login`).

---

## 2026-11-26 — Sesión 1 (continuación): cierre de la Fase 1

**Hecho**
- El dueño aprobó todas las recomendaciones (D-001…D-011).
- Escritos `ARCHITECTURE`, `DATABASE` (esquema completo, RPC, índices), `SECURITY` (capas, RLS, Storage), `DESIGN_SYSTEM`, `QA`, `ROADMAP`, `CHANGELOG`, `README` y `.gitignore`.
- Medido el contraste de la paleta: Mocha y Rose dan ≈ 2.8:1 sobre Ivory (no aptos para texto normal); Muted sobre Sand da 3.75:1. Se documentaron reglas de uso sin cambiar la paleta. Nueva decisión pendiente: D-014.
- `git init`, primer commit y push a `main`.

**Pendiente**
- Autorización para iniciar la Fase 2.

---

## 2026-11-26 — Sesión 1: auditoría y contexto

**Hecho**
- Auditoría de la carpeta: sin código de aplicación; solo skills de diseño (triplicadas en `.claude/`, `.agents/`, `.aider-desk/`), `.idea/` y `skills-lock.json`.
- Verificado el entorno: Node 24.19, npm 11.17, Git, Docker, Supabase CLI y `gh` autenticado.
- Verificado el repositorio remoto: privado y vacío.
- Presentados la arquitectura, la estructura de carpetas, las variables de entorno, el plan en 6 fases y 11 decisiones pendientes.
- Creados los archivos de contexto: `CLAUDE.md`, `docs/PROJECT_CONTEXT.md`, `docs/PROJECT_BRIEF.md`, `docs/TASKS.md`, `docs/DECISIONS.md` y `docs/SESSION_LOG.md`.

**Pendiente**
- Respuesta del usuario a D-001 … D-011.
- Resto de la Fase 1: git init, `.gitignore`, documentación técnica y primer push.

**Notas / riesgos**
- Vercel Hobby no permite uso comercial.
- Supabase Free pausa el proyecto tras unos 7 días de inactividad.
- Las transformaciones de imagen de Supabase son de pago.
