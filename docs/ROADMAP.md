# Roadmap — Naru Closet

> Vista de alto nivel por fases. El detalle de tareas está en `TASKS.md`.
> Estados: ✅ completada · 🟡 en curso · ⬜ pendiente

| Fase | Estado | Objetivo | Criterio de cierre |
|---|---|---|---|
| 1. Análisis y planificación | ✅ | Auditoría, arquitectura, esquema, documentación, repositorio | Documentación revisada; primer commit en `main` |
| 2. Fundamentos | ⬜ | Next.js, sistema de diseño, Supabase local, migraciones, RLS, funciones de inventario, login | pgTAP I-1…I-10 y S-1…S-6 en verde; `build` limpio |
| 3. Catálogo público | ⬜ | Inicio, catálogo con filtros, detalle con variantes, WhatsApp, páginas informativas | F-8…F-10 y V-1…V-7 en verde para las rutas públicas |
| 4. Panel: catálogo | ⬜ | Dashboard, productos, variantes, categorías, colores y tallas, fotos, configuración | F-1…F-3 y F-7 en verde |
| 5. Panel: inventario | ⬜ | Entradas, ventas, devoluciones, cancelaciones, apartados, ajustes, historial | F-4…F-6 en verde; pruebas de inventario repetidas desde la interfaz |
| 6. Optimización y lanzamiento | ⬜ | SEO, rendimiento, auditoría de seguridad, QA final, guía de despliegue | Lighthouse ≥ 90 en móvil; QA completo; despliegue **solo con autorización** |

## Flujo de trabajo

- La Fase 1 se sube directamente a `main` (el repositorio estaba vacío).
- Desde la Fase 2, cada fase se desarrolla en una rama `fase-N-nombre` y se integra con un Pull Request revisado por el dueño (D-009).

## Ideas fuera de alcance (no se implementan sin aprobación)

- Carrito, checkout o pagos en línea.
- Integraciones con Facebook.
- Atributos de variante adicionales (corte, material); el esquema ya los admite.
