# Bitácora de sesiones — Naru Closet

> Una entrada por sesión de trabajo, la más reciente arriba. Breve: qué se hizo, qué quedó pendiente, qué se aprendió.

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
