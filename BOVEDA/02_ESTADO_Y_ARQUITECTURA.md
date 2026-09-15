# Estado y arquitectura

Actualizado: 2026-09-15

## Estado real

**Fase 0 en marcha.** Lo local está montado y verificado; falta lo que vive
fuera de esta carpeta.

Hecho y comprobado (`npm run verify` en verde: lint, tipos, 9 pruebas, build):

- Esqueleto Next.js con App Router, una sola pantalla de comprobación.
- `next.config.ts` con CSP y las cinco cabeceras de seguridad, HSTS incluido.
- `src/lib/dinero.ts` — el único sitio por donde pasa el dinero, con sus
  pruebas y **dos pruebas guardián** que fallan si alguien formatea euros o
  convierte importes por su cuenta.
- `.github/workflows/ci.yml` — `agentes:check`, lint, tipos, pruebas y build.
- 7 agentes en `.claude/agents/` con espejo generado en `.codex/agents/`.
- Esta bóveda. `.cuenta` → `personal`.

Pendiente de fase 0:

- Repositorio `BigAPP37/Arca` en GitHub y primer commit.
- Proyecto de Supabase, con la primera migración aplicada por CLI.
- Proyecto de Vercel sirviendo la pantalla de comprobación.
- Fila de Arca en `~/.codex/AGENTS.md`.

No existe todavía: `supabase/`, autenticación, ni modelo de datos.

## Stack

Decidido el 2026-09-15 (ver `DECISIONES/DEC-0004`):

| Pieza | Elección |
|---|---|
| Framework | Next.js 16.3.5, App Router, React 19.3 |
| Lenguaje | TypeScript 5 con `strict: true`, `paths {"@/*": ["./src/*"]}` |
| Estilos | Tailwind 4 |
| Base de datos y auth | Supabase con `@supabase/ssr` (sesión en cookie) |
| Validación | zod 4 |
| Pruebas | `tsx --test tests/*.test.ts` (runner de Node, sin framework) |
| Lint | ESLint 9 con `eslint-config-next/core-web-vitals` |
| Paquetes | npm con `package-lock.json` versionado |
| Despliegue | Vercel, región `dub1` |
| Forma de la app | PWA, sin envoltorio nativo por ahora |

Supuestos de producto: España, EUR, `Europe/Madrid`, interfaz en español.

## Cómo se organiza el código

- `src/app/` — rutas del App Router. Las rutas nuevas, en español.
- `src/lib/` — dominio puro y testeable, sin dependencias del framework.
  `dinero.ts` manda en todo lo que sea un importe.
- `tests/` — fuera de `src/`, pruebas unitarias y guardianes.
- `supabase/` — cuando exista: `config.toml` y `migrations/`.
- `scripts/agentes/` — sincronización de agentes con Codex.

Las escrituras de dinero irán por servidor (Server Actions o funciones RPC de
Postgres), nunca directas desde el navegador. Ver regla dura 3 de `AGENTS.md`.

## Decisiones de implementación ya tomadas

- **Dentro del programa, un importe es un entero de céntimos**; en la base,
  `numeric(14,2)`. La conversión ocurre solo en los bordes (`aCentimos`,
  `formatear`, `aNumericSql`). No se usa BigInt: el techo de `numeric(14,2)`
  cabe de sobra en un entero exacto de JavaScript, y se rechaza lo que pase.
- **El separador de millar se fuerza siempre** («1.234,56 €»), aunque el español
  admita «1234,56» sin punto: en una lista de importes la mezcla se lee peor.
- El espacio entre cifra y € es **duro** (U+00A0) a propósito, para que el
  símbolo no salte de renglón en una pantalla estrecha.

## Historia previa

Arca sustituye a dos intentos anteriores del mismo producto (`fondo-familiar` y
`fondo-hogar`, este último «FONDO FAMILIAR 2.0»). El 2026-09-15 se borró todo a
propósito: carpetas, repositorio de GitHub, proyecto de Vercel y proyecto de
Supabase. No se porta código. Lo único que viaja de ahí son las lecciones de
`03_LECCIONES.md`.
