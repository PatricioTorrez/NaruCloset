# Changelog — Naru Closet

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Fechas en AAAA-MM-DD.

## [No publicado]

### Añadido — 2026-11-26 · Fases 2–6
- Catálogo público: inicio, catálogo con búsqueda, filtros (categoría, colección, talla, color, disponibilidad), orden y paginación; detalle con disponibilidad por variante y WhatsApp configurable; Nosotros; Contacto.
- Panel: resumen con indicadores reales, productos, variantes, fotografías optimizadas a WebP, categorías, colores y tallas, inventario, entradas, ventas, devoluciones, apartados, ajustes, historial, configuración y usuarios.
- Base de datos: 7 migraciones con RLS, funciones de inventario transaccionales, vencimiento automático de apartados y bucket de fotos.
- SEO: metadatos, Open Graph, sitemap, robots, JSON-LD. Cabeceras de seguridad.
- Pruebas: Vitest, pgTAP (sin Docker), concurrencia y E2E con Playwright.

### Añadido — 2026-11-26 · Fase 1
- Documentación inicial: requisitos (`PROJECT_BRIEF`), contexto, tareas, decisiones, bitácora, arquitectura, base de datos, seguridad, sistema de diseño, QA y roadmap.
- `CLAUDE.md` con el protocolo de contexto entre sesiones.
- Repositorio git con `.gitignore`.
