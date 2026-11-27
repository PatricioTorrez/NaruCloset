# Roadmap — Naru Closet

> Vista de alto nivel por fases. El detalle de tareas está en `TASKS.md`.
> Estados: ✅ completada · 🟡 en curso · ⬜ pendiente

| Fase | Estado | Objetivo | Criterio de cierre |
|---|---|---|---|
| 1. Análisis y planificación | ✅ | Auditoría, arquitectura, esquema, documentación, repositorio | Documentación revisada; primer commit en `main` |
| 2. Fundamentos | ✅ | Next.js, sistema de diseño, Supabase local, migraciones, RLS, funciones de inventario, login | pgTAP I-1…I-10 y S-1…S-6 en verde; `build` limpio |
| 3. Catálogo público | ✅ | Inicio, catálogo con filtros, detalle con variantes, WhatsApp, páginas informativas | F-8…F-10 y V-1…V-7 en verde para las rutas públicas |
| 4. Panel: catálogo | ✅ | Dashboard, productos, variantes, categorías, colores y tallas, fotos, configuración | F-1…F-3 y F-7 en verde |
| 5. Panel: inventario | 🟡 | Entradas, ventas, devoluciones, cancelaciones, apartados, ajustes, historial | F-4…F-6 en verde; pruebas de inventario repetidas desde la interfaz |
| 6. Optimización y lanzamiento | 🟡 | SEO, rendimiento, auditoría de seguridad, QA final, guía de despliegue | Lighthouse ≥ 90 en móvil; QA completo; despliegue **solo con autorización** |

## Pendiente para cerrar

- **Fase 5:** probar entradas, ventas, devoluciones y apartados desde la interfaz con los primeros productos reales (la lógica ya pasó 53 pruebas pgTAP y la de concurrencia).
- **Fase 6:** prueba en teléfono real, Lighthouse, E2E con Playwright (requiere autorizar la descarga de Chromium) y decidir el hosting (D-001). Despliegue solo con autorización.

## Flujo de trabajo

- Todo se sube con commit y push directo a `main`; no se usan ramas por fase (D-015).
- Las fases se completan una tras otra; cada una termina con su puerta de calidad en verde y un commit.

## Ideas fuera de alcance (no se implementan sin aprobación)

- Carrito, checkout o pagos en línea.
- Integraciones con Facebook.
- Atributos de variante adicionales (corte, material); el esquema ya los admite.
