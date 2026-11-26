# NARU CLOSET — PROMPT MAESTRO DEL PROYECTO

> Fuente de verdad de los requisitos, proporcionada por el dueño del proyecto el 2026-11-26.
> No modificar sin autorización. Los cambios de alcance se registran en `DECISIONS.md`.

## 1. ROL Y OBJETIVO

Actúa como un desarrollador Full Stack senior, arquitecto de software, diseñador UI/UX y especialista en comercio minorista.

Tu objetivo es diseñar y desarrollar **Naru Closet**, una plataforma web para una marca de ropa que necesita mostrar sus productos al público y administrar internamente su catálogo, inventario, variantes, fotografías y ventas.

Debes trabajar con una mentalidad profesional: código limpio, arquitectura escalable, seguridad, rendimiento, accesibilidad y una experiencia visual coherente con la identidad de la marca.

No construyas únicamente una demostración visual. El objetivo es desarrollar un sistema real, funcional y preparado para utilizarse en un negocio.

Antes de implementar cualquier funcionalidad:
- Analiza la estructura actual del proyecto.
- Identifica las tecnologías y dependencias existentes.
- Comprueba qué funcionalidades ya están implementadas.
- No sobrescribas ni elimines código útil sin justificación.
- Propón una arquitectura organizada.
- Divide el trabajo en etapas verificables.
- Documenta las decisiones técnicas importantes.

Si falta información indispensable, pregunta antes de tomar decisiones que puedan afectar la arquitectura o el funcionamiento del negocio.

---

## 2. DESCRIPCIÓN DEL NEGOCIO

**Nombre:** Naru Closet.

**Actividad:** Venta de ropa para mujeres y hombres.

**Modelo de negocio:**
- No existe una tienda física tradicional.
- La marca venderá principalmente de manera local.
- Instagram será uno de los principales canales de promoción.
- El sitio web funcionará como catálogo oficial de productos.
- Los clientes podrán consultar productos, precios, tallas, colores y disponibilidad.
- WhatsApp podría utilizarse como canal de contacto o solicitud de productos.
- La entrega o recolección de los productos se coordinará directamente con el cliente.

El proyecto NO debe construirse como una tienda electrónica tradicional con carrito de compras, checkout y pagos en línea.

La prioridad es tener un catálogo público actualizado y un panel privado que permita administrar el negocio.

### Flujo esperado del cliente

1. El cliente descubre Naru Closet en Instagram.
2. Visita el sitio web.
3. Explora el catálogo.
4. Consulta fotografías, precios, tallas, colores y disponibilidad.
5. Puede contactar a la tienda para preguntar o solicitar un producto.
6. La entrega se coordina directamente.

El canal de WhatsApp debe poder activarse o desactivarse desde la configuración del sistema.

No asumir que se utilizará Facebook ni implementar funciones innecesarias para ese canal.

---

## 3. IDENTIDAD DE MARCA

La identidad visual debe transmitir:

- Elegancia.
- Calidez.
- Modernidad.
- Minimalismo.
- Cercanía.
- Versatilidad.
- Estilo cotidiano.
- Personalidad propia.

Naru Closet está dirigido tanto a mujeres como a hombres. La identidad no debe sentirse exclusivamente femenina ni masculina.

### Concepto visual

**Warm Minimalism — Minimalismo cálido.**

El diseño debe combinar una estética editorial de moda con una interfaz moderna, limpia y sencilla.

Debe sentirse como una boutique contemporánea, no como una plantilla genérica de comercio electrónico.

### Paleta de colores

Utiliza esta paleta como referencia oficial inicial:

| Color | Código | Uso |
|---|---|---|
| Warm Ivory | #F5F1EB | Fondo principal |
| Deep Espresso | #302B28 | Textos principales y botones |
| Soft Sand | #DCCFC0 | Fondos secundarios |
| Muted Mocha | #A68D7B | Elementos complementarios |
| Dusty Rose | #B98280 | Acentos discretos |
| White | #FFFFFF | Superficies y tarjetas |
| Border | #E8E1D8 | Bordes y separadores |
| Muted Text | #70645B | Textos secundarios |

Distribución visual orientativa:
- 55 % tonos ivory.
- 20 % blanco.
- 10 % arena.
- 10 % espresso.
- 5 % acentos complementarios.

No utilices el rosa como color dominante.

### Tipografías

- **Playfair Display:** títulos editoriales, encabezados y campañas.
- **DM Sans:** navegación, botones, productos, precios, descripciones y elementos de interfaz.

### Logotipo

La dirección inicial será tipográfica.

- Nombre principal: `naru closet.`
- Versión secundaria: `NARU / C L O S E T`.
- Estética limpia, elegante y minimalista.
- Evitar iconos genéricos de perchas, vestidos o bolsas de compras.
- No inventar ni modificar el logotipo definitivo sin autorización.

Si todavía no existen archivos oficiales del logotipo, utiliza temporalmente una versión tipográfica sencilla.

### Eslogan propuesto

"Tu estilo, a tu manera."

Debe poder modificarse desde la configuración del sitio.

---

## 4. TECNOLOGÍAS Y ARQUITECTURA

La arquitectura recomendada para comenzar es:

### Frontend
- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- shadcn/ui cuando aporte valor.
- Lucide Icons.

### Backend y datos
- Supabase.
- PostgreSQL.
- Supabase Storage para fotografías.
- Supabase Auth para autenticación administrativa.
- Row Level Security (RLS) para proteger los datos.

### Validación y formularios
- Zod.
- React Hook Form.

### Visualización de datos
- Recharts cuando se necesiten gráficas administrativas.

### Control de versiones
- Git.
- GitHub.

### Despliegue
Diseñar el proyecto para poder desplegarse en Vercel u otro proveedor compatible con Next.js.

Antes de elegir el proveedor definitivo, comprobar que su plan y condiciones permiten el uso comercial del proyecto.

### Consideraciones económicas

La prioridad es comenzar con servicios gratuitos o de bajo costo.

No contratar servicios innecesarios ni agregar dependencias de pago sin autorización.

Los servicios gratuitos tienen límites. Documenta las limitaciones relevantes y evita diseñar el sistema dependiendo de una capacidad que el plan elegido no garantice.

---

## 5. ESTRUCTURA GENERAL DEL SISTEMA

La aplicación tendrá dos áreas principales:

### A. Sitio público

Accesible para cualquier visitante.

Rutas sugeridas:

- `/` — Inicio.
- `/catalogo` — Catálogo completo.
- `/mujer` — Colección para mujer.
- `/hombre` — Colección para hombre.
- `/novedades` — Productos nuevos.
- `/producto/[slug]` — Detalle del producto.
- `/nosotros` — Información de la marca.
- `/contacto` — Información de contacto.

### B. Panel administrativo

Acceso privado y exclusivo para usuarios autorizados.

Ruta sugerida:

- `/admin`

Secciones:

- Dashboard.
- Productos.
- Categorías.
- Variantes.
- Inventario.
- Entradas de mercancía.
- Ventas.
- Reservaciones o apartados.
- Historial de movimientos.
- Configuración.

El panel administrativo debe tener una interfaz independiente del catálogo público, pero conservar la identidad visual de Naru Closet.

---

## 6. SITIO WEB PÚBLICO

### 6.1 Página de inicio

Debe presentar la identidad de Naru Closet de manera atractiva.

Elementos sugeridos:

- Encabezado con logotipo y navegación.
- Menú para mujer y hombre.
- Sección principal tipo editorial con fotografía.
- Mensaje de marca y eslogan.
- Acceso a novedades.
- Productos destacados.
- Categorías principales.
- Sección de presentación de la marca.
- Acceso a Instagram.
- Información de contacto.
- Pie de página.

La página debe ser visualmente atractiva sin sobrecargarla de elementos.

### 6.2 Catálogo

El catálogo debe mostrar productos disponibles y permitir explorar las colecciones.

Cada producto debe mostrar:

- Fotografía principal.
- Nombre.
- Precio.
- Precio anterior, si existe una promoción.
- Categoría.
- Disponibilidad.
- Indicador de novedad, cuando corresponda.

Funciones:

- Buscar productos por nombre.
- Filtrar por categoría.
- Filtrar por género o colección.
- Filtrar por talla.
- Filtrar por color.
- Ordenar por precio.
- Ordenar por novedades.
- Mostrar solamente productos disponibles, si el visitante lo desea.

Los filtros deben funcionar realmente con los datos almacenados.

### 6.3 Detalle del producto

Cada producto debe tener una página individual.

Elementos:

- Galería de fotografías.
- Nombre del producto.
- Precio.
- Precio anterior, si corresponde.
- Descripción.
- Colores disponibles.
- Tallas disponibles.
- Existencias por variante.
- Indicadores de disponibilidad.
- Productos relacionados.
- Botón de contacto o solicitud por WhatsApp, si está habilitado.

El cliente debe poder seleccionar un color y una talla.

La disponibilidad debe actualizarse según la variante seleccionada.

Nunca mostrar una variante como disponible si su inventario es cero.

No mostrar información interna del negocio, como costos de adquisición, márgenes o historial de ventas.

### 6.4 Productos agotados

Los productos agotados pueden seguir apareciendo en el catálogo si el administrador lo permite.

Deben identificarse claramente como agotados.

No deben permitir solicitudes de compra como si hubiera existencias.

### 6.5 Diseño responsive

El sitio debe funcionar correctamente en:

- Teléfonos.
- Tablets.
- Computadoras portátiles.
- Monitores de escritorio.

La experiencia móvil es prioritaria.

---

## 7. PANEL ADMINISTRATIVO

El panel administrativo será una de las partes más importantes del proyecto.

Debe permitir controlar el negocio desde un solo lugar.

### 7.1 Dashboard

Mostrar información útil:

- Cantidad total de productos.
- Productos activos.
- Productos agotados.
- Productos con pocas existencias.
- Unidades disponibles.
- Ventas registradas.
- Ingresos registrados.
- Productos más vendidos.
- Movimientos recientes de inventario.

Los indicadores deben calcularse a partir de los datos reales.

No utilizar números inventados en el dashboard.

### 7.2 Gestión de productos

El administrador debe poder:

- Crear productos.
- Editar productos.
- Eliminar o archivar productos.
- Activar o desactivar productos.
- Modificar nombres.
- Modificar descripciones.
- Cambiar precios.
- Establecer precios promocionales.
- Asignar categorías.
- Asignar colección de mujer u hombre.
- Marcar productos como novedades.
- Marcar productos como destacados.
- Controlar su visibilidad en el catálogo.

Cada producto debe contar con un identificador único y un slug para su URL pública.

Antes de eliminar un producto que tenga movimientos históricos, ventas o apartados, utilizar archivado o baja lógica en lugar de borrar información importante.

### 7.3 Variantes de productos

Esta funcionalidad es obligatoria.

No administrar las existencias únicamente mediante una cantidad total por producto.

El inventario debe controlarse por variante.

Ejemplo:

Producto: Sudadera básica.

| Color | Talla | Existencias |
|---|---|---:|
| Gris | S | 3 |
| Gris | M | 4 |
| Gris | L | 2 |
| Blanco | S | 2 |
| Blanco | M | 5 |
| Blanco | L | 0 |

Cada combinación de color y talla debe tener su propia existencia.

El administrador debe poder:

- Crear variantes.
- Editar variantes.
- Activar o desactivar variantes.
- Establecer cantidades.
- Consultar disponibilidad.
- Consultar movimientos de cada variante.

Evitar combinaciones duplicadas dentro del mismo producto.

La estructura debe permitir incorporar otras características en el futuro, como diferentes cortes o materiales, sin tener que reconstruir todo el inventario.

### 7.4 Gestión de fotografías

El administrador debe poder:

- Subir fotografías.
- Eliminar fotografías.
- Cambiar la fotografía principal.
- Reordenar imágenes.
- Asociar varias fotografías a un producto.
- Ver una vista previa.
- Reemplazar imágenes.

Las imágenes deben almacenarse en Supabase Storage.

La base de datos debe almacenar sus referencias y metadatos, no los archivos binarios.

Recomendaciones:

- Utilizar WebP cuando sea adecuado.
- Mantener una proporción visual consistente de 4:5.
- Utilizar imágenes optimizadas.
- Generar miniaturas cuando sea necesario.
- Evitar fotografías excesivamente pesadas.
- No deformar las fotografías originales.

Objetivo inicial de optimización: fotografías de aproximadamente 100–250 KB cuando la calidad de origen lo permita.

### 7.5 Categorías

Permitir crear, editar y organizar categorías.

Ejemplos:

- Sudaderas.
- Playeras.
- Pantalones.
- Jeans.
- Chamarras.
- Accesorios.

No limitar las categorías a estos ejemplos.

El administrador debe poder crear nuevas categorías sin modificar el código.

### 7.6 Entradas de mercancía

Registrar cuando llega mercancía nueva.

Cada entrada debe incluir:

- Producto.
- Variante.
- Cantidad recibida.
- Fecha.
- Proveedor, opcional.
- Costo de adquisición, opcional.
- Observaciones.
- Usuario que registró el movimiento.

Al confirmar la entrada, el inventario debe aumentar automáticamente.

El sistema debe guardar el movimiento en el historial.

### 7.7 Ventas

Permitir registrar ventas manualmente.

Cada venta debe incluir:

- Fecha.
- Productos vendidos.
- Variantes.
- Cantidades.
- Precio de venta aplicado.
- Total.
- Método de pago, opcional.
- Notas.
- Estado de la venta.

Al confirmar una venta, el sistema debe descontar automáticamente las unidades correspondientes.

No permitir vender cantidades superiores al inventario disponible.

Si una venta se cancela o devuelve mercancía, registrar el movimiento correspondiente y ajustar las existencias mediante una operación trazable.

No borrar ventas para corregir errores: utilizar cancelaciones, devoluciones o ajustes registrados.

### 7.8 Apartados y reservaciones

El sistema debe poder registrar productos apartados para clientes.

Información:

- Nombre o referencia del cliente.
- Producto.
- Variante.
- Cantidad.
- Fecha de creación.
- Fecha límite.
- Estado.
- Observaciones.

Estados posibles:

- Pendiente.
- Confirmado.
- Completado.
- Cancelado.
- Vencido.

Debe existir una configuración para determinar si los apartados descuentan existencias disponibles o solamente generan una reserva.

La política debe aplicarse de forma consistente para evitar vender unidades ya comprometidas.

### 7.9 Historial de inventario

Cada modificación de inventario debe generar un registro.

Tipos de movimiento:

- Entrada de mercancía.
- Venta.
- Devolución.
- Cancelación.
- Apartado.
- Liberación de apartado.
- Ajuste manual.
- Corrección administrativa.

Cada registro debe incluir:

- Producto.
- Variante.
- Cantidad modificada.
- Existencias anteriores.
- Existencias posteriores.
- Fecha y hora.
- Motivo.
- Usuario responsable.

Los movimientos históricos no deben modificarse silenciosamente.

Los ajustes manuales deben solicitar un motivo obligatorio.

---

## 8. BASE DE DATOS

Diseña una estructura relacional clara y normalizada.

Como mínimo, considera estas entidades:

- `profiles`
- `categories`
- `products`
- `product_variants`
- `product_images`
- `inventory_movements`
- `sales`
- `sale_items`
- `reservations`
- `reservation_items`
- `store_settings`

Puedes agregar tablas auxiliares cuando estén justificadas.

### Reglas importantes

1. Cada producto debe tener un identificador único.
2. Cada variante debe pertenecer a un producto.
3. Las existencias deben almacenarse por variante.
4. Las fotografías deben relacionarse con sus productos.
5. Las ventas deben conservar el precio aplicado al momento de la operación.
6. Los movimientos deben conservar el historial de cambios.
7. Las fechas deben almacenarse de manera consistente.
8. Utilizar restricciones para evitar cantidades negativas.
9. Evitar duplicación innecesaria de información.
10. Diseñar índices para consultas frecuentes.
11. Utilizar transacciones para operaciones que modifiquen varias tablas.
12. Definir claves foráneas y reglas de integridad.

Los datos financieros e históricos deben conservar su valor original aunque posteriormente cambien los precios de los productos.

### Operaciones de inventario

Las entradas, ventas, devoluciones y apartados deben realizarse mediante operaciones seguras.

Utilizar funciones o transacciones en PostgreSQL cuando una operación requiera actualizar existencias y registrar movimientos simultáneamente.

Nunca depender de una secuencia de peticiones independientes desde el navegador para modificar inventario.

---

## 9. SEGURIDAD

La seguridad no es opcional.

Implementar:

- Autenticación mediante Supabase Auth.
- Acceso administrativo protegido.
- Validación de permisos en el servidor.
- Row Level Security en las tablas.
- Políticas de acceso para fotografías.
- Validación de entradas.
- Protección contra modificaciones no autorizadas.
- Manejo seguro de errores.
- Variables de entorno.

Reglas obligatorias:

- Los visitantes únicamente pueden consultar la información pública autorizada.
- Los visitantes nunca pueden modificar productos o inventario.
- Solamente usuarios administrativos autorizados pueden acceder al panel.
- Nunca exponer la clave `service_role` de Supabase en el frontend.
- No confiar únicamente en ocultar botones o rutas.
- Validar permisos en cada operación sensible.
- No almacenar contraseñas manualmente.
- No registrar información sensible innecesaria.

Las operaciones de venta, inventario y apartados deben tener controles para evitar condiciones de carrera y modificaciones simultáneas incorrectas.

---

## 10. EXPERIENCIA VISUAL Y UI/UX

La interfaz debe mantener una identidad coherente en todas las páginas.

### Reglas de diseño

- Diseño mobile-first.
- Espaciado basado en una escala de 8 px.
- Contenedor de contenido de hasta 1280 px.
- Fotografías de productos con proporción 4:5.
- Bordes discretos.
- Sombras mínimas.
- Tarjetas con radios aproximados de 8–12 px.
- Botones principales en Deep Espresso.
- Fondos cálidos.
- Jerarquía tipográfica clara.
- Buen contraste.
- Estados de carga.
- Estados vacíos.
- Mensajes de error comprensibles.
- Confirmaciones para acciones importantes.

Evitar:

- Interfaces genéricas.
- Colores excesivamente saturados.
- Degradados innecesarios.
- Sombras exageradas.
- Demasiados elementos decorativos.
- Animaciones constantes.
- Tarjetas innecesariamente grandes.
- Tablas difíciles de utilizar en dispositivos móviles.

### Animaciones

Las animaciones deben ser discretas, elegantes y funcionales.

Duración orientativa: 180–250 ms.

Ejemplos:

- Aparición sutil de elementos principales.
- Transiciones entre fotografías.
- Hover de tarjetas de producto.
- Apertura del menú móvil.
- Selección de talla o color.
- Modales.
- Notificaciones.
- Transiciones de páginas.

Preferir transformaciones y opacidad cuando sea posible.

Respetar `prefers-reduced-motion`.

Evitar animaciones que provoquen saltos de contenido, bloqueen la interacción o afecten el rendimiento.

Si se utilizan skills de diseño o animación para agentes de programación, aplicarlas como criterios de implementación y revisión, no como sustituto de pruebas reales.

---

## 11. RENDIMIENTO Y SEO

El sitio público debe estar optimizado para buscadores y dispositivos móviles.

Implementar:

- Metadatos por página.
- Títulos y descripciones.
- URLs legibles.
- Open Graph.
- Sitemap.
- Robots.txt.
- Datos estructurados cuando sean apropiados.
- Optimización de imágenes.
- Carga diferida de imágenes fuera de pantalla.
- Componentes de servidor cuando corresponda.
- Caché controlada.
- Paginación o carga progresiva en catálogos grandes.

Evitar consultas innecesarias a la base de datos.

La disponibilidad de un producto debe mantenerse razonablemente actualizada y no depender de datos estáticos almacenados indefinidamente en caché.

---

## 12. CONFIGURACIÓN DEL NEGOCIO

Crear una sección de configuración para administrar:

- Nombre de la tienda.
- Logotipo.
- Eslogan.
- Descripción.
- Instagram.
- Número de WhatsApp.
- Activar o desactivar WhatsApp.
- Información de contacto.
- Moneda.
- Preferencias del catálogo.
- Políticas de apartados.
- Información de entrega y recolección.

La moneda inicial será MXN.

Mostrar los precios en pesos mexicanos.

No asumir ni inventar políticas de entrega, horarios, direcciones o condiciones comerciales. Deben poder configurarse posteriormente.

---

## 13. CALIDAD, PRUEBAS Y CRITERIOS DE ACEPTACIÓN

La calidad debe verificarse durante todo el desarrollo, no únicamente al terminar.

### Pruebas funcionales obligatorias

- Crear productos.
- Editar productos.
- Archivar productos.
- Crear variantes.
- Subir y eliminar fotografías.
- Consultar disponibilidad.
- Registrar entradas.
- Registrar ventas.
- Cancelar ventas.
- Registrar devoluciones.
- Crear apartados.
- Liberar apartados.
- Consultar movimientos históricos.
- Comprobar permisos de usuarios.
- Comprobar el catálogo público.

### Pruebas de inventario

Verificar especialmente:

1. Que las entradas aumenten las existencias correctas.
2. Que las ventas descuenten las existencias correctas.
3. Que una variante no modifique el inventario de otra.
4. Que no sea posible vender más unidades de las disponibles.
5. Que las cancelaciones y devoluciones se registren correctamente.
6. Que dos operaciones simultáneas no generen existencias incorrectas.
7. Que los movimientos históricos sean consistentes.
8. Que los apartados respeten la política de disponibilidad.

### Pruebas de seguridad

- Acceso administrativo sin autenticación.
- Acceso de usuarios no autorizados.
- Lectura de datos privados.
- Modificación directa desde el navegador.
- Acceso indebido a fotografías.
- Protección de secretos y variables de entorno.

### Pruebas visuales

Comprobar:

- Escritorio.
- Tablet.
- Móvil.
- Diferentes tamaños de pantalla.
- Fotografías verticales y horizontales.
- Textos largos.
- Productos sin fotografías.
- Productos agotados.
- Catálogo vacío.
- Errores de carga.

No considerar una funcionalidad terminada hasta comprobar su funcionamiento.

---

## 14. DOCUMENTACIÓN DEL PROYECTO

Mantener documentación actualizada.

Crear y mantener estos archivos:

### `CLAUDE.md`

Instrucciones permanentes para Claude Code:

- Descripción del proyecto.
- Arquitectura.
- Tecnologías.
- Estructura de carpetas.
- Convenciones.
- Reglas de seguridad.
- Reglas de diseño.
- Comandos.
- Criterios de calidad.

### `README.md`

Explicación general:

- Qué es Naru Closet.
- Requisitos.
- Instalación.
- Configuración.
- Ejecución local.
- Despliegue.

### `docs/ARCHITECTURE.md`

Arquitectura general y decisiones técnicas.

### `docs/DATABASE.md`

Esquema de base de datos, relaciones y reglas.

### `docs/DESIGN_SYSTEM.md`

Identidad visual, colores, tipografías, componentes y reglas de interfaz.

### `docs/SECURITY.md`

Autenticación, permisos, RLS y protección de datos.

### `docs/QA.md`

Pruebas, controles de calidad y criterios de aceptación.

### `docs/ROADMAP.md`

Etapas de desarrollo, tareas pendientes y funcionalidades completadas.

### `docs/CHANGELOG.md`

Registro de cambios importantes.

No crear documentación vacía solamente para cumplir una lista. Cada archivo debe contener información útil y mantenerse sincronizado con la implementación.

---

## 15. METODOLOGÍA DE DESARROLLO

Trabaja en etapas.

### Fase 1 — Análisis y planificación

- Inspeccionar el repositorio.
- Revisar archivos existentes.
- Definir arquitectura.
- Definir estructura de carpetas.
- Definir esquema inicial de base de datos.
- Identificar riesgos técnicos.
- Crear documentación inicial.
- Presentar el plan antes de implementar cambios importantes.

### Fase 2 — Fundamentos

- Configurar Next.js y TypeScript.
- Configurar Tailwind CSS.
- Crear el sistema de diseño.
- Configurar Supabase.
- Configurar variables de entorno.
- Crear migraciones.
- Implementar autenticación.
- Configurar RLS.

### Fase 3 — Catálogo público

- Página de inicio.
- Navegación.
- Catálogo.
- Categorías.
- Filtros.
- Búsqueda.
- Detalle de producto.
- Galería.
- Disponibilidad por variante.
- Diseño responsive.

### Fase 4 — Panel administrativo

- Dashboard.
- Gestión de productos.
- Gestión de variantes.
- Gestión de categorías.
- Gestión de fotografías.
- Configuración.

### Fase 5 — Inventario

- Entradas.
- Ventas.
- Apartados.
- Devoluciones.
- Cancelaciones.
- Historial de movimientos.
- Controles de integridad.

### Fase 6 — Optimización y lanzamiento

- SEO.
- Rendimiento.
- Pruebas de seguridad.
- Pruebas funcionales.
- Pruebas visuales.
- Corrección de errores.
- Documentación final.
- Preparación del despliegue.

No intentes implementar todas las fases en una sola operación.

Completa y verifica cada etapa antes de avanzar.

---

## 16. REGLAS DE TRABAJO PARA CLAUDE CODE

Estas reglas deben respetarse durante todo el proyecto:

1. No inventar funcionalidades que no estén justificadas.
2. No modificar la identidad visual sin autorización.
3. No instalar dependencias innecesarias.
4. No introducir servicios de pago sin autorización.
5. No dejar botones decorativos que aparenten funcionar.
6. No utilizar datos ficticios como si fueran datos reales.
7. No exponer claves privadas.
8. No confiar en la validación exclusiva del frontend.
9. No permitir inventarios negativos.
10. No eliminar registros históricos importantes.
11. No duplicar lógica de negocio.
12. No ignorar errores de TypeScript, lint o compilación.
13. No ocultar errores mediante soluciones temporales.
14. No considerar terminada una tarea sin pruebas.
15. Mantener la documentación actualizada.
16. Priorizar soluciones sencillas, mantenibles y seguras.
17. Evitar sobrearquitectura: implementar únicamente lo que el proyecto necesita.
18. Explicar los cambios importantes antes de ejecutarlos.
19. No realizar operaciones destructivas sobre la base de datos sin autorización.
20. No desplegar cambios a producción sin autorización.

Cuando encuentres un problema:
- Explica qué ocurre.
- Identifica la causa.
- Propón una solución.
- Implementa la solución cuando esté dentro del alcance autorizado.
- Comprueba que no se hayan introducido errores adicionales.

---

## 17. OBJETIVO FINAL

El resultado debe ser una plataforma web profesional para Naru Closet que permita:

- Presentar la marca con una identidad visual propia.
- Mostrar un catálogo actualizado.
- Permitir a los clientes explorar productos.
- Consultar precios, tallas, colores y disponibilidad.
- Administrar productos y fotografías.
- Controlar inventario por variante.
- Registrar entradas y ventas.
- Administrar apartados.
- Consultar movimientos históricos.
- Proteger la información administrativa.
- Funcionar correctamente en móviles y computadoras.
- Poder crecer sin tener que reconstruir el proyecto.

La prioridad es construir una base sólida, funcional y mantenible.

**Naru Closet debe sentirse como una marca de moda real y tener un sistema administrativo confiable detrás de su imagen.**
